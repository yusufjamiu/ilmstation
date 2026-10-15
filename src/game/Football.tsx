import { useEffect, useMemo, useRef, useState } from "react";
import type { Kick, Match, Online } from "./online";
import { FOOTBALL } from "./content";

/* A football match on the pitch: players take turns to shoot and to keep goal.
   Each half has 3 shots each; a draw goes to penalties (3 each, then sudden death).
   Play the computer, or a real player you invited. */

const HALF = 6; // rounds per half (3 shots each)
const NORMAL = HALF * 2;

type Side = "a" | "b";
type Picks = Record<number, Partial<Record<Side, Kick>>>;

/** The score and what happens next, from the picks so far. */
function tally(picks: Picks) {
  const goals = { a: 0, b: 0 },
    pens = { a: 0, b: 0 };
  let r = 0;
  const log: { r: number; shooter: Side; goal: boolean; aim: Kick; dive: Kick }[] = [];
  for (; ; r++) {
    const p = picks[r];
    if (!p?.a || !p?.b) break;
    const shooter: Side = r % 2 === 0 ? "a" : "b";
    const keeper: Side = shooter === "a" ? "b" : "a";
    const goal = p[shooter] !== p[keeper];
    if (goal) (r < NORMAL ? goals : pens)[shooter]++;
    log.push({ r, shooter, goal, aim: p[shooter]!, dive: p[keeper]! });
    if (r === NORMAL - 1 && goals.a !== goals.b) {
      r++;
      return { goals, pens, next: r, done: true, log };
    }
    const n = r + 1 - NORMAL;
    if (n >= 6 && n % 2 === 0 && pens.a !== pens.b) {
      r++;
      return { goals, pens, next: r, done: true, log };
    }
  }
  return { goals, pens, next: r, done: false, log };
}
const winner = (t: ReturnType<typeof tally>): Side =>
  t.goals.a !== t.goals.b ? (t.goals.a > t.goals.b ? "a" : "b") : t.pens.a > t.pens.b ? "a" : "b";

const AIM: { k: Kick; label: string }[] = [
  { k: "L", label: "⬅️ Left" },
  { k: "C", label: "⬆️ Middle" },
  { k: "R", label: "➡️ Right" },
];
const randomKick = (): Kick => (["L", "C", "R"] as Kick[])[Math.floor(Math.random() * 3)];

