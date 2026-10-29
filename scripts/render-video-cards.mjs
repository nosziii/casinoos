import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";

const outputDir = resolve(process.env.VIDEO_CARD_DIR ?? "video/drafts/casinoops-v2");
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });

const baseStyles = `
  * { box-sizing: border-box; }
  html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; }
  body {
    display: grid;
    place-items: center;
    color: #f3f7f5;
    background:
      radial-gradient(circle at 50% 42%, rgba(69, 230, 164, .10), transparent 34%),
      linear-gradient(145deg, #07100f, #091412 58%, #06100e);
    font-family: Inter, "Segoe UI", Arial, sans-serif;
  }
  body::before {
    content: "";
    position: fixed;
    inset: 42px;
    border: 1px solid rgba(255,255,255,.07);
    pointer-events: none;
  }
  main { width: 1420px; text-align: center; }
  .eyebrow { color: #45e6a4; font-size: 24px; font-weight: 750; letter-spacing: .05em; }
  h1 { margin: 24px 0 10px; font-size: 112px; line-height: .95; letter-spacing: -.055em; }
  h1 span { color: #45e6a4; }
  h2 { margin: 28px 0 0; font-size: 48px; line-height: 1.2; letter-spacing: -.025em; }
  p { margin: 24px auto 0; max-width: 1080px; color: #98aaa5; font-size: 29px; line-height: 1.5; }
  .rule { width: 120px; height: 4px; margin: 38px auto; border-radius: 999px; background: #45e6a4; box-shadow: 0 0 28px rgba(69,230,164,.45); }
  .url { display: inline-block; margin-top: 26px; color: #45e6a4; font-size: 54px; font-weight: 800; letter-spacing: -.02em; }
  .meta { margin-top: 46px; color: #667974; font-size: 20px; letter-spacing: .03em; }
`;

async function render(name, body) {
  await page.setContent(`<!doctype html><html><head><style>${baseStyles}</style></head><body>${body}</body></html>`);
  await page.screenshot({ path: resolve(outputDir, `${name}.png`) });
}

async function renderChapter(name, label) {
  await page.setContent(`<!doctype html><html><head><style>
    * { box-sizing: border-box; }
    html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; background: transparent; }
    body { position: relative; font-family: Inter, "Segoe UI", Arial, sans-serif; }
    .chapter {
      position: absolute;
      top: 112px;
      left: 72px;
      min-width: 260px;
      padding: 18px 26px 16px;
      color: #07100f;
      background: #45e6a4;
      border-radius: 8px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, .34), 0 0 26px rgba(69, 230, 164, .20);
      font-size: 30px;
      font-weight: 850;
      letter-spacing: .10em;
      line-height: 1;
    }
  </style></head><body><div class="chapter">${label}</div></body></html>`);
  await page.screenshot({ path: resolve(outputDir, `${name}.png`), omitBackground: true });
}

await render("intro-card", `
  <main>
    <div class="eyebrow">AI-POWERED CASINO OPERATIONS DIGITAL TWIN</div>
    <h1>CASINO<span>OPS</span></h1>
    <div class="rule"></div>
    <h2>Understand what failed. Know what happens next.</h2>
    <p>Detect cascading incidents, verify their root cause, predict their impact and test recovery before touching production.</p>
  </main>
`);

await render("end-card", `
  <main>
    <div class="eyebrow">CASINO OPERATIONS INTELLIGENCE</div>
    <h1>CASINO<span>OPS</span></h1>
    <h2>See the failure before it becomes an incident.</h2>
    <a class="url">casinoops.tech</a>
    <p>github.com/nosziii/casinoos</p>
    <div class="meta">Synthetic environment · No production systems connected · No autonomous production actions</div>
  </main>
`);

await renderChapter("chapter-detect", "DETECT");
await renderChapter("chapter-verify", "VERIFY");
await renderChapter("chapter-predict", "PREDICT");
await renderChapter("chapter-recovery", "TEST RECOVERY");

await browser.close();
process.stdout.write(`${outputDir}\n`);
