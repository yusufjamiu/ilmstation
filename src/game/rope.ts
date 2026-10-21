/* The skipping rope at a Sisters' Corner: two sisters turn the rope, one jumps.
   When nobody is playing, the sisters play on their own. You can jump in (tap Jump as the
   rope comes round under your feet) or take one end and turn (tap Turn each time the rope
   is at the top). With other real sisters at the same corner, everyone shares one rope and
   the roles go round after each jumper is out. */

import * as THREE from "three";
import { NPC, nextRound, type RopeNet, type RopeRoom, type RopeRound } from "./ropenet";

type V = { x: number; z: number };
type Animate = (g: THREE.Object3D, phase: number, amount: number, speed?: number) => void;
type Kit = (name: string) => THREE.Object3D;

export type RopeMode =
  { kind: "solo"; role: "jump" | "turn" } | { kind: "net"; net: RopeNet; name: string };
export type RopeState = {
  /** what you do: jump, turn (tap in rhythm), or hold the end (others jumping) */
  role: "jump" | "turn" | "hold";
  phase: "count" | "play" | "out";
  count: number;
  /** turning on your own: chances left before the rope tangles */
  lives?: number;
  msg: string;
  together: boolean;
  names: { jumper: string; left: string; right: string };
  /** seconds to the start */
  countdown: number;
  /** the real players at this rope */
  uids: string[];
};

const T_JUMP = 0.46;
const H_JUMP = 0.5;
/** turns of the rope after t seconds: it starts slow and speeds up */
function revs(t: number) {
  if (t <= 0) return 0;
  const f0 = 0.8,
    a = 0.04,
    fMax = 2.1,
    tc = (fMax - f0) / a;
  if (t < tc) return f0 * t + 0.5 * a * t * t;
  return f0 * tc + 0.5 * a * tc * tc + fMax * (t - tc);
}
function freq(t: number) {
  return Math.min(2.1, 0.8 + 0.04 * Math.max(0, t));
}
const hop = (s: number) =>
  s >= 0 && s < T_JUMP ? 4 * H_JUMP * (s / T_JUMP) * (1 - s / T_JUMP) : 0;

export class RopeRig {
  private segs: THREE.Mesh[] = [];
  private idleT = Math.random() * 10;
  private npcJump = -1;
  private game: null | {
    mode: RopeMode;
    startAt: number; // local seconds (solo)
    count: number;
    out: boolean;
    outAt: number;
    lives: number;
    myJump: number; // local seconds of your last jump
    prev: number; // revs last frame
    tapped: Set<number>;
    checked: number;
    room: RopeRoom | null;
    round: RopeRound | null;
    off?: () => void;
    remote: Map<string, THREE.Object3D>;
    missAt: number;
    msgT: number;
    msg: string;
  } = null;
  private lastKey = "";

  constructor(
    private parent: THREE.Object3D,
    private spots: { left: V; right: V; mid: V; wait: V; face: number },
    private sisters: [THREE.Object3D, THREE.Object3D, THREE.Object3D],
    private me: THREE.Object3D,
    private animate: Animate,
    private kit: Kit,
    private onState: (s: RopeState) => void = () => {},
  ) {
    const mat = new THREE.MeshLambertMaterial({ color: 0xe6b84a });
    const geo = new THREE.CylinderGeometry(0.035, 0.035, 1, 5);
    geo.rotateX(Math.PI / 2);
    for (let i = 0; i < 16; i++) {
      const m = new THREE.Mesh(geo, mat);
      parent.add(m);
      this.segs.push(m);
    }
    this.place(0);
  }

  get playing() {
    return !!this.game;
  }
  /** Where the camera should look. */
  centre() {
    const o = this.parent.position;
    return { x: this.spots.mid.x + o.x, z: this.spots.mid.z + o.z };
  }

