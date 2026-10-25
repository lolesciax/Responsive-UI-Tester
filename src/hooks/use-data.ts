import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";
import { db } from "../database/db";
export function useData() {
  return useLiveQuery(async () => ({
    projects: await db.projects.orderBy("updatedAt").reverse().toArray(),
    screenshots: await db.screenshots.toArray(),
    issues: await db.issues.toArray(),
    comparisons: await db.comparisons.toArray(),
    audits: await db.auditRuns.toArray(),
    findings: await db.auditFindings.toArray(),
    annotations: await db.annotations.toArray(),
    presets: await db.viewportPresets.toArray(),
    activity: await db.activityEvents
      .orderBy("createdAt")
      .reverse()
      .limit(100)
      .toArray(),
  }));
}
export type Data = NonNullable<ReturnType<typeof useData>>;
export function useObjectUrl(blob?: Blob) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    // Object URLs are external resources; creation and revocation share this lifecycle.
    if (!blob) {
      // oxlint-disable-next-line react/set-state-in-effect
      setUrl("");
      return;
    }
    const url = URL.createObjectURL(blob);
    setUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);
  return url;
}
