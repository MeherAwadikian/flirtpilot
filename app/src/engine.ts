// On-device heuristic "copilot" engine.
//
// This is a deliberately offline, no-network stand-in that demonstrates the app's
// shape and UX. It contains NO third-party prompts, text, or model weights — it is a
// clean-room, rule-based generator. Swap these functions for real on-device / server
// inference later (see reimplementation/PLAN.md for the intended backend surface).

export type Tone = 'playful' | 'warm' | 'direct' | 'witty';

const OPENERS: Record<Tone, string[]> = {
  playful: [
    'Okay, important question before we go any further: pineapple on pizza — yes or crime?',
    'I have a strict two-question limit on first messages. Burning one on: what made you smile today?',
    'Your profile passed vibe-check. Risky follow-up: what are you weirdly competitive about?',
  ],
  warm: [
    'Hi! Your profile has a really easy, genuine energy — what have you been enjoying lately?',
    'Hey — you seem like good company. What does a good weekend look like for you?',
    'Something about your photos reads very "down to earth." What are you into these days?',
  ],
  direct: [
    "Hey, I'll be straightforward: you caught my eye. What are you looking for on here?",
    'Not big on small talk — what actually gets you excited right now?',
    "I'd like to take you for a coffee. But first: tea or coffee person?",
  ],
  witty: [
    'I was going to open with a clever line, but honestly your profile already set the bar too high.',
    "Statistically one of us has to send the first message. I drew the short straw — lucky you.",
    "On a scale of 'texts back in 3 seconds' to 'ghost', how are we feeling about this conversation?",
  ],
};

const REPLY_MOVES: Record<Tone, (ctx: string) => string> = {
  playful: (c) => `Light + teasing: "${firstHook(c)}? Bold claim. You're going to have to back that up over coffee."`,
  warm: (c) => `Warm + curious: "I love that — ${firstHook(c)}. Tell me more, what's the story there?"`,
  direct: () => `Direct + forward: "Honestly I'm enjoying this. Free this week? I'd like to keep it going in person."`,
  witty: (c) => `Witty callback: "Noted: ${firstHook(c)}. I'm choosing to be impressed rather than intimidated."`,
};

function firstHook(text: string): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'that';
  // Grab a short noun-ish fragment to echo back — keeps replies grounded in their message.
  const words = cleaned.split(' ').slice(0, 6).join(' ');
  return words.length > 48 ? words.slice(0, 45) + '…' : words;
}

export function generateIcebreakers(tone: Tone, count = 3): string[] {
  const pool = OPENERS[tone];
  return pool.slice(0, Math.min(count, pool.length));
}

export function coachReplies(conversation: string, tones: Tone[] = ['playful', 'warm', 'direct']): string[] {
  const ctx = conversation.trim();
  if (!ctx) return [];
  return tones.map((t) => REPLY_MOVES[t](ctx));
}

export interface ProfileReview {
  score: number; // 0-100
  strengths: string[];
  fixes: string[];
}

export function reviewProfile(bio: string): ProfileReview {
  const text = bio.trim();
  const words = text ? text.split(/\s+/).length : 0;
  const strengths: string[] = [];
  const fixes: string[] = [];

  if (words >= 25) strengths.push('Good length — enough to give someone a hook to reply to.');
  else fixes.push('Too short. Aim for 25–60 words; give at least two concrete hooks.');

  if (/[?]/.test(text)) strengths.push('Ends with an invitation to respond — nice.');
  else fixes.push('Add one light question or call-to-action so matches know how to open.');

  const genericWords = ['fun', 'easygoing', 'love to laugh', 'adventure', 'good vibes'];
  const hits = genericWords.filter((g) => text.toLowerCase().includes(g));
  if (hits.length) fixes.push(`Swap clichés (${hits.join(', ')}) for one specific, true detail.`);
  else if (words > 0) strengths.push('Avoids the usual clichés — feels specific.');

  if (/\b(I|my|me)\b/i.test(text)) strengths.push('Written in first person — reads as genuine.');

  // Simple transparent score: length + specificity + CTA.
  let score = 40;
  score += Math.min(words, 60) / 2; // up to +30
  if (/[?]/.test(text)) score += 15;
  score -= hits.length * 8;
  score = Math.max(5, Math.min(99, Math.round(score)));

  return { score, strengths, fixes };
}

const PRACTICE_REPLIES = [
  "Haha okay that's actually a good answer. So what's your go-to way to spend a day off?",
  "Mm, I'll allow it. Tell me something most people don't guess about you.",
  "You're more fun than your profile let on. Are you a planner or a wing-it person?",
  "Careful, I might start enjoying this. What's the last thing that genuinely made you laugh?",
  "Bold. I respect it. Coffee or a walk — what's your ideal low-key first meet?",
];

export function practiceReply(turn: number): string {
  return PRACTICE_REPLIES[turn % PRACTICE_REPLIES.length];
}