  /* ---------- start and stop ---------- */
  start(mode: RopeMode, onState: (s: RopeState) => void) {
    this.stop();
    this.onState = onState;
    const now = performance.now() / 1000;
    this.game = {
      mode,
      startAt: now + 3,
      count: 0,
      out: false,
      outAt: 0,
      lives: 3,
      myJump: -9,
      prev: 0,
      tapped: new Set(),
      checked: 0,
      room: null,
      round: null,
      remote: new Map(),
      // turning for a computer jumper: she will trip somewhere between 12 and 40 jumps
      missAt: 12 + Math.floor(Math.random() * 28),
      msgT: 0,
      msg: "",
    };
    if (mode.kind === "net") {
      const g = this.game;
      void mode.net.join(mode.name);
      g.off = mode.net.watch((r) => {
        g.room = r;
        this.sync();
      });
    }
    this.lastKey = "";
  }
  stop() {
    const g = this.game;
    if (!g) return;
    g.off?.();
    if (g.mode.kind === "net") {
      void g.mode.net.leave();
      g.mode.net.close();
    }
    g.remote.forEach((o) => o.removeFromParent());
    this.game = null;
    this.me.position.y = 0;
    // the sisters go back to their places
    this.sisters.forEach((s) => (s.visible = true));
  }
  /** Solo: play again, as the jumper or turning. */
  again(role: "jump" | "turn") {
    if (!this.game || this.game.mode.kind !== "solo") return;
    this.start({ kind: "solo", role }, this.onState);
  }

  /* ---------- your button ---------- */
  tap() {
    const g = this.game;
    if (!g || g.out) return;
    const now = performance.now() / 1000;
    const role = this.myRole();
    if (role === "jump") {
      if (now - g.myJump < T_JUMP) return;
      g.myJump = now;
      if (g.mode.kind === "net")
        g.mode.net.jump({ at: g.mode.net.now(), n: g.count, seq: g.round?.seq });
    } else if (role === "turn") {
      const t = this.tau();
      const r = revs(t);
      const k = Math.round(r);
      const off = Math.abs(r - k) / freq(t);
      if (off < 0.22 && k >= 1) {
        g.tapped.add(k);
        this.say("Nice rhythm!");
      } else this.say(r - k < 0 ? "A little early…" : "A little late…");
    }
  }

  /* ---------- who is where ---------- */
  private myUid() {
    const g = this.game;
    return g?.mode.kind === "net" ? g.mode.net.uid : "me";
  }
  private myRole(): RopeState["role"] {
    const g = this.game;
    if (!g) return "hold";
    if (g.mode.kind === "solo") return g.mode.role;
    return g.round?.jumper === this.myUid() ? "jump" : "hold";
  }
  /** seconds since the rope started turning */
  private tau() {
    const g = this.game;
    if (!g) return this.idleT;
    if (g.mode.kind === "solo") return performance.now() / 1000 - g.startAt;
    if (!g.round) return -1;
    return (g.mode.net.now() - g.round.start) / 1000;
  }
  private nameOf(uid: string, npc = "Sister Habibah") {
    if (uid === NPC) return npc;
    if (uid === this.myUid()) return "You";
    return this.game?.room?.players[uid]?.name ?? "Sister";
  }

  /* ---------- online: keep the round going ---------- */
  private sync() {
    const g = this.game;
    if (!g || g.mode.kind !== "net" || !g.room) return;
    const net = g.mode.net;
    const room = g.room;
    const prev = g.round;
    g.round = room.round;
    const ids = Object.entries(room.players)
      .sort((a, b) => a[1].at - b[1].at)
      .map(([u]) => u);
    const first = ids[0] === net.uid;
    const r = room.round;
    const stale = !r || !room.players[r.jumper];
    if (stale && first) {
      net.setRound(nextRound(room, net.now(), r)!);
      return;
    }
    // someone new arrived: give them a free end of the rope
    if (r && first) {
      const waiting = ids.filter((u) => u !== r.jumper && u !== r.left && u !== r.right);
      if (waiting.length && (r.left === NPC || r.right === NPC)) {
        const n = { ...r };
        if (n.left === NPC) n.left = waiting.shift()!;
        if (n.right === NPC && waiting.length) n.right = waiting.shift()!;
        net.setRound(n);
      }
    }
    // a new round: start counting again
    if (r && (!prev || prev.seq !== r.seq)) {
      g.count = 0;
      g.out = false;
      g.prev = 0;
      g.myJump = -9;
      g.msg = "";
      g.msgT = 0;
    }
    // another sister is out
    if (r && r.jumper !== net.uid) {
      const j = room.jumps[r.jumper];
      if (j?.out && j.seq === r.seq && g.msgT !== 99) {
        g.msg = `${this.nameOf(r.jumper)} is out after ${j.n} skips!`;
        g.msgT = 3;
      }
    }
  }

