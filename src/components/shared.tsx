import { useState, type ReactNode } from "react";
import { perform } from "../lib/feedback";
import {
  FolderPlus,
  ImagePlus,
  LoaderCircle,
  Plus,
  Upload,
  PanelsTopLeft,
} from "lucide-react";
import { Button } from "./ui/button";
import { Modal } from "./ui/dialog";
import { useUI } from "../stores/ui";
import { saveProject, uploadImages } from "../database/repository";
import { defaults, type Project, type Screenshot } from "../database/schema";
import { useObjectUrl, type Data } from "../hooks/use-data";
import { uid } from "../lib/utils";
export function Empty({
  title,
  description,
  action,
  icon = "project",
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: "project" | "image";
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        {icon === "image" ? (
          <ImagePlus size={42} strokeWidth={1.25} />
        ) : (
          <PanelsTopLeft size={52} strokeWidth={1.15} />
        )}
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function PageTitle({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="row wrap">{children}</div>
    </div>
  );
}
export function Loading() {
  return (
    <div className="empty" role="status">
      <LoaderCircle className="spin" />
      Loading local records…
    </div>
  );
}
export function ProjectSelect({
  data,
  all = false,
  value,
  onChange,
}: {
  data: Data;
  all?: boolean;
  value?: string;
  onChange?: (id: string) => void;
}) {
  const ui = useUI();
  const current = value ?? ui.projectId;
  return (
    <label className="field compact">
      <span>Project</span>
      <select
        value={current}
        onChange={(e) =>
          onChange
            ? onChange(e.target.value)
            : ui.set({ projectId: e.target.value, screenshotId: "" })
        }
      >
        <option value="">{all ? "All projects" : "Select a project"}</option>
        {data.projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </label>
  );
}
export function ProjectForm({
  project,
  open,
  onOpenChange,
}: {
  project?: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={project ? "Edit project" : "Create project"}
      description="Keep screenshots, comparisons and findings together. Everything stays in this browser."
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          const now = Date.now();
          const id = project?.id ?? uid();
          setBusy(true);
          const ok = await perform(
            () =>
              saveProject({
                id,
                name: String(form.get("name")),
                description: String(form.get("description")),
                url: String(form.get("url")),
                presetIds: form.getAll("presets").map(String),
                createdAt: project?.createdAt ?? now,
                updatedAt: now,
              }),
            "Project saved",
          );
          setBusy(false);
          if (ok) {
            useUI.getState().set({ projectId: id });
            onOpenChange(false);
          }
        }}
      >
        <label className="field">
          Project name
          <input
            name="name"
            required
            maxLength={100}
            defaultValue={project?.name}
            placeholder="e.g. Website redesign"
          />
        </label>
        <label className="field">
          Description
          <textarea
            name="description"
            maxLength={3000}
            defaultValue={project?.description}
            placeholder="What are you testing?"
          />
        </label>
        <label className="field">
          Website URL (optional)
          <input
            name="url"
            type="url"
            defaultValue={project?.url}
            placeholder="https://example.com"
          />
        </label>
        <fieldset>
          <legend>Preferred viewports</legend>
          <div className="preset-checks">
            {defaults.map((p) => (
              <label key={p.id}>
                <input
                  type="checkbox"
                  name="presets"
                  value={p.id}
                  defaultChecked={
                    project?.presetIds.includes(p.id) ??
                    ["mobile", "tablet", "desktop"].includes(p.id)
                  }
                />
                {p.name}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="dialog-actions">
          <Button type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="default" disabled={busy}>
            <FolderPlus size={16} />
            {busy ? "Saving…" : "Save project"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
export function NewProjectButton({
  label = "New project",
}: {
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="default" onClick={() => setOpen(true)}>
        <Plus size={17} />
        {label}
      </Button>
      <ProjectForm open={open} onOpenChange={setOpen} />
    </>
  );
}
export function Confirm({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action: () => Promise<unknown>;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <Button type="button" variant="ghost" onClick={() => setOpen(true)}>
        {children}
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={description}
      >
        <div className="dialog-actions">
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="destructive"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              if (await perform(action, "Deleted successfully")) setOpen(false);
              setBusy(false);
            }}
          >
            Delete permanently
          </Button>
        </div>
      </Modal>
    </>
  );
}
export function UploadButton({
  projectId,
  label = "Upload screenshots",
}: {
  projectId: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const ui = useUI();
  return (
    <label className={`button outline ${!projectId || busy ? "disabled" : ""}`}>
      <Upload size={16} />
      {busy ? "Decoding images…" : label}
      <input
        aria-label={label}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        disabled={!projectId || busy}
        className="sr-only"
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (!files.length) return;
          setBusy(true);
          await perform(
            () => uploadImages(projectId, files, ui),
            "Screenshots uploaded",
          );
          setBusy(false);
        }}
      />
    </label>
  );
}
export function ShotImage({
  shot,
  className,
}: {
  shot: Screenshot;
  className?: string;
}) {
  const url = useObjectUrl(shot.blob);
  return url ? (
    <img src={url} alt={shot.name} className={className} loading="lazy" />
  ) : null;
}
