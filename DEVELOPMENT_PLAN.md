# CasinoOps – fejlesztési terv

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

- [x] agent trace WebSocket esemény
- [x] terv, checklist, tool call, megfigyelés és evidence megjelenítése
- [x] verifier eredmény és verified badge
- [x] belső chain-of-thought helyett auditálható operatív trace

### 7. Stabilizálás

- [ ] további determinisztikus scenario-k
- [ ] provider-összehasonlítás
- [ ] model call history
- [ ] API- és böngészős integrációs tesztek
- [ ] CI pipeline

## Aktuális mérföldkő

**Auditálható trace és UI**

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

### Auditálható agent trace eredmény

Az Infrastructure Agent minden vizsgálatához strukturált, Zod-validált operatív trace készül. A `plan`, `tool_call`, `observation`, `verification` és `report` lépések REST-en és WebSocketen is elérhetők, a dashboard pedig megjeleníti a checklistet, az evidence ID-kat, a verifier ellenőrzéseit és a `VERIFIED` állapotot.

A trace kizárólag auditálható műveleti adatot tartalmaz: toolnevet, validált inputot, evidence-hivatkozást, ellenőrzési eredményt és összefoglalót. Belső modellgondolatmenet vagy nyers, validálatlan érzékeny payload nem kerül bele. Az in-memory előzmény 500 elemre korlátozott.

Az ütemterv 42 tételéből 36 elkészült (**86%**); a stabilizálási fázisból és az egységes provider-metrikákból összesen 6 tétel van hátra.

Következő konkrét lépés az új keret megérkezése után: judge-facing Guided Demo és az azt lefedő browser E2E journey.

## Következő munkamenet – termékesítés és judge-facing demo

**Állapot: megkezdve; a kis, önálló demófejlesztésekkel haladunk tovább.**

A hackathon AI-magja feature-complete állapotú. A következő munkamenetben nem új AI-képességeket építünk, hanem a meglévő determinisztikus auth cascade köré készítünk könnyen érthető, publikus demóélményt.

### Prioritási sorrend

1. **Guided Demo és Explore mód — elkészült**
   - első képernyőn világos termékleírás, `Start Guided Demo` és `Explore CasinoOps` belépési pont;
   - guided flow: healthy → incident → agent investigation → verified root cause → 30 perces forecast → mitigation comparison → operátori jóváhagyású recovery simulation → recovered;
   - aktuális lépés és rövid magyarázat megjelenítése;
   - az Explore mód őrizze meg az összes jelenlegi manuális funkciót.
   - passzív, valós állapotból számított Demo Journey progress sáv — elkészült;
2. **Browser E2E tesztek**
   - teljes guided demo journey;
   - reset után healthy alapállapot;
   - forecast, mitigation és explicit recovery approval ellenőrzése;
   - technikai trace megnyitása.
3. **Demo reset és publikus működés**
   - jól látható `Reset Demo` művelet;
   - simulator state, eventek, agent riportok, investigation trace és incidensek ürítése;
   - mind a hat service visszaállítása healthy állapotba;
   - több egymást követő zsűritagi futtatás biztonságos kezelése.
4. **UI olvashatósági és vizuális hierarchia redesign**
   - a jelenlegi sötét command-center arculat megtartása;
   - desktop body text legalább 14–16 px, fontos esemény 16–18 px, panel heading 18–22 px, KPI 30–48 px;
   - közel fehér primary text és erősebb kontraszt;
   - monospace csak timestamp, event ID, trace és technikai metadata esetén;
   - nagy, videón is olvasható impact- és recovery-KPI-k.
5. **Investigation summary elsődleges nézet — elkészült**
   - hypothesis, evidence count, verification checks, confidence és `VERIFIED` státusz nagy kártyán;
   - a részletes `PLAN / TOOL CALL / OBSERVATION` trace másodlagos `View technical trace` interakció mögött;
   - nagy Infrastructure Agent progress kártya és Casino Brain „wow” állapot.
6. **Természetes nyelvű Digital Twin kérdés UI — elkészült**
   - `Ask CasinoOps…` input;
   - előre definiált `Predict +30 min` gyorsművelet;
   - a háttérben változatlanul a determinisztikus `predictOutage` és `compareMitigations` fusson.
