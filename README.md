# REF: Dating Coach — Reverse-Engineering & Competitive-Analysis Repo

Clean-room reverse-engineering and competitive analysis of **REF: Dating Coach**
(iOS, App Store `id6803683151`), for the purpose of informing our own product
**FlirtPilot**. Interoperability / research / education scope.

## ⚠️ Guardrails (read first)
- **Clean-room.** This repo documents *observed behavior* and *inferred architecture*.
  It does **not** contain, redistribute, or republish REF's copyrighted binary, assets,
  or source code.
- **Evidence tags** are used throughout:
  - `OBSERVED` — directly seen in a fetched page, the production JS bundle, or an API response.
  - `INFERRED` — a reasoned hypothesis from observed evidence.
  - `UNKNOWN` — not yet determined; the doc states how to obtain it.
- No secrets are exfiltrated. Runtime-injected keys are noted as existing, not dumped.

## What REF is (OBSERVED)
An AI dating coach + **iOS keyboard extension**. Three headline jobs: improve your
texts, improve your dating profile, build confidence. The keyboard lets you get
coaching from a **screenshot of a conversation**, or tap for an **icebreaker**, inside
any messaging/dating app.

- Developer: STOCKTON CHANDLER MCCLELLAN · Site: https://refdating.com
- Bundle: `app.lovable.p5273e8dc9c364c499a079ade87f87a3c` → **built with Lovable** (Lovable Cloud backend)
- v1.0.10 · iOS 15+ · 32.3 MB · 17+ · Free w/ subscription (weekly/monthly/yearly, 3-day trial)
- Source of facts: Apple lookup API + production web bundle (`refdating.com/assets/main-Cs-i7fYn.js`)

## Status dashboard
| Track | Status | Notes |
|-------|--------|-------|
| App metadata | ✅ Done | `analysis/01-app-overview.md` |
| Web/SPA architecture | ✅ Done | Lovable + Supabase edge functions, fully mapped |
| Backend API surface | ✅ Done (OBSERVED) | 16 edge functions, `analysis/03-network-and-api.md` |
| Keyboard-extension auth | ✅ Done (OBSERVED) | `keyboard-token` issue/revoke device-scoped tokens |
| iOS binary (Mach-O) RE | ⬜ Methodology only | IPA not available in this env — `analysis/04-binary-re-methodology.md` |
| Reimplementation plan | ✅ Done | `reimplementation/PLAN.md` |

## Layout
```
BRIEF.md                         task brief + guardrails
README.md                        this file
analysis/01-app-overview.md      verified metadata, features, screenshots
analysis/02-architecture-inference.md   stack, data flow, components
analysis/03-network-and-api.md   edge-function API surface (OBSERVED)
analysis/04-binary-re-methodology.md    runnable Ghidra/Frida/retdec procedure for the IPA
reimplementation/PLAN.md         clean-room feature-parity plan vs FlirtPilot
tooling/recon.sh                 the web-recon script used (reproducible)
recon/                           captured artifacts (bundle, html, lookup.json)
```

## Tools used (installed in this project, `E:\reverse-engineering\`)
- **Web/repo analysis (used now):** `curl` + `grep` recon (`tooling/recon.sh`); `gitingest` to produce an LLM-ready digest of this repo.
- **Binary RE (methodology, pending IPA):** `ghidra`, `cutter`, `retdec`, `frida`.
- `jadx` — **N/A** (Android decompiler; REF is iOS-only as of this analysis).
