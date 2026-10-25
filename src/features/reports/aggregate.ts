import type { Issue } from "../../database/schema";
export function filterIssues(
  issues: Issue[],
  filters: {
    projectId?: string;
    severity?: string;
    status?: string;
    viewport?: string;
    from?: number;
    to?: number;
    search?: string;
  },
) {
  return issues.filter(
    (i) =>
      (!filters.projectId || i.projectId === filters.projectId) &&
      (!filters.severity || i.severity === filters.severity) &&
      (!filters.status || i.status === filters.status) &&
      (!filters.viewport || i.viewport === filters.viewport) &&
      (filters.from === undefined || i.createdAt >= filters.from) &&
      (filters.to === undefined || i.createdAt <= filters.to) &&
      (!filters.search ||
        `${i.title} ${i.description}`
          .toLowerCase()
          .includes(filters.search.toLowerCase())),
  );
}
export function distribution(
  issues: Issue[],
  field: "severity" | "status" | "viewport",
) {
  return issues.reduce<Record<string, number>>((counts, issue) => {
    const key = issue[field] || "Unspecified";
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}
