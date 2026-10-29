import { expect, test } from "@playwright/test";

test("the public demo is reachable and completes the pre-approval story", async ({ page, request }) => {
  const health = await request.get("/api/health");
  expect(health.ok()).toBe(true);
  expect(await health.json()).toMatchObject({ status: "ok" });

  await page.goto("/");
  await expect(page.getByTestId("demo-landing")).toBeVisible();
  await expect(page.getByTestId("ai-mode")).toContainText(/LIVE AI|DETERMINISTIC|AI FALLBACK/);
  await expect(page.getByText("LIVE LINK")).toBeVisible();

  await page.getByTestId("start-guided-demo").click();
  await expect(page.getByTestId("guided-demo")).toHaveAttribute("data-stage", "awaiting_approval");
  await expect(page.getByTestId("dependency-graph").getByText("Cascade detected")).toBeVisible();

  await page.getByRole("button", { name: "Exit demo" }).click();
  await expect(page.getByTestId("demo-landing")).toBeVisible();
  await expect(page.locator(".service .status-pill--ok")).toHaveCount(6);
});
