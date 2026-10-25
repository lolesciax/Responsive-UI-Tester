import { perform } from "../../lib/feedback";
import { useState } from "react";
import {
  Copy,
  Download,
  ExternalLink,
  Folder,
  Pencil,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Confirm,
  Empty,
  NewProjectButton,
  PageTitle,
  ProjectForm,
} from "../../components/shared";
import { Button } from "../../components/ui/button";
import type { Data } from "../../hooks/use-data";
import type { Project } from "../../database/schema";
import { deleteProject, saveProject } from "../../database/repository";
import { exportBackup } from "../../database/backup";
import { date, download, uid } from "../../lib/utils";
import { useUI } from "../../stores/ui";
export default function Projects({ data }: { data: Data }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("updated");
  const [editing, setEditing] = useState<Project>();
  const projects = data.projects
    .filter((p) =>
      `${p.name} ${p.description}`.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : sort === "created"
          ? b.createdAt - a.createdAt
          : b.updatedAt - a.updatedAt,
    );
  return (
    <>
      <PageTitle
        title="Projects"
        description="Organize the websites and interfaces you’re testing."
      >
        <NewProjectButton />
      </PageTitle>
      <div className="filterbar">
        <label className="field grow">
          Search projects
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or description…"
          />
        </label>
        <label className="field">
          Sort by
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="updated">Last updated</option>
            <option value="created">Newest first</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>
      {projects.length ? (
        <div className="project-grid">
          {projects.map((p) => (
            <article className="panel project-card" key={p.id}>
              <div className="row between">
                <span className="stat-icon">
                  <Folder size={22} />
                </span>
                <span className="muted small">
                  {data.screenshots.filter((s) => s.projectId === p.id).length}{" "}
                  screenshots
                </span>
              </div>
              <h2>{p.name}</h2>
              <p>{p.description || "No description added."}</p>
              {p.url && (
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate"
                >
                  {p.url}
                  <ExternalLink size={13} />
                </a>
              )}
              <small className="muted">Updated {date(p.updatedAt)}</small>
              <div className="row wrap">
                <span>
                  {data.issues.filter((i) => i.projectId === p.id).length}{" "}
                  issues
                </span>
                <span>·</span>
                <span>
                  {data.audits.filter((a) => a.projectId === p.id).length}{" "}
                  audits
                </span>
              </div>
              <div className="card-actions">
                <Button asChild variant="default">
                  <Link
                    to="/workspace"
                    onClick={() =>
                      useUI
                        .getState()
                        .set({ projectId: p.id, screenshotId: "" })
                    }
                  >
                    Open workspace
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Edit ${p.name}`}
                  onClick={() => setEditing(p)}
                >
                  <Pencil size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Duplicate ${p.name}`}
                  onClick={() =>
                    void perform(
                      () =>
                        saveProject({
                          ...p,
                          id: uid(),
                          name: `${p.name.slice(0, 90)} (copy)`,
                          createdAt: Date.now(),
                          updatedAt: Date.now(),
                        }),
                      "Project configuration duplicated",
                    )
                  }
                >
                  <Copy size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Export ${p.name}`}
                  onClick={() =>
                    void perform(
                      async () =>
                        download(await exportBackup(p.id), `${p.name}.zip`),
                      "Project archive downloaded",
                    )
                  }
                >
                  <Download size={16} />
                </Button>
                <Confirm
                  title={`Delete ${p.name}?`}
                  description="This permanently removes the project and all its screenshots, annotations, comparisons, issues, audit records and activity. Export a backup first if needed."
                  action={() => deleteProject(p.id)}
                >
                  <Trash2 size={16} />
                  <span className="sr-only">Delete {p.name}</span>
                </Confirm>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="panel">
          <Empty
            title={search ? "No matching projects" : "Your projects start here"}
            description={
              search
                ? "Try a different search."
                : "Create a project to organize screenshots and responsive findings."
            }
            action={<NewProjectButton label="Create project" />}
          />
        </section>
      )}
      {editing && (
        <ProjectForm
          project={editing}
          open
          onOpenChange={(open) => {
            if (!open) setEditing(undefined);
          }}
        />
      )}
    </>
  );
}
