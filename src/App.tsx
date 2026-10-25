import {
  Component,
  Suspense,
  lazy,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { Toaster } from "sonner";
import { Database, House, Menu, Moon, Sun } from "lucide-react";
import { navigationGroups as groups } from "./app/navigation";
import Navigation from "./components/layout/Navigation";
import { useData } from "./hooks/use-data";
import { Empty, Loading, PageTitle } from "./components/shared";
import { perform } from "./lib/feedback";
import { Button } from "./components/ui/button";
import { Modal } from "./components/ui/dialog";
import { useUI } from "./stores/ui";
import { db } from "./database/db";
import { ActivityList } from "./components/ActivityList";
const Dashboard = lazy(() => import("./features/dashboard/Dashboard"));
const Projects = lazy(() => import("./features/projects/Projects"));
const Screenshots = lazy(() => import("./features/screenshots/Screenshots"));
const Workspace = lazy(() => import("./features/workspace/Workspace"));
const Comparisons = lazy(() => import("./features/comparisons/Comparisons"));
const Issues = lazy(() => import("./features/issues/Issues"));
const Audits = lazy(() => import("./features/audits/Audits"));
const Reports = lazy(() => import("./features/reports/Reports"));
const Settings = lazy(() => import("./features/settings/Settings"));
const Presets = lazy(() => import("./features/settings/Presets"));
const DataManagement = lazy(() => import("./features/settings/DataManagement"));
const Landing = lazy(() => import("./features/landing/Landing"));
function Shell() {
  const ui = useUI();
  const data = useData();
  const location = useLocation();
  const [mobile, setMobile] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const current = groups
    .flatMap((g) => g.links)
    .find(([, path]) => path === location.pathname);
  const group = groups.find((g) =>
    g.links.some(([, path]) => path === location.pathname),
  );
  useEffect(() => {
    let active = true;
    db.open()
      .then(() => {
        if (active) setReady(true);
      })
      .catch((e) => {
        if (active)
          setError(
            e instanceof Error ? e.message : "IndexedDB is unavailable.",
          );
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const match = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () =>
      document.documentElement.classList.toggle(
        "dark",
        ui.theme === "dark" || (ui.theme === "system" && match.matches),
      );
    update();
    match.addEventListener("change", update);
    return () => match.removeEventListener("change", update);
  }, [ui.theme]);
  useEffect(() => {
    void perform(() =>
      db.settings.put({
        id: "preferences",
        value: JSON.stringify({
          theme: ui.theme,
          threshold: ui.threshold,
          defaultPreset: ui.defaultPreset,
          fitImages: ui.fitImages,
          annotationType: ui.annotationType,
          reportStatus: ui.reportStatus,
          notifications: ui.notifications,
        }),
      }),
    );
  }, [
    ui.theme,
    ui.threshold,
    ui.defaultPreset,
    ui.fitImages,
    ui.annotationType,
    ui.reportStatus,
    ui.notifications,
  ]);
  return (
    <div className={`app-shell ${ui.collapsed ? "sidebar-collapsed" : ""}`}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <aside className="sidebar">
        <Navigation />
      </aside>
      <div className="app-main">
        <header className="app-header">
          <div className="row">
            <Button
              className="mobile-menu"
              size="icon"
              variant="ghost"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={20} />
            </Button>
            <Link to="/" aria-label="Responsive Studio home">
              <House size={17} className="muted breadcrumb-home" />
            </Link>
            <span className="breadcrumb">
              {group?.label ?? "Workspace"}
              <span>/</span>
              <strong>{current?.[0] ?? "Page not found"}</strong>
            </span>
          </div>
          <div className="row">
            <span className="storage-status">
              <Database size={16} />
              Local storage (IndexedDB)
              <span className={ready ? "local-dot" : "pending-dot"} />
              {ready ? "Ready" : "Opening"}
            </span>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Toggle light/dark theme"
              onClick={() =>
                ui.set({
                  theme: document.documentElement.classList.contains("dark")
                    ? "light"
                    : "dark",
                })
              }
            >
              {ui.theme === "dark" ? <Moon size={19} /> : <Sun size={19} />}
            </Button>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          {error ? (
            <section className="panel">
              <Empty
                title="Local storage is unavailable"
                description={`Open Studio directly in its own browser tab if it is embedded in a sandbox. Otherwise check browser storage permissions or private browsing restrictions. ${error}`}
                action={
                  <div className="row wrap">
                    <Button onClick={() => window.location.reload()}>
                      Retry
                    </Button>
                    <Button asChild>
                      <a
                        href={window.location.href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open Studio in new tab
                      </a>
                    </Button>
                  </div>
                }
              />
            </section>
          ) : !data ? (
            <Loading />
          ) : (
            <Suspense fallback={<Loading />}>
              <Routes>
                <Route path="/dashboard" element={<Dashboard data={data} />} />
                <Route path="/projects" element={<Projects data={data} />} />
                <Route path="/workspace" element={<Workspace data={data} />} />
                <Route
                  path="/screenshots"
                  element={<Screenshots data={data} />}
                />
                <Route
                  path="/comparisons"
                  element={<Comparisons data={data} />}
                />
                <Route path="/issues" element={<Issues data={data} />} />
                <Route path="/audits" element={<Audits data={data} />} />
                <Route path="/reports" element={<Reports data={data} />} />
                <Route path="/presets" element={<Presets data={data} />} />
                <Route path="/settings" element={<Settings data={data} />} />
                <Route path="/data" element={<DataManagement data={data} />} />
                <Route
                  path="/activity"
                  element={
                    <>
                      <PageTitle
                        title="Recent activity"
                        description="Your latest project changes and audit records."
                      />
                      <section className="panel">
                        {data.activity.length ? (
                          <ActivityList data={data} />
                        ) : (
                          <Empty
                            title="No activity yet"
                            description="Project changes will appear here as you work."
                          />
                        )}
                      </section>
                    </>
                  }
                />
                <Route
                  path="*"
                  element={
                    <Empty
                      title="Page not found"
                      description="Return to your testing dashboard."
                      action={
                        <Button asChild>
                          <Link to="/dashboard">Dashboard</Link>
                        </Button>
                      }
                    />
                  }
                />
              </Routes>
            </Suspense>
          )}
        </main>
        <footer className="app-footer">
          <span>
            <Database size={14} />
            IndexedDB local storage{" "}
            <span className="footer-detail">
              · All data is stored locally in your browser.
            </span>
          </span>
          <span>Responsive Studio v1.0.0</span>
        </footer>
      </div>
      <Modal
        open={mobile}
        onOpenChange={setMobile}
        title="Navigation"
        description="Move between your local testing tools."
      >
        <div className="mobile-navigation">
          <Navigation close={() => setMobile(false)} />
        </div>
      </Modal>
      <Toaster
        closeButton
        theme={ui.theme}
        toastOptions={{
          style: {
            background: "var(--surface)",
            color: "var(--foreground)",
            border: "1px solid var(--border)",
          },
        }}
      />
    </div>
  );
}
class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: string }
> {
  state = { error: "" };
  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }
  render() {
    return this.state.error ? (
      <div className="fatal">
        <h1>We couldn’t open the workspace</h1>
        <p>{this.state.error}</p>
        <p>Your saved browser records have not been deleted.</p>
        <Button onClick={() => window.location.reload()}>
          Reload application
        </Button>
        <Button asChild>
          <a
            href={window.location.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Studio in new tab
          </a>
        </Button>
      </div>
    ) : (
      this.props.children
    );
  }
}
function RouteScrollReset() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!window.location.hash) window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <RouteScrollReset />
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="*" element={<Shell />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
