# Deploying the app

This repo now contains a real, buildable app under [`app/`](app/) plus two CI pipelines:

| Target | What it is | Pipeline | Opens on iOS how |
|--------|-----------|----------|------------------|
| **Web / PWA** | The app as an installable website | `.github/workflows/cloudflare-pages.yml` → Cloudflare Pages | Safari → **Share → Add to Home Screen** (standalone, offline-capable) |
| **Native iOS** | The same codebase wrapped by Capacitor into a real `.ipa` | `.github/workflows/ios.yml` → TestFlight | Install from **TestFlight**, then the App Store |

Both pipelines auto-run on push to `main` (only when `app/**` changes). There is no
"opening the repo on a phone deploys it" mechanism — that does not exist on any platform.
Deploys are triggered by **git push**, which is the real equivalent.

---

## 1. Web / PWA → Cloudflare Pages  ✅ works today

**One secret needed.**

1. Create a Cloudflare API token: dash → My Profile → API Tokens → *Create Token* →
   permission **Account · Cloudflare Pages · Edit** (account `5b7e398b42211bcb3ef301986c3dec3a`).
2. Add it as a GitHub repo secret named **`CLOUDFLARE_API_TOKEN`**
   (repo → Settings → Secrets and variables → Actions → New repository secret).
3. Push to `main` (or run the *Deploy web (Cloudflare Pages)* workflow manually).
   First run creates the Pages project `flirtpilot` and prints the live `*.pages.dev` URL.

The account id is public and already hard-coded in the workflow.

### Build locally
```bash
cd app
npm install
npm run build      # outputs app/dist (static, deployable anywhere)
npm run preview    # serve the production build locally
```

---

## 1a. AI backend (real coaching)  ✅ works, free by default

The app's intelligence runs in a Cloudflare Pages Function at `/api/ai`
([`app/functions/api/ai.ts`](app/functions/api/ai.ts)) that calls OpenRouter **server-side**
— the key is never in the client bundle. The frontend falls back to on-device rules when
offline or if this is unset, so the app always works.

1. Add the key to the Pages project (one time):
   - Dashboard: Pages → `flirtpilot` → Settings → Environment variables → add
     **`OPENROUTER_API_KEY`** (Production + Preview), or
   - CLI: `cd app && npx wrangler pages secret put OPENROUTER_API_KEY --project-name flirtpilot`
2. (Optional) `OPENROUTER_MODEL` — defaults to **`nvidia/nemotron-3.5-super-vl:free`**
   (a free model, $0/call). Set a paid model id here if the key has credits.
3. (Optional, recommended before public launch) hardening on the `/api/ai` Function:
   - **`ALLOWED_ORIGINS`** — comma-separated CORS allowlist. If unset, the default allows your
     `*.pages.dev` + the Capacitor/localhost origins; any other origin is blocked.
   - **`RATE_LIMIT`** — bind a **KV namespace** named `RATE_LIMIT` to the Pages project to enable
     per-IP limiting (30 req / 60s). Without it, add a **Cloudflare WAF rate rule** on `/api/ai`.
   - The Function already caps request bodies at 16 KB, times out the upstream call at 20s, escapes
     the prompt delimiter in user input, and never echoes upstream errors to the client.

Verified locally: all four modes (coach, openers, profile, practice) return real,
context-aware output against the free model at zero cost.

### Test the AI locally
```bash
cd app
echo "OPENROUTER_API_KEY=sk-or-..." > .dev.vars   # gitignored
npm run build && npx wrangler pages dev dist --port 8788
curl -X POST http://127.0.0.1:8788/api/ai \
  -H 'Content-Type: application/json' \
  -d '{"mode":"coach","conversation":"She said she loves hiking","tones":["playful","warm"]}'
```

---

## 2. Native iOS → TestFlight  ⚠️ needs your Apple Developer account

A native iOS build **cannot** be produced by Cloudflare, Windows, or this environment. It
requires Apple's toolchain (a macOS runner — already configured in `ios.yml`) **and** your
Apple credentials. Add these GitHub repo secrets:

| Secret | Where it comes from |
|--------|---------------------|
| `ASC_KEY_ID` | App Store Connect → Users and Access → **Integrations / Keys** → key id |
| `ASC_ISSUER_ID` | same page → Issuer ID |
| `ASC_KEY_P8` | the full contents of the downloaded `AuthKey_XXXX.p8` |
| **Signing (pick one)** | `MATCH_GIT_URL` + `MATCH_PASSWORD` (fastlane match, recommended) **or** uncomment the manual cert/profile block in `ios.yml` and add `DIST_CERT_P12_BASE64` + `DIST_CERT_PASSWORD` |

Prerequisites: an **Apple Developer Program** membership ($99/yr) and an app record with
bundle id **`com.flirtpilot.app`** created in App Store Connect.

Until those secrets exist the `iOS TestFlight` workflow will fail at the signing step — that
is expected, not a bug.

### Generate the Xcode project locally (on a Mac)
```bash
cd app
npm install && npm run build
npx cap add ios      # creates app/ios/App/App.xcworkspace
npx cap sync ios
npx cap open ios     # opens Xcode
```
On Windows you can do everything **except** `cap add ios` / Xcode — that step is Mac-only and
is what the `ios.yml` runner performs for you.

> **iOS + AI:** the native app's WebView loads from a local origin, so a relative `/api/ai`
> call won't reach your deployed backend. The `ios.yml` workflow now builds with
> `VITE_API_BASE` set automatically (repo variable `VITE_API_BASE`, default
> `https://flirtpilot.pages.dev`). For a local Mac build, pass it yourself:
> ```bash
> VITE_API_BASE=https://flirtpilot.pages.dev npm run build && npx cap sync ios
> ```
> The Function's CORS allowlist already includes the Capacitor/localhost origins. The PWA needs
> no such setting (same-origin).

---

## What's real vs. pending

- ✅ App builds and runs (web + PWA) — verified with `npm run build`.
- ✅ **Real AI coaching** via `/api/ai` → OpenRouter — verified end-to-end locally (all four
  modes) with `wrangler pages dev`. Free model by default; add `OPENROUTER_API_KEY` to turn on.
- ✅ On-device rule-based engine remains as the **offline fallback** (`app/src/engine.ts`).
- ✅ Cloudflare Pages auto-deploy — works as soon as `CLOUDFLARE_API_TOKEN` is added.
- ✅ iOS pipeline is fully wired — runs as soon as the Apple secrets + signing are added.

## About
This app is **FlirtPilot** (our own product). See [`README.md`](README.md) for an overview.
