# FlirtPilot (app)

On-device dating-conversation copilot. One codebase → **PWA** (Cloudflare Pages) and **native
iOS** (Capacitor → TestFlight). Clean-room; contains no third-party code or assets.

## Stack
- Vite + React + TypeScript
- `vite-plugin-pwa` (installable, offline service worker)
- Capacitor (iOS wrapper)
- Zero-dependency icon generator (`scripts/generate-icons.mjs`)

## Screens
- **Coach** — paste a message, get three replies in different tones (on-device).
- **Openers** — tone-picked icebreakers, tap to copy.
- **Profile** — transparent bio score + concrete fixes.
- **Practice** — a safe simulated match to rehearse against.

All logic lives in [`src/engine.ts`](src/engine.ts) and is a deliberately offline, rule-based
stand-in for real inference. See `../reimplementation/PLAN.md` for the intended backend.

## Develop
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # -> dist/
npm run preview
npm run icons      # regenerate app icons
```

## Deploy
See [`../DEPLOY.md`](../DEPLOY.md) for the web (Cloudflare Pages) and iOS (TestFlight) pipelines
and the exact secrets each needs.
