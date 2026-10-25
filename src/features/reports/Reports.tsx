import { useState } from "react";
import { Download, Printer } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Empty,
  PageTitle,
  ProjectSelect,
  ShotImage,
} from "../../components/shared";
import { Button } from "../../components/ui/button";
import type { Data } from "../../hooks/use-data";
import { useUI } from "../../stores/ui";
import { severities, statuses } from "../../database/schema";
import { csv, date, download } from "../../lib/utils";
import { distribution, filterIssues } from "./aggregate";
export default function Reports({ data }: { data: Data }) {
  const [generatedAt] = useState(() => Date.now());
  const ui = useUI();
  const [severity, setSeverity] = useState("");
  const [status, setStatus] = useState(ui.reportStatus);
  const [viewport, setViewport] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [auditType, setAuditType] = useState("");
  const start = from ? new Date(`${from}T00:00:00`).getTime() : undefined;
  const end = to ? new Date(`${to}T23:59:59.999`).getTime() : undefined;
  const issues = filterIssues(data.issues, {
    projectId: ui.projectId,
    severity,
    status,
    viewport,
    from: start,
    to: end,
  });
  const audits = data.audits.filter(
    (a) =>
      (!ui.projectId || a.projectId === ui.projectId) &&
      (!auditType || a.type === auditType) &&
      (!viewport || a.viewport === viewport) &&
      (start === undefined || a.createdAt >= start) &&
      (end === undefined || a.createdAt <= end),
  );
  const findings = data.findings.filter(
    (f) =>
      audits.some((a) => a.id === f.auditId) &&
      (!severity || f.severity === severity) &&
      (!viewport || f.viewport === viewport),
  );
  const comparisons = data.comparisons.filter(
    (c) =>
      (!ui.projectId || c.projectId === ui.projectId) &&
      (start === undefined || c.createdAt >= start) &&
      (end === undefined || c.createdAt <= end),
  );
  const evidenceIds = new Set([
    ...issues.map((i) => i.screenshotId),
    ...findings.map((f) => f.screenshotId),
    ...comparisons.flatMap((c) => [c.baselineId, c.currentId]),
  ]);
  const evidence = data.screenshots.filter((s) => evidenceIds.has(s.id));
  const report = {
    version: 1,
    generatedAt: new Date(generatedAt).toISOString(),
    filters: {
      projectId: ui.projectId,
      severity,
      status,
      viewport,
      from,
      to,
      auditType,
    },
    projects: data.projects.filter(
      (p) => !ui.projectId || p.id === ui.projectId,
    ),
    issues,
    audits,
    findings,
    comparisons,
    screenshots: evidence.map(({ blob: _blob, ...meta }) => meta),
  };
  return (
    <>
      <PageTitle
        title="Reports"
        description="Share evidence and corrective actions from your local testing records."
      >
        <Button
          onClick={() =>
            download(
              new Blob([JSON.stringify(report, null, 2)], {
                type: "application/json",
              }),
              "responsive-report.json",
            )
          }
        >
          <Download size={16} />
          JSON
        </Button>
        <Button
          onClick={() =>
            download(
              new Blob([csv(issues)], { type: "text/csv;charset=utf-8" }),
              "issues.csv",
            )
          }
        >
          <Download size={16} />
          CSV
        </Button>
        <Button variant="default" onClick={() => window.print()}>
          <Printer size={16} />
          Print / PDF
        </Button>
      </PageTitle>
      <div className="filterbar no-print">
        <ProjectSelect data={data} all />
        {[
          ["Severity", severity, setSeverity, severities],
          ["Status", status, setStatus, statuses],
          [
            "Viewport",
            viewport,
            setViewport,
            [
              ...new Set([
                ...data.issues.map((i) => i.viewport),
                ...data.audits.map((a) => a.viewport),
              ]),
            ].filter(Boolean),
          ],
          ["Audit type", auditType, setAuditType, ["manual", "automated"]],
        ].map(([label, value, setter, options]) => (
          <label className="field" key={String(label)}>
            {String(label)}
            <select
              value={value as string}
              onChange={(e) => (setter as (v: string) => void)(e.target.value)}
            >
              <option value="">All</option>
              {(options as readonly string[]).map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
        ))}
        <label className="field">
          From
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="field">
          To
          <input
            type="date"
            min={from}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
      </div>
      <article className="panel report">
        <div className="row between wrap">
          <div>
            <h2>
              {data.projects.find((p) => p.id === ui.projectId)?.name ??
                "All projects"}{" "}
              · Review report
            </h2>
            <p className="muted">
              Generated {date(generatedAt)} · Manual observations and stored
              evidence
            </p>
          </div>
          <strong>
            {issues.length} issues · {audits.length} audits · {findings.length}{" "}
            findings
          </strong>
        </div>
        <div className="report-distributions">
          {(["severity", "status", "viewport"] as const).map((field) => (
            <section key={field}>
              <h3>{field[0].toUpperCase() + field.slice(1)} distribution</h3>
              {Object.entries(distribution(issues, field)).map(
                ([name, count]) => (
                  <div className="distribution-row" key={name}>
                    <span>{name}</span>
                    <meter
                      min={0}
                      max={Math.max(1, issues.length)}
                      value={count}
                      aria-label={`${name}: ${count}`}
                    />
                    <strong>{count}</strong>
                  </div>
                ),
              )}
              {!issues.length && <p className="muted">No matching issues</p>}
            </section>
          ))}
        </div>
        <h3>Issues and corrective actions</h3>
        {issues.map((i) => (
          <section className="report-item" key={i.id}>
            <h4>{i.title}</h4>
            <p>
              <strong>
                {i.severity} · {i.status}
              </strong>{" "}
              · {i.category} · {i.viewport} · {i.source}
            </p>
            <p>{i.description}</p>
            {i.steps && <p>Reproduction: {i.steps}</p>}
            {i.suggestion && <p>Recommended action: {i.suggestion}</p>}
            {i.screenshotId && (
              <Link to={`/workspace?screenshot=${i.screenshotId}`}>
                View screenshot evidence
              </Link>
            )}
          </section>
        ))}
        <h3>Audit summaries</h3>
        {audits.map((a) => (
          <section className="report-item" key={a.id}>
            <h4>{a.summary}</h4>
            <p>
              {a.type} · {a.status} · {a.viewport} · {date(a.createdAt)}
            </p>
            {findings
              .filter((f) => f.auditId === a.id)
              .map((f) => (
                <div key={f.id}>
                  <p>
                    <strong>
                      {f.severity}: {f.type}
                    </strong>{" "}
                    — {f.description}
                  </p>
                  <p>{f.evidence}</p>
                  <p>{f.suggestion}</p>
                  <small>{f.limitation}</small>
                </div>
              ))}
          </section>
        ))}
        <h3>Comparison sessions</h3>
        {comparisons.map((c) => (
          <p key={c.id}>
            {c.name} · {c.mode} · threshold {c.threshold} · {c.alignment}{" "}
            alignment. Baseline:{" "}
            {data.screenshots.find((s) => s.id === c.baselineId)?.name};
            current: {data.screenshots.find((s) => s.id === c.currentId)?.name}.
          </p>
        ))}
        <h3>Screenshot evidence</h3>
        <div className="report-evidence">
          {evidence.map((s) => (
            <figure key={s.id}>
              <ShotImage shot={s} />
              <figcaption>
                {s.name} · viewport {s.viewportWidth} × {s.viewportHeight}
              </figcaption>
            </figure>
          ))}
        </div>
        {!issues.length && !audits.length && !comparisons.length && (
          <Empty
            title="Your findings become your report"
            description="Add issues or record an audit, then use filters to prepare a focused report."
          />
        )}
        <p className="notice">
          Reports summarize recorded evidence; they do not certify accessibility
          or responsive correctness. JSON reports include image metadata; use
          Data Management ZIP backups to include original image files. Print
          uses your browser’s Save as PDF option.
        </p>
      </article>
    </>
  );
}
