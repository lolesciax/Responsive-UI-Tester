import { z } from "zod";
const id = z.string().uuid();
const time = z.number().finite().nonnegative();
export const dimensions = z.object({
  width: z.number().int().min(200).max(7680),
  height: z.number().int().min(200).max(7680),
});
export const safeUrl = z
  .string()
  .max(2048)
  .refine((value) => {
    if (!value) return true;
    try {
      const u = new URL(value);
      return (
        ["http:", "https:"].includes(u.protocol) && !u.username && !u.password
      );
    } catch {
      return false;
    }
  }, "Enter an http:// or https:// URL without credentials");
export const projectSchema = z.object({
  id,
  name: z.string().trim().min(1).max(100),
  description: z.string().max(3000),
  url: safeUrl,
  presetIds: z.array(z.string()).max(100),
  createdAt: time,
  updatedAt: time,
});
export const screenshotMetaSchema = z.object({
  id,
  projectId: id,
  name: z.string().min(1).max(200),
  width: z.number().int().positive().max(20000),
  height: z.number().int().positive().max(20000),
  size: z.number().int().positive().max(20971520),
  mime: z.enum(["image/png", "image/jpeg", "image/webp"]),
  viewportWidth: z.number().int().min(200).max(7680),
  viewportHeight: z.number().int().min(200).max(7680),
  createdAt: time,
});
export const annotationSchema = z.object({
  id,
  screenshotId: id,
  type: z.enum(["rectangle", "pin", "text", "highlight"]),
  x: z.number().nonnegative(),
  y: z.number().nonnegative(),
  width: z.number().nonnegative(),
  height: z.number().nonnegative(),
  text: z.string().max(3000),
  createdAt: time,
  updatedAt: time,
});
export const categories = [
  "Responsive Layout",
  "Horizontal Overflow",
  "Clipped Content",
  "Overlapping Elements",
  "Typography",
  "Spacing and Alignment",
  "Images and Media",
  "Accessibility",
  "Navigation",
  "Forms and Controls",
  "Visual Regression",
  "Other",
] as const;
export const severities = ["Critical", "High", "Medium", "Low"] as const;
export const statuses = [
  "Open",
  "In Progress",
  "Resolved",
  "Won't Fix",
] as const;
export const issueSchema = z.object({
  id,
  projectId: id,
  title: z.string().trim().min(1).max(200),
  description: z.string().max(10000),
  category: z.enum(categories),
  severity: z.enum(severities),
  status: z.enum(statuses),
  screenshotId: id.optional(),
  annotationId: id.optional(),
  viewport: z.string().max(100),
  steps: z.string().max(10000),
  suggestion: z.string().max(10000),
  source: z.enum(["manual", "automated"]),
  createdAt: time,
  updatedAt: time,
  resolvedAt: time.optional(),
});
export const comparisonSchema = z.object({
  id,
  projectId: id,
  baselineId: id,
  currentId: id,
  name: z.string().min(1).max(200),
  mode: z.enum(["side", "slider", "difference"]),
  alignment: z.enum(["top-left", "center"]),
  threshold: z.number().min(0).max(255),
  createdAt: time,
});
export const auditSchema = z.object({
  id,
  projectId: id,
  url: safeUrl,
  type: z.enum(["manual", "automated"]),
  summary: z.string().trim().min(1).max(10000),
  status: z.enum(["In progress", "Complete"]),
  viewport: z.string().max(100),
  browser: z.string().max(200),
  createdAt: time,
});
export const findingSchema = z.object({
  id,
  auditId: id,
  type: z.string().min(1).max(100),
  severity: z.enum(severities),
  description: z.string().min(1).max(10000),
  evidence: z.string().max(10000),
  viewport: z.string().max(100),
  selector: z.string().max(1000),
  suggestion: z.string().max(10000),
  limitation: z.string().max(10000),
  screenshotId: id.optional(),
});
export const presetSchema = dimensions.extend({
  id: z.string().min(1).max(100),
  name: z.string().trim().min(1).max(100),
  category: z.enum(["Mobile", "Tablet", "Desktop"]),
  dpr: z.number().min(0.5).max(4),
  orientation: z.enum(["portrait", "landscape"]),
  custom: z.boolean(),
});
export const activitySchema = z.object({
  id,
  projectId: id.optional(),
  text: z.string().max(1000),
  createdAt: time,
});
export type Project = z.infer<typeof projectSchema>;
export type Screenshot = z.infer<typeof screenshotMetaSchema> & { blob: Blob };
export type Annotation = z.infer<typeof annotationSchema>;
export type Issue = z.infer<typeof issueSchema>;
export type Comparison = z.infer<typeof comparisonSchema>;
export type Audit = z.infer<typeof auditSchema>;
export type Finding = z.infer<typeof findingSchema>;
export type Preset = z.infer<typeof presetSchema>;
export type Activity = z.infer<typeof activitySchema>;
export const defaults: Preset[] = [
  ["small-mobile", "Small mobile", 320, 568, "Mobile"],
  ["mobile", "Standard mobile", 375, 812, "Mobile"],
  ["large-mobile", "Large mobile", 390, 844, "Mobile"],
  ["tablet", "Tablet portrait", 768, 1024, "Tablet"],
  ["tablet-wide", "Tablet landscape", 1024, 768, "Tablet"],
  ["laptop", "Small laptop", 1280, 800, "Desktop"],
  ["desktop", "Desktop", 1440, 900, "Desktop"],
  ["large-desktop", "Large desktop", 1920, 1080, "Desktop"],
].map(([key, name, width, height, category]) => ({
  id: String(key),
  name: String(name),
  width: Number(width),
  height: Number(height),
  category: category as Preset["category"],
  dpr: 1,
  orientation: Number(width) > Number(height) ? "landscape" : "portrait",
  custom: false,
}));
