# Testing

Requires Node.js 22.12 or later. Run the same checks as CI:

```powershell
npm ci
npm run check
npx playwright install chromium
npm run test:e2e
npm run test:preview
```

`npm run check` verifies formatting, runs lint and unit/component tests, then type-checks and builds the application. TypeScript covers application code, unit/E2E tests and tool configuration. `npm run test:preview` tests the current `dist` output, so build first. `npm run typecheck` provides a standalone type check.

## Coverage

| Suite                    | Coverage                                                                                                                                                                                                                                                 |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vitest / Testing Library | Validation, presets, pixel thresholds/transparency, issue filters, report distributions, CSV escaping, cascades, evidence integrity, annotation bounds, backup validation/remapping, project forms, denied preference storage and preview-origin policy. |
| Chromium E2E             | Create project → upload/assign screenshot → annotate → create/resolve issue → compare in three modes → manual audit → report export → ZIP backup/import with original images → reload → delete.                                                          |
| Preview regressions      | Origin-scoped storage consent, same-origin restriction, denied localStorage fallback, compact help, fit/zoom/scroll and mode-specific inspector. Tests use controlled local fixtures.                                                                    |
| Responsive               | 320, 375, 390, 768, 1024, 1280, 1440 and 1920px across all routes in both themes, with page-overflow assertions.                                                                                                                                         |
| Accessibility            | Axe A/AA scans, populated galleries/forms, keyboard slider, dialog focus restoration, mobile navigation and live-preview controls.                                                                                                                       |
| Production preview       | Built assets, deep links, dialogs, project creation and reload persistence.                                                                                                                                                                              |

## Artifacts

The responsive matrix uses 16 independent viewport/theme tests, each visiting 12 routes with populated screenshot evidence. Each case gets the configured test timeout, and named route steps identify failures. Run just this matrix with `npm run test:e2e -- --grep "responsive routes"`.

Development traces go to `test-results/`, production artifacts to `test-results-production/`, and visual captures to `output/playwright/`. All are gitignored and can be regenerated. The original design concept remains at `docs/design/dashboard-concept.png`; generated QA captures are not source assets.

## Verification status

Pre-push cleanup verified on 2026-10-25:

- `npm run check`: passed formatting, lint without warnings, 21 unit/component tests, strict application/test/config types and the production build.
- `npm run test:e2e`: all eight Chromium tests passed, including the complete evidence workflow, responsive matrix, storage policy and accessibility checks.
- `npm run test:preview`: production-bundle smoke test passed.
- `npm audit --omit=dev`: zero reported vulnerabilities.
- Push candidates exclude generated output, dependency folders, environment files and QA archives. Package/lockfile metadata matches and source references use portable paths.

Firefox/Safari, manual screen-reader review, large long-running collections, real quota exhaustion and the optional runner remain unverified. Storage denial is simulated. Print-media CSS and report content are checked; the native print/PDF dialog is not automated. Axe passing does not certify complete WCAG conformance.
