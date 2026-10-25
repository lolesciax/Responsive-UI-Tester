import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
export const uid = () => crypto.randomUUID();
export const date = (value: number) => new Date(value).toLocaleString();
export const bytes = (size: number) =>
  size < 1048576
    ? `${(size / 1024).toFixed(1)} KB`
    : `${(size / 1048576).toFixed(1)} MB`;
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function csv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "title,status,severity\r\n";
  const keys = Object.keys(rows[0]);
  const cell = (v: unknown) =>
    `"${String(v ?? "")
      .replace(/^(?:\s*[=+@-]|[\t\r])/, "'$&")
      .replaceAll('"', '""')}"`;
  return [
    keys.map(cell).join(","),
    ...rows.map((row) => keys.map((key) => cell(row[key])).join(",")),
  ].join("\r\n");
}
