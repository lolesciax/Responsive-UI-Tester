import { perform } from "../../lib/feedback";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Confirm,
  Empty,
  PageTitle,
  ProjectSelect,
} from "../../components/shared";
import { Button } from "../../components/ui/button";
import { Modal } from "../../components/ui/dialog";
import type { Data } from "../../hooks/use-data";
import { useUI } from "../../stores/ui";
import { severities, type Audit, type Finding } from "../../database/schema";
import { saveAudit } from "../../database/repository";
import { db } from "../../database/db";
import { date, uid } from "../../lib/utils";
export default function Audits({ data }: { data: Data }) {
  const ui = useUI();
  const [editing, setEditing] = useState<Audit | null | undefined>();
  const audits = data.audits
    .filter((a) => !ui.projectId || a.projectId === ui.projectId)
    .sort((a, b) => b.createdAt - a.createdAt);
  return (
    <>
      <PageTitle
        title="Audits"
        description="Document manual reviews and the evidence behind each finding."
      >
        <Button
          variant="default"
          disabled={!ui.projectId}
          onClick={() => setEditing(null)}
        >
          <Plus size={16} />
          Record manual audit
        </Button>
      </PageTitle>
      <div className="filterbar">
        <ProjectSelect data={data} all />
        <span className="muted small">
          Local runner not connected · Automated DOM audits unavailable
        </span>
      </div>
      {audits.length ? (
        <div className="stack">
          {audits.map((a) => (
            <article className="panel audit-card" key={a.id}>
              <div className="row between wrap">
                <div>
                  <span className="muted small">
                    {a.type} review · {a.status} · {date(a.createdAt)}
                  </span>
                  <h2>{a.summary}</h2>
                  <p>
                    {a.url || "Screenshot review"} · {a.viewport}
                  </p>
                </div>
                <div className="row">
                  <Button onClick={() => setEditing(a)}>Edit audit</Button>
                  <Confirm
                    title="Delete audit?"
                    description="This removes the audit and its findings. Project issues and screenshots are preserved."
                    action={() =>
                      db.transaction(
                        "rw",
                        [db.auditRuns, db.auditFindings],
                        async () => {
                          await db.auditFindings
                            .where("auditId")
                            .equals(a.id)
                            .delete();
                          await db.auditRuns.delete(a.id);
                        },
                      )
                    }
                  >
                    <Trash2 size={16} />
                    <span className="sr-only">Delete audit</span>
                  </Confirm>
                </div>
              </div>
              {data.findings
                .filter((f) => f.auditId === a.id)
                .map((f) => (
                  <div className="finding" key={f.id}>
                    <span
                      className={`severity severity-${f.severity.toLowerCase()}`}
                    >
                      {f.severity}
                    </span>
                    <strong>{f.type}</strong>
                    <p>{f.description}</p>
                    {f.evidence && <p>Evidence: {f.evidence}</p>}
                    {f.suggestion && (
                      <p>Suggested resolution: {f.suggestion}</p>
                    )}
                    <small className="muted">
                      {f.viewport} · {f.limitation}
                    </small>
                    {f.screenshotId && (
                      <Link
                        className="evidence-link"
                        to={`/workspace?screenshot=${f.screenshotId}`}
                      >
                        View screenshot evidence
                      </Link>
                    )}
                  </div>
                ))}
            </article>
          ))}
        </div>
      ) : (
        <section className="panel">
          <Empty
            title="Give your review a record"
            description="Create a manual audit, collect findings, and link screenshot evidence. Browser-only reviews do not inspect external DOM."
          />
        </section>
      )}
      {editing !== undefined && (
        <AuditForm
          data={data}
          audit={editing ?? undefined}
          onClose={() => setEditing(undefined)}
        />
      )}
    </>
  );
}
function AuditForm({
  data,
  audit,
  onClose,
}: {
  data: Data;
  audit?: Audit;
  onClose: () => void;
}) {
  const ui = useUI();
  const [id] = useState(audit?.id ?? uid());
  const projectId = audit?.projectId ?? ui.projectId;
  const [findings, setFindings] = useState<Finding[]>(
    data.findings.filter((f) => f.auditId === id),
  );
  const [busy, setBusy] = useState(false);
  const patch = (index: number, value: Partial<Finding>) =>
    setFindings((items) =>
      items.map((f, i) => (i === index ? { ...f, ...value } : f)),
    );
  return (
    <Modal
      open
      onOpenChange={onClose}
      title={audit ? "Edit manual audit" : "Record manual audit"}
      description="A manual review documents your observations. It does not establish complete accessibility or responsive correctness."
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          setBusy(true);
          const ok = await perform(
            () =>
              saveAudit(
                {
                  id,
                  projectId,
                  url: String(f.get("url")),
                  type: audit?.type ?? "manual",
                  summary: String(f.get("summary")),
                  status: String(f.get("status")) as Audit["status"],
                  viewport: String(f.get("viewport")),
                  browser: audit?.browser ?? navigator.userAgent,
                  createdAt: audit?.createdAt ?? Date.now(),
                },
                findings,
              ),
            "Audit saved",
          );
          setBusy(false);
          if (ok) onClose();
        }}
      >
        <label className="field">
          Summary
          <textarea
            name="summary"
            required
            maxLength={10000}
            defaultValue={audit?.summary}
          />
        </label>
        <label className="field">
          Target URL (optional)
          <input
            name="url"
            type="url"
            defaultValue={
              audit?.url ?? data.projects.find((p) => p.id === projectId)?.url
            }
          />
        </label>
        <div className="form-grid">
          <label className="field">
            Status
            <select name="status" defaultValue={audit?.status ?? "Complete"}>
              <option>In progress</option>
              <option>Complete</option>
            </select>
          </label>
          <label className="field">
            Viewport
            <input
              name="viewport"
              maxLength={100}
              defaultValue={audit?.viewport ?? `${ui.width} × ${ui.height}`}
            />
          </label>
        </div>
        <h3>Findings</h3>
        {findings.map((f, index) => (
          <fieldset key={f.id}>
            <legend>Finding {index + 1}</legend>
            <div className="form-grid">
              <label className="field">
                Type
                <input
                  required
                  maxLength={100}
                  value={f.type}
                  onChange={(e) => patch(index, { type: e.target.value })}
                />
              </label>
              <label className="field">
                Severity
                <select
                  value={f.severity}
                  onChange={(e) =>
                    patch(index, {
                      severity: e.target.value as Finding["severity"],
                    })
                  }
                >
                  {severities.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="field">
              Description
              <textarea
                required
                maxLength={10000}
                value={f.description}
                onChange={(e) => patch(index, { description: e.target.value })}
              />
            </label>
            <label className="field">
              Evidence
              <input
                maxLength={10000}
                value={f.evidence}
                onChange={(e) => patch(index, { evidence: e.target.value })}
              />
            </label>
            <label className="field">
              Screenshot
              <select
                value={f.screenshotId ?? ""}
                onChange={(e) =>
                  patch(index, { screenshotId: e.target.value || undefined })
                }
              >
                <option value="">None</option>
                {data.screenshots
                  .filter((s) => s.projectId === projectId)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </label>
            <label className="field">
              Affected viewport
              <input
                maxLength={100}
                value={f.viewport}
                onChange={(e) => patch(index, { viewport: e.target.value })}
              />
            </label>
            <label className="field">
              Suggested resolution
              <input
                maxLength={10000}
                value={f.suggestion}
                onChange={(e) => patch(index, { suggestion: e.target.value })}
              />
            </label>
            <label className="field">
              Confidence or limitations
              <input
                maxLength={10000}
                value={f.limitation}
                onChange={(e) => patch(index, { limitation: e.target.value })}
              />
            </label>
            <Button
              type="button"
              onClick={() =>
                setFindings((items) => items.filter((_, i) => i !== index))
              }
            >
              Remove finding
            </Button>
          </fieldset>
        ))}
        <Button
          type="button"
          onClick={() =>
            setFindings((items) => [
              ...items,
              {
                id: uid(),
                auditId: id,
                type: "Responsive Layout",
                severity: "Medium",
                description: "",
                evidence: "",
                viewport: `${ui.width} × ${ui.height}`,
                selector: "",
                suggestion: "",
                limitation: "Manual observation; verify in the target browser.",
              },
            ])
          }
        >
          <Plus size={16} />
          Add finding
        </Button>
        <div className="dialog-actions">
          <Button variant="default" disabled={busy}>
            Save audit
          </Button>
        </div>
      </form>
    </Modal>
  );
}
