import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { z } from "zod";
import { db } from "./db";
import {
  activitySchema,
  annotationSchema,
  auditSchema,
  comparisonSchema,
  findingSchema,
  issueSchema,
  presetSchema,
  projectSchema,
  screenshotMetaSchema,
} from "./schema";
import type { Screenshot } from "./schema";
import { decodeImage } from "./repository";
import { uid } from "../lib/utils";
const archiveSchema = z.object({
  version: z.literal(1),
  projects: z.array(projectSchema).max(1000),
  screenshots: z.array(screenshotMetaSchema).max(1000),
  annotations: z.array(annotationSchema).max(20000),
  issues: z.array(issueSchema).max(20000),
  comparisons: z.array(comparisonSchema).max(10000),
  audits: z.array(auditSchema).max(10000),
  findings: z.array(findingSchema).max(20000),
  presets: z.array(presetSchema).max(200),
  activity: z.array(activitySchema).max(20000),
  settings: z
    .array(z.object({ id: z.string().max(100), value: z.string().max(10000) }))
    .max(100),
});
export async function exportBackup(projectId?: string) {
  const data = await db.transaction("r", db.tables, async () => {
    const projects = await db.projects.toArray();
    const screenshots = await db.screenshots.toArray();
    const audits = await db.auditRuns.toArray();
    const shots = screenshots.filter(
      (s) => !projectId || s.projectId === projectId,
    );
    const runs = audits.filter((a) => !projectId || a.projectId === projectId);
    return {
      version: 1 as const,
      projects: projects.filter((p) => !projectId || p.id === projectId),
      screenshots: shots,
      annotations: (await db.annotations.toArray()).filter((a) =>
        shots.some((s) => s.id === a.screenshotId),
      ),
      issues: (await db.issues.toArray()).filter(
        (i) => !projectId || i.projectId === projectId,
      ),
      comparisons: (await db.comparisons.toArray()).filter(
        (c) => !projectId || c.projectId === projectId,
      ),
      audits: runs,
      findings: (await db.auditFindings.toArray()).filter((f) =>
        runs.some((a) => a.id === f.auditId),
      ),
      presets: await db.viewportPresets.toArray(),
      activity: (await db.activityEvents.toArray()).filter(
        (a) => !projectId || a.projectId === projectId,
      ),
      settings: await db.settings.toArray(),
    };
  });
  const entries: Record<string, Uint8Array> = {};
  for (const shot of data.screenshots)
    entries[`images/${shot.id}`] = new Uint8Array(
      await shot.blob.arrayBuffer(),
    );
  const metadata = {
    ...data,
    screenshots: data.screenshots.map(({ blob: _blob, ...rest }) => rest),
  };
  entries["manifest.json"] = strToU8(JSON.stringify(metadata));
  const zip = zipSync(entries, { level: 0 });
  return new Blob([new Uint8Array(zip)], { type: "application/zip" });
}
export async function importBackup(file: Blob) {
  if (file.size > 250 * 1024 * 1024)
    throw new Error("Backup exceeds the 250 MB import limit.");
  let total = 0;
  const entries = unzipSync(new Uint8Array(await file.arrayBuffer()), {
    filter: (entry) => {
      total += entry.originalSize;
      if (total > 300 * 1024 * 1024 || entry.originalSize > 25 * 1024 * 1024)
        throw new Error("Expanded archive exceeds safety limits.");
      return true;
    },
  });
  if (!entries["manifest.json"])
    throw new Error("Missing versioned manifest.json.");
  const data = archiveSchema.parse(
    JSON.parse(strFromU8(entries["manifest.json"])),
  );
  const all = [
    ...data.projects,
    ...data.screenshots,
    ...data.annotations,
    ...data.issues,
    ...data.comparisons,
    ...data.audits,
    ...data.findings,
    ...data.activity,
  ];
  const ids = new Set(all.map((r) => r.id));
  if (ids.size !== all.length)
    throw new Error("Duplicate record IDs in backup.");
  const projectIds = new Set(data.projects.map((p) => p.id));
  const shots = new Map(data.screenshots.map((s) => [s.id, s]));
  const notes = new Map(data.annotations.map((a) => [a.id, a]));
  const audits = new Map(data.audits.map((a) => [a.id, a]));
  const fail = () => {
    throw new Error("Backup has an invalid or orphaned reference.");
  };
  for (const r of [
    ...data.screenshots,
    ...data.issues,
    ...data.comparisons,
    ...data.audits,
  ])
    if (!projectIds.has(r.projectId)) fail();
  for (const a of data.annotations) {
    const s = shots.get(a.screenshotId);
    if (!s || a.x + a.width > s.width || a.y + a.height > s.height) fail();
  }
  for (const i of data.issues) {
    if (i.screenshotId && shots.get(i.screenshotId)?.projectId !== i.projectId)
      fail();
    if (
      i.annotationId &&
      notes.get(i.annotationId)?.screenshotId !== i.screenshotId
    )
      fail();
  }
  for (const c of data.comparisons)
    if (
      c.baselineId === c.currentId ||
      shots.get(c.baselineId)?.projectId !== c.projectId ||
      shots.get(c.currentId)?.projectId !== c.projectId
    )
      fail();
  for (const f of data.findings) {
    const a = audits.get(f.auditId);
    if (
      !a ||
      (f.screenshotId && shots.get(f.screenshotId)?.projectId !== a.projectId)
    )
      fail();
  }
  for (const a of data.activity)
    if (a.projectId && !projectIds.has(a.projectId)) fail();
  const mapped = new Map([...ids].map((id) => [id, uid()]));
  const remap = (id: string) => mapped.get(id) ?? id;
  const presetIds = new Map(
    data.presets.filter((p) => p.custom).map((p) => [p.id, uid()]),
  );
  const images: Screenshot[] = [];
  for (const shot of data.screenshots) {
    const binary = entries[`images/${shot.id}`];
    if (!binary || binary.length !== shot.size)
      throw new Error("Missing or inconsistent image asset.");
    const blob = new Blob([new Uint8Array(binary)], { type: shot.mime });
    const decoded = await decodeImage(blob);
    if (decoded.width !== shot.width || decoded.height !== shot.height)
      throw new Error("Image dimensions do not match metadata.");
    images.push({
      ...shot,
      id: remap(shot.id),
      projectId: remap(shot.projectId),
      blob,
    });
  }
  await db.transaction("rw", db.tables, async () => {
    await db.projects.bulkAdd(
      data.projects.map((p) => ({
        ...p,
        id: remap(p.id),
        presetIds: p.presetIds.map((id) => presetIds.get(id) ?? id),
        name: `${p.name.slice(0, 89)} (imported)`,
        updatedAt: Date.now(),
      })),
    );
    await db.screenshots.bulkAdd(images);
    await db.annotations.bulkAdd(
      data.annotations.map((a) => ({
        ...a,
        id: remap(a.id),
        screenshotId: remap(a.screenshotId),
      })),
    );
    await db.issues.bulkAdd(
      data.issues.map((i) => ({
        ...i,
        id: remap(i.id),
        projectId: remap(i.projectId),
        screenshotId: i.screenshotId ? remap(i.screenshotId) : undefined,
        annotationId: i.annotationId ? remap(i.annotationId) : undefined,
      })),
    );
    await db.comparisons.bulkAdd(
      data.comparisons.map((c) => ({
        ...c,
        id: remap(c.id),
        projectId: remap(c.projectId),
        baselineId: remap(c.baselineId),
        currentId: remap(c.currentId),
      })),
    );
    await db.auditRuns.bulkAdd(
      data.audits.map((a) => ({
        ...a,
        id: remap(a.id),
        projectId: remap(a.projectId),
      })),
    );
    await db.auditFindings.bulkAdd(
      data.findings.map((f) => ({
        ...f,
        id: remap(f.id),
        auditId: remap(f.auditId),
        screenshotId: f.screenshotId ? remap(f.screenshotId) : undefined,
      })),
    );
    await db.activityEvents.bulkAdd(
      data.activity.map((a) => ({
        ...a,
        id: remap(a.id),
        projectId: a.projectId ? remap(a.projectId) : undefined,
      })),
    );
    for (const preset of data.presets)
      if (preset.custom)
        await db.viewportPresets.put({
          ...preset,
          id: presetIds.get(preset.id)!,
        });
    // Import preferences only when absent; restore never silently replaces current settings.
    for (const setting of data.settings)
      if (!(await db.settings.get(setting.id))) await db.settings.add(setting);
  });
  return data.projects.length;
}
