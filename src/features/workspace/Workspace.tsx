import AnnotationCanvas from "./AnnotationCanvas";
import AnnotationForm from "./AnnotationForm";
import { perform } from "../../lib/feedback";
import { useEffect, useRef, useState } from "react";
import {
  Download,
  ExternalLink,
  Info,
  Maximize2,
  Minus,
  Plus,
  RotateCcw,
  Scan,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Empty,
  PageTitle,
  ProjectSelect,
  UploadButton,
} from "../../components/shared";
import { Button } from "../../components/ui/button";
import type { Data } from "../../hooks/use-data";
import { useUI } from "../../stores/ui";
import { defaults, safeUrl, type Annotation } from "../../database/schema";
import { download } from "../../lib/utils";
import { previewPolicy } from "../../lib/preview-policy";
import { useCanvasFit } from "./use-canvas-fit";
export default function Workspace({ data }: { data: Data }) {
  const ui = useUI();
  const [params] = useSearchParams();
  const requested = params.get("screenshot");
  useEffect(() => {
    const s = data.screenshots.find((s) => s.id === requested);
    if (s) useUI.getState().set({ screenshotId: s.id, projectId: s.projectId });
  }, [requested, data.screenshots]);
  const project = data.projects.find((p) => p.id === ui.projectId);
  const shots = data.screenshots.filter((s) => s.projectId === ui.projectId);
  const shot = shots.find((s) => s.id === ui.screenshotId) ?? shots[0];
  const [mode, setMode] = useState<"screenshot" | "live">("screenshot");
  const [urlDraft, setUrlDraft] = useState({
    projectId: ui.projectId,
    value: project?.url ?? "",
  });
  const url =
    urlDraft.projectId === ui.projectId ? urlDraft.value : (project?.url ?? "");
  const setUrl = (value: string) =>
    setUrlDraft({ projectId: ui.projectId, value });
  const [preview, setPreview] = useState("");
  const [previewReload, setPreviewReload] = useState(0);
  const [previewHelpOpen, setPreviewHelpOpen] = useState(false);
  const [trustedOrigin, setTrustedOrigin] = useState<string | null>(null);
  const draftPolicy = previewPolicy(url, window.location.origin, trustedOrigin);
  const activePolicy = previewPolicy(
    preview,
    window.location.origin,
    trustedOrigin,
  );
  const [editing, setEditing] = useState<Annotation | null | undefined>();
  const [pan, setPan] = useState(false);
  const canvas = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    x: number;
    y: number;
    left: number;
    top: number;
  } | null>(null);
  const presets = [...defaults, ...data.presets];
  const selectedPreset =
    presets.find(
      (preset) => preset.width === ui.width && preset.height === ui.height,
    )?.id ?? "";
  const notes = data.annotations.filter((a) => a.screenshotId === shot?.id);
  const fit = useCanvasFit(
    canvas,
    mode === "live" ? ui.width : shot?.width,
    mode === "live" ? ui.height : shot?.height,
    mode === "live"
      ? preview
        ? `${preview}:${activePolicy.storageEnabled}:${previewReload}`
        : undefined
      : shot?.id,
    mode === "live" || ui.fitImages,
  );
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).closest(
          'input, textarea, select, [role="dialog"]',
        )
      )
        return;
      if (e.key === "0") ui.set({ zoom: 1 });
      if (e.key === "+" || e.key === "=")
        ui.set({ zoom: Math.min(4, ui.zoom + 0.1) });
      if (e.key === "-") ui.set({ zoom: Math.max(0.05, ui.zoom - 0.1) });
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [ui]);
  return (
    <>
      <PageTitle
        title="Testing workspace"
        description="Inspect your interface. Capture evidence. Keep the details in view."
      >
        <UploadButton projectId={ui.projectId} />
        <Button asChild>
          <Link to="/comparisons">Compare</Link>
        </Button>
        <Button asChild>
          <Link to="/audits">Record audit</Link>
        </Button>
        <Button asChild>
          <Link to="/reports">Export report</Link>
        </Button>
      </PageTitle>
      <div className="workspace-toolbar">
        <ProjectSelect data={data} />
        <label className="field compact">
          <span>Viewport preset</span>
          <select
            value={selectedPreset}
            onChange={(e) => {
              const p = presets.find((p) => p.id === e.target.value);
              if (p) ui.set({ width: p.width, height: p.height });
            }}
          >
            <option value="">
              {ui.width} × {ui.height} · Custom
            </option>
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.width} × {p.height}
              </option>
            ))}
          </select>
        </label>
        <label className="field compact dimensions">
          Width
          <input
            aria-label="Viewport width"
            type="number"
            min={200}
            max={7680}
            value={ui.width}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (n >= 200 && n <= 7680) ui.set({ width: n });
            }}
          />
        </label>
        <label className="field compact dimensions">
          Height
          <input
            aria-label="Viewport height"
            type="number"
            min={200}
            max={7680}
            value={ui.height}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (n >= 200 && n <= 7680) ui.set({ height: n });
            }}
          />
        </label>
        <Button
          size="icon"
          aria-label="Rotate viewport"
          onClick={() => ui.set({ width: ui.height, height: ui.width })}
        >
          <RotateCcw size={16} />
        </Button>
      </div>
      <div
        className={`workspace-grid ${mode === "live" ? "live-preview-workspace" : ""}`}
      >
        <section className="panel canvas-panel">
          <div className="canvas-header">
            <div className="segmented" aria-label="Preview mode">
              <Button
                variant={mode === "screenshot" ? "default" : "ghost"}
                size="sm"
                onClick={() => setMode("screenshot")}
              >
                Screenshot
              </Button>
              <Button
                variant={mode === "live" ? "default" : "ghost"}
                size="sm"
                onClick={() => setMode("live")}
              >
                Live preview
              </Button>
            </div>
            <div className="row wrap">
              <Button
                size="icon"
                aria-label="Zoom out"
                onClick={() => ui.set({ zoom: Math.max(0.05, ui.zoom - 0.1) })}
              >
                <Minus size={15} />
              </Button>
              <span className="mono">{Math.round(ui.zoom * 100)}%</span>
              <Button
                size="icon"
                aria-label="Zoom in"
                onClick={() => ui.set({ zoom: Math.min(4, ui.zoom + 0.1) })}
              >
                <Plus size={15} />
              </Button>
              <Button size="icon" aria-label="Fit to canvas" onClick={fit}>
                <Scan size={16} />
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  ui.set({ zoom: 1 });
                  if (canvas.current) canvas.current.scrollTo(0, 0);
                }}
              >
                1:1
              </Button>
              <Button
                size="icon"
                aria-label="Fullscreen canvas"
                onClick={() =>
                  void perform(async () => {
                    if (!document.fullscreenElement)
                      await canvas.current?.requestFullscreen();
                    else await document.exitFullscreen();
                  })
                }
              >
                <Maximize2 size={16} />
              </Button>
            </div>
          </div>
          {mode === "live" && (
            <>
              <form
                className="url-bar"
                onSubmit={(e) => {
                  e.preventDefault();
                  const parsed = safeUrl.safeParse(url);
                  if (!parsed.success || !url) {
                    void perform(async () => {
                      throw new Error(
                        "Enter a valid HTTP(S) URL without credentials.",
                      );
                    });
                    return;
                  }
                  setPreview(url);
                  setPreviewReload((value) => value + 1);
                }}
              >
                <label className="field grow">
                  <span className="sr-only">Preview website URL</span>
                  <input
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                  />
                </label>
                <Button>Load preview</Button>
                {draftPolicy.origin && (
                  <Button asChild>
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      Open site in new tab <ExternalLink size={14} />
                    </a>
                  </Button>
                )}
              </form>
              <div className="preview-options">
                <label className="check-row preview-storage-toggle">
                  <input
                    type="checkbox"
                    disabled={!draftPolicy.canEnableStorage}
                    checked={
                      draftPolicy.canEnableStorage &&
                      trustedOrigin === draftPolicy.origin
                    }
                    onChange={(event) =>
                      setTrustedOrigin(
                        event.target.checked ? draftPolicy.origin : null,
                      )
                    }
                    aria-describedby="preview-storage-help"
                    aria-label="Allow site storage for this trusted external site"
                  />
                  Allow storage for this trusted site
                </label>
                <span id="preview-storage-help" className="sr-only">
                  Enable only for an external site you trust. Storage access
                  stays disabled for Studio’s own origin.
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-expanded={previewHelpOpen}
                  aria-controls="live-preview-help"
                  onClick={() => setPreviewHelpOpen((open) => !open)}
                >
                  <Info size={15} />
                  Preview help
                </Button>
              </div>
              <div
                id="live-preview-help"
                className="preview-help"
                role="region"
                aria-label="Live preview help"
                hidden={!previewHelpOpen}
              >
                <p>
                  {draftPolicy.origin && !draftPolicy.canEnableStorage
                    ? "This URL shares Studio’s origin. Use a different local port or open the site in a new tab; preview storage stays disabled."
                    : "Enable storage only for a site you trust, including its redirects. Changing this option reloads the preview. Browser privacy settings still apply."}
                </p>
                <p>
                  If embedding is blocked, open the site in a new tab or upload
                  screenshots. DOM audits require a local runner; no runner is
                  connected.
                </p>
              </div>
            </>
          )}
          {mode === "screenshot" && (
            <div className="screenshot-selector">
              <label className="field compact">
                Screenshot
                <select
                  value={shot?.id ?? ""}
                  onChange={(e) => ui.set({ screenshotId: e.target.value })}
                >
                  <option value="" disabled>
                    Select screenshot
                  </option>
                  {shots.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <Button size="sm" aria-pressed={pan} onClick={() => setPan(!pan)}>
                {pan ? "Pan enabled" : "Enable pan"}
              </Button>
            </div>
          )}
          <div
            className={`canvas ${pan ? "panning" : ""}`}
            ref={canvas}
            onPointerDown={(e) => {
              if (!pan || !canvas.current) return;
              drag.current = {
                x: e.clientX,
                y: e.clientY,
                left: canvas.current.scrollLeft,
                top: canvas.current.scrollTop,
              };
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!drag.current || !canvas.current) return;
              canvas.current.scrollLeft =
                drag.current.left - (e.clientX - drag.current.x);
              canvas.current.scrollTop =
                drag.current.top - (e.clientY - drag.current.y);
            }}
            onPointerUp={() => {
              drag.current = null;
            }}
            onPointerCancel={() => {
              drag.current = null;
            }}
          >
            {mode === "screenshot" ? (
              shot ? (
                <AnnotationCanvas
                  shot={shot}
                  annotations={notes}
                  zoom={ui.zoom}
                  onSelect={setEditing}
                  disabled={pan}
                />
              ) : (
                <Empty
                  icon="image"
                  title="Your canvas is ready"
                  description={
                    project
                      ? "Upload a screenshot to start reviewing and annotating."
                      : "Select or create a project, then upload your screenshots."
                  }
                  action={<UploadButton projectId={ui.projectId} />}
                />
              )
            ) : preview ? (
              <div
                className="live-preview-stage"
                style={{
                  width: ui.width * ui.zoom,
                  height: ui.height * ui.zoom,
                  flexShrink: 0,
                }}
              >
                <iframe
                  key={`${preview}-${activePolicy.storageEnabled}-${previewReload}`}
                  title="Sandboxed website preview"
                  src={preview}
                  sandbox={activePolicy.sandbox}
                  referrerPolicy="no-referrer"
                  style={{
                    width: ui.width,
                    height: ui.height,
                    transform: `scale(${ui.zoom})`,
                    transformOrigin: "top left",
                    border: 0,
                    background: "white",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    display: "block",
                  }}
                />
              </div>
            ) : (
              <Empty
                title="Preview a website"
                description="Enter a URL above. The preview uses a sandboxed iframe; screenshots remain the most reliable review workflow."
              />
            )}
          </div>
          <div className="canvas-footer">
            <span>
              {shot && mode === "screenshot"
                ? `Original ${shot.width} × ${shot.height} px · viewport ${shot.viewportWidth} × ${shot.viewportHeight}`
                : `Viewport ${ui.width} × ${ui.height}`}
            </span>
            <span>+ / − zoom · 0 actual size</span>
          </div>
        </section>
        {mode === "screenshot" && (
          <aside className="panel inspector">
            <h2>Inspector</h2>
            {shot ? (
              <>
                <label className="field">
                  Screenshot
                  <input readOnly value={shot.name} />
                </label>
                <p className="muted small">
                  Annotations use original image coordinates and remain aligned
                  at every zoom.
                </p>
                <Button onClick={() => setEditing(null)}>
                  <Plus size={15} />
                  Add annotation
                </Button>
                <Button onClick={() => download(shot.blob, shot.name)}>
                  <Download size={15} />
                  Download original
                </Button>
                <hr />
                <h3>
                  Annotations <span className="count">{notes.length}</span>
                </h3>
                {notes.map((a, index) => (
                  <button
                    className="annotation-row"
                    key={a.id}
                    onClick={() => setEditing(a)}
                  >
                    <span className="annotation-number">{index + 1}</span>
                    <span>
                      <strong>{a.type}</strong>
                      <small>{a.text || "No note"}</small>
                    </span>
                  </button>
                ))}
                {!notes.length && (
                  <p className="muted small">
                    Add a note with the button, or click the image to place a
                    marker.
                  </p>
                )}
                <hr />
                <h3>Linked issues</h3>
                {data.issues
                  .filter((i) => i.screenshotId === shot.id)
                  .map((i) => (
                    <Link className="evidence-link" key={i.id} to="/issues">
                      {i.title}
                      <small>
                        {i.severity} · {i.status}
                      </small>
                    </Link>
                  ))}
                <Button asChild>
                  <Link to={`/issues?evidence=${shot.id}`}>
                    Create issue from screenshot
                  </Link>
                </Button>
                <hr />
                <h3>Audit findings</h3>
                {data.findings
                  .filter((f) => f.screenshotId === shot.id)
                  .map((f) => (
                    <p key={f.id}>
                      {f.description}
                      <small className="muted">
                        {f.severity} · {f.limitation}
                      </small>
                    </p>
                  ))}
              </>
            ) : (
              <p className="muted">
                Select a screenshot to inspect its details and annotations.
              </p>
            )}
          </aside>
        )}
      </div>
      {editing !== undefined && shot && (
        <AnnotationForm
          key={editing?.id ?? "new"}
          shot={shot}
          note={editing ?? undefined}
          onClose={() => setEditing(undefined)}
        />
      )}
    </>
  );
}
