import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Confirm, PageTitle } from "../../components/shared";
import { Button } from "../../components/ui/button";
import { Modal } from "../../components/ui/dialog";
import { perform } from "../../lib/feedback";
import { uid } from "../../lib/utils";
import { useUI } from "../../stores/ui";
import { defaults, type Preset } from "../../database/schema";
import { db } from "../../database/db";
import { savePreset } from "../../database/repository";
import type { Data } from "../../hooks/use-data";
export default function Presets({ data }: { data: Data }) {
  const [editing, setEditing] = useState<Preset | null | undefined>();
  const [saving, setSaving] = useState(false);
  const ui = useUI();
  return (
    <>
      <PageTitle
        title="Device presets"
        description="Consistent viewport dimensions for every review."
      >
        <Button variant="default" onClick={() => setEditing(null)}>
          <Plus size={16} />
          Custom preset
        </Button>
      </PageTitle>
      <div className="preset-grid">
        {[...defaults, ...data.presets].map((p) => (
          <article className="panel preset-card" key={p.id}>
            <div
              className="device-outline"
              style={{ aspectRatio: `${p.width}/${p.height}` }}
            />
            <h2>{p.name}</h2>
            <p className="mono">
              {p.width} × {p.height}
            </p>
            <small>
              {p.category} · {p.orientation} · {p.dpr}× DPR
            </small>
            <div className="row wrap">
              <Button
                onClick={() =>
                  ui.set({
                    width: p.width,
                    height: p.height,
                    defaultPreset: p.id,
                  })
                }
              >
                {ui.width === p.width && ui.height === p.height
                  ? "Selected"
                  : "Use viewport"}
              </Button>
              {p.custom && (
                <>
                  <Button onClick={() => setEditing(p)}>Edit</Button>
                  <Confirm
                    title="Delete custom preset?"
                    description="Existing screenshot viewport assignments will remain unchanged."
                    action={() => db.viewportPresets.delete(p.id)}
                  >
                    <Trash2 size={16} />
                    <span className="sr-only">Delete {p.name}</span>
                  </Confirm>
                </>
              )}
            </div>
          </article>
        ))}
      </div>
      {editing !== undefined && (
        <Modal
          open
          onOpenChange={() => setEditing(undefined)}
          title={editing ? "Edit preset" : "Create custom preset"}
          description="Viewport dimensions must be between 200 and 7680 pixels."
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const width = Number(f.get("width"));
              const height = Number(f.get("height"));
              setSaving(true);
              if (
                await perform(
                  () =>
                    savePreset({
                      id: editing?.id ?? uid(),
                      name: String(f.get("name")),
                      width,
                      height,
                      category: String(f.get("category")) as Preset["category"],
                      dpr: Number(f.get("dpr")),
                      orientation: width > height ? "landscape" : "portrait",
                      custom: true,
                    }),
                  "Viewport preset saved",
                )
              )
                setEditing(undefined);
              setSaving(false);
            }}
          >
            <label className="field">
              Name
              <input
                name="name"
                required
                maxLength={100}
                defaultValue={editing?.name}
              />
            </label>
            <div className="form-grid">
              <label className="field">
                Width
                <input
                  name="width"
                  required
                  type="number"
                  min={200}
                  max={7680}
                  defaultValue={editing?.width ?? 390}
                />
              </label>
              <label className="field">
                Height
                <input
                  name="height"
                  required
                  type="number"
                  min={200}
                  max={7680}
                  defaultValue={editing?.height ?? 844}
                />
              </label>
              <label className="field">
                Category
                <select name="category" defaultValue={editing?.category}>
                  {["Mobile", "Tablet", "Desktop"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                Device pixel ratio
                <input
                  name="dpr"
                  required
                  type="number"
                  min={0.5}
                  max={4}
                  step={0.1}
                  defaultValue={editing?.dpr ?? 1}
                />
              </label>
            </div>
            <div className="dialog-actions">
              <Button variant="default" disabled={saving}>
                Save preset
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
