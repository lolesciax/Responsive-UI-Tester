import { perform } from "../../lib/feedback";
import { useState } from "react";
import { Download, Maximize2, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Confirm,
  Empty,
  PageTitle,
  ProjectSelect,
  ShotImage,
  UploadButton,
} from "../../components/shared";
import { Button } from "../../components/ui/button";
import { Modal } from "../../components/ui/dialog";
import type { Data } from "../../hooks/use-data";
import {
  deleteScreenshot,
  uploadImages,
  updateScreenshot,
} from "../../database/repository";
import type { Screenshot } from "../../database/schema";
import { bytes, download } from "../../lib/utils";
import { useUI } from "../../stores/ui";
export default function Screenshots({ data }: { data: Data }) {
  const ui = useUI();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Screenshot>();
  const [viewing, setViewing] = useState<Screenshot>();
  const [busy, setBusy] = useState(false);
  const shots = data.screenshots.filter(
    (s) =>
      (!ui.projectId || s.projectId === ui.projectId) &&
      s.name.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <PageTitle
        title="Screenshots"
        description="Original image evidence, organized by project and viewport."
      >
        <UploadButton projectId={ui.projectId} />
      </PageTitle>
      <div className="filterbar">
        <ProjectSelect data={data} all />
        <label className="field grow">
          Search screenshots
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search image names…"
          />
        </label>
      </div>
      <div
        className="drop-zone"
        aria-busy={busy}
        onDragOver={(e) => e.preventDefault()}
        onDrop={async (e) => {
          e.preventDefault();
          if (busy) return;
          setBusy(true);
          await perform(
            () =>
              uploadImages(ui.projectId, Array.from(e.dataTransfer.files), ui),
            "Screenshots uploaded",
          );
          setBusy(false);
        }}
      >
        {busy
          ? "Decoding and saving…"
          : "Drop PNG, JPEG or WebP files here · up to 20 MB each · select a project first"}
      </div>
      {shots.length ? (
        <div className="screenshot-grid">
          {shots.map((s) => (
            <article className="panel shot-card" key={s.id}>
              <button
                className="shot-thumb"
                aria-label={`View ${s.name}`}
                onClick={() => setViewing(s)}
              >
                <ShotImage shot={s} />
              </button>
              <div className="shot-info">
                <h2>{s.name}</h2>
                <p>
                  {s.width} × {s.height} px · {bytes(s.size)}
                </p>
                <small>
                  Viewport {s.viewportWidth} × {s.viewportHeight}
                </small>
                <div className="row wrap">
                  <Button asChild size="sm">
                    <Link
                      to="/workspace"
                      onClick={() =>
                        ui.set({ projectId: s.projectId, screenshotId: s.id })
                      }
                    >
                      Inspect
                    </Link>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Edit ${s.name}`}
                    onClick={() => setEditing(s)}
                  >
                    <Pencil size={16} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Download ${s.name}`}
                    onClick={() => download(s.blob, s.name)}
                  >
                    <Download size={16} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Fullscreen ${s.name}`}
                    onClick={() => setViewing(s)}
                  >
                    <Maximize2 size={16} />
                  </Button>
                  <Confirm
                    title="Delete screenshot?"
                    description="The original image, its annotations and comparisons will be deleted. Issues and audit findings remain, with their image links removed."
                    action={() => deleteScreenshot(s.id)}
                  >
                    <Trash2 size={16} />
                    <span className="sr-only">Delete {s.name}</span>
                  </Confirm>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="panel">
          <Empty
            icon="image"
            title="Make your first capture count"
            description="Upload screenshots from your browser or design tool. The original image is always preserved."
            action={<UploadButton projectId={ui.projectId} />}
          />
        </section>
      )}
      {viewing && (
        <Modal
          open
          onOpenChange={() => setViewing(undefined)}
          title={viewing.name}
          description={`${viewing.width} × ${viewing.height} original pixels`}
        >
          <div className="image-viewer">
            <ShotImage shot={viewing} />
          </div>
        </Modal>
      )}
      {editing && (
        <Modal
          open
          onOpenChange={() => setEditing(undefined)}
          title="Edit screenshot"
          description="Display dimensions are independent of the assigned viewport."
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const name = String(f.get("name")).trim();
              if (!name) return;
              setBusy(true);
              const ok = await perform(
                () =>
                  updateScreenshot(editing.id, {
                    name,
                    viewportWidth: Number(f.get("width")),
                    viewportHeight: Number(f.get("height")),
                  }),
                "Screenshot updated",
              );
              setBusy(false);
              if (ok) setEditing(undefined);
            }}
          >
            <label className="field">
              Name
              <input
                name="name"
                required
                maxLength={200}
                defaultValue={editing.name}
              />
            </label>
            <div className="form-grid">
              <label className="field">
                Viewport width
                <input
                  name="width"
                  type="number"
                  min={200}
                  max={7680}
                  required
                  defaultValue={editing.viewportWidth}
                />
              </label>
              <label className="field">
                Viewport height
                <input
                  name="height"
                  type="number"
                  min={200}
                  max={7680}
                  required
                  defaultValue={editing.viewportHeight}
                />
              </label>
            </div>
            <div className="dialog-actions">
              <Button variant="default" disabled={busy}>
                Save screenshot
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
