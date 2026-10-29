# CasinoOps — 3-minute submission video plan

Last updated: **2026-10-29**

## Goal

Explain the complete CasinoOps value proposition to a first-time judge in under three minutes:

> Understand what failed. Know what happens next. Test recovery before touching production.

The video must show a real, successful run of `https://casinoops.tech`, keep every important KPI readable at 1080p, and make the distinction between live AI analysis and deterministic digital-twin simulation explicit.

## Delivery format

- Duration: **2:50–2:58**; never exceed 3:00.
- Canvas: **1920×1080**, 16:9, 30 fps.
- Export: **H.264 MP4 + AAC**, 15–20 Mbps video, 48 kHz audio.
- Voice-over: English, calm and confident, approximately 125–135 words per minute.
- Captions: burned-in English subtitles, maximum two lines.
- Browser: clean profile, notifications disabled, bookmarks hidden, 100% zoom unless a panel needs a controlled crop.
- Cursor: visible only for meaningful clicks; no aimless movement.

## Storyboard and narration

| Time | Picture and action | English narration |
|---:|---|---|
| 0:00–0:10 | CasinoOps title card, then the landing page with six healthy systems. | **Casino operations depend on many connected systems. When one fails, the visible symptom is rarely the real cause. CasinoOps is an AI-powered operational digital twin built to explain that chain.** |
| 0:10–0:27 | Show `LIVE AI` and `LIVE LINK`, then click **Start live demo**. | **It monitors authentication, payments, KYC, cashier, player registration and customer support. This demo uses synthetic data and never connects to, or acts on, production systems.** |
| 0:27–0:48 | Auth degradation begins; service cards turn red; move to the dependency graph. | **We trigger a critical authentication latency incident. Within seconds, failures propagate into every dependent player and transaction journey, while the independent support service remains available.** |
| 0:48–1:15 | Casino Brain incident panel, confidence, affected systems, evidence count; open Investigation. | **Three specialist agents analyze the same operational evidence from infrastructure, business operations and risk perspectives. Casino Brain correlates their findings, but it does not trust an unsupported model answer. The root-cause hypothesis is checked against service degradation, dependency structure, event order and independent evidence.** |
| 1:15–1:32 | Evidence summary, verification checks, briefly reveal Technical Trace. | **The result is a verified authentication root cause with a visible confidence score. Judges and operators can inspect the evidence, tool calls and verification trace instead of treating the AI as a black box.** |
| 1:32–1:54 | Impact forecast; emphasize +30 minute KPI cards. | **Next, the deterministic digital twin answers the operational question that matters: what happens if we do nothing? It forecasts affected players, failed deposits, blocked transaction value and the time until further systems become critical.** |
| 1:54–2:18 | Mitigation comparison with strategy cards and the recommended option. | **CasinoOps then compares recovery strategies inside the twin. Each option is scored by recovery time, success probability, residual risk and business impact. The safest strategy is recommended, but nothing is executed automatically.** |
| 2:18–2:34 | Highlight and click **Approve simulated recovery**. | **A human operator must explicitly approve the next step. Even then, the action runs only as a simulation. This preserves human control and keeps production untouched.** |
| 2:34–2:50 | Recovery animation and services returning to green; dependency graph becomes healthy. | **The selected recovery restores all six services. The same dependency graph that explained the cascade now confirms that every operational path is healthy.** |
| 2:50–2:58 | Final product lockup, live URL and GitHub repository. | **CasinoOps helps teams understand what failed, predict what happens next and test recovery before touching production. Try the live demo at casinoops.tech.** |

## Recording plan

Record short, independent source clips instead of one long take. This makes timing predictable and avoids repeating the entire AI run after a single mistake.

1. **Landing:** 10–15 seconds, healthy baseline and runtime indicators.
2. **Trigger:** click Start live demo and capture the initial cascade.
3. **Dependency graph:** clean pan or crop from authentication to downstream systems.
4. **Casino Brain:** verified incident, confidence, affected systems and evidence.
5. **Investigation:** evidence summary plus a short technical-trace reveal.
6. **Impact:** +30 minute forecast and large KPIs.
7. **Mitigations:** comparison and recommended strategy.
8. **Approval:** one deliberate click on simulated recovery.
9. **Recovery:** all services and dependency paths returning to healthy.
10. **End card:** CasinoOps, `casinoops.tech`, GitHub and Meta/Baseten model attribution.

For reliability, capture at least two successful takes of clips 2–9. Keep one uninterrupted full run as evidence that the displayed story is genuine.

## FilmCraft 0.14 workflow

FilmCraft is suitable for this edit, but it is still alpha software. Keep the project simple and save versions frequently.

### Timeline

- `V1`: screen recordings.
- `V2`: controlled zooms/crops and short callout labels.
- `V3`: title card, chapter labels and end card.
- `A1`: voice-over.
- `A2`: subtle background music.
- `A3`: restrained click/transition accents, if needed.

### Editing rules

- Prefer hard cuts and 4–8 frame dissolves; avoid flashy transitions.
- Use only a few controlled scale keyframes to keep important KPIs readable.
- Keep the UI's own green/black visual language; do not add a second visual theme.
- Do not show fallback footage in the final story unless fallback transparency is being explained deliberately.
- Leave runtime badges visible long enough to prove that the live providers and WebSocket link are active.
- Duck music under narration; target voice around **−16 LUFS integrated** and peaks below **−1 dBFS**.
- Export a low-resolution draft first, then render the final 1080p file only after timing and captions are approved.

## Low-load workflow for this machine

1. Close unnecessary browser tabs before recording.
2. Record 1080p/30 fps, not 4K or 60 fps.
3. Keep every source clip short and use H.264/WebM source media.
4. In FilmCraft, avoid heavy color effects and generated proxies unless playback actually struggles.
5. Use a half-scale or low-quality draft export first.
6. Run the final export only when the edit is locked.
7. Do not stop, disable or reconfigure Cortex XDR.

## Acceptance checklist

- [ ] Final runtime is between 2:50 and 2:58.
- [ ] The first ten seconds explain the product and show the healthy baseline.
- [ ] `LIVE AI` and `LIVE LINK` are readable in at least one shot.
- [ ] Authentication is unambiguously shown as the verified root cause.
- [ ] Evidence and verification are understandable without reading the technical trace.
- [ ] +30 minute impact KPIs remain readable in a 1080p upload.
- [ ] Operator approval is visibly required before recovery.
- [ ] Recovery returns every service and graph path to healthy.
- [ ] Synthetic-data and no-production-action disclaimers are visible.
- [ ] Captions match the final voice-over.
- [ ] No secret, API key, server console, personal notification or unrelated browser tab appears.
- [ ] Final MP4 plays correctly from start to finish on another device.

## Next production step

The lightweight automated browser capture and first low-resolution FilmCraft timing draft are complete. The successful source take ran fully in live AI mode without fallback and is kept outside Git under `video/raw/`. The first 540p timing draft uses a local scratch voice and is kept under `video/drafts/`.

Next, review pacing and shot selection, extend the 2:37 timing draft to 2:50–2:58 with deliberate opening and closing holds, record the final English voice-over, then add captions, restrained music and visual polish before the single final 1080p export.
