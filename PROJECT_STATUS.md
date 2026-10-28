# CasinoOps – projektstátusz

Utolsó frissítés: **2026-10-28**

Ez a dokumentum a CasinoOps aktuális megvalósítási állapotának elsődleges nyilvántartása. Minden érdemi új funkció, architekturális változás vagy elkészült mérföldkő után frissítendő.

## Rövid összefoglaló

A CasinoOps jelenleg egy lokálisan és Docker Compose-zal futtatható, determinisztikus casino operations digital twin prototípus. A rendszer képes:

- authentication cascade incidenst generálni;
- az eseményeket valós időben továbbítani;
- három specialist agenttel párhuzamosan elemezni;
- Casino Brain segítségével közös gyökérokot meghatározni;
- 1–120 perces determinisztikus hatás-előrejelzést készíteni;
- öt mitigation stratégiát összehasonlítani;
- a kiválasztott stratégiát kizárólag a digitális ikerben lefuttatni;
- a teljes incidens- és helyreállítási folyamatot dashboardon megjeleníteni.
- az Infrastructure Agent teljes operatív vizsgálati trace-ét auditálható módon megjeleníteni.

A termék új neve **CasinoOps — AI-Powered Casino Operations Digital Twin**. A munkakönyvtár és a GitHub repository technikai neve kompatibilitási okból továbbra is `casinoos`.

Az alapértelmezett `AI_MODE=mock`, ezért a teljes demó API-kredit felhasználása nélkül futtatható.

## Aktuális architektúra

```text
Vue dashboard
    │ REST + WebSocket
    ▼
Fastify API / CasinoRuntime
    │
    ├── deterministic CasinoSimulator
    ├── EventBus + EventBuffer
    │
    ├── Infrastructure Agent ─┐
    ├── Operations Agent ────┼──► Casino Brain
    └── Risk Agent ──────────┘
                                  │
                                  ├── correlated incident
                                  ├── deterministic prediction
                                  ├── mitigation comparison
                                  └── recovery simulation
```

Monorepo:

```text
apps/api             Fastify REST és WebSocket API
apps/web             Vue 3 + Pinia dashboard
packages/shared      közös Zod-sémák és TypeScript-típusok
packages/events      in-process Event Bus és buffer
packages/simulator   scenario, prediction és mitigation motorok
packages/agents      AI-kliensek, specialist agentek és Casino Brain
docker               API/web Dockerfile és Nginx-konfiguráció
```

## Elkészült funkciók

### 1. Projektalapok

- [x] pnpm workspace monorepo
- [x] TypeScript strict mód
- [x] közös ESLint-konfiguráció
- [x] `.env.example` és biztonságos `.gitignore`
- [x] production build és fejlesztői indítás
- [x] moduláris workspace package-ek

### 2. Determinisztikus szimulátor

- [x] egységes `CasinoEvent` envelope
- [x] auth, payment, KYC, cashier, registration és support rendszerek
- [x] szolgáltatásállapot, latency, error rate és dependency lista
- [x] determinisztikus dependency graph
- [x] négylépcsős auth cascade scenario
- [x] reprodukálható eseményazonosítók és időbélyegek
- [x] scenario start, stop és reset

Generált kulcsesemények többek között:

```text
AUTH_LATENCY_HIGH
AUTH_LATENCY_CRITICAL
PAYMENT_AUTH_TIMEOUT
KYC_TOKEN_VALIDATION_FAILED
CASHIER_AUTH_TIMEOUT
REGISTRATION_AUTH_FAILED
PAYMENT_FAILED
KYC_QUEUE_GROWING
SUPPORT_COMPLAINT_SPIKE
```

### 3. Eseményfeldolgozás

- [x] in-process Event Bus
- [x] domain- és globális subscription
- [x] méret- és időalapú Event Buffer
- [x] párhuzamos specialist feldolgozás
- [x] WebSocket eseménytovábbítás
- [x] mitigation események leválasztása az AI input bufferről

### 4. AI-agent rendszer

- [x] újrafelhasználható `AIClient` absztrakció
- [x] Baseten OpenAI-compatible kliens
- [x] Meta OpenAI-compatible kliens
- [x] determinisztikus mock kliens
- [x] közös structured completion és egyszeri retry
- [x] Zod-validált modellválaszok
- [x] perces híváskorlátozás
- [x] input batch korlátozás
- [x] model call logging kulcsok naplózása nélkül

Agentek:

- [x] Infrastructure Agent
- [x] Operations Agent
- [x] Risk Agent
- [x] Casino Brain

Megjegyzés: a teljes agentlánc mock módban ellenőrzött. A Baseten Infrastructure Agent és a Meta Casino Brain külön live smoke suite-ja valódi API-kulcsokkal is sikeresen lefutott; a normál fejlesztői és Docker indítás továbbra is költségmentes mock módot használ.

