import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Columns2,
  Download,
  FolderPlus,
  ImagePlus,
  Laptop,
  Scan,
  ShieldCheck,
} from "lucide-react";
import PreviewDemo from "./PreviewDemo";
import LandingNavigation, { LandingBrand } from "./LandingNavigation";
import "./landing.css";

const features = [
  {
    icon: Scan,
    title: "Look closer at every size",
    text: "Choose a device preset or enter your own dimensions. Preview a site, or zoom into a screenshot and mark exactly what needs attention.",
  },
  {
    icon: Columns2,
    title: "Make changes visible",
    text: "Place screenshots side by side, slide between versions, or use pixel differences to spot visual changes.",
  },
  {
    icon: ShieldCheck,
    title: "Keep evidence with the issue",
    text: "Turn observations into tracked issues. Add severity, annotations, and manual audit findings so the next step is clear.",
  },
  {
    icon: Download,
    title: "Take your review with you",
    text: "Export JSON or CSV reports, print to PDF, and save a ZIP backup that includes your original screenshots.",
  },
];
const steps = [
  {
    icon: FolderPlus,
    title: "Create a project",
    text: "Give your review a name. Add the site URL if you want to use live preview.",
    link: "/projects",
    action: "Create a project",
  },
  {
    icon: ImagePlus,
    title: "Bring in your screens",
    text: "Upload PNG, JPEG, or WebP screenshots. Assign viewport dimensions to keep your evidence organized.",
    link: "/screenshots",
    action: "Upload screenshots",
  },
  {
    icon: Scan,
    title: "Inspect and compare",
    text: "Annotate details in the workspace, compare two versions, and record issues or manual audit findings.",
    link: "/workspace",
    action: "Explore the workspace",
  },
  {
    icon: Download,
    title: "Share your findings",
    text: "Filter your report, export the results, and download a backup before moving to another browser.",
    link: "/reports",
    action: "View reports",
  },
];
const questions = [
  [
    "Do I need an account?",
    "No. Open Studio and start a project. Projects, screenshots, and findings are saved in this browser, without an account or cloud sync.",
  ],
  [
    "Can I test any website in live preview?",
    "Some websites block embedding. If a preview is blank or refused, open the site in a separate tab and upload screenshots. For a trusted external site that needs storage, enable the storage option in the workspace. Cross-origin DOM inspection is unavailable.",
  ],
  [
    "Does Studio automatically audit my website?",
    "This version supports visual review, screenshot comparison, issue tracking, and manual audits. It does not run automated audits of arbitrary websites. The optional local browser runner is not connected.",
  ],
  [
    "How do I protect my work?",
    "Download a ZIP backup from Data Management regularly. Clearing browser data can remove your projects. Reports share findings; ZIP backups also preserve original screenshot files and can be restored into Studio.",
  ],
  [
    "Can I work offline?",
    "Uploaded screenshots are reviewed locally after Studio has loaded. Live previews need a network connection, and reopening the app offline is not guaranteed. No installation is required for the hosted app.",
  ],
];

