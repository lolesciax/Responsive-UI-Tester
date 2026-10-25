import { useEffect, useState } from "react";
import { Database, Download, Trash2, Upload } from "lucide-react";
import { Confirm, PageTitle } from "../../components/shared";
import { Button } from "../../components/ui/button";
import { Modal } from "../../components/ui/dialog";
import { perform } from "../../lib/feedback";
import { bytes, download } from "../../lib/utils";
import { useUI } from "../../stores/ui";
import { db } from "../../database/db";
import { exportBackup, importBackup } from "../../database/backup";
import type { Data } from "../../hooks/use-data";
export default function DataManagement({ data }: { data: Data }) {
  const [estimate, setEstimate] = useState<StorageEstimate>();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");
  const [file, setFile] = useState<File>();
  useEffect(() => {
    if (navigator.storage?.estimate)
      void navigator.storage
        .estimate()
        .then(setEstimate)
        .catch(() => {});
  }, [data.screenshots.length]);
  return (
    <>
      <PageTitle
        title="Data management"
        description="Your work stays local. Keep a backup when it matters."
      />
      <section className="panel settings-panel">
        <div className="row">
          <span className="stat-icon">
            <Database size={22} />
          </span>
          <div>
            <h2>Browser storage</h2>
            <p>
              {data.projects.length} projects · {data.screenshots.length}{" "}
              screenshots ·{" "}
              {bytes(data.screenshots.reduce((total, s) => total + s.size, 0))}{" "}
              of image evidence
            </p>
          </div>
        </div>
        {estimate && (
          <p>
            {bytes(estimate.usage ?? 0)} used of approximately{" "}
            {bytes(estimate.quota ?? 0)} available for this origin.
          </p>
        )}
        <p className="notice">
          Data is tied to this browser profile and site origin. Clearing
          browser/site data can permanently remove your work. There is no
          automatic cross-device sync. Export backups regularly.
        </p>
        <h3>Backup and restore</h3>
        <p>
          ZIP backups include all project records, annotations, findings, custom
          presets and original image files. Imports create new project copies
          and never replace existing work.
        </p>
        <div className="row wrap">
          <Button
            disabled={busy}
            onClick={() =>
              void perform(async () => {
                setBusy(true);
                try {
                  download(
                    await exportBackup(),
                    "responsive-studio-backup.zip",
                  );
                } finally {
                  setBusy(false);
                }
              }, "Complete backup downloaded")
            }
          >
            <Download size={16} />
            {busy ? "Working…" : "Export all data"}
          </Button>
          <label className={`button outline ${busy ? "disabled" : ""}`}>
            <Upload size={16} />
            Import backup
            <input
              aria-label="Import backup"
              type="file"
              accept=".zip,application/zip"
              disabled={busy}
              className="sr-only"
              onChange={(e) => {
                setFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        <p role="status">{result}</p>
        <hr />
        <h3>Reset local data</h3>
        <p>
          Deletes all projects, evidence, findings and custom presets from this
          origin.
        </p>
        <Confirm
          title="Delete all local data?"
          description="Every project, screenshot, annotation, issue, audit, comparison and custom preset will be permanently deleted from this browser. Export a backup before continuing."
          action={async () => {
            await db.transaction("rw", db.tables, async () => {
              for (const table of db.tables) await table.clear();
            });
            useUI.getState().set({ projectId: "", screenshotId: "" });
            setResult("All local records deleted.");
          }}
        >
          <Trash2 size={16} />
          Reset local database
        </Confirm>
      </section>
      {file && (
        <Modal
          open
          onOpenChange={() => setFile(undefined)}
          title="Import backup as new copies?"
          description={`${file.name}: existing projects are preserved. Every imported record receives a new ID. Only validated archives up to 250 MB are accepted.`}
        >
          <div className="dialog-actions">
            <Button disabled={busy} onClick={() => setFile(undefined)}>
              Cancel
            </Button>
            <Button
              variant="default"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                const ok = await perform(async () => {
                  const count = await importBackup(file);
                  setResult(
                    `Imported ${count} project${count === 1 ? "" : "s"} with image assets.`,
                  );
                }, "Backup imported");
                setBusy(false);
                if (ok) setFile(undefined);
              }}
            >
              {busy ? "Validating and importing…" : "Import copies"}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
