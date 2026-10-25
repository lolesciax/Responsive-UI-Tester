import Dexie, { type EntityTable } from "dexie";
import type {
  Project,
  Screenshot,
  Annotation,
  Issue,
  Comparison,
  Audit,
  Finding,
  Preset,
  Activity,
} from "./schema";
export const db = new Dexie("responsive-studio") as Dexie & {
  projects: EntityTable<Project, "id">;
  screenshots: EntityTable<Screenshot, "id">;
  annotations: EntityTable<Annotation, "id">;
  issues: EntityTable<Issue, "id">;
  comparisons: EntityTable<Comparison, "id">;
  auditRuns: EntityTable<Audit, "id">;
  auditFindings: EntityTable<Finding, "id">;
  viewportPresets: EntityTable<Preset, "id">;
  settings: EntityTable<{ id: string; value: string }, "id">;
  activityEvents: EntityTable<Activity, "id">;
};
db.version(1).stores({
  projects: "id,name,updatedAt",
  screenshots: "id,projectId,createdAt",
  annotations: "id,screenshotId",
  issues: "id,projectId,screenshotId,annotationId,status,severity,createdAt",
  comparisons: "id,projectId,baselineId,currentId",
  auditRuns: "id,projectId,createdAt",
  auditFindings: "id,auditId,screenshotId",
  viewportPresets: "id",
  settings: "id",
  activityEvents: "id,projectId,createdAt",
});
