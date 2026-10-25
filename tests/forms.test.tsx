import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectForm } from "../src/components/shared";
import { db } from "../src/database/db";
describe("project dialog", () => {
  it("submits a real record and closes only after persistence", async () => {
    const user = userEvent.setup();
    let closed = false;
    render(
      <ProjectForm
        open
        onOpenChange={(open) => {
          closed = !open;
        }}
      />,
    );
    expect(screen.getByRole("dialog")).toHaveAccessibleName("Create project");
    await user.type(screen.getByLabelText("Project name"), "Component test");
    await user.type(
      screen.getByLabelText("Website URL (optional)"),
      "https://example.com",
    );
    await user.click(screen.getByRole("button", { name: "Save project" }));
    await waitFor(() => expect(closed).toBe(true));
    const saved = await db.projects
      .where("name")
      .equals("Component test")
      .first();
    expect(saved?.url).toBe("https://example.com");
    expect(saved?.presetIds).toContain("mobile");
  });
});
