import { describe, expect, it, vi } from "vitest";
import { previewPolicy } from "../src/lib/preview-policy";
import { createPreferenceStorage } from "../src/lib/preference-storage";

describe("preview storage permissions", () => {
  const studio = "http://127.0.0.1:5173";
  it("keeps default previews opaque and scopes storage consent to one external origin", () => {
    expect(
      previewPolicy("https://example.test/page", studio).storageEnabled,
    ).toBe(false);
    const allowed = previewPolicy(
      "https://example.test/page",
      studio,
      "https://example.test",
    );
    expect(allowed.storageEnabled).toBe(true);
    expect(allowed.sandbox).toContain("allow-same-origin");
    expect(
      previewPolicy("https://other.test", studio, "https://example.test")
        .storageEnabled,
    ).toBe(false);
  });
  it("never allows scripts and same-origin privileges for Studio’s origin", () => {
    const policy = previewPolicy(`${studio}/target`, studio, studio);
    expect(policy.canEnableStorage).toBe(false);
    expect(policy.sandbox).not.toContain("allow-same-origin");
    expect(
      previewPolicy("http://127.0.0.1:5174", studio).canEnableStorage,
    ).toBe(true);
  });
  it("rejects empty, credential-bearing and non-HTTP targets", () => {
    for (const value of [
      "",
      "javascript:alert(1)",
      "https://user:secret@example.test",
      "not a URL",
    ]) {
      expect(previewPolicy(value, studio).origin).toBeNull();
    }
  });
});
describe("denied preference storage", () => {
  it("survives a SecurityError while reading the localStorage property", () => {
    const storage = createPreferenceStorage(() => {
      throw new DOMException("Sandboxed document", "SecurityError");
    });
    expect(storage.getItem("preferences")).toBeNull();
    expect(() => storage.setItem("preferences", "theme=dark")).not.toThrow();
    expect(storage.getItem("preferences")).toBe("theme=dark");
    storage.removeItem("preferences");
    expect(storage.getItem("preferences")).toBeNull();
  });
  it("keeps the latest value in memory if writes fail after a successful read", () => {
    const backing = {
      getItem: vi.fn(() => "old"),
      setItem: vi.fn(() => {
        throw new DOMException("Full", "QuotaExceededError");
      }),
      removeItem: vi.fn(),
    };
    const storage = createPreferenceStorage(
      () => backing as unknown as Storage,
    );
    expect(storage.getItem("preferences")).toBe("old");
    storage.setItem("preferences", "new");
    expect(storage.getItem("preferences")).toBe("new");
    storage.removeItem("preferences");
    expect(storage.getItem("preferences")).toBeNull();
  });
  it("uses persistent storage normally and respects external deletion", () => {
    const memory = new Map<string, string>();
    const storage = createPreferenceStorage(
      () =>
        ({
          getItem: (name) => memory.get(name) ?? null,
          setItem: (name, value) => {
            memory.set(name, value);
          },
          removeItem: (name) => {
            memory.delete(name);
          },
        }) as Storage,
    );
    storage.setItem("preferences", "saved");
    expect(memory.get("preferences")).toBe("saved");
    memory.clear();
    expect(storage.getItem("preferences")).toBeNull();
  });
});
