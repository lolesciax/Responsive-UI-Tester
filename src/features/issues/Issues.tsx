import { perform } from "../../lib/feedback";
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Confirm,
  Empty,
  PageTitle,
  ProjectSelect,
} from "../../components/shared";
import { Modal } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import type { Data } from "../../hooks/use-data";
import { useUI } from "../../stores/ui";
import {
  categories,
  severities,
  statuses,
  type Issue,
} from "../../database/schema";
import { saveIssue } from "../../database/repository";
import { db } from "../../database/db";
import { date, uid } from "../../lib/utils";
export default function Issues({ data }: { data: Data }) {
  const ui = useUI();
  const [params, setParams] = useSearchParams();
  const evidence = params.get("evidence");
  const [editing, setEditing] = useState<Issue | null | undefined>(() =>
    evidence ? null : undefined,
  );
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("date");
  useEffect(() => {
    if (evidence) {
      const s = data.screenshots.find((s) => s.id === evidence);
      if (s) {
        useUI.getState().set({ projectId: s.projectId });
      }
    }
  }, [evidence, data.screenshots]);
  const issues = data.issues
    .filter(
      (i) =>
        (!ui.projectId || i.projectId === ui.projectId) &&
        (!severity || i.severity === severity) &&
        (!status || i.status === status) &&
        (!category || i.category === category) &&
        `${i.title} ${i.description}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "severity"
        ? severities.indexOf(a.severity) - severities.indexOf(b.severity)
        : b.createdAt - a.createdAt,
    );
  return (
    <>
      <PageTitle
        title="Issues"
        description="Turn findings into clear, actionable improvements."
      >
        <Button
          variant="default"
          disabled={!ui.projectId}
          onClick={() => setEditing(null)}
        >
          <Plus size={16} />
          Create issue
        </Button>
      </PageTitle>
      <div className="filterbar">
        <ProjectSelect data={data} all />
        <label className="field grow">
          Search
          <input
            value={search}
            type="search"
            placeholder="Search issues…"
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        {[
          ["Severity", severity, setSeverity, severities],
          ["Status", status, setStatus, statuses],
          ["Category", category, setCategory, categories],
        ].map(([name, value, setter, values]) => (
          <label className="field" key={String(name)}>
            {String(name)}
            <select
              value={value as string}
              onChange={(e) => (setter as (v: string) => void)(e.target.value)}
            >
              <option value="">All {String(name).toLowerCase()}</option>
              {(values as readonly string[]).map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
        ))}
        <label className="field">
          Sort
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="date">Newest</option>
            <option value="severity">Severity</option>
          </select>
        </label>
      </div>
      {issues.length ? (
        <div className="panel issue-list">
          {issues.map((i) => (
            <article key={i.id} className="issue-row">
              <div className="grow">
                <div className="row wrap">
                  <span
                    className={`severity severity-${i.severity.toLowerCase()}`}
                  >
                    {i.severity}
                  </span>
                  <span className="muted small">
                    {i.category} · {i.source}
                  </span>
                </div>
                <button
                  className="text-button issue-title"
                  onClick={() => setEditing(i)}
                >
                  {i.title}
                </button>
                <p>{i.description}</p>
                <small className="muted">
                  {date(i.updatedAt)}
                  {i.viewport && ` · ${i.viewport}`}
                </small>
                {i.screenshotId && (
                  <Link
                    to={`/workspace?screenshot=${i.screenshotId}`}
                    className="evidence-link"
                  >
                    View screenshot evidence
                  </Link>
                )}
              </div>
              <label className="field compact">
                Status
                <select
                  aria-label={`Status for ${i.title}`}
                  value={i.status}
                  onChange={(e) =>
                    void perform(
                      () =>
                        saveIssue({
                          ...i,
                          status: e.target.value as Issue["status"],
                          updatedAt: Date.now(),
                          resolvedAt:
                            e.target.value === "Resolved"
                              ? Date.now()
                              : undefined,
                        }),
                      "Issue status updated",
                    )
                  }
                >
                  {statuses.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <Confirm
                title="Delete issue?"
                description="The issue will be permanently deleted. Screenshot and annotation evidence will be preserved."
                action={() => db.issues.delete(i.id)}
              >
                <Trash2 size={16} />
                <span className="sr-only">Delete {i.title}</span>
              </Confirm>
            </article>
          ))}
        </div>
      ) : (
        <section className="panel">
          <Empty
            title="A place for every finding"
            description="Select a project and record a responsive issue, or adjust your filters."
          />
        </section>
      )}
      {editing !== undefined && (
        <IssueForm
          data={data}
          issue={editing ?? undefined}
          evidence={evidence ?? undefined}
          onClose={() => {
            setEditing(undefined);
            if (evidence) setParams({});
          }}
        />
      )}
    </>
  );
}
function IssueForm({
  data,
  issue,
  evidence,
  onClose,
}: {
  data: Data;
  issue?: Issue;
  evidence?: string;
  onClose: () => void;
}) {
  const ui = useUI();
  const projectId = issue?.projectId ?? ui.projectId;
  const [screenshot, setScreenshot] = useState(
    issue?.screenshotId ?? evidence ?? "",
  );
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      open
      onOpenChange={onClose}
      title={issue ? "Edit issue" : "Create issue"}
      description="Manual findings are observations to verify. Include evidence and reproduction details."
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const f = new FormData(e.currentTarget);
          const now = Date.now();
          const status = String(f.get("status")) as Issue["status"];
          const ok = await perform(
            () =>
              saveIssue({
                id: issue?.id ?? uid(),
                projectId,
                title: String(f.get("title")),
                description: String(f.get("description")),
                category: String(f.get("category")) as Issue["category"],
                severity: String(f.get("severity")) as Issue["severity"],
                status,
                screenshotId: screenshot || undefined,
                annotationId: String(f.get("annotation")) || undefined,
                viewport: String(f.get("viewport")),
                steps: String(f.get("steps")),
                suggestion: String(f.get("suggestion")),
                source: issue?.source ?? "manual",
                createdAt: issue?.createdAt ?? now,
                updatedAt: now,
                resolvedAt:
                  status === "Resolved"
                    ? (issue?.resolvedAt ?? now)
                    : undefined,
              }),
            "Issue saved",
          );
          setBusy(false);
          if (ok) onClose();
        }}
      >
        <label className="field">
          Title
          <input
            name="title"
            defaultValue={issue?.title}
            required
            maxLength={200}
          />
        </label>
        <label className="field">
          Description
          <textarea
            name="description"
            defaultValue={issue?.description}
            maxLength={10000}
          />
        </label>
        <div className="form-grid">
          <label className="field">
            Category
            <select name="category" defaultValue={issue?.category}>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Severity
            <select name="severity" defaultValue={issue?.severity ?? "Medium"}>
              {severities.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Status
            <select name="status" defaultValue={issue?.status}>
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Viewport
            <input
              name="viewport"
              maxLength={100}
              defaultValue={
                issue?.viewport ??
                (screenshot
                  ? `${data.screenshots.find((s) => s.id === screenshot)?.viewportWidth} × ${data.screenshots.find((s) => s.id === screenshot)?.viewportHeight}`
                  : `${ui.width} × ${ui.height}`)
              }
            />
          </label>
        </div>
        <label className="field">
          Screenshot evidence
          <select
            value={screenshot}
            onChange={(e) => setScreenshot(e.target.value)}
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
          Related annotation
          <select
            key={screenshot}
            name="annotation"
            defaultValue={issue?.annotationId}
          >
            <option value="">None</option>
            {data.annotations
              .filter((a) => a.screenshotId === screenshot)
              .map((a, index) => (
                <option key={a.id} value={a.id}>
                  {index + 1}. {a.text || a.type}
                </option>
              ))}
          </select>
        </label>
        <label className="field">
          Reproduction steps
          <textarea
            name="steps"
            defaultValue={issue?.steps}
            maxLength={10000}
          />
        </label>
        <label className="field">
          Suggested fix
          <textarea
            name="suggestion"
            defaultValue={issue?.suggestion}
            maxLength={10000}
          />
        </label>
        <div className="dialog-actions">
          <Button variant="default" disabled={busy}>
            Save issue
          </Button>
        </div>
      </form>
    </Modal>
  );
}
