import {
  ArrowRight,
  CheckCircle2,
  Database,
  Folder,
  Image,
  ListTodo,
  TriangleAlert,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Empty, NewProjectButton, PageTitle } from "../../components/shared";
import { Button } from "../../components/ui/button";
import type { Data } from "../../hooks/use-data";
import { ActivityList } from "../../components/ActivityList";
import { useUI } from "../../stores/ui";
export default function Dashboard({ data }: { data: Data }) {
  const metrics = [
    { name: "Projects", value: data.projects.length, icon: Folder },
    { name: "Screenshots", value: data.screenshots.length, icon: Image },
    {
      name: "Open issues",
      value: data.issues.filter(
        (i) => i.status === "Open" || i.status === "In Progress",
      ).length,
      icon: TriangleAlert,
    },
    {
      name: "Resolved issues",
      value: data.issues.filter((i) => i.status === "Resolved").length,
      icon: CheckCircle2,
    },
  ];
  return (
    <>
      <PageTitle
        title="Dashboard"
        description="Your responsive testing workspace, all in one place."
      >
        <NewProjectButton />
      </PageTitle>
      <div className="stats">
        {metrics.map((m) => (
          <div className="stat" key={m.name}>
            <span className="stat-icon">
              <m.icon size={22} />
            </span>
            <div>
              <strong>{m.value}</strong>
              <span>{m.name}</span>
              {m.name === "Open issues" && (
                <small className="muted">
                  {data.issues.length} recorded in total
                </small>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <div className="stack">
          <section className="panel">
            <div className="panel-heading">
              <h2>Recently updated projects</h2>
              <Link to="/projects">
                View all projects <ArrowRight size={15} />
              </Link>
            </div>
            {!data.projects.length ? (
              <Empty
                title="A clear view starts with your first project"
                description="Create a project to start uploading screenshots, test across devices, and track your findings."
                action={<NewProjectButton label="Create project" />}
              />
            ) : (
              <div className="project-list">
                {data.projects.slice(0, 5).map((p) => (
                  <Link
                    key={p.id}
                    to="/workspace"
                    onClick={() =>
                      useUI
                        .getState()
                        .set({ projectId: p.id, screenshotId: "" })
                    }
                    className="project-row"
                  >
                    <span className="stat-icon">
                      <Folder size={20} />
                    </span>
                    <div>
                      <strong>{p.name}</strong>
                      <p>
                        {p.description || p.url || "Ready for your next review"}
                      </p>
                    </div>
                    <div className="row-end">
                      <small>
                        {
                          data.screenshots.filter((s) => s.projectId === p.id)
                            .length
                        }{" "}
                        screenshots
                      </small>
                      <ArrowRight size={17} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h2>Recent activity</h2>
              <Link to="/activity">
                View all activity <ArrowRight size={15} />
              </Link>
            </div>
            {data.activity.length ? (
              <ActivityList data={data} limit={4} />
            ) : (
              <div className="small-empty">
                <ListTodo size={28} />
                <strong>No activity yet</strong>
                <p>Your project activity will appear here.</p>
              </div>
            )}
          </section>
        </div>
        <aside className="stack">
          <section className="panel onboarding">
            <h2>Getting started</h2>
            {[
              [
                "Create a project",
                "Set up a project for your app or website.",
                "/projects",
              ],
              [
                "Upload screenshots",
                "Add screenshots from different devices and viewports.",
                "/screenshots",
              ],
              [
                "Review and compare",
                "Compare layouts and spot responsive issues.",
                "/comparisons",
              ],
              [
                "Document findings",
                "Create issues and keep track of improvements.",
                "/issues",
              ],
            ].map(([title, text, href], index) => (
              <Link to={href} key={title} className="step">
                <span>{index + 1}</span>
                <div>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
              </Link>
            ))}
          </section>
          <section className="panel local-panel">
            <Database size={24} />
            <div>
              <h2>Local-first by design</h2>
              <p>
                Projects, screenshots and findings are stored in this browser
                using IndexedDB. No account or cloud database required.
              </p>
              <Link to="/data">
                Manage your data <ArrowRight size={15} />
              </Link>
            </div>
          </section>
          <div className="row wrap quick-actions">
            <Button asChild>
              <Link to="/workspace">Open workspace</Link>
            </Button>
            <Button asChild>
              <Link to="/reports">View reports</Link>
            </Button>
          </div>
        </aside>
      </div>
    </>
  );
}
