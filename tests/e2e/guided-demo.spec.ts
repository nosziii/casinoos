import { expect, test } from "@playwright/test";

test("a judge can complete and safely reset the guided incident journey", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByTestId("demo-landing")).toBeVisible();
  await expect(page.getByTestId("ai-mode")).toContainText("DETERMINISTIC");
  const aiStatusBox = await page.getByTestId("ai-mode").boundingBox();
  const linkStatusBox = await page.locator("nav .status-pill").boundingBox();
  if (!aiStatusBox || !linkStatusBox) throw new Error("Header runtime indicators are not visible");
  expect(Math.abs((aiStatusBox.y + aiStatusBox.height / 2) - (linkStatusBox.y + linkStatusBox.height / 2))).toBeLessThanOrEqual(1);
  await expect(page.getByRole("heading", { name: "CasinoOps", exact: true })).toBeVisible();
  await expect(page.getByText("Understand what failed. Know what happens next.")).toBeVisible();

  await page.getByTestId("start-guided-demo").click();
  const guidedDemo = page.getByTestId("guided-demo");
  const judgeTour = page.getByTestId("judge-tour");
  await expect(judgeTour).toHaveAttribute("data-step", "0");
  await expect(guidedDemo).toHaveAttribute("data-stage", "investigating");
  await expect(guidedDemo).toHaveAttribute("data-stage", "awaiting_approval", { timeout: 30_000 });

  await expect(page.getByRole("heading", { name: "Critical incident" })).toBeVisible();
  await expect(page.getByTestId("incident-confidence")).toHaveText(/^\d{1,3}%$/);
  await expect(page.getByText(/affected players/i)).toBeVisible();
  await expect(page.getByText(/recommended/i)).toBeVisible();
  const dependencyGraph = page.getByTestId("dependency-graph");
  await expect(dependencyGraph).toBeVisible();
  await expect(dependencyGraph.locator("[data-service='auth-service']")).toHaveClass(/dependency-node--root/);
  await expect(dependencyGraph.getByText("Cascade detected")).toBeVisible();
  await page.getByRole("button", { name: /View evidence/ }).click();
  await expect(page.getByTestId("evidence-viewer").locator("article")).not.toHaveCount(0);

  for (const expectedStep of [1, 2, 3, 4, 5, 6, 7, 8]) {
    await judgeTour.getByRole("button", { name: "Next" }).click();
    await expect(judgeTour).toHaveAttribute("data-step", String(expectedStep));
  }
  await expect(judgeTour.getByText("Use the highlighted button")).toBeVisible();

  await page.getByRole("button", { name: "View technical trace" }).click();
  await expect(page.locator("#technical-agent-trace")).toBeVisible();
  await expect(page.locator("#technical-agent-trace > li")).not.toHaveCount(0);

  await page.getByTestId("approve-recovery").click();
  await expect(judgeTour).toHaveAttribute("data-step", "9");
  await expect(guidedDemo).toHaveAttribute("data-stage", "completed", { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Incident recovered" })).toBeVisible();
  await expect(dependencyGraph.getByText("All paths healthy")).toBeVisible();
  await judgeTour.getByRole("button", { name: "Finish tour" }).click();
  await expect(judgeTour).toBeHidden();

  await page.getByRole("button", { name: "Exit demo" }).click();
  await expect(page.getByTestId("demo-landing")).toBeVisible();
  await expect(page.getByRole("heading", { name: "System health" })).toBeVisible();
  await expect(page.locator(".service .status-pill--ok")).toHaveCount(6);
});
