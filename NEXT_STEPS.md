# CasinoOps – következő fejlesztési lépések

Utolsó frissítés: 2026-10-28

Ez a dokumentum a még hátralévő munkát tartja egyetlen, prioritásos listában. A már elkészült rendszer részletes állapota a [PROJECT_STATUS.md](PROJECT_STATUS.md), a korábbi fejlesztési döntések pedig a [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) fájlban találhatók.

## Jelenlegi helyzet

A determinisztikus auth cascade, a három specialist agent, az evidence-alapú verifier, a Casino Brain, az impact forecast, a mitigation comparison, az operátori jóváhagyású recovery és a Judge Experience V2 elkészült. A következő szakasz célja elsőként a publikus demo megbízhatósága, majd a backend üzembiztonsága és csak ezután az új termékfunkciók.

## P0 – Demo megbízhatóság és automatikus ellenőrzés

### 1. Teljes browser E2E journey

**Állapot: elkészült ebben a mérföldkőben.**

- Playwright alapú Chromium teszt;
- landing page és terméküzenet ellenőrzése;
- teljes guided incident journey;
- verified incident, forecast és mitigation comparison ellenőrzése;
- explicit recovery approval boundary ellenőrzése;
- technical trace megnyitása;
- recovery utáni reset és hat healthy service ellenőrzése;
- hiba esetén trace, screenshot és videó megtartása.

Az E2E bevezetése két valódi integrációs hibát is feltárt és javított: a guided flow most megvárja a teljes, 3. fázisú incident state-et az approval előtt, a mock AI-kliens pedig nem fogyasztja a live provider védelmére fenntartott rate limitet. Emiatt több demo egymás után is lefuttatható, miközben live módban a provider-limit változatlanul érvényes.

### 2. CI pipeline

**Állapot: elkészült ebben a mérföldkőben.**

- GitHub Actions workflow pnpm cache-sel;
- lint, typecheck, unit test és production build;
- Playwright Chromium telepítés és browser E2E;
- tesztriport feltöltése kizárólag hiba esetén;
- később dependency- és container image scan külön jobban.

### Judge-facing coach-mark tour

**Állapot: elkészült.**

- a Guided Demo indításakor automatikusan megjelenik;
- a valódi Guided Demo, Casino Brain, Investigation, Impact és Approval elemekhez rögzül;
- az automatikus investigation befejezését megvárja;
- az approval gombot csak kiemeli, nem kattint helyette;
- a recovery eredménnyel zárul, bármikor átugorható;
- Playwright E2E teszt végigjárja mind a hat lépést.

### 3. Publikus deployment smoke teszt

**Állapot: a teszt elkészült; az új verzió szerverre telepítése után a publikus domainen futtatandó.**

- `https://casinoops.tech/health` és `/api/health` ellenőrzése;
- főoldal, WebSocket kapcsolat és guided demo minimális smoke tesztje;
- külön `PUBLIC_DEMO_URL` használata, hogy tetszőleges publikus környezet ellenőrizhető legyen build nélkül;
- deployment checklist HTTPS-, secret- és proxybeállításokhoz.

A `pnpm test:e2e:public` ellenőrzi az API-health végpontot, a landing oldalt, a WebSocket `LIVE LINK` állapotát, a teljes pre-approval történetet és az Exit demo utáni hat healthy szolgáltatást. Lokális production image-en sikeresen lefutott.

## P1 – Backend stabilizálás és biztonság

### 4. Fastify API integration tesztek

- a szerver összeállításának szétválasztása `buildApp()` és indítási rétegre;
- route-ok tesztelése Fastify `inject()` használatával;
- invalid payload, ismeretlen scenario, reset, forecast és mitigation hibautak;
- live provider nélkül, determinisztikus mock konfigurációval fusson.

### 5. Request-level rate limiting

- külön limit a read-only és műveletet indító route-okra;
- szigorúbb limit a Casino Brain/model hívásokra;
- szabványos `429` válasz és `Retry-After` header;
- proxy mögötti kliensazonosítás biztonságos konfigurálása.

### 6. Strukturált application logging

