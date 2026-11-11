# App Backend — Date Chat (Supabase)

The clean-room app reimplementation (**Date Chat**) uses its own Supabase project,
wholly separate from REF's backend documented in `analysis/`.

| Field | Value |
|-------|-------|
| Project name | `date-chat` |
| Project ref | `ruoavvhsbejvxpwczhqx` |
| API URL | https://ruoavvhsbejvxpwczhqx.supabase.co |
| Publishable (anon) key | `sb_publishable_qiXeq3zj70t-RwYVw6gKtg_ONrc652G` (public-safe) |
| Org | linkedin (Free plan) |
| Data API | enabled · **Automatic RLS** enabled |

See `.env.example` for how to wire a client. **Secrets** (service_role key, DB
password, OpenRouter key) are never committed — they go in a local, gitignored
`.env`. Row Level Security, not key secrecy, protects user data behind the
publishable key.

> Note: this repo is the reverse-engineering + reimplementation-plan dossier. The
> actual application code lives alongside the plan in `reimplementation/` as it is
> built out.
