# CasinoOS

Az aktuális megvalósítási állapot és roadmap: [PROJECT_STATUS.md](PROJECT_STATUS.md)

AI-powered casino operations digital twin. The current milestone implements the deterministic authentication cascade, three parallel specialist agents, Casino Brain correlation, mock/live AI modes, structured Zod validation, REST/WebSocket delivery and a live Vue operations dashboard.

## Requirements

- Node.js 22+
- pnpm 10+

## Start locally

```bash
pnpm install
copy .env.example .env
pnpm dev
```

Mock mode is the default and never spends model credits. The dashboard opens at `http://127.0.0.1:5173` and the API listens on `http://127.0.0.1:3000`.

## Docker Compose (recommended)

Docker Compose starts a non-root Fastify API container and a non-root Nginx web container:

```bash
docker compose up --build
```

Open `http://127.0.0.1:8088`. Stop the stack with `docker compose down`.

The host ports are configurable without editing the Compose file:

```env
WEB_PORT=8088
API_PORT=3000
```

The services have independent health checks and communicate over a private Compose network. Host ports bind to localhost only and containers cannot gain new privileges. This keeps the deployment ready for a later Kubernetes migration without requiring a local cluster for MVP development.

Start the deterministic scenario:

```bash
curl -X POST http://127.0.0.1:3000/simulation/scenario/auth-cascade-failure
```

Inspect generated events at `GET /events`, specialist output at `GET /agent-reports`, and correlated Casino Brain output at `GET /incidents`. WebSocket clients can connect to `ws://127.0.0.1:3000/ws`.

After Casino Brain detects an incident, run deterministic digital-twin analysis:

```bash
curl -X POST http://127.0.0.1:3000/simulation/predict \
  -H "content-type: application/json" \
  -d '{"durationMinutes":30}'

curl -X POST http://127.0.0.1:3000/simulation/mitigations \
  -H "content-type: application/json" \
  -d '{"durationMinutes":30}'
```

Prediction horizons are restricted to 1–120 minutes. Mitigation output is simulated only and never performs real infrastructure actions.

Apply a selected strategy to the digital twin after comparing mitigations:

```bash
curl -X POST http://127.0.0.1:3000/simulation/mitigations/failover_service/simulate \
  -H "content-type: application/json" \
  -d '{}'
```

Only allow-listed mitigation actions are accepted. Recovery progresses through deterministic timeline events and is isolated from the specialist-agent input buffers.

## Live Baseten mode

Set `AI_MODE=live`, `BASETEN_API_KEY`, `META_MODEL_API_KEY`, and `META_MODEL` in the ignored `.env` file. Specialist agents use Baseten; Casino Brain uses Meta. Model responses are parsed as JSON and validated; a failed call or validation is retried once.

## Quality checks

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

Run the deterministic Infrastructure Agent smoke suite separately:

```bash
pnpm test:ai
```

It validates authentication correlation, an independent payment-provider incident and a healthy baseline. Live Baseten validation is opt-in and reads credentials only from the environment:

```powershell
$env:AI_TEST_PROVIDER="baseten"
pnpm test:ai
```
