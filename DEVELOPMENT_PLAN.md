# CasinoOS – fejlesztési terv

Utolsó frissítés: **2026-10-28**

Ez a dokumentum a következő fejlesztési irányt és annak haladását követi. A már elkészült rendszer részletes állapota a [PROJECT_STATUS.md](PROJECT_STATUS.md) fájlban található.

## Fejlesztési elvek

- kis, jól körülhatárolt és tesztelhető modulok;
- providerfüggetlen domain- és agentlogika;
- Zod-validáció minden külső AI inputon és outputon;
- read-only agent eszközök és explicit allow-list;
- bizonyíték nélkül nincs verifikált gyökérok;
- API-kulcs vagy érzékeny adat nem kerülhet forráskódba, logba vagy Gitbe;
- minden mérföldkő után teszt, dokumentációfrissítés és áttekinthető commit.

## Megvalósítási sorrend

### 1. AI readiness és live validáció

- [x] providerfüggetlen Infrastructure Agent smoke-test runner
- [x] auth cascade fixture
- [x] független payment-provider fixture az auth-torzítás ellen
- [x] healthy baseline fixture
- [x] külön `pnpm test:ai` parancs
- [x] explicit, alapból mock `AI_TEST_PROVIDER` konfiguráció
- [x] Gitből kizárt helyi `.env` előkészítése a hackathon Baseten modellhez
- [ ] Baseten live futtatás valódi kulccsal
- [ ] Meta Casino Brain smoke-test runner
- [ ] Meta live futtatás valódi kulccsal
- [ ] token-, latency-, retry- és schema-validációs metrikák egységes tárolása

### 2. Read-only agent tool layer

- [ ] providerfüggetlen `AgentToolRegistry`
- [ ] `getServiceState`
- [ ] `getDependencies`
- [ ] `getDependents`
- [ ] `getRecentEvents`
- [ ] argumentum- és eredményvalidáció
- [ ] eredményméret-korlát és adatredakció

### 3. Investigation és evidence modell

- [ ] `InvestigationContext`
- [ ] megváltoztathatatlan evidence ID és provenance
- [ ] hipotézisek és checklist
- [ ] `insufficient_evidence` kimenet
- [ ] determinisztikus verifier
- [ ] verifikált confidence számítás

### 4. Infrastructure Agent tool loop

- [ ] `PLAN → TOOL CALL → OBSERVE → VERIFY → REPORT`
- [ ] maximum 4 kör és 6 tool call
- [ ] teljes futási időkorlát
- [ ] mock és live kliens közös protokollja
- [ ] negatív és elégtelen bizonyítékú regressziós tesztek

### 5. Casino Brain és operátori lekérdezések

- [ ] evidence-aware Casino Brain
- [ ] determinisztikus prediction és mitigation toolok
- [ ] természetes nyelvű `/casino-brain/query` API
- [ ] digitális-iker szimuláció csak explicit operátori jóváhagyással

### 6. Auditálható trace és UI

- [ ] agent trace WebSocket esemény
- [ ] terv, checklist, tool call, megfigyelés és evidence megjelenítése
- [ ] verifier eredmény és verified badge
- [ ] belső chain-of-thought helyett auditálható operatív trace

### 7. Stabilizálás

- [ ] további determinisztikus scenario-k
- [ ] provider-összehasonlítás
- [ ] model call history
- [ ] API- és böngészős integrációs tesztek
- [ ] CI pipeline

## Aktuális mérföldkő

**AI readiness és live validáció**

Első implementáció: elkészült a külön futtatható Infrastructure Agent smoke suite. A normál alkalmazás mock módban marad, a külön smoke test pedig explicit módon használhatja a Gitből kizárt `.env` Baseten-konfigurációját.

Következő konkrét lépés: a smoke suite Baseten live futtatása fejlesztői környezeti változókból, az eredmény kiértékelése, majd a Meta Casino Brain suite kialakítása.

## Későbbre halasztott elemek

- Kubernetes és Helm;
- PostgreSQL;
- production authentication/authorization;
- 2D/3D casino floor és SAM integráció.

Ezek akkor következnek, amikor a tool-grounded agentfolyamat, a verifikáció és a regressziós tesztek már stabilak.
