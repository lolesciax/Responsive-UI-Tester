import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createPreferenceStorage } from "../lib/preference-storage";
type Preferences = {
  theme: "light" | "dark" | "system";
  projectId: string;
  screenshotId: string;
  width: number;
  height: number;
  zoom: number;
  threshold: number;
  collapsed: boolean;
  notifications: boolean;
  fitImages: boolean;
  annotationType: "rectangle" | "pin" | "text" | "highlight";
  reportStatus: string;
  defaultPreset: string;
};
export const useUI = create<
  Preferences & { set: (value: Partial<Preferences>) => void }
>()(
  persist(
    (set) => ({
      theme: "light",
      projectId: "",
      screenshotId: "",
      width: 375,
      height: 812,
      zoom: 1,
      threshold: 20,
      collapsed: false,
      notifications: true,
      fitImages: true,
      annotationType: "rectangle",
      reportStatus: "",
      defaultPreset: "mobile",
      set: (value) => set(value),
    }),
    {
      name: "responsive-studio-ui",
      storage: createJSONStorage(() => createPreferenceStorage()),
    },
  ),
);
