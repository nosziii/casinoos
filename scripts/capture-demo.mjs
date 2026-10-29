import { chromium } from "@playwright/test";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";

const baseURL = process.env.DEMO_CAPTURE_URL ?? "https://casinoops.tech";
const stamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
const outputDir = resolve("video", "raw", stamp);
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
  colorScheme: "dark",
  recordVideo: {
    dir: outputDir,
    size: { width: 1920, height: 1080 },
  },
});

const page = await context.newPage();
const video = page.video();
const metadata = {
  baseURL,
  capturedAt: new Date().toISOString(),
  viewport: "1920x1080",
  fallbackDetected: false,
  fallbackReason: null,
  completed: false,
  screenshots: [],
};

async function pause(milliseconds) {
  await page.waitForTimeout(milliseconds);
}

async function frame(name) {
  const path = resolve(outputDir, `${name}.png`);
  await page.screenshot({ path });
  metadata.screenshots.push(`${name}.png`);
}

async function show(selector, hold = 5_000) {
  const target = page.locator(selector).first();
  await target.waitFor({ state: "visible", timeout: 20_000 });
  await target.evaluate((element) => element.scrollIntoView({ behavior: "smooth", block: "center" }));
  await pause(1_200);
  await pause(hold);
}

try {
  await page.goto(baseURL, { waitUntil: "networkidle", timeout: 30_000 });
  await page.getByTestId("demo-landing").waitFor({ state: "visible" });
  await page.getByText("LIVE LINK", { exact: true }).waitFor({ state: "visible", timeout: 15_000 });
  const initialFallback = page.getByTestId("provider-fallback");
  if (await initialFallback.isVisible().catch(() => false)) {
    await initialFallback.getByRole("button", { name: "Reset and retry live AI" }).click();
    await initialFallback.waitFor({ state: "hidden", timeout: 15_000 });
  }
  await page.getByTestId("ai-mode").locator("summary").filter({ hasText: "LIVE AI" }).waitFor({ state: "visible", timeout: 15_000 });
  await frame("01-healthy-landing");
  await pause(7_000);

  await page.getByTestId("start-guided-demo").click();
  const tour = page.getByTestId("judge-tour");
  await tour.waitFor({ state: "visible", timeout: 10_000 });
  await tour.getByRole("button", { name: "Skip tour" }).click();

  await show("[data-tour='system-health']", 6_000);
  const guidedDemo = page.getByTestId("guided-demo");
  await guidedDemo.waitFor({ state: "visible" });
  await guidedDemo.evaluate((element) => new Promise((resolvePromise, rejectPromise) => {
    const deadline = Date.now() + 45_000;
    const check = () => {
      if (element.dataset.stage === "awaiting_approval") return resolvePromise(undefined);
      if (element.dataset.stage === "error") return rejectPromise(new Error("Guided demo entered the error stage"));
      if (Date.now() > deadline) return rejectPromise(new Error("Timed out waiting for operator approval"));
      globalThis.setTimeout(check, 250);
    };
    check();
  }));

  const fallback = page.getByTestId("provider-fallback");
  metadata.fallbackDetected = await fallback.isVisible().catch(() => false);
  if (metadata.fallbackDetected) metadata.fallbackReason = (await fallback.textContent())?.replaceAll(/\s+/g, " ").trim() ?? "Unknown fallback";

  await show("[data-tour='casino-brain']", 8_000);
  await frame("02-verified-incident");
  await show("[data-tour='dependencies']", 8_000);
  await frame("03-failure-propagation");

  await show("[data-tour='investigation']", 2_000);
  await page.getByRole("button", { name: /View evidence/ }).click();
  await show("#investigation-evidence", 8_000);
  await frame("04-investigation-evidence");
  await page.getByRole("button", { name: "View technical trace" }).click();
  await show("#technical-agent-trace", 4_000);

  await show("[data-tour='impact']", 10_000);
  await frame("05-impact-and-mitigations");
  await show("[data-tour='guided-status']", 5_000);
  await frame("06-operator-approval");

  await page.getByTestId("approve-recovery").click();
  await show("[data-tour='recovery']", 5_000);
  await guidedDemo.evaluate((element) => new Promise((resolvePromise, rejectPromise) => {
    const deadline = Date.now() + 20_000;
    const check = () => {
      if (element.dataset.stage === "completed") return resolvePromise(undefined);
      if (element.dataset.stage === "error") return rejectPromise(new Error("Recovery entered the error stage"));
      if (Date.now() > deadline) return rejectPromise(new Error("Timed out waiting for recovery"));
      globalThis.setTimeout(check, 200);
    };
    check();
  }));

  await show("[data-tour='dependencies']", 8_000);
  await frame("07-recovered-dependencies");
  await show("[data-tour='guided-status']", 6_000);
  await frame("08-recovery-complete");
  metadata.completed = true;
} catch (error) {
  metadata.error = error instanceof Error ? error.message : String(error);
  process.exitCode = 1;
} finally {
  await writeFile(resolve(outputDir, "capture.json"), `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
  await context.close();
  if (video) await rename(await video.path(), resolve(outputDir, "casinoops-demo-take.webm"));
  await browser.close();
}

process.stdout.write(`${JSON.stringify({ outputDir, ...metadata }, null, 2)}\n`);
