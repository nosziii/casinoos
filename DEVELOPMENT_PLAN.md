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
- [x] Baseten live futtatás valódi kulccsal
- [x] Meta Casino Brain smoke-test runner
- [x] Meta live futtatás valódi kulccsal
- [ ] token-, latency-, retry- és schema-validációs metrikák egységes tárolása

### 2. Read-only agent tool layer

- [x] providerfüggetlen `AgentToolRegistry`
- [x] `getServiceState`
- [x] `getDependencies`
- [x] `getDependents`
- [x] `getRecentEvents`
- [x] argumentum- és eredményvalidáció
- [x] eredményméret-korlát és adatredakció

### 3. Investigation és evidence modell

- [x] `InvestigationContext`
- [x] megváltoztathatatlan evidence ID és provenance
- [x] hipotézisek és checklist
- [x] `insufficient_evidence` kimenet
- [x] determinisztikus verifier
- [x] verifikált confidence számítás

### 4. Infrastructure Agent tool loop

- [x] `PLAN → TOOL CALL → OBSERVE → VERIFY → REPORT`
- [x] maximum 4 kör és 6 tool call
- [x] teljes futási időkorlát
- [x] mock és live kliens közös protokollja
- [x] negatív és elégtelen bizonyítékú regressziós tesztek

### 5. Casino Brain és operátori lekérdezések

- [x] evidence-aware Casino Brain
- [x] determinisztikus prediction és mitigation toolok
- [x] természetes nyelvű `/casino-brain/query` API
- [x] digitális-iker szimuláció csak explicit operátori jóváhagyással

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

### Legutóbbi live validáció

2026-10-28-án a `meta-models/muse-spark-open-1026` modellen mindhárom Infrastructure Agent fixture sikeresen lefutott:

- auth cascade: helyes `auth-service` gyökérok, 0,98 confidence;
- payment-provider degradation: helyes `payment-provider` gyökérok, auth-tévesztés nélkül, 0,95 confidence;
- healthy baseline: helyesen nem jelzett incidenst, 0,99 confidence.

A három hívás teljes futási ideje körülbelül 11,2 másodperc volt. A strukturált JSON-válasz kompatibilis volt a jelenlegi Zod-sémával.

2026-10-28-án a `muse-wonder-1.0` modellen a Casino Brain mindhárom fixture-je is sikeresen lefutott:

- auth cascade: az `auth-service` gyökérok és a specialist impact értékek megmaradtak;
- payment-provider degradation: a `payment-provider` gyökérok auth-tévesztés nélkül megmaradt;
- healthy baseline: nem keletkezett téves incidens, a gyökérok `unknown`, confidence 0 lett.

Az első kompatibilitási futás feltárta, hogy a Casino Brain prompt nem tartalmazta a kötelező JSON-mezőket. A teljes struktúra explicit leírása után a három Meta hívás körülbelül 20,5 másodperc alatt sikeresen teljesült. Az AI-kliensek 30 másodperces request timeoutot kaptak.

### Read-only tool layer eredmény

A runtime registry kizárólag a négy engedélyezett lekérdezést tartalmazza, és a szimulátor klónozott, aktuális snapshotjait használja. Az input alapértelmezett maximuma 4 KiB, az outputé 16 KiB. Ismeretlen tool, extra argumentum és túlméretes payload strukturált hibával leáll. A token-, secret-, password- és hasonló mezők az agent előtt redaktálódnak.

### Investigation és verification eredmény

Az evidence ID a validált tartalom és provenance SHA-256 lenyomatából képződik, az evidence snapshotok immutable formában kerülnek kiadásra. A verifier 35% degradáció-, 30% dependency-, 20% időrend- és 15% evidence-minimum súlyozást használ. Legalább három egyedi evidence szükséges legalább két evidence típusból; duplikált ID-val a minimum nem növelhető. A végső confidence a modell confidence és a verification score szorzata.

### Infrastructure Agent tool loop eredmény

A runtime már a közös mock/live strukturált akcióprotokollt használja. Az alapértelmezett hard limit 4 kör, 6 tool call és 25 másodperc; a deadline AbortSignal segítségével a folyamatban lévő AI-kérést is megszakítja. A strict validációval elutasított tool call auditálható hibaként visszakerül a kontextusba, így javítható, de nem kerülhető meg.

A Baseten live teszt során a modell root service state-, dependent- és recent-event toolokat használt, hat evidence-et gyűjtött, majd 1,0 verification score és 0,98 final confidence mellett verifikálta az auth cascade gyökérokát.

### Evidence-aware Casino Brain eredmény

A runtime csak `verified` Infrastructure investigation után hívja a Casino Braint. A Brain megkapja a teljes evidence-listát és verification eredményt; a kód determinisztikusan korlátozza a root-cause confidence-et a `finalConfidence` értékre, eltérő root service esetén hibát ad, elégtelen bizonyítékból pedig nem enged aktív incidenst létrehozni.

A külön decision-support registry kizárólag `predictOutage` és `compareMitigations` read-only toolokat tartalmaz. Mindkettő 1–120 perces validált horizonttal a determinisztikus szimulátort használja. `simulateMitigation` nincs az agent allow-listben, így a végrehajtás operátori jóváhagyáshoz kötött marad. Az evidence-aware Meta live suite mindhárom fixture-rel sikeres volt.

### Természetes nyelvű Casino Brain query eredmény

A `POST /casino-brain/query` végpont csak aktív, verifikált incidens mellett fut. A strukturált planner kizárólag `predictOutage` vagy `compareMitigations` toolt és 1–120 perces horizontot választhat; a választott számítást a determinisztikus registry végzi. A válasz nem szabad LLM-generált számítás, hanem validált szimulátor-outputból készült sablon.

A mitigation eredmény mindig `requiresOperatorApproval: true`, és az agent registry nem tartalmaz végrehajtási toolt. A Meta live smoke helyesen választotta a 45 perces prediction és 30 perces mitigation comparison útvonalat.

Következő konkrét lépés: auditálható agent trace WebSocket eseményekkel és dashboard megjelenítéssel.

## Későbbre halasztott elemek

- Kubernetes és Helm;
- PostgreSQL;
- production authentication/authorization;
- 2D/3D casino floor és SAM integráció.

Ezek akkor következnek, amikor a tool-grounded agentfolyamat, a verifikáció és a regressziós tesztek már stabilak.