  /* ---------- every frame ---------- */
  update(dt: number) {
    const g = this.game;
    const now = performance.now() / 1000;
    if (!g) {
      // the sisters play on their own
      this.idleT += dt;
      const t = this.idleT % 40;
      const r = 1.05 * t;
      this.npcJumpFor(r, 1.05, now);
      this.place(r);
      this.pose([this.sisters[0], this.sisters[1], this.sisters[2]], hop(now - this.npcJump), now);
      return;
    }
    const tau = this.tau();
    const r = g.out ? g.prev : revs(tau);
    const role = this.myRole();
    // who stands where this round
    let L: THREE.Object3D, R: THREE.Object3D, J: THREE.Object3D;
    const unused = new Set(this.sisters);
    if (g.mode.kind === "solo") {
      if (g.mode.role === "jump") [L, R, J] = [this.sisters[0], this.sisters[1], this.me];
      else [L, R, J] = [this.me, this.sisters[1], this.sisters[2]];
    } else {
      const rd = g.round;
      const fig = (uid: string, npc: THREE.Object3D) => {
        if (uid === NPC) return npc;
        if (uid === this.myUid()) return this.me;
        let o = g.remote.get(uid);
        if (!o) {
          o = this.kit(this.nameOf(uid));
          this.parent.add(o);
          g.remote.set(uid, o);
        }
        return o;
      };
      L = fig(rd?.left ?? NPC, this.sisters[0]);
      R = fig(rd?.right ?? NPC, this.sisters[1]);
      J = rd ? fig(rd.jumper, this.sisters[2]) : this.sisters[2];
      // remote players who left
      for (const [u, o] of g.remote)
        if (!g.room?.players[u]) {
          o.removeFromParent();
          g.remote.delete(u);
        }
    }
    unused.delete(L);
    unused.delete(R);
    unused.delete(J);
    // sisters not in the game wait by the bench
    let wi = 0;
    for (const s of unused) {
      s.position.set(this.spots.wait.x + wi * 0.9, 0, this.spots.wait.z);
      s.rotation.y = this.spots.face;
      this.animate(s, 0, 0);
      wi++;
    }

    // jumps
    let jy = 0;
    if (J === this.me) jy = hop(now - g.myJump);
    else if (g.mode.kind === "net" && g.round && J !== this.sisters[2]) {
      const j = g.room?.jumps[g.round.jumper];
      if (j) jy = hop((g.mode.net.now() - j.at) / 1000);
    } else {
      // a computer jumper (turning on your own)
      if (!g.out && tau > 0) {
        const plannedMiss = g.count >= g.missAt;
        if (!plannedMiss) this.npcJumpFor(r, freq(tau), now);
      }
      jy = hop(now - this.npcJump);
    }

    // the rope passes under the jumper's feet
    if (!g.out && tau > 0 && Math.floor(g.prev - 0.5) < Math.floor(r - 0.5) && r > 0.5) {
      const judged = g.mode.kind === "solo" || role === "jump";
      if (judged) {
        // a computer jumper lands every jump until her planned slip
        const npcJumper = g.mode.kind === "solo" && g.mode.role === "turn";
        const inAir = npcJumper ? g.count < g.missAt : jy > 0.12;
        if (inAir) {
          g.count++;
          if (role === "jump" && g.mode.kind === "net")
            g.mode.net.jump({
              at: g.mode.net.now() - (now - g.myJump) * 1000,
              n: g.count,
              seq: g.round?.seq,
            });
        } else this.out(now, role === "jump" ? "Oops! The rope caught your feet." : "She tripped!");
      } else if (g.mode.kind === "net" && g.round) {
        // someone else is jumping: show their count
        const jj = g.room?.jumps[g.round.jumper];
        if (jj?.seq === g.round.seq) g.count = jj.n;
      }
    }
    // turning on your own: tap each time the rope is at the top
    if (!g.out && role === "turn" && tau > 0) {
      const k = Math.floor(r - 0.3);
      if (k >= 1 && k > g.checked) {
        g.checked = k;
        if (!g.tapped.has(k)) {
          g.lives--;
          this.say(g.lives > 0 ? "Tap Turn when the rope is at the top!" : "");
          if (g.lives <= 0) this.out(now, "The rope slowed down and tangled.");
        }
      }
    }
    if (!g.out) g.prev = r;

    this.place(g.out ? 0.5 : r);
    this.pose([L, R, J], jy, now);
    this.emit(role, tau, now);
  }