7. **Publikus deployment – `casinoops.tech`**
   - a demo közvetlenül a fő domainen;
   - HTTPS, konfiguráció- és secret-ellenőrzés;
   - látható `Demo-only synthetic data / No production systems connected` notice — elkészült;
   - mitigationnél `SIMULATION ONLY` badge — elkészült;
   - healthcheck és ismételhető smoke teszt.
8. **Második determinisztikus incident scenario**
   - csak az elsődleges guided demo, E2E és deployment stabilizálása után;
   - ugyanazt a verifier/evidence biztonsági modellt használja.
9. **CI pipeline**
   - lint, typecheck, unit test, production build és browser E2E;
   - később dependency- és container image scanning.

### Későbbre sorolt stabilizálási elemek

- provider comparison;
- teljes model call history;
- további backend AI-képességek;
- külön marketingoldal, ha a fő demo elkészülte után marad idő.

### Következő munkamenet elfogadási feltétele

A zsűritag README nélkül, a nyitóképernyőről indulva végig tudja futtatni a teljes auth cascade történetet, érti a verifikált gyökérokot és az üzleti hatást, majd explicit jóváhagyással kizárólag a digitális ikerben szimulálja a helyreállítást. Mindezt egy automatikus browser E2E teszt is igazolja.

### Elkészült demo-fejlesztés: Investigation summary

Az Investigation panel most a legutóbbi agentfutásból külön, judge-facing összefoglalót képez: kiemeli a hipotézist, az egyedi evidence-ek számát, a verifier ellenőrzéseinek állását, az evidence-adjusted confidence értéket és a végső státuszt. A részletes audit trace megmaradt, de alapértelmezetten rejtett, és a `View technical trace` gombbal nyitható meg. Az összefoglaló-képzés külön, újrafelhasználható és automatikusan tesztelt frontend modul.

### Elkészült demo-fejlesztés: Ask the Digital Twin

A What-if panel a meglévő, korlátozott `/casino-brain/query` végpontot közvetlenül elérhetővé teszi. Az operátor természetes nyelvű kérdést írhat be vagy használhatja a `Predict +30 min` gyorsműveletet. A strukturált planner továbbra is csak a read-only `predictOutage` és `compareMitigations` toolok közül választhat; a dashboard a validált választ, az eredménykártyákat és az operátori jóváhagyás szükségességét együtt jeleníti meg.

### Elkészült demo-fejlesztés: publikus biztonsági határok

A dashboard tetején állandó, jól olvasható notice jelzi, hogy a környezet kizárólag szintetikus adatot használ, nincs production rendszerhez kötve és nem hajt végre production műveletet. A Digital Twin elemzési panel külön `SIMULATION ONLY` jelölést kapott, a manuális visszaállítás pedig egyértelmű `Reset demo` elnevezéssel jelenik meg.

### Elkészült demo-fejlesztés: Demo Journey progress

A dashboard hétlépcsős progress sávja a tényleges runtime állapotból követi a demó történetét: healthy baseline, incident trigger, AI investigation, verified root cause, impact forecast, mitigation comparison és recovery simulation. A megjelenítés nem indít háttérműveletet, ezért a meglévő explicit operátori jóváhagyási határok változatlanok maradnak. A progress-számítás külön, automatikusan tesztelt frontend modul.

### Elkészült demo-fejlesztés: Guided Demo és Explore mód

Az első látogatót egy rövid terméküzenet és két egyértelmű belépési pont fogadja. Az Explore mód megtartja az összes manuális operátori kontrollt. A Guided Demo healthy állapotból indítja a determinisztikus auth cascade-et, megvárja az evidence-backed root-cause verifikációt, majd automatikusan elkészíti a 30 perces forecastot és a mitigation comparisont.

A recovery nem indul el automatikusan: a flow az `Operator approval required` lépésnél megáll, és kizárólag az `Approve simulated recovery` gomb után futtatja a javasolt stratégiát a Digital Twinben. A folyamat újrafuttatható, megszakítható és resetelhető. A guided state machine külön composable-ban található, a teljes happy path automatikus regressziós tesztet kapott.

## Későbbre halasztott elemek

- Kubernetes és Helm;
- PostgreSQL;
- production authentication/authorization;
- 2D/3D casino floor és SAM integráció.

Ezek akkor következnek, amikor a tool-grounded agentfolyamat, a verifikáció és a regressziós tesztek már stabilak.
