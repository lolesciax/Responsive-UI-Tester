import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUp, Menu, X } from "lucide-react";

const sections = [
  ["features", "Features"],
  ["how-it-works", "How to use"],
  ["requirements", "What you need"],
  ["faq", "FAQ"],
] as const;

export function LandingBrand() {
  return (
    <a
      href="#top"
      className="landing-brand"
      aria-label="Responsive Studio home"
    >
      <img
        src="/brand/responsive-studio-mark.svg"
        width={36}
        height={36}
        alt=""
      />
      <span>Responsive Studio</span>
    </a>
  );
}

export default function LandingNavigation() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const [pastHero, setPastHero] = useState(false);
  const header = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.documentElement.classList.add("landing-scroll");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-105px 0px -55% 0px" },
    );
    for (const id of ["landing-hero", ...sections.map(([id]) => id)]) {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    }
    const hero = document.getElementById("landing-hero");
    const heroObserver = new IntersectionObserver(([entry]) => {
      setPastHero(!entry.isIntersecting && entry.boundingClientRect.bottom < 0);
    });
    if (hero) heroObserver.observe(hero);
    // Resolve direct links after the lazy-loaded landing content has mounted.
    const target = document.getElementById(window.location.hash.slice(1));
    target?.scrollIntoView();
    return () => {
      observer.disconnect();
      heroObserver.disconnect();
      document.documentElement.classList.remove("landing-scroll");
    };
  }, []);

  useEffect(() => {
    const wide = window.matchMedia("(min-width: 801px)");
    const closeOnResize = () => {
      if (wide.matches) setOpen(false);
    };
    wide.addEventListener("change", closeOnResize);
    return () => wide.removeEventListener("change", closeOnResize);
  }, []);

  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    const outside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !header.current?.contains(event.target)
      )
        setOpen(false);
    };
    document.addEventListener("keydown", escape);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", escape);
      document.removeEventListener("pointerdown", outside);
    };
  }, [open]);

  const followSection = (id: string) => {
    setActive(id);
    setOpen(false);
    // Keep keyboard focus at the destination when the mobile links disappear.
    document.getElementById(id)?.focus({ preventScroll: true });
  };

  return (
    <>
      <header ref={header} className="landing-header-wrap">
        <div className="landing-header landing-container">
          <LandingBrand />
          <nav className="landing-desktop-nav" aria-label="Landing navigation">
            {sections.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                aria-current={active === id ? "location" : undefined}
                onClick={() => followSection(id)}
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="landing-header-actions">
            <Link
              to="/dashboard"
              className="landing-button landing-button-small"
            >
              Open Studio
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <button
              ref={toggle}
              type="button"
              className="landing-menu-toggle"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="landing-mobile-nav"
              onClick={() => setOpen(!open)}
            >
              {open ? (
                <X size={21} aria-hidden="true" />
              ) : (
                <Menu size={21} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
        <nav
          id="landing-mobile-nav"
          className="landing-mobile-nav landing-container"
          aria-label="Mobile landing navigation"
          hidden={!open}
        >
          {sections.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              aria-current={active === id ? "location" : undefined}
              onClick={() => followSection(id)}
            >
              {label}
              <ArrowRight size={16} aria-hidden="true" />
            </a>
          ))}
        </nav>
      </header>
      <nav aria-label="Page controls" hidden={!pastHero}>
        <a
          href="#top"
          className="landing-back-top"
          aria-label="Back to top"
          onClick={() =>
            document.getElementById("top")?.focus({ preventScroll: true })
          }
        >
          <ArrowUp size={19} aria-hidden="true" />
        </a>
      </nav>
    </>
  );
}
