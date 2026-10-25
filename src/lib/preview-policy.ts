import { safeUrl } from "../database/schema";

const restrictedSandbox = "allow-scripts allow-forms";

export function previewPolicy(
  url: string,
  studioOrigin: string,
  trustedOrigin: string | null = null,
) {
  if (!url || !safeUrl.safeParse(url).success) {
    return {
      origin: null,
      canEnableStorage: false,
      storageEnabled: false,
      sandbox: restrictedSandbox,
    };
  }
  const origin = new URL(url).origin;
  // Never combine scripts and same-origin privileges for Studio's own origin.
  const canEnableStorage = origin !== studioOrigin;
  const storageEnabled = canEnableStorage && trustedOrigin === origin;
  return {
    origin,
    canEnableStorage,
    storageEnabled,
    sandbox: storageEnabled
      ? `${restrictedSandbox} allow-same-origin`
      : restrictedSandbox,
  };
}
