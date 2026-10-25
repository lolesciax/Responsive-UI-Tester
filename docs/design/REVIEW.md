# Design reference

`dashboard-concept.png` is the original Image Gen reference: white surfaces, cool gray canvas, navy text, indigo actions, a 232px sidebar, compact header, actual-data metrics, project empty state, onboarding and activity. Controls and text are implemented in React, rather than rendered into a background image.

The application keeps that composition while adding the requested workflows, total issue count, themes, mobile navigation and the logo described in LOGO.md. No sample production records are inserted. The optional runner is explicitly unavailable.

Browser review covers navigation, header, metrics, empty states, onboarding, activity, storage information and footer. Captures were inspected on desktop/mobile in both themes. The concept is a reference rather than a pixel-exact specification.

Generated browser captures belong in ignored `output/playwright/` and can be regenerated. Earlier captures with the old icon are excluded from source to avoid presenting them as current UI.
