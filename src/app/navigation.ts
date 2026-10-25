import {
  Activity,
  Bug,
  Columns2,
  Database,
  FileText,
  Folder,
  House,
  Image,
  Monitor,
  Settings as SettingsIcon,
  ShieldCheck,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
export const navigationGroups: {
  label: string;
  links: [string, string, LucideIcon][];
}[] = [
  {
    label: "Overview",
    links: [
      ["Dashboard", "/dashboard", House],
      ["Recent Activity", "/activity", Activity],
    ],
  },
  {
    label: "Workspace",
    links: [
      ["Projects", "/projects", Folder],
      ["Testing Workspace", "/workspace", Monitor],
      ["Screenshots", "/screenshots", Image],
      ["Comparisons", "/comparisons", Columns2],
    ],
  },
  {
    label: "Testing",
    links: [
      ["Audits", "/audits", ShieldCheck],
      ["Issues", "/issues", Bug],
      ["Reports", "/reports", FileText],
    ],
  },
  {
    label: "Maintenance",
    links: [
      ["Device Presets", "/presets", Smartphone],
      ["Settings", "/settings", SettingsIcon],
      ["Data Management", "/data", Database],
    ],
  },
];
