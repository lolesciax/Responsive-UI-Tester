import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Confirm } from "../../components/shared";
import { Button } from "../../components/ui/button";
import { Modal } from "../../components/ui/dialog";
import type { Annotation, Screenshot } from "../../database/schema";
import { deleteAnnotation, saveAnnotation } from "../../database/repository";
import { perform } from "../../lib/feedback";
import { uid } from "../../lib/utils";
import { useUI } from "../../stores/ui";
export default function AnnotationForm({
  shot,
  note,
  onClose,
}: {
  shot: Screenshot;
  note?: Annotation;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      open
      onOpenChange={onClose}
      title={note ? "Edit annotation" : "Add annotation"}
      description={`Coordinates in original image pixels (${shot.width} × ${shot.height}). Pin and text notes use zero width and height.`}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const f = new FormData(e.currentTarget);
          const now = Date.now();
          const ok = await perform(
            () =>
              saveAnnotation({
                id: note?.id ?? uid(),
                screenshotId: shot.id,
                type: String(f.get("type")) as Annotation["type"],
                x: Number(f.get("x")),
                y: Number(f.get("y")),
                width: Number(f.get("width")),
                height: Number(f.get("height")),
                text: String(f.get("text")),
                createdAt: note?.createdAt ?? now,
                updatedAt: now,
              }),
            "Annotation saved",
          );
          setBusy(false);
          if (ok) onClose();
        }}
      >
        <label className="field">
          Type
          <select
            name="type"
            defaultValue={note?.type ?? useUI.getState().annotationType}
          >
            {["rectangle", "pin", "text", "highlight"].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <div className="form-grid">
          {[
            ["x", note?.x ?? 0, shot.width],
            ["y", note?.y ?? 0, shot.height],
            ["width", note?.width ?? Math.min(100, shot.width), shot.width],
            ["height", note?.height ?? Math.min(100, shot.height), shot.height],
          ].map(([name, value, max]) => (
            <label className="field" key={name}>
              {String(name)}
              <input
                name={String(name)}
                type="number"
                step="any"
                min={0}
                max={Number(max)}
                required
                defaultValue={Number(value)}
              />
            </label>
          ))}
        </div>
        <label className="field">
          Text note
          <textarea name="text" defaultValue={note?.text} maxLength={3000} />
        </label>
        <div className="dialog-actions">
          {note && (
            <Confirm
              title="Delete annotation?"
              description="The annotation will be removed. Linked issues will retain their screenshot evidence."
              action={async () => {
                await deleteAnnotation(note.id);
                onClose();
              }}
            >
              <Trash2 size={16} />
              Delete
            </Confirm>
          )}
          <Button variant="default" disabled={busy}>
            Save annotation
          </Button>
        </div>
      </form>
    </Modal>
  );
}
