import { expect, test } from "@playwright/test";

test("a judge can complete and safely reset the guided incident journey", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByTestId("demo-landing")).toBeVisible();
  await expect(page.getByRole("heading", { name: "CasinoOps", exact: true })).toBeVisible();
  await expect(page.getByText("Understand what failed. Know what happens next.")).toBeVisible();

  await page.getByTestId("start-guided-demo").click();
  const guidedDemo = page.getByTestId("guided-demo");
  await expect(guidedDemo).toHaveAttribute("data-stage", "investigating");
  await expect(guidedDemo).toHaveAttribute("data-stage", "awaiting_approval", { timeout: 30_000 });

  await expect(page.getByRole("heading", { name: "Critical incident" })).toBeVisible();
  await expect(page.getByTestId("incident-confidence")).toHaveText(/^\d{1,3}%$/);
  await expect(page.getByText(/affected players/i)).toBeVisible();
  await expect(page.getByText(/recommended/i)).toBeVisible();

  await page.getByRole("button", { name: "View technical trace" }).click();
  await expect(page.locator("#technical-agent-trace")).toBeVisible();
  await expect(page.locator("#technical-agent-trace > li")).not.toHaveCount(0);

  await page.getByTestId("approve-recovery").click();
  await expect(guidedDemo).toHaveAttribute("data-stage", "completed", { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Incident recovered" })).toBeVisible();

  await page.getByRole("button", { name: "Exit demo" }).click();
  await expect(page.getByTestId("demo-landing")).toBeVisible();
  await expect(page.getByRole("heading", { name: "System health" })).toBeVisible();
  await expect(page.locator(".service .status-pill--ok")).toHaveCount(6);
});
