# 02 — Architecture

## Stack (OBSERVED unless tagged)
- **Frontend:** React + React Router + Vite SPA. (OBSERVED: `window.__reactRouterContext`,
  `__reactRouterDataRouter`, `reactrouter.com` link, Vite-hashed bundle `main-Cs-i7fYn.js`.)
- **Builder/host:** **Lovable** / **Lovable Cloud**. (OBSERVED: `<meta name="twitter:site" content="@Lovable">`,
  `https://lovable.dev`, `window.__lovable_cloud_auth_js_version`, `oauth.lovable.app`,
  Lovable telemetry `/__l5e/events...js`, bundle id prefix `app.lovable.`.)
- **Backend:** **Supabase** edge functions, invoked via `supabase-js`
  `supabase.functions.invoke("<name>", { body, headers })`. (OBSERVED: 16 distinct invoke calls.)
- **Auth:** Lovable Cloud managed auth (a managed Supabase Auth). The Supabase project URL
  and anon key are **injected at runtime** by the Lovable Cloud auth script — which is why
  no `*.supabase.co` URL or anon key is a literal string in the bundle. (INFERRED from the
  single `Supabase` token + `window.__lovable_cloud_auth_js_version` + absence of a baked URL.)
- **Payments:** RevenueCat (entitlements) + Stripe (web checkout). (OBSERVED.)
- **iOS shell:** native wrapper around the web app + a **keyboard extension** target.
  (INFERRED: `app.lovable.*` bundle, 32 MB size, web stack; wrapper is likely Capacitor or a
  WKWebView shell. Confirm via binary RE — `04`.)

## Component map
```
┌─────────────────────────── iOS app (32 MB) ───────────────────────────┐
│  Main app (WKWebView/Capacitor shell over the React SPA = refdating.com)│
│    • RevenueCat SDK (entitlements)                                      │
│    • Lovable Cloud auth (session)                                       │
│  Keyboard extension (app extension target)                             │
│    • Basic typing: offline, no Full Access                             │
│    • Coaching/Icebreakers: needs Full Access (network) + keyboard-token │
└───────────────┬────────────────────────────────────────────────────────┘
                │ supabase.functions.invoke(name, {body, headers:auth})
                ▼
      ┌───────── Supabase Edge Functions (Lovable Cloud) ─────────┐
      │ AI:      coaching-ai · profile-review-ai · practice-ai     │
      │          generate-practice-prompt · pattern-interrupt-ai   │
      │          line-of-the-day                                    │
      │ Keyboard:keyboard-token (issue/revoke, device-scoped)       │
      │ Billing: check-subscription · create-checkout ·            │
      │          customer-portal · winback-checkout ·              │
      │          retention-offer · start-elite-now                 │
      │ Account: delete-account · send-password-reset ·            │
      │          email-unsubscribe                                 │
      └───────────────┬───────────────────────────────────────────┘
                      ▼
         LLM provider (server-side; provider NOT exposed client-side)
         + Supabase Postgres (usage/quota/consent, subscriptions)
```

## Core data flow — screenshot coaching (OBSERVED shape)
1. User screenshots a chat; in the app or keyboard, taps **Coaching**.
2. Client calls `coaching-ai` with `{ body, headers: <auth> }`. Observed body keys across
   AI calls include `message`, `tone`, `context`, `platform`, `userId`, `token`.
   (INFERRED: the screenshot image is uploaded/OCR'd or vision-analyzed server-side; the
   client-side provider is hidden, so vision+LLM happens in the edge function.)
3. `coaching-ai` returns `{ allowed, consentRequired, error, ... }` — i.e. the server enforces
   **consent gating** and **quota/entitlement gating** before returning suggestions. (OBSERVED:
   `H.consentRequired`, `H.allowed===false`, `H.error` branches around the invoke.)

## Keyboard-extension auth — the interesting bit (OBSERVED)
The keyboard extension can't carry the full app session, so REF issues it a scoped token:
```js
// issue
functions.invoke("keyboard-token", { body: { action:"issue",
    ...(deviceId && {device_id}), ...(deviceId && replacesHash && {replaces_hash}) },
    headers: <session auth> })
// revoke
functions.invoke("keyboard-token", { body: { action:"revoke", ...(deviceId && {device_id}) }, headers })
```
INFERRED: the main app (which holds the Lovable Cloud session) mints a **device-scoped,
revocable token** that the keyboard extension stores in a shared App Group and sends on
its own `coaching-ai`/icebreaker calls. `replaces_hash` implies token rotation. This is a
clean pattern for giving a sandboxed app extension least-privilege API access — directly
relevant to FlirtPilot's IME→backend trust boundary.
