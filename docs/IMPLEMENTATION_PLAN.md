# Implementation status

Initialized from an empty repository as a static React + TypeScript + Vite application. Records and image Blobs use Dexie/IndexedDB; Zustand holds workspace/preferences, Zod validates data, and a worker compares pixels. No hosted backend, account or cloud database is required.

| Phase                  | Status      | Delivered                                                                                                                |
| ---------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| 0 — Architecture       | Complete    | Module boundaries, schema, design reference and acceptance criteria.                                                     |
| 1 — Foundation         | Complete    | Routes, responsive navigation, themes, dialogs, errors and tests. Light is the initial default; saved choices persist.   |
| 2 — Projects/evidence  | Complete    | Project CRUD, image management, viewports, pan/zoom/fit, annotations and persistence.                                    |
| 3 — Comparisons/issues | Complete    | Three comparison modes, saved sessions, issues, evidence links and status tracking.                                      |
| 4 — Audits/reports     | Complete    | Manual audits/findings, filtered reports, JSON/CSV/print and full ZIP backup/copy import.                                |
| 5 — Optional runner    | Deferred    | Local Playwright automation and versioned audit import. No connected runner is advertised.                               |
| 6 — Verification/docs  | Implemented | Strict typing, CI, unit/component/E2E, responsive/axe checks, preview and docs. See TESTING.md for execution and limits. |

## Acceptance workflow

Create a project, upload original screenshots, assign viewports, annotate, create/resolve an issue, save a comparison, record an audit, export reports, export/import a ZIP with image bytes, reload and verify persistence, then delete the copied project without orphaned records.

## Decisions

- Transactions enforce evidence integrity and cascades. Imports validate schemas/images/references, then remap IDs into independent copies.
- Previews default to opaque origins. Storage consent is scoped to a trusted external origin; Studio-origin targets cannot opt in. Separate-tab and screenshot fallbacks remain available.
- Denied preference storage uses session memory. Project records still require IndexedDB.
- Live viewports and screenshots share resize-aware fit. Help is expandable and the screenshot inspector is hidden in live mode.
- Navigation, maintenance pages and annotation components have separate modules. Routes load lazily and pixel comparison runs in a worker.
- The original concept and production logo are retained; generated QA output is excluded from the source tree.

## Remaining enhancements

Optional runner, annotation drag handles and undo/redo, direct PDF generation, large-gallery pagination/thumbnails, additional browsers and manual assistive-technology review. Coordinate annotation editing and browser print-to-PDF are functional. See KNOWN_LIMITATIONS.md.
