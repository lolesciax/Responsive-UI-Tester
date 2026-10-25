import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("site storage requires explicit origin-scoped trust and never enables for Studio itself", async ({
  page,
}) => {
  const fixture = `<!doctype html><html lang="en"><title>Storage fixture</title><body><h1 id="storage"></h1><p id="parent"></p><script>
    try { localStorage.setItem('studio-preview-fixture', 'ok'); document.getElementById('storage').textContent = 'Storage available'; }
    catch (error) { document.getElementById('storage').textContent = 'Storage blocked: ' + error.name; }
    try { parent.document.title; document.getElementById('parent').textContent = 'Parent accessible'; }
    catch { document.getElementById('parent').textContent = 'Parent isolated'; }
  </script></body></html>`;
  await page.route("**/storage-fixture", (route) =>
    route.fulfill({ contentType: "text/html", body: fixture }),
  );
  await page.goto("/workspace");
  await page.getByRole("button", { name: "Live preview", exact: true }).click();
  const input = page.getByRole("textbox", { name: "Preview website URL" });
  const trust = page.getByRole("checkbox", {
    name: "Allow site storage for this trusted external site",
  });
  const iframe = page.locator('iframe[title="Sandboxed website preview"]');
  const frame = page.frameLocator('iframe[title="Sandboxed website preview"]');
  await input.fill("http://127.0.0.1:5174/storage-fixture");
  await page.getByRole("button", { name: "Load preview", exact: true }).click();
  await expect(frame.getByRole("heading")).toHaveText(
    "Storage blocked: SecurityError",
  );
  await expect(iframe).not.toHaveAttribute("sandbox", /allow-same-origin/);
  await trust.check();
  await expect(frame.getByRole("heading")).toHaveText("Storage available");
  await expect(frame.getByText("Parent isolated")).toBeVisible();
  await expect(iframe).toHaveAttribute("sandbox", /allow-same-origin/);
  await expect(
    page.getByRole("link", { name: "Open site in new tab" }),
  ).toHaveAttribute("rel", "noopener noreferrer");
  await input.fill("http://127.0.0.1:5175/storage-fixture");
  await page.getByRole("button", { name: "Load preview", exact: true }).click();
  await expect(trust).not.toBeChecked();
  await expect(frame.getByRole("heading")).toHaveText(
    "Storage blocked: SecurityError",
  );
  await input.fill("http://127.0.0.1:5173/storage-fixture");
  await page.getByRole("button", { name: "Load preview", exact: true }).click();
  await expect(trust).toBeDisabled();
  await expect(frame.getByRole("heading")).toHaveText(
    "Storage blocked: SecurityError",
  );
  await expect(iframe).not.toHaveAttribute("sandbox", /allow-same-origin/);
  await page.setViewportSize({ width: 320, height: 812 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
  ).toBe(false);
  await page.screenshot({
    path: "output/playwright/preview-storage-mobile.png",
    fullPage: true,
  });
});

test("Studio preferences work when localStorage access is denied", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() =>
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException(
          "Access denied by sandbox policy",
          "SecurityError",
        );
      },
    }),
  );
  await page.goto("/settings");
  await page
    .getByRole("combobox", { name: "Theme", exact: true })
    .selectOption("dark");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("link", { name: "Projects", exact: true }).click();
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await page.getByLabel("Project name").fill("Storage-denied fixture");
  await page.getByRole("button", { name: "Save project" }).click();
  await expect(
    page.getByRole("heading", { name: "Storage-denied fixture", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Storage-denied fixture", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("live preview toolbar stays compact and fit keeps the complete viewport visible", async ({
  page,
}) => {
  await page.route("**/layout-fixture", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<!doctype html><html lang="en"><title>Layout fixture</title><body style="margin:0;background:#eef2ff"><header style="background:#263365;color:white;padding:18px;font:16px system-ui">Preview starts here</header><main style="padding:18px;font:16px system-ui">Controlled responsive preview</main></body></html>',
    }),
  );
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/settings");
  await page
    .getByRole("combobox", { name: "Theme", exact: true })
    .selectOption("dark");
  await page.goto("/workspace");
  await page.getByRole("button", { name: "Live preview", exact: true }).click();
  await expect(page.locator(".inspector")).toHaveCount(0);
  const help = page.getByRole("button", { name: "Preview help", exact: true });
  await expect(help).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#live-preview-help")).toBeHidden();
  await page
    .getByRole("textbox", { name: "Preview website URL" })
    .fill("http://127.0.0.1:5174/layout-fixture");
  await page.getByRole("button", { name: "Load preview", exact: true }).click();
  await expect(
    page.frameLocator("iframe").getByText("Preview starts here"),
  ).toBeVisible();
  await help.click();
  await expect(
    page.getByRole("region", { name: "Live preview help" }),
  ).toBeVisible();
  await help.click();
  await page
    .getByRole("combobox", { name: "Viewport preset", exact: true })
    .selectOption("large-desktop");
  for (const width of [1920, 1024, 375, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.getByRole("button", { name: "1:1", exact: true }).click();
    await page
      .getByRole("button", { name: "Fit to canvas", exact: true })
      .click();
    await expect
      .poll(() =>
        page.locator(".canvas").evaluate((canvas) => ({
          x: canvas.scrollLeft,
          y: canvas.scrollTop,
          overflowX: canvas.scrollWidth - canvas.clientWidth,
          overflowY: canvas.scrollHeight - canvas.clientHeight,
        })),
      )
      .toEqual({ x: 0, y: 0, overflowX: 0, overflowY: 0 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      ),
    ).toBe(false);
  }
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page
    .getByRole("combobox", { name: "Viewport preset", exact: true })
    .selectOption("small-mobile");
  await expect(
    page.getByRole("combobox", { name: "Viewport preset", exact: true }),
  ).toHaveValue("small-mobile");
  await expect
    .poll(() =>
      page
        .locator(".canvas")
        .evaluate((element) => element.scrollHeight - element.clientHeight),
    )
    .toBe(0);
  const before = await page
    .locator("iframe")
    .evaluate((element) => element.getBoundingClientRect().width);
  await page.getByRole("button", { name: "Zoom out", exact: true }).click();
  await expect
    .poll(() =>
      page
        .locator("iframe")
        .evaluate((element) => element.getBoundingClientRect().width),
    )
    .toBeLessThan(before);
  await page
    .getByRole("button", { name: "Fit to canvas", exact: true })
    .click();
  const scan = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(scan.violations).toEqual([]);
  await page.screenshot({
    path: "output/playwright/preview-compact-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Screenshot", exact: true }).click();
  await expect(page.locator(".inspector")).toBeVisible();
  expect(errors).toEqual([]);
});
