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
bundle id **`live.aiology.flirtpilot`** created in App Store Connect.

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

---

## What's real vs. pending

- ✅ App builds and runs (web + PWA) — verified with `npm run build`.
- ✅ Cloudflare Pages auto-deploy — works as soon as `CLOUDFLARE_API_TOKEN` is added.
- ✅ iOS pipeline is fully wired — runs as soon as the Apple secrets + signing are added.
- ⚠️ The current app logic is an **on-device, rule-based stand-in** (`app/src/engine.ts`),
  not a trained model. It's a working, clean-room shell — swap in real inference per
  [`reimplementation/PLAN.md`](reimplementation/PLAN.md).

## Clean-room note
This app is **FlirtPilot** (our own product). It contains no REF code, prompts, text, or
assets — consistent with the guardrails in [`README.md`](README.md) and the plan in
`reimplementation/PLAN.md`.
