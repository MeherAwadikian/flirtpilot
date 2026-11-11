# 01 — App Overview (OBSERVED)

All facts below are from Apple's public lookup API
(`https://itunes.apple.com/lookup?id=6803683151`, fetched 2026-11-11) and the
public marketing/app site, unless tagged otherwise.

## Identity
| Field | Value |
|-------|-------|
| Name | REF: Dating Coach |
| App Store ID | 6803683151 |
| Developer | STOCKTON CHANDLER MCCLELLAN (`id6803683153`) |
| Website (sellerUrl) | https://refdating.com |
| Bundle ID | `app.lovable.p5273e8dc9c364c499a079ade87f87a3c` |
| Builder | Lovable (lovable.dev) — see `02-architecture-inference.md` |
| Version | 1.0.10 |
| First released | 2026-09-30 |
| Last updated | 2026-11-09 |
| Min iOS | 15.0 |
| Size | 32.3 MB (33,22,560 bytes) |
| Price | Free (subscription inside) |
| Age rating | 17+ — "Frequent/Intense Profanity or Crude Humor", "Frequent/Intense Mature/Suggestive Themes" |
| Rating | 5.0 avg (10 ratings — small/new) |
| Languages | English only |

## Feature inventory (OBSERVED: screenshots + bundle strings)
Screenshot filenames (App Store) name the five pillars directly:
1. **Coaching** (`REF-1-coaching`) — paste/screenshot a conversation, get suggested replies.
2. **Keyboard** (`REF-2-keyboard`) — system keyboard extension to use REF inside any app.
3. **Icebreakers** (`REF-3-icebreakers`) — one-tap openers.
4. **Practice** (`REF-4-practice`) — practice chat / simulated conversation partner.
5. **Profile review** (`REF-5-profile-review`) — feedback on dating-profile photos/text.

Bundle keyword frequency (`recon/main.js`) corroborates:
`coaching` ×60, `screenshot` ×44, `icebreaker` ×31, `subscription` ×156,
`profile-review` ×6, `analyze` ×4, `prompt` ×16, `paywall` ×9,
`revenuecat` ×14, `stripe` ×18.

## Keyboard extension (OBSERVED)
App description: "Switch to the REF Keyboard in any messaging or dating app, tap
**Coaching** to get suggestions from a screenshot of your conversation, or tap
**Icebreakers** for an opener, then send it without leaving the chat. **Typing works
without Full Access.**" → Full Access is only required for the network-backed
coaching/icebreaker calls, not for basic typing. (See `keyboard-token` auth in `03`.)

## Monetization (OBSERVED)
- **RevenueCat** SDK (`errors.rev.cat/configuring-sdk`) for in-app subscription entitlements.
- **Stripe** web checkout (`checkout.stripe.com`) for web-originated purchases / win-back.
- Tiers: weekly / monthly / yearly, each with a **3-day free trial** (release notes v1.0.10).
- An **"elite"** tier exists (`start-elite-now`, `CA(...)` returns `"elite"`; bundle).
- Retention machinery: `retention-offer`, `winback-checkout`, `pattern-interrupt-ai`,
  `line-of-the-day` (daily hook), `email-unsubscribe`.

## Privacy labels
UNKNOWN (exact App Store privacy "nutrition" labels not captured via the lookup API).
How to obtain: open the App Store product page "App Privacy" section, or parse
`https://apps.apple.com/us/app/ref-dating-coach/id6803683151` privacy JSON. Given the
screenshot-coaching feature, expect collection of user-submitted images/conversations.
