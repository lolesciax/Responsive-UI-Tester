import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createProject, uploadFixtures } from "../helpers/studio";
test("complete local-first evidence workflow", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await createProject(page);
  await uploadFixtures(page);
  await page
    .getByRole("button", { name: "Edit baseline.png", exact: true })
    .click();
  await page.getByLabel("Viewport width", { exact: true }).fill("390");
  await page.getByRole("button", { name: "Save screenshot" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .locator(".shot-card")
    .filter({ has: page.getByRole("heading", { name: "baseline.png" }) })
    .getByRole("link", { name: "Inspect", exact: true })
    .click();
  await page.getByRole("button", { name: "Add annotation" }).click();
  await page.getByLabel("Text note").fill("Potential clipped navigation");
  await page.getByRole("button", { name: "Save annotation" }).click();
  await expect(page.locator(".annotation-row")).toContainText(
    "Potential clipped navigation",
  );
  await page
    .getByRole("link", { name: "Create issue from screenshot" })
    .click();
  await page.getByLabel("Title", { exact: true }).fill("Navigation clipping");
  await page
    .getByLabel("Description", { exact: true })
    .fill("Review the navigation at mobile width.");
  await page
    .getByRole("combobox", { name: "Related annotation", exact: true })
    .selectOption({ label: "1. Potential clipped navigation" });
  await page.getByLabel("Suggested fix").fill("Allow the navigation to wrap.");
  await page.getByRole("button", { name: "Save issue" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByLabel("Status for Navigation clipping")
    .selectOption("Resolved");
  await expect(page.getByLabel("Status for Navigation clipping")).toHaveValue(
    "Resolved",
  );
  await page.goto("/comparisons");
  await page
    .getByRole("combobox", { name: "Baseline", exact: true })
    .selectOption({ label: "baseline.png · 400×300" });
  await page
    .getByRole("combobox", { name: "Current", exact: true })
    .selectOption({ label: "current.png · 400×300" });
  await expect(page.getByAltText("Baseline: baseline.png")).toBeVisible();
  await page
    .getByRole("combobox", { name: "Mode", exact: true })
    .selectOption("slider");
  await page.getByLabel("Comparison divider", { exact: true }).fill("65");
  await page.getByLabel("Comparison divider", { exact: true }).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(
    page.getByLabel("Comparison divider", { exact: true }),
  ).toHaveValue("64");
  await page
    .getByRole("combobox", { name: "Mode", exact: true })
    .selectOption("difference");
  await expect(page.locator(".comparison-summary")).toContainText(
    "6.667% changed",
  );
  await page.getByRole("button", { name: "Save comparison" }).click();
  await expect(
    page.getByRole("combobox", { name: "Saved sessions", exact: true }),
  ).not.toHaveValue("");
  await page.goto("/audits");
  await page.getByRole("button", { name: "Record manual audit" }).click();
  await page
    .getByLabel("Summary", { exact: true })
    .fill("Mobile navigation review");
  await page.getByRole("button", { name: "Add finding" }).click();
  await page
    .getByLabel("Description", { exact: true })
    .fill("Potential overflow; verify in target browser.");
  await page
    .getByRole("combobox", { name: "Screenshot", exact: true })
    .selectOption({ label: "baseline.png" });
  await page.getByRole("button", { name: "Save audit" }).click();
  await expect(
    page.getByRole("heading", { name: "Mobile navigation review" }),
  ).toBeVisible();
  await page.goto("/reports");
  await expect(
    page.getByRole("heading", { name: "Navigation clipping", exact: true }),
  ).toBeVisible();
  const jsonDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "JSON", exact: true }).click();
  const json = await jsonDownload;
  await json.saveAs(testInfo.outputPath("report.json"));
  const csvDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "CSV", exact: true }).click();
  expect((await csvDownload).suggestedFilename()).toBe("issues.csv");
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".report")).toBeVisible();
  await page.emulateMedia({ media: "screen" });
  await page.goto("/projects");
  const projectDownload = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export Responsive fixture", exact: true })
    .click();
  const archive = await projectDownload;
  const archivePath = testInfo.outputPath("project.zip");
  await archive.saveAs(archivePath);
  await page.goto("/data");
  await page
    .getByLabel("Import backup", { exact: true })
    .setInputFiles(archivePath);
  await page.getByRole("button", { name: "Import copies" }).click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Imported 1 project with image assets." }),
  ).toBeVisible();
  await page.reload();
  await page.goto("/projects");
  await expect(
    page.getByRole("heading", {
      name: "Responsive fixture (imported)",
      exact: true,
    }),
  ).toBeVisible();
  await page.goto("/screenshots");
  await page
    .getByRole("combobox", { name: "Project", exact: true })
    .selectOption({ label: "Responsive fixture (imported)" });
  await expect(page.locator(".shot-card")).toHaveCount(2);
  await expect(page.locator(".shot-thumb img").first()).toHaveJSProperty(
    "naturalWidth",
    400,
  );
  await page.goto("/workspace");
  await page
    .getByRole("combobox", { name: "Screenshot", exact: true })
    .selectOption({ label: "baseline.png" });
  await expect(page.locator(".annotation-row")).toContainText(
    "Potential clipped navigation",
  );
  await page.goto("/issues");
  await expect(page.getByLabel("Status for Navigation clipping")).toHaveValue(
    "Resolved",
  );
  await page.goto("/projects");
  await page
    .getByRole("button", {
      name: "Delete Responsive fixture (imported)",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Delete permanently" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Responsive fixture (imported)",
      exact: true,
    }),
  ).toHaveCount(0);
  expect(errors).toEqual([]);
});
test("responsive routes and themes have no page overflow", async ({ page }) => {
  test.setTimeout(180000);
  await createProject(page);
  await uploadFixtures(page);
  for (const width of [320, 375, 390, 768, 1024, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const theme of ["light", "dark"]) {
      await page.goto("/settings");
      await page
        .getByRole("combobox", { name: "Theme", exact: true })
        .selectOption(theme);
      for (const route of [
        "/dashboard",
        "/projects",
        "/screenshots",
        "/workspace",
        "/comparisons",
        "/issues",
        "/audits",
        "/reports",
        "/presets",
        "/settings",
        "/data",
        "/activity",
      ]) {
        await page.goto(route);
        await expect(page.locator("h1")).toBeVisible();
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth,
        );
        expect(overflow, `${route} at ${width}px in ${theme}`).toBe(false);
      }
    }
  }
});
test("axe accessibility, dialog keyboard behavior and mobile navigation", async ({
  page,
}) => {
  test.setTimeout(120000);
  for (const theme of ["light", "dark"]) {
    await page.goto("/settings");
    await page
      .getByRole("combobox", { name: "Theme", exact: true })
      .selectOption(theme);
    for (const route of [
      "/dashboard",
      "/projects",
      "/screenshots",
      "/workspace",
      "/comparisons",
      "/issues",
      "/audits",
      "/reports",
      "/presets",
      "/settings",
      "/data",
    ]) {
      await page.goto(route);
      await expect(page.locator("h1")).toBeVisible();
      const scan = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(
        scan.violations,
        `${route} ${theme}: ${JSON.stringify(scan.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })))}`,
      ).toEqual([]);
    }
  }
  await page.goto("/dashboard");
  const trigger = page.getByRole("button", {
    name: "New project",
    exact: true,
  });
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Projects", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Projects", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("captures empty-state visual references", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: "Dashboard", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "output/playwright/dashboard-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({
    path: "output/playwright/dashboard-mobile.png",
    fullPage: true,
  });
  await page.goto("/settings");
  await page
    .getByRole("combobox", { name: "Theme", exact: true })
    .selectOption("dark");
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: "Dashboard", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "output/playwright/dashboard-dark-mobile.png",
    fullPage: true,
  });
});
test("populated evidence, forms and invalid image handling", async ({
  page,
}) => {
  await createProject(page);
  await uploadFixtures(page);
  const scan = async () =>
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
  await scan();
  await page
    .getByLabel("Upload screenshots", { exact: true })
    .first()
    .setInputFiles({
      name: "corrupt.png",
      mimeType: "image/png",
      buffer: Buffer.from("not an image"),
    });
  await expect(
    page.locator('[data-sonner-toast][data-type="error"]'),
  ).toBeVisible();
  await expect(page.locator(".shot-card")).toHaveCount(2);
  await page.goto("/workspace");
  await expect(page.getByRole("heading", { name: "Inspector" })).toBeVisible();
  await scan();
  await page
    .getByRole("button", { name: "Add annotation", exact: true })
    .click();
  await scan();
  await page.keyboard.press("Escape");
  await page.goto("/issues");
  await page.getByRole("button", { name: "Create issue" }).click();
  await scan();
  await page.keyboard.press("Escape");
});