- közös request/correlation ID;
- scenario, agent, provider és időtartam mezők;
- API-kulcsok, authorization headerek és érzékeny payloadok redakciója;
- fejlesztői és production logszint külön konfigurációból.

### 7. Provider-kompatibilitás és usage metrikák

- Baseten és Meta válaszformátumok egységes normalizálása;
- input/output token usage és latency rögzítése;
- hiányzó vagy eltérő usage mezők biztonságos kezelése;
- provider smoke fixture-ek bővítése regressziós esetekkel.

A Baseten chat completion válaszból az input-, output- és total token mérhető; a kliens ezt már hívásonként naplózza latencyvel együtt. A válasz nem tartalmaz dollárban vagy creditben kifejezett költségmezőt, ezért a pontos credit-fogyás forrása a Baseten billing felülete. Következő fejlesztésként in-memory, majd perzisztált run-szintű usage summary készülhet; pénzügyi becslést csak hivatalos modellár megadása után szabad számolni.

### 8. Kisebb és biztonságosabb container image

- production dependency-only runtime;
- build eszközök kizárása a futó image-ből;
- image user, filesystem és capability beállítások ellenőrzése;
- dependency- és image-vulnerability scanning CI-ben.

## P2 – Tartós adatok és visszanézhetőség

### 9. SQLite perzisztencia

- repository interfész az in-memory tömbök leválasztására;
- incidensek, agent reportok, trace-ek és model call metadata tárolása;
- séma és verziózott migráció;
- retention limit és biztonságos reset/demo cleanup.

### 10. History nézet

- korábbi incident runok listája;
- egy futás evidence-, forecast- és mitigation-eredményeinek visszanézése;
- összehasonlítható recovery outcome-ok;
- pagination és időalapú szűrés.

## P3 – Következő termékfunkciók

### 11. Második determinisztikus incident scenario

- az auth cascade-től eltérő gyökérok és terjedési út;
- ugyanaz az evidence provenance és verifier biztonsági modell;
- scenario-választó a Guided Demo elején;
- unit, API integration és browser E2E lefedés.

### 12. Egyszerű 2D dependency graph

**Állapot: elkészült.**

- a hat operációs rendszer és függőségeik áttekinthető megjelenítése;
- healthy/degraded/failed állapot animáció nélkül is jól olvashatóan;
- az aktuális root cause és terjedési út kiemelése;
- első körben SVG-alapú, új 3D stack nélkül.

A graph közvetlenül a `ServiceState.dependencies` és aktuális státuszok alapján épül fel. A Casino Brain által verifikált root cause külön jelölést kap, a recovery state machine változásai pedig automatikusan megjelennek rajta.

### 13. Mitigation history összehasonlítás

- különböző stratégiák korábbi kimeneteleinek összevetése;
- recovery, kockázat, idő és blokkolt érték egységes táblázatban;
- kizárólag szimulációs adatok, production action nélkül.

## P4 – Production és skálázás

Ezek csak a publikus demo, API-tesztek és perzisztencia stabilizálása után következnek.

- production authentication és role-based authorization;
- Kubernetes manifest vagy Helm chart;
- külső event/state backend több API replica számára;
- szükség esetén PostgreSQL migráció;
- metrics, distributed tracing és centralizált logok;
- külön readiness/liveness probe;
- HPA valós, mért terhelési metrikák alapján;
- opcionális 2D/3D casino floor és Security Vision Agent / SAM integráció.

## Javasolt megvalósítási sorrend

1. Az új dependency graph verzió telepítése és `pnpm test:e2e:public` futtatása.
2. Háromperces próbafelvétel a [JUDGE_EXPERIENCE.md](JUDGE_EXPERIENCE.md) alapján.
3. Fastify `buildApp()` refaktor és API integration tesztek.
4. Rate limiting és strukturált logging.
5. Provider usage metrikák és container hardening.
6. SQLite repository és incident history.
7. Production auth és csak utána Kubernetes/Helm.

Minden mérföldkő elfogadási feltétele: lint, typecheck, unit/integration teszt, production build, releváns browser E2E és frissített dokumentáció.
