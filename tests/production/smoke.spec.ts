import { test, expect } from "@playwright/test";
test("production bundle supports deep links, dialogs and persisted records", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/projects");
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await page.getByLabel("Project name").fill("Production smoke");
  await page.getByRole("button", { name: "Save project" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Production smoke", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Production smoke", exact: true }),
  ).toBeVisible();
  for (const route of [
    "/workspace",
    "/comparisons",
    "/reports",
    "/settings",
    "/data",
  ]) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
  }
  expect(errors).toEqual([]);
});
