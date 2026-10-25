import { useObjectUrl } from "../../hooks/use-data";
import type { Annotation, Screenshot } from "../../database/schema";
import { uid } from "../../lib/utils";
export default function AnnotationCanvas({
  shot,
  annotations,
  zoom,
  onSelect,
  disabled,
}: {
  shot: Screenshot;
  annotations: Annotation[];
  zoom: number;
  onSelect: (a: Annotation) => void;
  disabled: boolean;
}) {
  const url = useObjectUrl(shot.blob);
  return (
    <div
      className="image-stage"
      style={{ width: shot.width * zoom, height: shot.height * zoom }}
    >
      <img
        src={url || undefined}
        alt={shot.name}
        draggable={false}
        style={{ width: "100%", height: "100%" }}
      />
      <svg
        className="annotation-overlay"
        viewBox={`0 0 ${shot.width} ${shot.height}`}
        aria-label="Screenshot annotations"
        onClick={(e) => {
          if (disabled || e.target !== e.currentTarget) return;
          const r = e.currentTarget.getBoundingClientRect();
          const now = Date.now();
          onSelect({
            id: uid(),
            screenshotId: shot.id,
            type: "pin",
            x: Math.max(
              0,
              Math.min(
                shot.width,
                ((e.clientX - r.left) / r.width) * shot.width,
              ),
            ),
            y: Math.max(
              0,
              Math.min(
                shot.height,
                ((e.clientY - r.top) / r.height) * shot.height,
              ),
            ),
            width: 0,
            height: 0,
            text: "",
            createdAt: now,
            updatedAt: now,
          });
        }}
      >
        {annotations.map((a, i) => (
          <g
            key={a.id}
            role="button"
            tabIndex={0}
            aria-label={`Edit annotation ${i + 1}: ${a.text}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(a);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(a);
              }
            }}
          >
            <title>{a.text}</title>
            {a.type === "rectangle" || a.type === "highlight" ? (
              <rect
                x={a.x}
                y={a.y}
                width={a.width}
                height={a.height}
                fill={a.type === "highlight" ? "#facc1544" : "#6366f11a"}
                stroke="#6366f1"
                strokeWidth={2 / zoom}
              />
            ) : (
              <circle cx={a.x} cy={a.y} r={12 / zoom} fill="#4f46e5" />
            )}
            <text
              x={a.x + (a.type === "pin" || a.type === "text" ? 0 : 8 / zoom)}
              y={
                a.y +
                (a.type === "pin" || a.type === "text" ? 4 / zoom : 18 / zoom)
              }
              textAnchor={
                a.type === "pin" || a.type === "text" ? "middle" : "start"
              }
              fontSize={12 / zoom}
              fill={a.type === "pin" || a.type === "text" ? "white" : "#4338ca"}
            >
              {i + 1}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
