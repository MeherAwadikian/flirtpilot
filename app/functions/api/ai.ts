// Cloudflare Pages Function — real AI backend for FlirtPilot.
// POST /api/ai  { mode, ...payload }  ->  JSON result.
// The OpenRouter key lives ONLY here (server-side), never in the client bundle.
//
// Required Pages env var / secret:
//   OPENROUTER_API_KEY   — your OpenRouter key
// Optional:
//   OPENROUTER_MODEL     — defaults to a free model (see below). Override with any
//                          OpenRouter model id (a paid model needs credits on the key).

interface Env {
  OPENROUTER_API_KEY?: string;
  OPENROUTER_MODEL?: string;
}

type Tone = 'playful' | 'warm' | 'direct' | 'witty';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });

export const onRequestOptions = () => new Response(null, { headers: CORS });

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx;
  if (!env.OPENROUTER_API_KEY) {
    return json({ error: 'AI not configured: set OPENROUTER_API_KEY in the Pages project.' }, 503);
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const mode = String(body?.mode || '');
  // Default is a free OpenRouter model so the app works with zero credits.
  // It's a reasoning model (spends hidden tokens), hence the higher max_tokens below.
  const model = env.OPENROUTER_MODEL || 'nvidia/nemotron-3.5-super-vl:free';

  const spec = buildPrompt(mode, body);
  if (!spec) return json({ error: `Unknown mode: ${mode}` }, 400);

  let content: string;
  try {
    content = await callOpenRouter(env.OPENROUTER_API_KEY, model, spec.system, spec.user);
  } catch (e: any) {
    return json({ error: 'Upstream AI call failed', detail: String(e?.message || e) }, 502);
  }

  // Modes that expect structured JSON back.
  if (mode === 'profile') {
    const parsed = safeJson(content);
    if (parsed && typeof parsed.score === 'number') return json(parsed);
    return json({ error: 'Could not parse model output', raw: content }, 502);
  }
  if (mode === 'coach' || mode === 'openers') {
    const parsed = safeJson(content);
    const list = parsed?.items ?? parsed?.replies ?? parsed?.lines;
    if (Array.isArray(list)) return json({ items: list.map(String) });
    // Fallback: split lines if the model didn't return JSON.
    return json({ items: splitLines(content) });
  }
  // practice -> single reply string
  return json({ reply: stripQuotes(content.trim()) });
};

function buildPrompt(mode: string, body: any): { system: string; user: string } | null {
  const guard =
    'You are FlirtPilot, a sharp, kind dating-conversation coach. Keep suggestions respectful, ' +
    'consent-aware, never manipulative, never sexual unless clearly invited, never cheesy. Be specific and human.';

  if (mode === 'coach') {
    const convo = String(body?.conversation || '').slice(0, 2000);
    const tones: Tone[] = Array.isArray(body?.tones) && body.tones.length ? body.tones : ['playful', 'warm', 'direct'];
    return {
      system: `${guard} Read the actual conversation and write replies that genuinely respond to it.`,
      user:
        `Conversation / what they said:\n"""${convo}"""\n\n` +
        `Write exactly ${tones.length} reply options, one in each of these tones: ${tones.join(', ')}. ` +
        `Each reply should be something I could send as-is (1-2 sentences), grounded in what they actually said. ` +
        `Return ONLY JSON: {"items": ["<tone>: <reply>", ...]}`,
    };
  }
  if (mode === 'openers') {
    const tone = String(body?.tone || 'playful');
    const about = String(body?.about || '').slice(0, 600);
    return {
      system: `${guard} Write opening messages that invite a reply.`,
      user:
        `Tone: ${tone}.` +
        (about ? ` Their profile / context: """${about}""".` : '') +
        ` Write 3 distinct opener messages I could send first. Each 1-2 sentences, specific, not generic. ` +
        `Return ONLY JSON: {"items": ["...","...","..."]}`,
    };
  }
  if (mode === 'profile') {
    const bio = String(body?.bio || '').slice(0, 2000);
    return {
      system: `${guard} You critique dating-app bios honestly and concretely.`,
      user:
        `Here is my dating-app bio:\n"""${bio}"""\n\n` +
        `Score it 0-100 for how well it would attract genuine, specific replies. ` +
        `List what works and what to fix, each as short concrete bullets. ` +
        `Return ONLY JSON: {"score": <int>, "strengths": ["..."], "fixes": ["..."]}`,
    };
  }
  if (mode === 'practice') {
    const history = Array.isArray(body?.history) ? body.history.slice(-12) : [];
    const transcript = history
      .map((m: any) => `${m?.me ? 'Me' : 'Match'}: ${String(m?.text || '')}`)
      .join('\n')
      .slice(0, 2000);
    return {
      system:
        `${guard} You are role-playing as a warm, realistic dating match the user is practicing with. ` +
        `Stay in character as the match. Reply naturally in 1-2 sentences, ask a light follow-up sometimes. ` +
        `Never break character or give meta-advice here.`,
      user: `Conversation so far:\n${transcript}\n\nReply as the match (plain text only, no quotes):`,
    };
  }
  return null;
}

async function callOpenRouter(key: string, model: string, system: string, user: string): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://flirtpilot.pages.dev',
      'X-Title': 'FlirtPilot',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.8,
      max_tokens: 900,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${t.slice(0, 300)}`);
  }
  const data: any = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty completion');
  return String(content);
}

function safeJson(s: string): any {
  try {
    return JSON.parse(s);
  } catch {
    const m = s.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function splitLines(s: string): string[] {
  return s
    .split('\n')
    .map((l) => l.replace(/^\s*[-*\d.)\]]+\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 5);
}

function stripQuotes(s: string): string {
  return s.replace(/^["'“”]+|["'“”]+$/g, '');
}
