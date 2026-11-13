# FlirtPilot

An on-device dating-conversation copilot: reply coaching, icebreakers, profile review, and a
practice mode. One codebase ships as an installable **PWA** (Cloudflare Pages) and a **native iOS
app** (Capacitor → TestFlight).

## Layout
```
app/                      the application (Vite + React + TypeScript)
  src/                    UI + the AI-first / offline-fallback engine
  functions/api/ai.ts     Cloudflare Pages Function — server-side AI (OpenRouter)
  capacitor.config.ts     native iOS wrapper config
.github/workflows/        CI: Cloudflare Pages deploy + iOS TestFlight
DEPLOY.md                 how to deploy (web + iOS) and the secrets each needs
```

## Quick start
```bash
cd app
npm install
npm run dev        # http://localhost:5173
npm run build      # -> app/dist
```

## Features
- **Coach** — paste a message, get three replies in different tones, grounded in what they said.
- **Openers** — tone-picked icebreakers from optional profile context.
- **Profile review** — a score plus concrete fixes for your bio.
- **Practice** — a realistic simulated match to rehearse against.

Real AI runs server-side via a Cloudflare Pages Function calling OpenRouter (the key never touches
the client); the app falls back to an on-device, rule-based engine when offline. See
[`DEPLOY.md`](DEPLOY.md) for setup and [`app/README.md`](app/README.md) for app details.
