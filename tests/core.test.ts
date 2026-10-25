import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../src/database/db";
import {
  deleteAnnotation,
  deleteProject,
  deleteScreenshot,
  saveAnnotation,
  saveComparison,
  saveIssue,
  saveProject,
} from "../src/database/repository";
import {
  defaults,
  dimensions,
  safeUrl,
  type Issue,
  type Project,
} from "../src/database/schema";
import { comparePixels } from "../src/features/comparisons/pixels";
import { distribution, filterIssues } from "../src/features/reports/aggregate";
import { csv, uid } from "../src/lib/utils";
import { exportBackup, importBackup } from "../src/database/backup";
import { strToU8, zipSync } from "fflate";
const project = (): Project => ({
  id: uid(),
  name: "Test project",
  description: "",
  url: "",
  presetIds: [],
  createdAt: 1,
  updatedAt: 1,
});
const issue = (projectId: string): Issue => ({
  id: uid(),
  projectId,
  title: "Overflow",
  description: "Content leaves viewport",
  category: "Horizontal Overflow",
  severity: "High",
  status: "Open",
  viewport: "375 × 812",
  steps: "",
  suggestion: "Use max-width",
  source: "manual",
  createdAt: 10,
  updatedAt: 10,
});
beforeEach(async () => {
  await db.transaction("rw", db.tables, async () => {
    for (const table of db.tables) await table.clear();
  });
});
describe("validation and viewport presets", () => {
  it("rejects unsafe URLs, credentials and dimensions", () => {
    expect(safeUrl.safeParse("javascript:alert(1)").success).toBe(false);
    expect(safeUrl.safeParse("https://user:password@example.com").success).toBe(
      false,
    );
    expect(safeUrl.safeParse("https://localhost:3000").success).toBe(true);
    expect(dimensions.safeParse({ width: 10, height: 812 }).success).toBe(
      false,
    );
    expect(defaults.map((p) => p.width)).toEqual([
      320, 375, 390, 768, 1024, 1280, 1440, 1920,
    ]);
  });
});
describe("pixel difference", () => {
  it("composites partial transparency against white before applying thresholds", () => {
    const transparentRed = new Uint8ClampedArray([255, 0, 0, 128]);
    const equivalentOpaque = new Uint8ClampedArray([255, 127, 127, 255]);
    expect(comparePixels(transparentRed, equivalentOpaque, 0).changed).toBe(0);
    const oneChannelChange = new Uint8ClampedArray([255, 128, 127, 255]);
    expect(comparePixels(transparentRed, oneChannelChange, 0).changed).toBe(1);
    expect(comparePixels(transparentRed, oneChannelChange, 1).changed).toBe(0);
  });
  it("measures changed pixels and respects thresholds", () => {
    const a = new Uint8ClampedArray([0, 0, 0, 255, 255, 255, 255, 255]);
    const b = new Uint8ClampedArray([30, 0, 0, 255, 255, 255, 255, 255]);
    expect(comparePixels(a, b, 20).percent).toBe(50);
    expect(comparePixels(a, b, 30).changed).toBe(0);
  });
  it("ignores invisible RGB and rejects mismatched arrays", () => {
    expect(
      comparePixels(
        new Uint8ClampedArray([255, 0, 0, 0]),
        new Uint8ClampedArray([0, 255, 0, 0]),
        0,
      ).changed,
    ).toBe(0);
    expect(() =>
      comparePixels(new Uint8ClampedArray(4), new Uint8ClampedArray(8), 0),
    ).toThrow();
  });
});
describe("reports", () => {
  it("combines filters and aggregates real issue records", () => {
    const a = issue(uid());
    const b = {
      ...a,
      id: uid(),
      severity: "Low" as const,
      status: "Resolved" as const,
      createdAt: 20,
    };
    expect(
      filterIssues([a, b], {
        severity: "High",
        status: "Open",
        search: "overflow",
        from: 1,
        to: 15,
      }),
    ).toEqual([a]);
    expect(distribution([a, b], "status")).toEqual({ Open: 1, Resolved: 1 });
  });
  it("escapes CSV quotes and spreadsheet formulas", () => {
    expect(
      csv([{ title: '=WEBSERVICE("bad")', description: "a,b\nline" }]),
    ).toContain("'=WEBSERVICE");
    expect(csv([{ title: 'a"b' }])).toContain('a""b');
  });
});
describe("repository integrity", () => {
  it("validates project names and missing issue parents", async () => {
    await expect(saveProject({ ...project(), name: " " })).rejects.toThrow();
    await expect(saveIssue(issue(uid()))).rejects.toThrow("no longer exists");
  });
  it("cascades project records atomically", async () => {
    const p = project();
    await saveProject(p);
    const s = {
      id: uid(),
      projectId: p.id,
      name: "a.png",
      blob: new Blob(["x"]),
      mime: "image/png" as const,
      width: 200,
      height: 200,
      size: 1,
      viewportWidth: 375,
      viewportHeight: 812,
      createdAt: 1,
    };
    await db.screenshots.add(s);
    await saveAnnotation({
      id: uid(),
      screenshotId: s.id,
      type: "rectangle",
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      text: "note",
      createdAt: 1,
      updatedAt: 1,
    });
    await saveIssue({ ...issue(p.id), screenshotId: s.id });
    await deleteProject(p.id);
    expect(await db.projects.count()).toBe(0);
    expect(await db.screenshots.count()).toBe(0);
    expect(await db.annotations.count()).toBe(0);
    expect(await db.issues.count()).toBe(0);
    expect(await db.activityEvents.count()).toBe(0);
  });
  it("preserves issues while unlinking deleted screenshot evidence", async () => {
    const p = project();
    await saveProject(p);
    const id = uid();
    await db.screenshots.add({
      id,
      projectId: p.id,
      name: "a.png",
      blob: new Blob(["x"]),
      mime: "image/png",
      width: 200,
      height: 200,
      size: 1,
      viewportWidth: 375,
      viewportHeight: 812,
      createdAt: 1,
    });
    const note = {
      id: uid(),
      screenshotId: id,
      type: "pin" as const,
      x: 10,
      y: 10,
      width: 0,
      height: 0,
      text: "",
      createdAt: 1,
      updatedAt: 1,
    };
    await saveAnnotation(note);
    const i = { ...issue(p.id), screenshotId: id, annotationId: note.id };
    await saveIssue(i);
    await deleteAnnotation(note.id);
    expect((await db.issues.get(i.id))?.annotationId).toBeUndefined();
    await deleteScreenshot(id);
    expect((await db.issues.get(i.id))?.screenshotId).toBeUndefined();
    expect(await db.issues.count()).toBe(1);
  });
  it("rejects cross-project evidence and out-of-bounds annotations", async () => {
    const p = project();
    const other = project();
    await saveProject(p);
    await saveProject(other);
    const id = uid();
    await db.screenshots.add({
      id,
      projectId: other.id,
      name: "a.png",
      blob: new Blob(["x"]),
      mime: "image/png",
      width: 200,
      height: 200,
      size: 1,
      viewportWidth: 375,
      viewportHeight: 812,
      createdAt: 1,
    });
    await expect(
      saveIssue({ ...issue(p.id), screenshotId: id }),
    ).rejects.toThrow("must belong");
    await expect(
      saveAnnotation({
        id: uid(),
        screenshotId: id,
        type: "rectangle",
        x: 190,
        y: 0,
        width: 20,
        height: 20,
        text: "",
        createdAt: 1,
        updatedAt: 1,
      }),
    ).rejects.toThrow("fit within");
    await expect(
      saveComparison({
        id: uid(),
        projectId: p.id,
        baselineId: id,
        currentId: id,
        name: "bad",
        mode: "side",
        alignment: "top-left",
        threshold: 20,
        createdAt: 1,
      }),
    ).rejects.toThrow("different");
  });
});
describe("backup validation", () => {
  it("remaps custom preset references with imported projects", async () => {
    const p = project();
    const presetId = uid();
    await db.viewportPresets.add({
      id: presetId,
      name: "Custom",
      width: 420,
      height: 800,
      category: "Mobile",
      dpr: 1,
      orientation: "portrait",
      custom: true,
    });
    await saveProject({ ...p, presetIds: [presetId] });
    await importBackup(await exportBackup());
    const restored = (await db.projects.toArray()).find(
      (item) => item.id !== p.id,
    )!;
    expect(restored.presetIds[0]).not.toBe(presetId);
    expect((await db.viewportPresets.get(restored.presetIds[0]))?.width).toBe(
      420,
    );
  });
  it("round trips project metadata as new copies", async () => {
    const p = project();
    await saveProject(p);
    const archive = await exportBackup();
    await importBackup(archive);
    expect(await db.projects.count()).toBe(2);
    expect((await db.projects.toArray()).map((p) => p.name)).toContain(
      "Test project (imported)",
    );
  });
  it("rejects unsupported versions without modifying data", async () => {
    const zip = zipSync({
      "manifest.json": strToU8(JSON.stringify({ version: 999 })),
    });
    await expect(importBackup(new Blob([zip]))).rejects.toThrow();
    expect(await db.projects.count()).toBe(0);
  });
  it("rejects orphaned references before any database write", async () => {
    const archive = {
      version: 1,
      projects: [],
      screenshots: [],
      annotations: [],
      issues: [issue(uid())],
      comparisons: [],
      audits: [],
      findings: [],
      presets: [],
      activity: [],
      settings: [],
    };
    await expect(
      importBackup(
        new Blob([
          zipSync({ "manifest.json": strToU8(JSON.stringify(archive)) }),
        ]),
      ),
    ).rejects.toThrow("orphaned");
    expect(await db.issues.count()).toBe(0);
  });
});
