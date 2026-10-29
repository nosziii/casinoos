# CasinoOps – Judge Experience & Submission Readiness

Utolsó frissítés: **2026-10-29**

## Cél

Egy zsűritag előismeret nélkül, tíz másodpercen belül értse meg a CasinoOps értékét, majd egyetlen belépési pontból végig tudja játszani a teljes történetet. A publikus demó determinisztikus módban fut a megbízhatóság érdekében; a live modellekkel végzett validáció külön dokumentált.

## Háromperces narratíva

| Idő | Kép | Narráció |
|---:|---|---|
| 0:00–0:20 | Nyitóképernyő és hat healthy rendszer | A kaszinó kritikus operációi egészségesek, a CasinoOps folyamatosan figyeli a jeleket és függőségeket. |
| 0:20–0:45 | Auth degradation és dependency graph | Egy authentication hiba továbbterjed a payment, KYC, cashier és registration rendszerekre. |
| 0:45–1:15 | Casino Brain és Investigation | A specialist agentek közös gyökérokot keresnek, majd a rendszer bizonyítékokkal és determinisztikus ellenőrzésekkel verifikálja azt. |
| 1:15–1:45 | +30 perces impact forecast | A digitális iker megmutatja, hány játékos, tranzakció és mekkora érték kerül veszélybe beavatkozás nélkül. |
| 1:45–2:15 | Mitigation comparison | Több recovery stratégia összehasonlítása történik sikeresség, kockázat, idő és üzleti hatás alapján. |
| 2:15–2:40 | Operator approval | A CasinoOps ajánl, de önállóan nem hajt végre műveletet; az operátor jóváhagyása kötelező. |
| 2:40–3:00 | Recovery és visszazöldülő graph | A kiválasztott stratégia kizárólag a digital twinben fut le, majd minden rendszer egészséges állapotba tér vissza. |

## Publikus próba checklist

- [ ] inkognitó ablakban a landing oldal 5 másodpercen belül betölt;
- [ ] a `LIVE LINK` megjelenik, tehát a WebSocket kapcsolat él;
- [ ] a **Start live demo** egy kattintásból elindítja a történetet;
- [ ] a coach-mark nem takarja el az aktuális célpontot notebook felbontáson;
- [ ] az authentication root cause és a terjedési út olvasható a dependency graphon;
- [ ] az impact KPI-k 1080p videóban is olvashatók;
- [ ] recovery csak explicit operátori jóváhagyás után indul;
- [x] WebSocket-megszakítás mellett is befejeződik a recovery, majd automatikusan visszaáll a `LIVE LINK`;
- [ ] az **Exit demo** teljesen healthy kezdőállapotot állít vissza;
- [ ] telefonon nincs vízszintes oldal-scroll, a graph saját területén görgethető;
- [ ] `pnpm test:e2e:public` sikeresen lefut.

## Submission checklist

- [x] publikus HTTPS demo;
- [x] determinisztikus, kreditfüggetlen judge flow;
- [x] tízlépcsős contextual tour runtime-, progress-, health-, dependency-, evidence- és approval-magyarázattal;
- [x] automatikus browser E2E és CI;
- [x] vizuális dependency graph;
- [x] látható live/deterministic/fallback AI runtime státusz;
- [x] transzparens provider-fallback és human-readable evidence viewer;
- [x] README első képernyőjén probléma, megoldás, screenshot és live link;
- [ ] háromperces próbafelvétel;
- [ ] végleges demo videó és README-link;
- [ ] másik gépes és telefonos manuális próba;
- [ ] beadási űrlap végleges szövege és assetjei.

## Live AI deployment checklist

A szerver Gitből kizárt `.env` fájljában:

```env
AI_MODE=live
AI_FALLBACK_ENABLED=true
MAX_AGENT_CALLS_PER_MINUTE=30
BASETEN_BASE_URL=https://inference.baseten.co/v1
BASETEN_MODEL=meta-models/muse-spark-open-1026
META_BASE_URL=https://api.meta.ai/v1
META_MODEL=muse-wonder-1.0
```

A `BASETEN_API_KEY` és `META_MODEL_API_KEY` csak a szerveren tölthető ki. Telepítés után:

```bash
git pull origin main
docker compose -f compose.yaml -f compose.production.yaml up -d --build
curl https://casinoops.tech/api/runtime/ai
pnpm test:e2e:public
```

Az első válaszban `configuredMode: "live"` és `effectiveMode: "live"` szükséges. A browser flow közben fallback esetén a felületnek látható `AI FALLBACK` állapotot, a hibázó providert és egy biztonságos hibakategóriát kell mutatnia.

## GitHub repository metadata

Manuálisan beállítandó a repository **About** részében:

- Description: `CasinoOps — AI-Powered Casino Operations Digital Twin`
- Website: `https://casinoops.tech`
- Topics: `ai`, `agents`, `digital-twin`, `meta-ai`, `muse`, `casino`, `operations`, `typescript`, `vue`, `fastify`, `hackathon`

## Parancsok

```bash
pnpm test:e2e
pnpm test:e2e:public
```

Másik publikus környezet ellenőrzése:

```bash
PUBLIC_DEMO_URL=https://example.com pnpm test:e2e:public
```
