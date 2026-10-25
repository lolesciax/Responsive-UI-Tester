import { perform } from "../../lib/feedback";
import { useEffect, useState } from "react";
import { Save, Trash2 } from "lucide-react";
import {
  Confirm,
  Empty,
  PageTitle,
  ProjectSelect,
} from "../../components/shared";
import { Button } from "../../components/ui/button";
import { useObjectUrl, type Data } from "../../hooks/use-data";
import { useUI } from "../../stores/ui";
import { saveComparison } from "../../database/repository";
import { db } from "../../database/db";
import type { Comparison, Screenshot } from "../../database/schema";
import { uid } from "../../lib/utils";
export default function Comparisons({ data }: { data: Data }) {
  const projectId = useUI((state) => state.projectId);
  return <ComparisonSession key={projectId} data={data} />;
}
function ComparisonSession({ data }: { data: Data }) {
  const ui = useUI();
  const [baselineId, setBaseline] = useState("");
  const [currentId, setCurrent] = useState("");
  const [mode, setMode] = useState<Comparison["mode"]>("side");
  const [alignment, setAlignment] =
    useState<Comparison["alignment"]>("top-left");
  const [name, setName] = useState("Visual comparison");
  const [id, setId] = useState("");
  const [zoom, setZoom] = useState(0.5);
  const [sync, setSync] = useState(true);
  const [saving, setSaving] = useState(false);
  const shots = data.screenshots.filter((s) => s.projectId === ui.projectId);
  const a = shots.find((s) => s.id === baselineId);
  const b = shots.find((s) => s.id === currentId);
  const sessions = data.comparisons.filter((c) => c.projectId === ui.projectId);
  return (
    <>
      <PageTitle
        title="Comparisons"
        description="See what changed. Visual differences are evidence, not confirmed defects."
      >
        <Button
          variant="default"
          disabled={saving || !a || !b || a.id === b.id}
          onClick={async () => {
            setSaving(true);
            await perform(async () => {
              const next = id || uid();
              await saveComparison({
                id: next,
                name,
                projectId: ui.projectId,
                baselineId,
                currentId,
                mode,
                alignment,
                threshold: ui.threshold,
                createdAt:
                  data.comparisons.find((c) => c.id === id)?.createdAt ??
                  Date.now(),
              });
              setId(next);
            }, "Comparison saved");
            setSaving(false);
          }}
        >
          <Save size={16} />
          Save comparison
        </Button>
      </PageTitle>
      <div className="filterbar">
        <ProjectSelect data={data} />
        <label className="field grow">
          Session name
          <input
            value={name}
            maxLength={200}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="field grow">
          Saved sessions
          <select
            value={id}
            onChange={(e) => {
              const c = sessions.find((c) => c.id === e.target.value);
              if (!c) {
                setId("");
                return;
              }
              setId(c.id);
              setName(c.name);
              setBaseline(c.baselineId);
              setCurrent(c.currentId);
              setMode(c.mode);
              setAlignment(c.alignment);
              ui.set({ threshold: c.threshold });
            }}
          >
            <option value="">New comparison</option>
            {sessions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        {id && (
          <Confirm
            title="Delete comparison?"
            description="This removes the comparison session. Original screenshots are preserved."
            action={async () => {
              await db.comparisons.delete(id);
              setId("");
            }}
          >
            <Trash2 size={16} />
            Delete
          </Confirm>
        )}
      </div>
      <section className="panel">
        <div className="comparison-controls">
          <label className="field grow">
            Baseline
            <select
              value={baselineId}
              onChange={(e) => setBaseline(e.target.value)}
            >
              <option value="">Select baseline</option>
              {shots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.width}×{s.height}
                </option>
              ))}
            </select>
          </label>
          <label className="field grow">
            Current
            <select
              value={currentId}
              onChange={(e) => setCurrent(e.target.value)}
            >
              <option value="">Select current</option>
              {shots
                .filter((s) => s.id !== baselineId)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {s.width}×{s.height}
                  </option>
                ))}
            </select>
          </label>
          <label className="field">
            Mode
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as Comparison["mode"])}
            >
              <option value="side">Side by side</option>
              <option value="slider">Before / after slider</option>
              <option value="difference">Pixel difference</option>
            </select>
          </label>
          <label className="field">
            Alignment
            <select
              value={alignment}
              onChange={(e) =>
                setAlignment(e.target.value as Comparison["alignment"])
              }
            >
              <option value="top-left">Top left</option>
              <option value="center">Center</option>
            </select>
          </label>
          <label className="field">
            Zoom
            <select
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
            >
              {[0.1, 0.25, 0.5, 0.75, 1, 1.5, 2].map((v) => (
                <option key={v} value={v}>
                  {v * 100}%
                </option>
              ))}
            </select>
          </label>
        </div>
        {mode === "side" && (
          <label className="check-row inset">
            <input
              type="checkbox"
              checked={sync}
              onChange={(e) => setSync(e.target.checked)}
            />
            Synchronize scrolling
          </label>
        )}
        {mode === "difference" && (
          <label className="field inset">
            Difference threshold: {ui.threshold} / 255
            <input
              type="range"
              min={0}
              max={255}
              value={ui.threshold}
              onChange={(e) => ui.set({ threshold: Number(e.target.value) })}
            />
          </label>
        )}
        {a && b && a.id !== b.id ? (
          <>
            {(a.width !== b.width || a.height !== b.height) && (
              <p className="notice">
                Different image sizes: each image keeps its original dimensions.
                The shared canvas uses{" "}
                {alignment === "center" ? "center" : "top-left"} alignment and
                white padding; padding differences count as changed pixels.
              </p>
            )}
            <ComparisonView
              key={`${a.id}:${b.id}:${mode}:${alignment}:${ui.threshold}`}
              a={a}
              b={b}
              mode={mode}
              alignment={alignment}
              threshold={ui.threshold}
              zoom={zoom}
              sync={sync}
            />
          </>
        ) : (
          <Empty
            icon="image"
            title="Every change tells a story"
            description="Choose two screenshots from the same project to compare. Upload images in Screenshots first."
          />
        )}
      </section>
    </>
  );
}
function ComparisonView({
  a,
  b,
  mode,
  alignment,
  threshold,
  zoom,
  sync,
}: {
  a: Screenshot;
  b: Screenshot;
  mode: Comparison["mode"];
  alignment: Comparison["alignment"];
  threshold: number;
  zoom: number;
  sync: boolean;
}) {
  const aUrl = useObjectUrl(a.blob);
  const bUrl = useObjectUrl(b.blob);
  const [divider, setDivider] = useState(50);
  const [difference, setDifference] = useState<{
    blob: Blob;
    percent: number;
    changed: number;
  }>();
  const [error, setError] = useState("");
  const diffUrl = useObjectUrl(difference?.blob);
  const width = Math.max(a.width, b.width);
  const height = Math.max(a.height, b.height);
  useEffect(() => {
    if (mode !== "difference") return;
    const worker = new Worker(
      new URL("./difference.worker.ts", import.meta.url),
      { type: "module" },
    );
    worker.onmessage = (e) => {
      if (e.data.error) setError(e.data.error);
      else setDifference(e.data);
    };
    worker.onerror = () =>
      setError("Pixel worker failed. Try smaller images or side-by-side mode.");
    worker.postMessage({
      baseline: a.blob,
      current: b.blob,
      threshold,
      alignment,
    });
    return () => worker.terminate();
  }, [a.blob, b.blob, mode, threshold, alignment]);
  const imgStyle = (s: Screenshot) => ({
    position: "absolute" as const,
    width: s.width * zoom,
    height: s.height * zoom,
    left: alignment === "center" ? Math.floor((width - s.width) / 2) * zoom : 0,
    top:
      alignment === "center" ? Math.floor((height - s.height) / 2) * zoom : 0,
    maxWidth: "none",
  });
  if (mode === "difference")
    return (
      <>
        <div className="comparison-summary" role="status">
          {error ||
            (difference
              ? `${difference.percent.toFixed(3)}% changed · ${difference.changed.toLocaleString()} pixels above threshold · pink indicates differences`
              : "Comparing pixels in a background worker…")}
        </div>
        {diffUrl && (
          <div className="comparison-scroll">
            <img
              src={diffUrl}
              alt="Pixel difference visualization; changed pixels appear pink"
              style={{
                width: width * zoom,
                height: height * zoom,
                maxWidth: "none",
              }}
            />
          </div>
        )}
      </>
    );
  if (mode === "side")
    return (
      <div className="side-comparison">
        {[
          { shot: a, url: aUrl, label: "Baseline" },
          { shot: b, url: bUrl, label: "Current" },
        ].map((item) => (
          <div key={item.label}>
            <div className="comparison-label">
              {item.label} · {item.shot.name}
            </div>
            <div
              className="comparison-scroll"
              onScroll={(e) => {
                if (!sync) return;
                const parent = e.currentTarget.closest(".side-comparison");
                const peers =
                  parent?.querySelectorAll<HTMLDivElement>(
                    ".comparison-scroll",
                  );
                peers?.forEach((p) => {
                  if (
                    p !== e.currentTarget &&
                    (p.scrollTop !== e.currentTarget.scrollTop ||
                      p.scrollLeft !== e.currentTarget.scrollLeft)
                  ) {
                    p.scrollTop = e.currentTarget.scrollTop;
                    p.scrollLeft = e.currentTarget.scrollLeft;
                  }
                });
              }}
            >
              <div
                style={{
                  width: width * zoom,
                  height: height * zoom,
                  position: "relative",
                  background: "white",
                }}
              >
                <img
                  src={item.url || undefined}
                  alt={`${item.label}: ${item.shot.name}`}
                  style={imgStyle(item.shot)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  return (
    <>
      <div className="comparison-label">Baseline (left) / Current (right)</div>
      <label className="field inset">
        Comparison divider: {divider}%
        <input
          aria-label="Comparison divider"
          type="range"
          min={0}
          max={100}
          value={divider}
          onChange={(e) => setDivider(Number(e.target.value))}
        />
      </label>
      <div className="comparison-scroll">
        <div
          style={{
            width: width * zoom,
            height: height * zoom,
            position: "relative",
            background: "white",
          }}
        >
          <img
            src={bUrl || undefined}
            alt={`Current: ${b.name}`}
            style={imgStyle(b)}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              clipPath: `inset(0 ${100 - divider}% 0 0)`,
              background: "white",
            }}
          >
            <img
              src={aUrl || undefined}
              alt={`Baseline: ${a.name}`}
              style={imgStyle(a)}
            />
          </div>
          <div className="comparison-divider" style={{ left: `${divider}%` }} />
        </div>
      </div>
    </>
  );
}