function FeatureSection() {
  return (
    <section
      id="features"
      tabIndex={-1}
      className="landing-section"
      aria-labelledby="features-title"
    >
      <div className="landing-section-heading">
        <h2 id="features-title">
          A focused space for
          <br />a thorough review.
        </h2>
        <p>
          From a small layout issue to a full interface review, keep the
          screens, observations, and next steps together.
        </p>
      </div>
      <div className="landing-features">
        {features.map(({ icon: Icon, title, text }) => (
          <article key={title}>
            <Icon size={25} strokeWidth={1.6} aria-hidden="true" />
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function HowToSection() {
  return (
    <section
      id="how-it-works"
      tabIndex={-1}
      className="landing-section landing-how"
      aria-labelledby="how-title"
    >
      <div className="landing-section-heading">
        <h2 id="how-title">
          Your first review,
          <br />
          in four simple steps.
        </h2>
        <p>
          Start with a project and a few screenshots. Build a useful record as
          you go.
        </p>
      </div>
      <ol className="landing-steps">
        {steps.map(({ icon: Icon, title, text, link, action }, index) => (
          <li key={title}>
            <div className="landing-step-number">
              0{index + 1}
              <Icon size={20} aria-hidden="true" />
            </div>
            <h3>{title}</h3>
            <p>{text}</p>
            <Link to={link}>
              {action}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

function RequirementsSection() {
  return (
    <section
      id="requirements"
      tabIndex={-1}
      className="landing-section landing-requirements"
      aria-labelledby="requirements-title"
    >
      <div>
        <Laptop size={32} strokeWidth={1.5} aria-hidden="true" />
        <h2 id="requirements-title">
          A browser. Your screens.
          <br />
          You’re ready.
        </h2>
        <p>
          No account, extensions, or installation needed to use the hosted app.
        </p>
        <Link className="landing-button landing-button-primary" to="/projects">
          Start your first project
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>
      <ul>
        <li>
          <Check aria-hidden="true" />
          <div>
            <h3>A current browser</h3>
            <p>
              Use an up-to-date browser with JavaScript and local storage
              enabled. A desktop or laptop gives you more room to compare.
            </p>
          </div>
        </li>
        <li>
          <Check aria-hidden="true" />
          <div>
            <h3>Screenshots or a site URL</h3>
            <p>
              Bring PNG, JPEG, or WebP images. An embeddable site URL is
              optional for live preview.
            </p>
          </div>
        </li>
        <li>
          <Check aria-hidden="true" />
          <div>
            <h3>A backup habit</h3>
            <p>
              Your work stays in this browser. Export a ZIP from Data Management
              to keep a copy or move it to another device.
            </p>
          </div>
        </li>
      </ul>
    </section>
  );
}

export default function Landing() {
  return (
    <div className="landing" id="top" tabIndex={-1}>
      <a className="skip-link" href="#landing-main">
        Skip to content
      </a>
      <LandingNavigation />
      <main id="landing-main" tabIndex={-1} className="landing-container">
        <section
          id="landing-hero"
          className="landing-hero"
          aria-labelledby="hero-title"
        >
          <div className="landing-hero-copy">
            <span className="landing-local">
              <span />
              Your review. Saved in your browser.
            </span>
            <h1 id="hero-title">
              Small screens.
              <br />
              Big attention
              <br />
              to detail.
            </h1>
            <p>
              See how your interface holds up at every size. Inspect
              screenshots, compare changes, and turn the details into a clear
              plan.
            </p>
            <div className="landing-hero-actions">
              <Link
                to="/dashboard"
                className="landing-button landing-button-primary"
              >
                Open the testing studio
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <a className="landing-text-link" href="#how-it-works">
                See how it works
              </a>
            </div>
            <span className="landing-hero-note">
              No sign-up. No cloud upload. Just your workspace.
            </span>
          </div>
          <PreviewDemo />
        </section>
        <div className="landing-workflow-strip">
          <span>One place for the whole review</span>
          <p>
            Inspect<span aria-hidden="true">/</span>Compare
            <span aria-hidden="true">/</span>Annotate
            <span aria-hidden="true">/</span>Report
          </p>
        </div>
        <FeatureSection />
        <HowToSection />
        <RequirementsSection />
        <section
          id="faq"
          tabIndex={-1}
          className="landing-section landing-faq"
          aria-labelledby="faq-title"
        >
          <div>
            <h2 id="faq-title">Before you jump in.</h2>
            <p>A few things that are good to know.</p>
          </div>
          <div>
            {questions.map(([question, answer]) => (
              <details key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="landing-closing" aria-labelledby="closing-title">
          <h2 id="closing-title">
            Give every screen
            <br />a second look.
          </h2>
          <Link
            to="/projects"
            className="landing-button landing-button-primary"
          >
            Start a review
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </section>
      </main>
      <footer className="landing-footer landing-container">
        <LandingBrand />
        <p>Made for the details that matter.</p>
        <div>
          <a href="#how-it-works">Quick start</a>
          <a href="#faq">FAQ</a>
          <Link to="/data">Back up your work</Link>
        </div>
      </footer>
    </div>
  );
}