### 5. Casino Brain korreláció

- [x] három specialist riport fogadása
- [x] közös gyökérok meghatározása
- [x] confidence és severity
- [x] érintett rendszerek
- [x] operatív hatás
- [x] kizárólag szimulációs ajánlások
- [x] cooldown a felesleges központi modellhívások ellen

Aktuális referenciaeredmény:

```text
Incident: Authentication Cascade Failure
Root cause: auth-service
Confidence: 94%
Risk: critical
Affected: payment, KYC, cashier, player registration
```

### 6. What-if előrejelzés

- [x] `POST /simulation/predict`
- [x] 1–120 perces validált időhorizont
- [x] determinisztikus impact timeline
- [x] érintett játékosok
- [x] sikertelen depositok
- [x] sorban álló withdrawalok
- [x] blokkolt pénzügyi érték
- [x] KYC queue kritikus ideje
- [x] support load növekedése

30 perces referencia:

```text
Affected players: 214
Failed deposits: 73
Queued withdrawals: 31
Estimated blocked value: €18,420
KYC queue critical in: 14 minutes
```

### 7. Mitigation engine

- [x] restart service
- [x] failover service
- [x] disable feature
- [x] queue requests
- [x] reduce load
- [x] sikeresség, kockázat, operatív hatás és recovery time pontozása
- [x] stratégiák determinisztikus rangsorolása
- [x] ajánlott stratégia kiválasztása

Aktuális ajánlás:

```text
Strategy: failover_service
Estimated recovery: 91%
Risk: low
Recovery time: 4 minutes
```

### 8. Recovery szimuláció

- [x] allow-listelt mitigation actionök
- [x] `POST /simulation/mitigations/:action/simulate`
- [x] 0% → 50% → 100% state machine
- [x] `recovered`, `partial`, `contained`, `stabilized` eredmények
- [x] szolgáltatásállapotok valós idejű módosítása
- [x] párhuzamos mitigation szimuláció tiltása
- [x] valós infrastruktúra-hívások teljes kizárása
- [x] kézi stop konzisztens állapottal

Failover recovery referencia:

```text
MITIGATION_SIMULATION_STARTED
MITIGATION_PROGRESS
AUTH_FAILOVER_COMPLETED

Healthy services: 6/6
Scenario status: recovered
```

### 9. Dashboard

- [x] sötét operations command center megjelenés
- [x] service health panel
- [x] live event stream
- [x] három agent aktivitása
- [x] Casino Brain incidenspanel
- [x] what-if impact kártyák és grafikon
- [x] természetes nyelvű `Ask CasinoOps` Digital Twin kérdésmező
- [x] 30 perces gyors-előrejelzés és strukturált Casino Brain válaszkártya
- [x] mitigation összehasonlító kártyák
- [x] recovery progress
- [x] incidens- és recovery timeline
- [x] reszponzív layout
- [x] REST + WebSocket Pinia store
- [x] állandó synthetic-only / no-production biztonsági notice
- [x] `SIMULATION ONLY` mitigation jelölés és egyértelmű `Reset demo`
- [x] runtime állapotból számított, hétlépcsős Demo Journey progress
- [x] judge-facing nyitóképernyő Guided Demo és Explore belépési ponttal
- [x] automatikus incident → verification → forecast → mitigation guided flow
- [x] kötelező operátori jóváhagyás a guided recovery előtt
- [x] UI/UX V2 high-end operations control-room vizuális rendszer
- [x] minimum 12 px technikai metadata és 15–17 px tartalmi szöveg
- [x] kiemelt Casino Brain KPI-k és egyszerűsített investigation/agent/timeline hierarchia
- [x] technikai monospace és trace elkülönítése az elsődleges termékfelülettől

### 10. Docker és futtatás

- [x] külön API- és webkonténer
- [x] multi-stage Docker build
- [x] Nginx reverse proxy
- [x] Docker Compose
- [x] API- és web-healthcheck
- [x] non-root konténerek
- [x] localhost-only host portok
- [x] `no-new-privileges`
- [x] konfigurálható portok

### 11. Auditálható agent trace

- [x] közös, Zod-validált trace séma
- [x] `plan`, `tool_call`, `observation`, `verification` és `report` lépések
- [x] bounded in-memory trace history
- [x] `GET /agent-traces` REST végpont
- [x] `agent.trace` WebSocket esemény
- [x] dashboard checklist-, evidence- és verifier-megjelenítés
- [x] verified badge
- [x] érzékeny részletek redakciója és belső modellgondolatmenet kizárása
- [x] judge-facing investigation summary és másodlagos technikai trace

Aktuális címek:

```text
Dashboard: http://127.0.0.1:8088
API:       http://127.0.0.1:3000
WebSocket: ws://127.0.0.1:3000/ws
```

