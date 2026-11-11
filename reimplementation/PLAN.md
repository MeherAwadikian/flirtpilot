# Reimplementation / Competitive Plan — REF ➜ FlirtPilot

Clean-room. We copy *ideas and architecture patterns*, never their code or assets.
Cross-reference: FlirtPilot is our Android dating-conversation keyboard + offline copilot
(Hermes profile `dating2`, repo `C:\Users\h\flirtpilot`).

## 1. Feature parity map
| REF feature (OBSERVED) | REF backend fn | FlirtPilot status | Action |
|------------------------|----------------|-------------------|--------|
| Screenshot → reply coaching | `coaching-ai` | core engine done (offline) | Add screenshot/OCR path; we can do it **on-device** (differentiator). |
| One-tap icebreakers | `line-of-the-day` | partial | Add opener generator + "line of the day" retention hook. |
| Profile review (photos/text) | `profile-review-ai` | missing | New feature; vision model. |
| Practice mode (sim partner) | `practice-ai` + `generate-practice-prompt` | missing | High-value, low-risk to build. |
| Keyboard inside any app | iOS appex + `keyboard-token` | our IME is the core | Mirror the **device-scoped revocable token** pattern for our IME→backend boundary. |
| Re-engagement nudges | `pattern-interrupt-ai` | n/a | Optional; align with our ethics line (no dark patterns). |

## 2. Architecture lessons worth copying (OBSERVED)
1. **Least-privilege extension token.** `keyboard-token` (issue/revoke, `replaces_hash`
   rotation) lets a sandboxed keyboard call the API without the full session. Adopt the same
   trust boundary: the main app mints a rotating, revocable, device-scoped token into a shared
   store; the IME uses only that. Prevents a compromised keyboard from owning the account.
2. **Server-side consent + quota gating.** `coaching-ai` returns `{consentRequired, allowed}`
   — never trust the client for entitlement or consent. Enforce in our backend too.
3. **Thin client, server-held LLM provider.** REF leaks no LLM provider client-side; all model
   calls are edge functions. Keeps keys safe and lets them swap models. (We already lean
   offline — for any cloud calls, do the same.)
4. **Retention stack as first-class backend.** `line-of-the-day`, `retention-offer`,
   `winback-checkout`, `pattern-interrupt-ai`, `email-unsubscribe`. If we monetize, these are
   the table-stakes server endpoints.

## 3. Where we can be *better*
- **Offline / on-device inference.** REF is a thin web shell; every coaching call is a network
  round-trip with consent/quota gating and a server LLM. FlirtPilot's offline copilot = privacy
  (conversation screenshots never leave the phone) + zero latency + works without Full Access /
  signal. This is our sharpest wedge — lead marketing with it.
- **Full Access honesty.** REF needs Full Access for its network features. We can keep the
  core coaching usable *without* Full Access by running on-device. Strong trust story.
- **No 17+ profanity gate / cleaner positioning** if we choose.

## 4. Suggested backend shape (if/when we add a cloud tier)
Mirror the surface, our own infra (Supabase or our stack):
```
functions/ coaching · icebreaker · profile-review · practice · practice-prompt
           keyboard-token(issue|revoke) · check-subscription · create-checkout
           customer-portal · delete-account
```
Gate every AI function on consent + entitlement server-side. Device-scoped keyboard token
with rotation. RevenueCat (or Play Billing on Android) for entitlements.

## 5. Open questions (need binary RE — `analysis/04`)
- Exact `coaching-ai` request schema (image field name, OCR vs vision?).
- App Group id + how the keyboard token is stored/rotated on-device.
- Which LLM/vision provider REF uses server-side (only knowable via live traffic, maybe not at all).

## 6. Legal/ethical note
Competitive analysis and clean-room reimplementation of *functionality* is legitimate. Do not
copy REF's text, images, prompts, or code. Keep our consent/privacy posture at least as strong
as theirs (their server-side consent gating is a good baseline).
