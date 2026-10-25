import { useState } from "react";
import { Check, Monitor, Smartphone, Tablet } from "lucide-react";

const devices = [
  { name: "Desktop", width: 1440, icon: Monitor },
  { name: "Tablet", width: 768, icon: Tablet },
  { name: "Mobile", width: 390, icon: Smartphone },
] as const;

export default function PreviewDemo() {
  const [device, setDevice] = useState<(typeof devices)[number]>(devices[0]);
  return (
    <section className="landing-demo" aria-label="Interactive viewport example">
      <div className="demo-toolbar">
        <span className="demo-filename">Portfolio review</span>
        <div
          className="demo-devices"
          role="group"
          aria-label="Example viewport"
        >
          {devices.map((item) => (
            <button
              key={item.name}
              type="button"
              aria-label={`${item.name} example`}
              aria-pressed={device.name === item.name}
              onClick={() => setDevice(item)}
            >
              <item.icon size={18} aria-hidden="true" />
            </button>
          ))}
        </div>
        <span className="demo-width" aria-live="polite">
          {device.width} px
        </span>
      </div>
      <div className="demo-canvas">
        <div
          className={`demo-browser demo-browser-${device.name.toLowerCase()}`}
        >
          <div className="demo-browser-bar" aria-hidden="true">
            <i />
            <i />
            <i />
            <span>example.test / portfolio</span>
          </div>
          <div className="demo-site">
            <div className="demo-site-nav">
              <strong>Form & function.</strong>
              <span>Selected work</span>
            </div>
            <div className="demo-site-intro">
              <span>Independent design practice</span>
              <h2>
                Good design.
                <br />
                Every screen.
              </h2>
              <p>
                Thoughtful digital experiences, from the first impression to the
                smallest detail.
              </p>
            </div>
            <div className="demo-site-work" aria-hidden="true">
              <div>
                <div className="demo-art-circle" />
                <span>Identity / 2026</span>
              </div>
              <div>
                <div className="demo-art-bars">
                  <i />
                  <i />
                  <i />
                </div>
                <span>Digital / 2026</span>
              </div>
            </div>
            <div className="demo-annotation">
              <span>1</span> Check spacing at this width
            </div>
          </div>
        </div>
      </div>
      <div className="demo-caption">
        <span>
          <Check size={15} aria-hidden="true" /> A little perspective changes
          everything.
        </span>
        <span>Illustrative example</span>
      </div>
    </section>
  );
}