## API végpontok

| Metódus | Végpont | Állapot | Leírás |
|---|---|---:|---|
| GET | `/health` | kész | API és AI-mód állapota |
| GET | `/simulation/state` | kész | digitális iker aktuális állapota |
| POST | `/simulation/start` | kész | scenario indítása |
| POST | `/simulation/stop` | kész | scenario vagy recovery leállítása |
| POST | `/simulation/reset` | kész | teljes in-memory állapot törlése |
| POST | `/simulation/scenario/:scenario` | kész | név szerinti scenario indítása |
| POST | `/simulation/predict` | kész | determinisztikus what-if előrejelzés |
| POST | `/simulation/mitigations` | kész | mitigation stratégiák rangsorolása |
| POST | `/simulation/mitigations/:action/simulate` | kész | stratégia futtatása a digitális ikerben |
| POST | `/casino-brain/query` | kész | természetes nyelvű read-only prediction vagy mitigation comparison |
| GET | `/events` | kész | generált események |
| GET | `/agent-reports` | kész | specialist riportok |
| GET | `/agent-traces` | kész | auditálható Infrastructure Agent vizsgálati lépések |
| GET | `/incidents` | kész | Casino Brain incidensek |
| WS | `/ws` | kész | valós idejű eseménycsatorna |

WebSocket message típusok:

```text
casino.event
agent.analysis
agent.trace
incident.detected
simulation.state
simulation.prediction
simulation.mitigation
```

## Biztonsági állapot

- [x] API-kulcsok kizárólag szerveroldalon
- [x] `.env` fájlok kizárása
- [x] strukturált input- és output-validáció
- [x] szigorú mitigation allow-list
- [x] 120 perces prediction limit
- [x] aktív incidens szükséges a prediction/mitigation futtatásához
- [x] rate limit az AI-hívásokon
- [x] log redaction
- [x] synthetic-only adatok
- [x] nincs valós infrastruktúra-beavatkozás
- [x] Content Security Policy
- [x] clickjacking- és MIME sniffing-védelem
- [x] kamera, mikrofon és geolocation tiltása
- [x] localhost-only Docker port binding
- [x] audit trace redakció és chain-of-thought kizárása

## Tesztek és ellenőrzések

Jelenleg **41 célzott automatikus teszt** található:

- Event Bus delivery;
- Infrastructure Agent root-cause detection;
- multi-agent Casino Brain correlation;
- determinisztikus cascade scenario;
- failover recovery state machine;
- 30 perces prediction referencia;
- mitigation ranking;
- túl nagy prediction horizon elutasítása.
- Infrastructure Agent smoke suite auth, payment-provider és healthy fixture-rel.
- Casino Brain smoke suite auth, payment-provider és healthy fixture-rel.
- read-only tool allow-list és registry listing;
- dependency/dependent feloldás aktuális snapshotból;
- bounded event filtering és érzékeny mezők redakciója;
- unknown tool, extra argumentum és túlméretes output elutasítása.
- determinisztikus investigation checklist létrehozása;
- stabil és immutable evidence ID;
- támogatott root cause sikeres verifikációja;
- elégtelen evidence felismerése;
- duplikált evidence ID-k figyelmen kívül hagyása;
- ellentmondó root-cause claim elutasítása.
- teljes mock investigation loop és verified report;
- healthy batch toolhívás nélküli lezárása;
- insufficient-evidence investigation ág;
- turn- és tool-call-limit betartása;
- teljes futási timeout és folyamatban lévő AI-kérés abortálása.
- decision-support tool allow-list;
- determinisztikus prediction és mitigation tool output;
- mitigation-végrehajtás és túl nagy horizont elutasítása;
- Casino Brain confidence determinisztikus korlátozása;
- insufficient evidence esetén aktív Brain incident blokkolása.
- természetes nyelvű prediction kérdés routingja;
- természetes nyelvű mitigation kérdés routingja és approval flag;
- aktív verifikált incidens nélküli query elutasítása.
- audit trace sorrendje és belső rationale kizárása.
- a legutóbbi investigation run kiválasztása és verified summary képzése.
- Guided Demo tartalmi állapotai és teljes, jóváhagyásnál megálló state machine-je.
- teljes Playwright browser journey a landingtől az approvalon és recoveryn át a healthy resetig.
- technical trace, impact KPI-k és mitigation recommendation browser-szintű ellenőrzése.