export function FootballMatch({
  myName,
  vs,
  onEnd,
  onClose,
}: {
  myName: string;
  /** the computer, or a real match by id */
  vs: { kind: "cpu" } | { kind: "online"; online: Online; id: string };
  onEnd: (myGoals: number, won: boolean) => void;
  onClose: () => void;
}) {
  const [started, setStarted] = useState(false);
  const [cpuPicks, setCpuPicks] = useState<Picks>({});
  const [match, setMatch] = useState<Match | null>(null);
  const [seen, setSeen] = useState(-1);
  const [halfTime, setHalfTime] = useState(false);
  const ended = useRef(false);

  useEffect(() => {
    if (vs.kind !== "online") return;
    return vs.online.watchMatch(vs.id, setMatch);
  }, [vs]);

  const me: Side = vs.kind === "online" && match ? (match.a === vs.online.uid ? "a" : "b") : "a";
  const names: Record<Side, string> =
    vs.kind === "online" && match
      ? { a: match.names[match.a] ?? "Player", b: match.names[match.b] ?? "Player" }
      : { a: myName, b: "IlmWorld FC (computer)" };
  const picks: Picks = useMemo(() => {
    if (vs.kind === "cpu" || !match) return cpuPicks;
    const out: Picks = {};
    for (const [k, v] of Object.entries(match.picks ?? {})) {
      const r = Number(k.slice(1));
      out[r] = { a: v[match.a], b: v[match.b] };
    }
    return out;
  }, [vs.kind, match, cpuPicks]);
  const t = tally(picks);
  const last = t.log[t.log.length - 1];
  const showing = last && last.r > seen;

  // the result of each shot shows for a moment
  useEffect(() => {
    if (!showing) return;
    const id = setTimeout(() => {
      setSeen(last.r);
      if (last.r === HALF - 1) setHalfTime(true);
    }, 1700);
    return () => clearTimeout(id);
  }, [showing, last]);

  // the end of the match
  useEffect(() => {
    if (!t.done || showing || ended.current) return;
    ended.current = true;
    onEnd(t.goals[me] + t.pens[me], winner(t) === me);
    if (vs.kind === "online") void vs.online.setMatch(vs.id, { status: "done" }).catch(() => {});
  }, [t, showing, me, vs, onEnd]);

  const pick = (k: Kick) => {
    const r = t.next;
    if (vs.kind === "cpu") {
      setCpuPicks((p) => ({ ...p, [r]: { ...p[r], a: k } }));
      setTimeout(() => setCpuPicks((p) => ({ ...p, [r]: { ...p[r], b: randomKick() } })), 700);
    } else void vs.online.kick(vs.id, r, k).catch(() => {});
  };

  const score = (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl bg-[#10201e] p-3 text-center text-[#fdf8ec]">
      <div className="truncate text-[13px] font-semibold">{names.a}</div>
      <div className="font-serif text-3xl tabular-nums">
        {t.goals.a} – {t.goals.b}
      </div>
      <div className="truncate text-[13px] font-semibold">{names.b}</div>
      {t.next > NORMAL && (
        <div className="col-span-3 text-[12px] opacity-80">
          Penalties {t.pens.a} – {t.pens.b}
        </div>
      )}
    </div>
  );

  if (vs.kind === "online" && match?.status === "declined")
    return (
      <div className="space-y-3 text-center">
        <p>{names.b} can't play right now.</p>
        <button
          onClick={onClose}
          className="w-full rounded-xl bg-[#1f6f63] py-3 font-bold text-[#fdf8ec]"
        >
          OK
        </button>
      </div>
    );
  if (vs.kind === "online" && match?.status === "invited")
    return (
      <div className="space-y-3 text-center">
        <div className="text-5xl">⚽</div>
        <p>Waiting for {match.names[match.b]} to accept your invite…</p>
        <button
          onClick={onClose}
          className="w-full rounded-xl border border-[#1f6f63]/30 bg-white py-3 font-bold"
        >
          Cancel
        </button>
      </div>
    );
  if (!started)
    return (
      <div className="space-y-3 text-center">
        <div className="text-5xl">⚽</div>
        <p className="text-[15px]">
          <b>{names.a}</b> vs <b>{names.b}</b>
        </p>
        <p className="text-[13px] opacity-75">
          Two halves of 3 shots each. When you shoot, pick a corner; when you keep goal, pick where
          to dive. A draw goes to penalties. +{FOOTBALL.perGoal} points a goal, +{FOOTBALL.win} for
          the win.
        </p>
        <button
          onClick={() => setStarted(true)}
          className="w-full rounded-xl bg-[#1f6f63] py-3 text-[16px] font-bold text-[#fdf8ec]"
        >
          Bismillah · kick off
        </button>
      </div>
    );
  if (t.done && !showing) {
    const w = winner(t);
    return (
      <div className="space-y-3 text-center">
        {score}
        <div className="text-4xl">{w === me ? "🏆" : "🤝"}</div>
        <p className="text-[16px] font-bold">
          {w === me ? "You won! Alhamdulillah." : `${names[w]} won. Well played!`}
        </p>
        <p className="text-[13px] opacity-75">
          Shake hands and say JazakAllahu khairan for the game.
        </p>
        <button
          onClick={onClose}
          className="w-full rounded-xl bg-[#1f6f63] py-3 font-bold text-[#fdf8ec]"
        >
          Done
        </button>
      </div>
    );
  }
  if (showing)
    return (
      <div className="space-y-3 text-center">
        {score}
        <div className="py-4">
          <div className="text-5xl">{last.goal ? "⚽🥅" : "🧤"}</div>
          <div className="mt-2 font-serif text-3xl">{last.goal ? "GOAL!" : "Saved!"}</div>
          <div className="text-[13px] opacity-75">
            {names[last.shooter]} shot {AIM.find((x) => x.k === last.aim)?.label.slice(3)}; the
            keeper dived {AIM.find((x) => x.k === last.dive)?.label.slice(3)}.
          </div>
        </div>
      </div>
    );
  if (halfTime)
    return (
      <div className="space-y-3 text-center">
        {score}
        <p className="text-[16px] font-bold">Half time</p>
        <p className="text-[13px] opacity-75">Drink some water and catch your breath.</p>
        <button
          onClick={() => setHalfTime(false)}
          className="w-full rounded-xl bg-[#1f6f63] py-3 font-bold text-[#fdf8ec]"
        >
          Second half
        </button>
      </div>
    );
  const r = t.next;
  const shooter: Side = r % 2 === 0 ? "a" : "b";
  const shooting = shooter === me;
  const mine = picks[r]?.[me];
  const stage = r < HALF ? "First half" : r < NORMAL ? "Second half" : "Penalties";
  return (
    <div className="space-y-3">
      {score}
      <div className="text-center text-[12px] font-semibold uppercase tracking-wide text-[#1f6f63]">
        {stage} · {shooting ? "your shot" : `${names[shooter]} is shooting`}
      </div>
      {mine ? (
        <p className="py-3 text-center text-[14px] opacity-75">
          Waiting for {names[me === "a" ? "b" : "a"]}…
        </p>
      ) : (
        <>
          <p className="text-center text-[15px] font-bold">
            {shooting ? "Where will you shoot?" : "Where will you dive?"}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {AIM.map((x) => (
              <button
                key={x.k}
                onClick={() => pick(x.k)}
                className="rounded-xl bg-[#1f6f63] py-4 text-[14px] font-bold text-[#fdf8ec] active:scale-95"
              >
                {x.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** Ask a player who invited you whether to play. */
export function MatchInvite({
  from,
  onAccept,
  onDecline,
}: {
  from: string;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="space-y-3 text-center">
      <div className="text-5xl">⚽</div>
      <p className="text-[15px]">
        <b>{from}</b> invites you to a football match.
      </p>
      <button
        onClick={onAccept}
        className="w-full rounded-xl bg-[#1f6f63] py-3 font-bold text-[#fdf8ec]"
      >
        Accept · Bismillah
      </button>
      <button
        onClick={onDecline}
        className="w-full rounded-xl border border-[#1f6f63]/30 bg-white py-3 font-bold"
      >
        Not now
      </button>
    </div>
  );
}
