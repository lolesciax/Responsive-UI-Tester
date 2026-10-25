import type { StateStorage } from "zustand/middleware";

// Accessing window.localStorage itself may throw in sandboxed/private contexts.
// UI preferences can remain usable in memory; project records still require IndexedDB.
export function createPreferenceStorage(
  getStorage: () => Storage = () => window.localStorage,
): StateStorage {
  const memory = new Map<string, string>();
  let memoryOnly = false;
  return {
    getItem(name) {
      if (memoryOnly) return memory.get(name) ?? null;
      try {
        const value = getStorage().getItem(name);
        if (value === null) memory.delete(name);
        else memory.set(name, value);
        return value;
      } catch {
        memoryOnly = true;
        return memory.get(name) ?? null;
      }
    },
    setItem(name, value) {
      memory.set(name, value);
      if (memoryOnly) return;
      try {
        getStorage().setItem(name, value);
      } catch {
        memoryOnly = true;
      }
    },
    removeItem(name) {
      memory.delete(name);
      if (memoryOnly) return;
      try {
        getStorage().removeItem(name);
      } catch {
        memoryOnly = true;
      }
    },
  };
}