Rendszeresen futtatott ellenőrzések:

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm test:e2e
pnpm test:ai
docker compose build
```

A legutóbbi ellenőrzéskor mindkét Compose service `healthy` állapotban futott.

## MVP-fázisok állapota

| Fázis | Állapot | Megjegyzés |
|---|---:|---|
| 1. Foundation | kész | monorepo, API, frontend, WebSocket, config |
| 2. Casino simulator | kész | determinisztikus auth cascade |
| 3. Live dashboard | kész | service health és live event stream |
| 4. Infrastructure Agent | kész | mock és Baseten live smoke suite ellenőrzött |
| 5. Multi-agent system | kész | három specialist strukturált riporttal |
| 6. Casino Brain | kész | mock és Meta live smoke suite ellenőrzött |
| 7. What-if simulator | kész | determinisztikus 1–120 perces prediction |
| 8. Mitigation engine | kész | ranking és recovery simulation |
| 9. Visual polish | kész | UI/UX V2 judge-facing control-room felület |
| 10. Digital Twin visualization | nincs kész | 2D/3D casino floor még nincs |
| SAM 3.1 extension | nincs kész | opcionális későbbi fázis |

## Ismert korlátok és hátralévő feladatok

### Fontos következő lépések

- [x] providerfüggetlen Infrastructure Agent smoke-test keretrendszer
- [x] auth-torzítást ellenőrző payment-provider és healthy fixture
- [x] Gitből kizárt Baseten live smoke-test környezeti konfiguráció
- [x] Baseten live smoke teszt valódi kulccsal, három fixture-rel
- [x] Meta Model API live smoke teszt valódi kulccsal, három fixture-rel
- [x] providerfüggetlen read-only `AgentToolRegistry`
- [x] service state, dependency, dependent és recent event toolok
- [x] tool payload limit, strict validáció és redakció
- [x] `InvestigationContext`, checklist és evidence provenance
- [x] determinisztikus root-cause verifier és confidence számítás
- [x] `insufficient_evidence` és `rejected` állapotok
- [x] Infrastructure Agent `PLAN → TOOL → OBSERVE → VERIFY → REPORT` loop
- [x] 4 körös, 6 tool callos és 25 másodperces hard limit
- [x] közös mock/live akcióprotokoll és Baseten live validáció
- [x] evidence-aware Casino Brain és determinisztikus confidence cap
- [x] read-only prediction és mitigation decision-support toolok
- [x] agent oldali mitigation-végrehajtás tiltása
- [x] természetes nyelvű Casino Brain query API
- [x] Meta live query planner validáció
- [x] auditálható agent trace REST/WebSocket csatornával és dashboard UI-val
- [ ] provider response-kompatibilitás és token usage ellenőrzése
- [ ] API integration tesztek Fastify injectionnel
- [x] teljes Guided Demo browser E2E Playwrighttal
- [ ] további Vue komponens-tesztek
- [x] CI pipeline lint/typecheck/test/build és Playwright E2E lépésekkel
- [ ] tartós adattárolás SQLite-tal
- [ ] incidens- és model call history perzisztálása
- [ ] request-level API rate limiting
- [ ] strukturált application logger
- [ ] production authentication és authorization
- [ ] container image méretének csökkentése production dependency deploy-jal
- [ ] dependency- és image-vulnerability scanning

### Későbbi skálázási lépések

- [ ] Kubernetes manifest vagy Helm chart
- [ ] több API replica esetén külső event/state backend
- [ ] PostgreSQL migráció, ha szükséges
- [ ] metrics, tracing és centralizált logok
- [ ] readiness/liveness szétválasztása
- [ ] horizontal autoscaling mérőszámok alapján

### Opcionális termékfunkciók

- [ ] egyszerű 2D dependency graph
- [ ] 2D/3D casino operations visualization
- [ ] több determinisztikus incident scenario
- [ ] természetes nyelvű operátori kérdések
- [ ] mitigation eredmények összehasonlító history nézete
- [ ] Security Vision Agent / SAM 3.1 integráció

## Gyors indítás

Docker Compose-zal:

```bash
docker compose up --build
```

Dashboard:

```text
http://127.0.0.1:8088
```

Lokális fejlesztői módban:

```bash
pnpm install
copy .env.example .env
pnpm dev
```

## Aktuális demófolyamat

1. Nyisd meg a dashboardot.
2. Kattints a **Run auth cascade** gombra.
3. Várd meg a Casino Brain korrelált incidensét.
4. Futtasd a **Run forecast** műveletet.
5. Válaszd a **Compare mitigations** műveletet.
6. A javasolt failover stratégián kattints a **Simulate** gombra.
7. Figyeld a service health állapotokat, a recovery progresszt és a timeline-t.

## Dokumentumkarbantartási szabály

Minden új fejlesztési fázis végén frissítendő:

1. az „Elkészült funkciók” megfelelő része;
2. az „MVP-fázisok állapota” táblázat;
3. az „Ismert korlátok és hátralévő feladatok” lista;
4. az „Utolsó frissítés” dátuma;
5. szükség esetén az API-végpontok és a tesztek száma.
