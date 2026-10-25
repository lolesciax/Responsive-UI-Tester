import type { Data } from "../hooks/use-data";
import { date } from "../lib/utils";
export function ActivityList({
  data,
  limit = 100,
}: {
  data: Data;
  limit?: number;
}) {
  return (
    <ul className="activity-list">
      {data.activity.slice(0, limit).map((a) => (
        <li key={a.id}>
          <span className="activity-dot" />
          <div>
            <strong>{a.text}</strong>
            <small>{date(a.createdAt)}</small>
          </div>
        </li>
      ))}
    </ul>
  );
}
