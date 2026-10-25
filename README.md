# Responsive Studio

A local-first responsive UI testing workspace. Organize projects, upload and annotate screenshots, compare pixels, track issues, record manual audits and export reports. No account, paid service or hosted database required.

## Run in Windows PowerShell

Requires Node.js 22.12+ and a modern browser supporting IndexedDB, module workers and Canvas.

```powershell
npm ci
npm run dev -- --host 127.0.0.1
```

Open the address printed by Vite, normally http://127.0.0.1:5173.

```powershell
npm run check
npx playwright install chromium
npm run test:e2e
npm run test:preview
npm run preview -- --host 127.0.0.1
```

`npm run check` checks formatting, lint, unit/component tests, strict types and the production build. `npm run format` formats maintained source/config/docs, and `npm run format:check` checks without writing. `npm run test:watch` runs unit tests in watch mode. Tests and tool configs are included in TypeScript checks. CI also runs the Chromium and production-preview suites.

## Workflow

1. Create a project with an optional website URL and preferred device presets.
2. In Screenshots, select a project and choose or drop PNG/JPEG/WebP files (up to 20 MB each).
3. Inspect evidence in Testing Workspace. Pan, zoom, fit, set viewport dimensions and add rectangle, pin, text or highlight annotations using original-image coordinates.
4. Create issues with screenshot/annotation evidence, severity, reproduction steps and suggested fixes. Resolve or reopen issues.
5. Compare two screenshots side by side, with a keyboard-accessible slider, or with background-worker pixel differences. Save the session parameters.
6. Record manual audits with structured findings. Filter reports and export JSON, CSV or browser print-to-PDF.
7. Export project ZIPs from Projects or a complete ZIP from Data Management. Import a backup as new project copies without replacing existing work.

## Stack and storage

React, strict TypeScript, Vite, Tailwind CSS v4, Radix-based shadcn-style primitives, Lucide, React Router, Zustand, Zod, Dexie/IndexedDB, Sonner and fflate. Tests use Vitest, Testing Library, Playwright and axe-core. Fonts are bundled locally.

Records and original screenshot Blobs are saved in IndexedDB. Workspace selection and preferences use localStorage; preference metadata is also saved in IndexedDB. No application data is sent to a cloud service. Loading a live preview requests the target site directly in a sandboxed iframe.

Light mode is the initial default. Users can choose dark or system mode, and an existing saved theme selection takes precedence.

Storage belongs to the current browser profile and site origin. Clearing site data can delete work. ZIP backups include original image bytes plus versioned metadata. Imports validate schemas, image decoding and relationships before atomic writes, remap IDs and preserve existing projects and UI preferences. There is no automatic cross-device sync. If localStorage is denied, preferences use session memory; project records still need IndexedDB.

For live previews that report a localStorage `SecurityError`, use **Allow storage for this trusted site** or **Open site in new tab**. The option is off by default, applies only to the chosen origin, and is disabled for Studio's own origin. Local targets can use a different port. Embedding headers and browser privacy restrictions remain enforced. If Studio itself is embedded in a storage-restricted sandbox, open Studio directly in its own tab.

## Deployment and scope

Deploy `dist` to Cloudflare Pages or another static host. `_redirects` provides Cloudflare SPA routing. No backend environment variables are required.

The optional local automation runner is not implemented or connected. Browser-only manual reviews cannot inspect arbitrary external DOM; some websites refuse iframe embedding. Pixel changes are evidence rather than confirmed defects. Direct PDF uses browser printing. Annotation undo/redo is not implemented.

Read [implementation status](docs/IMPLEMENTATION_PLAN.md), [architecture](docs/ARCHITECTURE.md), [data model](docs/DATA_MODEL.md), [features](docs/FEATURES.md), [testing](docs/TESTING.md), [deployment](docs/DEPLOYMENT.md) and [known limitations](docs/KNOWN_LIMITATIONS.md).
