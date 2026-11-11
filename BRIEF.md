# Task Brief — Reverse-Engineering Repo for "REF: Dating Coach"

## Verified target facts (from Apple lookup API, 2026-11-11)
- **App name:** REF: Dating Coach
- **App Store ID:** 6803683151 — https://apps.apple.com/us/app/ref-dating-coach/id6803683151
- **Seller:** STOCKTON CHANDLER MCCLELLAN
- **Bundle ID:** `app.lovable.p5273e8dc9c364c499a079ade87f87a3c`  ← built with **Lovable** (lovable.dev AI web-app builder)
- **Genre:** Lifestyle · **Price:** Free
- **Description (verified excerpt):** "REF is an AI dating coach that helps you improve your conversations, your dating profile and your confidence." Ships a **REF Keyboard** extension: switch to it in any messaging/dating app, tap **Coaching** to get suggestions from a screenshot of the conversation, or tap **Icebreakers** for an opener. "Typing works without Full Access."

## Why this matters to us
Direct competitor to our own **FlirtPilot** (Android dating-conversation keyboard + offline copilot). This repo is for **competitive analysis + clean-room reverse engineering + a reimplementation scaffold** we can learn from.

## Guardrails (MANDATORY)
- **Clean-room.** Document behavior and infer architecture. Do NOT redistribute their copyrighted binary, assets, or source if obtained.
- **No fabrication.** Every claim must trace to a real observation (a fetched page, an API response, a tool output). Mark anything inferred as "INFERRED", anything unknown as "UNKNOWN — how to obtain". Follow Hermes prompting discipline (diff-first, no fake data, PAS).
- This is legitimate interoperability / research / education work on a public app.

## Goal
Create a well-structured reverse-engineering repository in THIS folder (`ref-dating-coach`) using **every relevant tool installed in this project** (sibling folders under `E:\reverse-engineering\`):
- **Repo/code tooling:** `gitingest` (repo→LLM text), `repoagent`, `repoforge`, `jidra` — for ingesting/analyzing any source or web bundle.
- **Binary RE (iOS):** `ghidra`, `cutter`, `retdec`, `frida` — for the Mach-O binary ONCE an IPA is obtained. `jadx` is Android-only (note as N/A unless an Android build appears).

## Known constraint
The IPA binary is NOT available in this environment (no Apple device/account). So:
- Do the **web/JS-level analysis now** (Lovable apps are web apps in a native shell — the substance is reachable over HTTP). Try to locate the backing Lovable deployment / API endpoints from the App Store page, privacy labels, and the Lovable project hash.
- For the binary tracks, write a **runnable methodology**: exact commands to pull the IPA on a real device, decrypt, and run through Ghidra/Frida/retdec. Do not fake binary findings.

## Expected deliverables (create these files)
1. `README.md` — what the repo is, scope, guardrails, status dashboard.
2. `analysis/01-app-overview.md` — verified metadata, screenshots list, feature inventory, privacy labels.
3. `analysis/02-architecture-inference.md` — Lovable/web-shell hypothesis, keyboard-extension design, data flow (screenshot→OCR/vision→LLM→suggestion).
4. `analysis/03-network-and-api.md` — discovered/likely endpoints, auth model, how the keyboard talks to the backend; how to capture traffic (mitmproxy/Frida) — marked INFERRED vs OBSERVED.
5. `analysis/04-binary-re-methodology.md` — step-by-step Ghidra/Frida/retdec procedure for the IPA, with exact commands, referencing the installed tool paths.
6. `reimplementation/PLAN.md` — clean-room feature-parity plan mapped to FlirtPilot, gaps, and what we can ship better.
7. `tooling/` — any helper scripts you write (e.g. a gitingest wrapper, a recon script). Stdlib / already-installed deps only.

Keep it real, cite sources inline, and commit your work.
