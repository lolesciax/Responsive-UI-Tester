import { expect, type Page } from "@playwright/test";
export async function createProject(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await page.getByLabel("Project name").fill("Responsive fixture");
  await page
    .getByLabel("Description", { exact: true })
    .fill("Controlled local testing evidence");
  await page.getByRole("button", { name: "Save project", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}
export async function uploadFixtures(page: Page) {
  // Generate image fixtures in the browser; no public target is visited.
  const images = await page.evaluate(() =>
    [false, true].map((changed) => {
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 400, 300);
      ctx.fillStyle = changed ? "#ff0000" : "#0000ff";
      ctx.fillRect(20, 20, 100, 80);
      return canvas.toDataURL("image/png").split(",")[1];
    }),
  );
  await page.goto("/screenshots");
  await page
    .getByLabel("Upload screenshots", { exact: true })
    .first()
    .setInputFiles(
      images.map((data, i) => ({
        name: i ? "current.png" : "baseline.png",
        mimeType: "image/png",
        buffer: Buffer.from(data, "base64"),
      })),
    );
  await expect(
    page.getByRole("heading", { name: "baseline.png", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "current.png", exact: true }),
  ).toBeVisible();
}
