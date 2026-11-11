# 03 — Network & Backend API Surface

## Hosts (OBSERVED)
| Host | Role |
|------|------|
| `refdating.com` | Production web app (React SPA) + custom domain; Cloudflare in front (OBSERVED: `Server: cloudflare`, `__cf_bm`). |
| `refdating.lovable.app` | Lovable default domain → **302 → refdating.com** (canonical). |
| `oauth.lovable.app` | Lovable Cloud OAuth / auth. |
| `*.supabase.co` (project) | Supabase REST/Auth/Functions — URL **runtime-injected** by Lovable Cloud; not literal in bundle (UNKNOWN exact subdomain; see "How to recover"). |
| `checkout.stripe.com` | Stripe web checkout. |
| `api.revenuecat.com` (SDK) | RevenueCat entitlements (INFERRED from SDK presence). |

## Edge-function API surface (OBSERVED — `supabase.functions.invoke(...)`)
All are called as `POST <supabase>/functions/v1/<name>` with a JSON `body` and an
`Authorization`/apikey header set from the current session (or the keyboard token).

### AI / content
| Function | Purpose (INFERRED from name + call site) |
|----------|------------------------------------------|
| `coaching-ai` | Screenshot/conversation → suggested replies. Returns `{allowed, consentRequired, error}` gating. |
| `profile-review-ai` | Dating-profile (photos/text) critique. |
| `practice-ai` | Simulated chat partner for practice mode. |
| `generate-practice-prompt` | Creates a practice scenario/persona. |
| `pattern-interrupt-ai` | Re-engagement / "pattern interrupt" message generation. |
| `line-of-the-day` | Daily icebreaker/opener (retention hook). |

### Keyboard
| Function | Purpose |
|----------|---------|
| `keyboard-token` | `action:"issue"` → device-scoped token for the keyboard extension; `action:"revoke"`. `replaces_hash` ⇒ rotation. (OBSERVED call shape.) |

### Billing / lifecycle
| Function | Purpose |
|----------|---------|
| `check-subscription` | Verify entitlement/tier. |
| `create-checkout` | Start Stripe checkout session. |
| `customer-portal` | Stripe billing portal link. |
| `winback-checkout` | Discounted win-back purchase. |
| `retention-offer` | Server-decided retention/discount offer. |
| `start-elite-now` | Upsell to the "elite" tier. |

### Account
| Function | Purpose |
|----------|---------|
| `delete-account` | GDPR/account deletion. |
| `send-password-reset` | Password reset email. |
| `email-unsubscribe` | Marketing-email opt-out. |

## Observed request-body vocabulary
Across AI calls: `message`, `tone`, `context`, `platform`, `userId`, `token`.
(OBSERVED token counts in bundle; exact per-function schema is UNKNOWN without live calls.)

## Server-side gating (OBSERVED)
`coaching-ai` responses branch on `consentRequired`, `allowed`, and `error`. ⇒ consent +
quota/entitlement are enforced server-side, not trusted from the client. Good design to copy.

## How to recover the exact Supabase URL + schema (methodology, not yet done)
The project URL/anon key are injected at runtime, so capture them live rather than from the
static bundle. Pick ONE:

1. **DevTools / HAR (lowest effort, no device):** load `https://refdating.com` in a desktop
   browser, open Network, sign up, and watch requests to `*.supabase.co/functions/v1/*` and
   `/auth/v1/*`. The `apikey` header = anon key; the host = project URL. (The anon key is a
   *publishable* key; still, do not post it publicly.)
2. **mitmproxy on device (full fidelity, needs device):**
   ```bash
   mitmproxy --mode regular --listen-port 8080     # trust mitm cert on the iPhone
   # drive the app + keyboard; observe functions/v1/coaching-ai, keyboard-token, etc.
   ```
3. **Frida (dynamic, needs jailbroken/dev device):** hook `NSURLSession`/`fetch` to log URLs
   and bodies — see `04-binary-re-methodology.md`.

> Keep captured keys/tokens OUT of git. This repo intentionally does not store them.
