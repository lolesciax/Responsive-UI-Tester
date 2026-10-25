import { PageTitle } from "../../components/shared";
import { defaults, statuses } from "../../database/schema";
import { useUI } from "../../stores/ui";
import type { Data } from "../../hooks/use-data";
export default function Settings({ data }: { data: Data }) {
  const ui = useUI();
  return (
    <>
      <PageTitle
        title="Application settings"
        description="A workspace that works the way you do."
      />
      <section className="panel settings-panel">
        <h2>Appearance and behavior</h2>
        <label className="field">
          Theme
          <select
            value={ui.theme}
            onChange={(e) =>
              ui.set({ theme: e.target.value as typeof ui.theme })
            }
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <label className="field">
          Default viewport
          <select
            value={ui.defaultPreset}
            onChange={(e) => {
              const p = [...defaults, ...data.presets].find(
                (p) => p.id === e.target.value,
              )!;
              ui.set({ defaultPreset: p.id, width: p.width, height: p.height });
            }}
          >
            {[...defaults, ...data.presets].map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.width} × {p.height}
              </option>
            ))}
          </select>
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={ui.fitImages}
            onChange={(e) => ui.set({ fitImages: e.target.checked })}
          />
          Fit screenshots to canvas when opened
        </label>
        <label className="field">
          Default comparison threshold ({ui.threshold})
          <input
            type="range"
            min={0}
            max={255}
            value={ui.threshold}
            onChange={(e) => ui.set({ threshold: Number(e.target.value) })}
          />
        </label>
        <label className="field">
          Default annotation type
          <select
            value={ui.annotationType}
            onChange={(e) =>
              ui.set({
                annotationType: e.target.value as typeof ui.annotationType,
              })
            }
          >
            {["rectangle", "pin", "text", "highlight"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="field">
          Default report status
          <select
            value={ui.reportStatus}
            onChange={(e) => ui.set({ reportStatus: e.target.value })}
          >
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={ui.notifications}
            onChange={(e) => ui.set({ notifications: e.target.checked })}
          />
          Show success notifications (errors always shown)
        </label>
        <p className="muted">
          Preferences save automatically when browser storage is available;
          otherwise they last for this session. Reduced-motion settings follow
          your operating system.
        </p>
      </section>
    </>
  );
}