  private npcJumpFor(r: number, f: number, now: number) {
    const toBottom = (Math.ceil(r - 0.5) + 0.5 - r) / f;
    if (toBottom <= T_JUMP / 2 && now - this.npcJump > T_JUMP) this.npcJump = now;
  }
  private out(now: number, why: string) {
    const g = this.game!;
    g.out = true;
    g.outAt = now;
    g.msg = `${why} ${g.count} skips!`;
    g.msgT = 99;
    if (g.mode.kind === "net" && this.myRole() === "jump") {
      const net = g.mode.net;
      net.jump({ at: 0, n: g.count, out: true, seq: g.round?.seq });
      const room = g.room;
      if (room) setTimeout(() => net.setRound(nextRound(room, net.now(), g.round)!), 1800);
    }
  }
  private say(m: string) {
    const g = this.game;
    if (!g) return;
    g.msg = m;
    g.msgT = 1.4;
  }

  /* ---------- drawing ---------- */
  private hands() {
    const { left: a, right: b } = this.spots;
    const dx = b.x - a.x,
      dz = b.z - a.z,
      L = Math.hypot(dx, dz);
    const ux = dx / L,
      uz = dz / L;
    return {
      a: new THREE.Vector3(a.x + ux * 0.45, 1.0, a.z + uz * 0.45),
      b: new THREE.Vector3(b.x - ux * 0.45, 1.0, b.z - uz * 0.45),
      side: new THREE.Vector3(-uz, 0, ux),
    };
  }
  /** Draw the rope after r turns (r = 0: at the top). */
  private place(r: number) {
    const { a, b, side } = this.hands();
    const th = r * Math.PI * 2;
    const pts: THREE.Vector3[] = [];
    const n = this.segs.length;
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const amp = Math.sin(Math.PI * u) * 0.98;
      const p = a.clone().lerp(b, u);
      p.y += amp * Math.cos(th);
      p.addScaledVector(side, amp * Math.sin(th));
      pts.push(p);
    }
    for (let i = 0; i < n; i++) {
      const m = this.segs[i],
        p = pts[i],
        q = pts[i + 1];
      m.position.copy(p).add(q).multiplyScalar(0.5);
      m.scale.z = p.distanceTo(q) + 0.02;
      m.lookAt(q.clone().add(this.parent.position));
    }
  }
  private pose(who: [THREE.Object3D, THREE.Object3D, THREE.Object3D], jy: number, now: number) {
    const [L, R, J] = who;
    const s = this.spots;
    const o = this.parent.position;
    const put = (obj: THREE.Object3D, p: V, face: number, y = 0) => {
      if (obj === this.me) obj.position.set(p.x + o.x, y, p.z + o.z);
      else obj.position.set(p.x, y, p.z);
      obj.rotation.y = face;
    };
    const toR = Math.atan2(s.right.x - s.left.x, s.right.z - s.left.z);
    put(L, s.left, toR);
    put(R, s.right, toR + Math.PI);
    put(J, s.mid, s.face, jy);
    this.animate(L, now * 6, 0.25, 1);
    this.animate(R, now * 6, 0.25, 1);
    this.animate(J, 0, 0);
  }
  private emit(role: RopeState["role"], tau: number, now: number) {
    const g = this.game!;
    if (g.msgT !== 99 && g.msgT > 0) {
      g.msgT -= 1 / 60;
      if (g.msgT <= 0) g.msg = "";
    }
    const rd = g.round;
    const names =
      g.mode.kind === "solo"
        ? g.mode.role === "jump"
          ? { jumper: "You", left: "Sister Zainab", right: "Sister Habibah" }
          : { jumper: "Sister Rodiyah", left: "You", right: "Sister Habibah" }
        : {
            jumper: rd ? this.nameOf(rd.jumper) : "…",
            left: rd ? this.nameOf(rd.left, "Sister Zainab") : "Sister Zainab",
            right: rd ? this.nameOf(rd.right) : "Sister Habibah",
          };
    const s: RopeState = {
      role,
      phase: g.out ? "out" : tau < 0 ? "count" : "play",
      count: g.count,
      lives: role === "turn" ? g.lives : undefined,
      msg: g.msg,
      together: g.mode.kind === "net" && Object.keys(g.room?.players ?? {}).length > 1,
      names,
      countdown: Math.max(0, Math.ceil(-tau)),
      uids: Object.keys(g.room?.players ?? {}),
    };
    const key = JSON.stringify(s);
    if (key === this.lastKey) return;
    this.lastKey = key;
    void now;
    this.onState(s);
  }
  dispose() {
    this.stop();
    this.segs.forEach((m) => m.removeFromParent());
  }
}
