import { useState } from 'react';
import {
  type Tone,
  generateIcebreakers,
  coachReplies,
  reviewProfile,
  practiceReply,
} from './engine';

type Tab = 'coach' | 'openers' | 'profile' | 'practice';

const TONES: Tone[] = ['playful', 'warm', 'direct', 'witty'];

export default function App() {
  const [tab, setTab] = useState<Tab>('coach');

  return (
    <div className="app">
      <header className="topbar">
        <span className="logo">💘 FlirtPilot</span>
        <span className="badge">on-device</span>
      </header>

      <main className="screen">
        {tab === 'coach' && <CoachScreen />}
        {tab === 'openers' && <OpenersScreen />}
        {tab === 'profile' && <ProfileScreen />}
        {tab === 'practice' && <PracticeScreen />}
      </main>

      <nav className="tabbar">
        <TabButton id="coach" label="Coach" icon="💬" tab={tab} setTab={setTab} />
        <TabButton id="openers" label="Openers" icon="✨" tab={tab} setTab={setTab} />
        <TabButton id="profile" label="Profile" icon="🧐" tab={tab} setTab={setTab} />
        <TabButton id="practice" label="Practice" icon="🎯" tab={tab} setTab={setTab} />
      </nav>
    </div>
  );
}

function TabButton(props: {
  id: Tab;
  label: string;
  icon: string;
  tab: Tab;
  setTab: (t: Tab) => void;
}) {
  const active = props.tab === props.id;
  return (
    <button
      className={active ? 'tab active' : 'tab'}
      onClick={() => props.setTab(props.id)}
      aria-current={active}
    >
      <span className="tab-icon">{props.icon}</span>
      <span className="tab-label">{props.label}</span>
    </button>
  );
}

function CoachScreen() {
  const [convo, setConvo] = useState('');
  const [out, setOut] = useState<string[]>([]);
  return (
    <section>
      <h1>Reply coaching</h1>
      <p className="sub">
        Paste what they said (or describe the chat). You get three replies in different tones.
        Nothing leaves your device.
      </p>
      <textarea
        value={convo}
        onChange={(e) => setConvo(e.target.value)}
        placeholder="e.g. She said: 'I basically live at the climbing gym on weekends'"
        rows={5}
      />
      <button className="primary" onClick={() => setOut(coachReplies(convo))} disabled={!convo.trim()}>
        Coach me
      </button>
      <div className="results">
        {out.map((r, i) => (
          <div className="card" key={i}>{r}</div>
        ))}
      </div>
    </section>
  );
}

function OpenersScreen() {
  const [tone, setTone] = useState<Tone>('playful');
  const lines = generateIcebreakers(tone);
  return (
    <section>
      <h1>Icebreakers</h1>
      <p className="sub">Pick a tone. Tap a line to copy it.</p>
      <div className="chips">
        {TONES.map((t) => (
          <button
            key={t}
            className={t === tone ? 'chip active' : 'chip'}
            onClick={() => setTone(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="results">
        {lines.map((l, i) => (
          <button className="card tappable" key={i} onClick={() => copy(l)}>
            {l}
          </button>
        ))}
      </div>
    </section>
  );
}

function ProfileScreen() {
  const [bio, setBio] = useState('');
  const [review, setReview] = useState<ReturnType<typeof reviewProfile> | null>(null);
  return (
    <section>
      <h1>Profile review</h1>
      <p className="sub">Paste your bio. Get a transparent score and concrete fixes.</p>
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        placeholder="Paste your dating-app bio here…"
        rows={5}
      />
      <button className="primary" onClick={() => setReview(reviewProfile(bio))} disabled={!bio.trim()}>
        Review it
      </button>
      {review && (
        <div className="results">
          <div className="score">
            <span className="score-num">{review.score}</span>
            <span className="score-cap">/ 100</span>
          </div>
          {review.strengths.length > 0 && (
            <div className="card good">
              <strong>What works</strong>
              <ul>{review.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          )}
          {review.fixes.length > 0 && (
            <div className="card fix">
              <strong>Fix these</strong>
              <ul>{review.fixes.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function PracticeScreen() {
  const [log, setLog] = useState<{ me: boolean; text: string }[]>([
    { me: false, text: "Hey! So your profile says you're into live music — who's the last band you saw?" },
  ]);
  const [draft, setDraft] = useState('');
  function send() {
    if (!draft.trim()) return;
    const turn = log.filter((m) => m.me).length;
    setLog((l) => [...l, { me: true, text: draft.trim() }, { me: false, text: practiceReply(turn) }]);
    setDraft('');
  }
  return (
    <section>
      <h1>Practice mode</h1>
      <p className="sub">A safe, simulated match. Rehearse without the stakes.</p>
      <div className="chat">
        {log.map((m, i) => (
          <div className={m.me ? 'bubble me' : 'bubble them'} key={i}>{m.text}</div>
        ))}
      </div>
      <div className="composer">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Type your reply…"
        />
        <button className="primary" onClick={send} disabled={!draft.trim()}>Send</button>
      </div>
    </section>
  );
}

function copy(text: string) {
  if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
}
