# AtlasAI

AtlasAI is a local-first workspace dashboard. It includes a browser control plane, an Electron desktop monitor, and an Express API backed by SQLite.

## What is included

- A responsive web dashboard for service health, live machine metrics, plugins, and local settings.
- A desktop Electron monitor that reads CPU and memory data through a secure IPC bridge.
- A typed Express API with SQLite persistence, configuration validation, plugin lifecycle support, and structured logging.
- Legacy root endpoints plus a stable `/api` namespace for clients.

## Run locally

Use Node.js 20 or later. On Windows PowerShell systems that block `npm.ps1`, use `npm.cmd`.

```bash
npm install
npm run dev
```

This starts the backend, browser dashboard, and Electron application. The Vite command prints the browser dashboard URL. The backend runs on `http://localhost:5000` by default.

To run one part of the workspace:

```bash
npm --workspace backend run dev
npm --workspace frontend run dev
npm --workspace desktop run dev
```

Copy [`apps/backend/.env.example`](apps/backend/.env.example) to `apps/backend/.env` to override local defaults. `OPENAI_API_KEY` is optional and is intentionally not consumed by the dashboard yet.

## API

The following endpoints are available under both `/api` and the legacy root path:

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Backend availability and timestamp |
| `GET /api/system` | Static CPU, memory, OS, graphics, and storage information |
| `GET /api/system/live` | Current CPU and memory usage |
| `GET /api/database` | SQLite connection check |
| `GET /api/plugins` | Loaded plugin metadata |
| `GET /api/settings` | Stored local settings |
| `POST /api/settings` | Create or update `{ "key": "...", "value": "..." }` |

## Verify

```bash
npm run build
npm run lint
```
