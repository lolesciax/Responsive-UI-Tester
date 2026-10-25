import { Link, NavLink } from "react-router-dom";
import { ArrowLeftToLine, ArrowRightFromLine } from "lucide-react";
import { navigationGroups as groups } from "../../app/navigation";
import { useUI } from "../../stores/ui";
import { Button } from "../ui/button";
export default function Navigation({ close }: { close?: () => void }) {
  const ui = useUI();
  return (
    <>
      <Link
        to="/dashboard"
        className="brand"
        onClick={close}
        aria-label="Responsive Studio dashboard"
        title="Responsive Studio"
      >
        <span className="brand-mark">
          <img
            src="/brand/responsive-studio-mark.svg"
            alt=""
            width={34}
            height={34}
          />
        </span>
        <span>
          Responsive
          <br />
          Studio
        </span>
      </Link>
      <nav aria-label="Main navigation">
        {groups.map((group) => (
          <div
            className={`nav-group ${group.label === "Maintenance" ? "maintenance" : ""}`}
            key={group.label}
          >
            <p>{group.label}</p>
            {group.links.map(([name, path, Icon]) => (
              <NavLink
                to={path}
                end={path === "/dashboard"}
                key={path}
                onClick={close}
                title={ui.collapsed ? name : undefined}
              >
                <Icon size={19} strokeWidth={1.7} />
                <span>{name}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <span className="local-dot" />
        <span>Local workspace</span>
        <Button
          size="icon"
          variant="ghost"
          aria-label={ui.collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => ui.set({ collapsed: !ui.collapsed })}
        >
          {ui.collapsed ? (
            <ArrowRightFromLine size={16} />
          ) : (
            <ArrowLeftToLine size={16} />
          )}
        </Button>
      </div>
    </>
  );
}
