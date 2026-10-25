import { db } from "./db";
import {
  projectSchema,
  issueSchema,
  annotationSchema,
  comparisonSchema,
  auditSchema,
  findingSchema,
  presetSchema,
  screenshotMetaSchema,
  type Project,
  type Screenshot,
  type Issue,
  type Annotation,
  type Comparison,
  type Audit,
  type Finding,
  type Preset,
} from "./schema";
import { uid } from "../lib/utils";
export async function activity(text: string, projectId?: string) {
  await db.activityEvents.add({
    id: uid(),
    text,
    projectId,
    createdAt: Date.now(),
  });
  if (projectId) await db.projects.update(projectId, { updatedAt: Date.now() });
}
export async function saveProject(value: Project) {
  const project = projectSchema.parse(value);
  await db.transaction("rw", [db.projects, db.activityEvents], async () => {
    await db.projects.put(project);
    await activity(`Saved project “${project.name}”`, project.id);
  });
}
export async function deleteProject(id: string) {
  await db.transaction("rw", db.tables, async () => {
    const shots = await db.screenshots
      .where("projectId")
      .equals(id)
      .primaryKeys();
    const audits = await db.auditRuns
      .where("projectId")
      .equals(id)
      .primaryKeys();
    await db.annotations.where("screenshotId").anyOf(shots).delete();
    await db.auditFindings.where("auditId").anyOf(audits).delete();
    for (const table of [
      db.screenshots,
      db.issues,
      db.comparisons,
      db.auditRuns,
      db.activityEvents,
    ])
      await table.where("projectId").equals(id).delete();
    await db.projects.delete(id);
  });
}
export async function decodeImage(blob: Blob) {
  const bitmap = await createImageBitmap(blob);
  const result = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  if (
    result.width > 20000 ||
    result.height > 20000 ||
    result.width * result.height > 40000000
  )
    throw new Error("Image exceeds the 40 megapixel / 20,000px limit.");
  return result;
}
export async function uploadImages(
  projectId: string,
  files: File[],
  viewport: { width: number; height: number },
) {
  if (!(await db.projects.get(projectId)))
    throw new Error("Select a project before uploading.");
  const shots: Screenshot[] = [];
  for (const file of files) {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
      throw new Error(`${file.name}: use PNG, JPEG or WebP.`);
    if (file.size > 20 * 1024 * 1024 || !file.size)
      throw new Error(`${file.name}: images must be between 1 byte and 20 MB.`);
    const size = await decodeImage(file);
    shots.push({
      id: uid(),
      projectId,
      name: file.name,
      ...size,
      blob: file,
      size: file.size,
      mime: file.type as Screenshot["mime"],
      viewportWidth: viewport.width,
      viewportHeight: viewport.height,
      createdAt: Date.now(),
    });
  }
  await db.transaction(
    "rw",
    [db.projects, db.screenshots, db.activityEvents],
    async () => {
      await requireProject(projectId);
      await db.screenshots.bulkAdd(shots);
      await activity(
        `Uploaded ${shots.length} screenshot${shots.length === 1 ? "" : "s"}`,
        projectId,
      );
    },
  );
}
export async function deleteScreenshot(id: string) {
  await db.transaction("rw", db.tables, async () => {
    const shot = await db.screenshots.get(id);
    if (!shot) return;
    await db.annotations.where("screenshotId").equals(id).delete();
    await db.issues
      .where("screenshotId")
      .equals(id)
      .modify((issue) => {
        delete issue.screenshotId;
        delete issue.annotationId;
      });
    await db.auditFindings
      .where("screenshotId")
      .equals(id)
      .modify((finding) => {
        delete finding.screenshotId;
      });
    await db.comparisons
      .filter((c) => c.baselineId === id || c.currentId === id)
      .delete();
    await db.screenshots.delete(id);
    await activity(`Deleted screenshot “${shot.name}”`, shot.projectId);
  });
}
export async function updateScreenshot(
  id: string,
  changes: Pick<Screenshot, "name" | "viewportWidth" | "viewportHeight">,
) {
  await db.transaction(
    "rw",
    [db.screenshots, db.projects, db.activityEvents],
    async () => {
      const shot = await db.screenshots.get(id);
      if (!shot) throw new Error("Screenshot no longer exists.");
      const checked = screenshotMetaSchema.parse({ ...shot, ...changes });
      await db.screenshots.put({ ...checked, blob: shot.blob });
      await activity(`Updated screenshot “${checked.name}”`, shot.projectId);
    },
  );
}
async function requireProject(id: string) {
  if (!(await db.projects.get(id)))
    throw new Error("The selected project no longer exists.");
}
export async function saveIssue(value: Issue) {
  const issue = issueSchema.parse(value);
  await db.transaction("rw", db.tables, async () => {
    await requireProject(issue.projectId);
    if (
      issue.screenshotId &&
      (await db.screenshots.get(issue.screenshotId))?.projectId !==
        issue.projectId
    )
      throw new Error("Screenshot must belong to this project.");
    if (
      issue.annotationId &&
      (await db.annotations.get(issue.annotationId))?.screenshotId !==
        issue.screenshotId
    )
      throw new Error("Annotation must belong to the screenshot.");
    await db.issues.put(issue);
    await activity(`Issue: ${issue.title} · ${issue.status}`, issue.projectId);
  });
}
export async function saveAnnotation(value: Annotation) {
  const marker = value.type === "pin" || value.type === "text";
  const note = annotationSchema.parse(
    marker ? { ...value, width: 0, height: 0 } : value,
  );
  if (!marker && (!note.width || !note.height))
    throw new Error(
      "Rectangle and highlight dimensions must be greater than zero.",
    );
  await db.transaction("rw", [db.screenshots, db.annotations], async () => {
    const shot = await db.screenshots.get(note.screenshotId);
    if (
      !shot ||
      note.x + note.width > shot.width ||
      note.y + note.height > shot.height
    )
      throw new Error("Annotation must fit within the original image.");
    await db.annotations.put(note);
  });
}
export async function deleteAnnotation(id: string) {
  await db.transaction("rw", [db.annotations, db.issues], async () => {
    await db.issues
      .where("annotationId")
      .equals(id)
      .modify((issue) => {
        delete issue.annotationId;
      });
    await db.annotations.delete(id);
  });
}
export async function saveComparison(value: Comparison) {
  const c = comparisonSchema.parse(value);
  if (c.baselineId === c.currentId)
    throw new Error("Choose two different screenshots.");
  await db.transaction(
    "rw",
    [db.comparisons, db.projects, db.activityEvents, db.screenshots],
    async () => {
      await requireProject(c.projectId);
      const shots = await db.screenshots.bulkGet([c.baselineId, c.currentId]);
      if (shots.some((s) => !s || s.projectId !== c.projectId))
        throw new Error(
          "Both screenshots must belong to the selected project.",
        );
      await db.comparisons.put(c);
      await activity(`Saved comparison “${c.name}”`, c.projectId);
    },
  );
}
export async function saveAudit(value: Audit, findings: Finding[]) {
  const audit = auditSchema.parse(value);
  const checked = findings.map((f) => findingSchema.parse(f));
  await db.transaction("rw", db.tables, async () => {
    await requireProject(audit.projectId);
    for (const f of checked) {
      if (f.auditId !== audit.id) throw new Error("Invalid finding reference.");
      if (
        f.screenshotId &&
        (await db.screenshots.get(f.screenshotId))?.projectId !==
          audit.projectId
      )
        throw new Error("Invalid finding evidence.");
    }
    await db.auditRuns.put(audit);
    await db.auditFindings.where("auditId").equals(audit.id).delete();
    await db.auditFindings.bulkPut(checked);
    await activity(`Recorded ${audit.type} audit`, audit.projectId);
  });
}
export async function savePreset(value: Preset) {
  const preset = presetSchema.parse(value);
  if (!preset.custom) throw new Error("Default presets cannot be changed.");
  await db.viewportPresets.put(preset);
}
