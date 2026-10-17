/* Table tennis in the 3D world: you against the computer, or against another real player
   (brothers and sisters can play each other). Move with the stick, tap Hit when the ball
   has bounced on your side of the table; push the stick left or right as you hit to aim.
   First to 11 points, win by 2. Online, the first player's phone runs the rally and sends
   it to the other. (The class keeps its old name, Tennis.) */

import * as THREE from "three";

export type Court = { x: number; z: number; turn: number; len: number; wid: number };
export type TennisState = {
  score: [number, number];
  /** whose serve (0 = you / the near side) */
  server: 0 | 1;
  phase: "serve" | "rally" | "point" | "over";
  msg: string;
  /** you can hit the ball now */
  canHit: boolean;
  /** you are serving */
  myServe: boolean;
  names: [string, string];
  /** which side you are on */
  mySide: 0 | 1;
  won?: boolean;
};
export type TennisInput = { b: number; a: number; hit: number; aim: number };
export type TennisSnap = {
  p: [number, number, number, number];
  ball: [number, number, number, number, number, number];
  score: [number, number];
  server: 0 | 1;
  phase: TennisState["phase"];
  msg: string;
  last: 0 | 1 | -1;
  /** bounces since the last hit */
  bn?: number;
};
type Animate = (g: THREE.Object3D, phase: number, amount: number, speed?: number) => void;

const WIN = 11;
/** the table top, and the net above it */
const TH = 0.76;
const NET_H = TH + 0.1525;
const REACH = 1.05;
const G = 9.8;

type Pl = {
  g: THREE.Object3D;
  a: number;
  b: number;
  va: number;
  vb: number;
  t: number;
  cd: number;
};

export class Tennis {
  private ps: [Pl, Pl];
  private ball = { a: 0, b: 0, y: 1, va: 0, vb: 0, vy: 0 };
  private ballMesh: THREE.Mesh;
  private shadow: THREE.Mesh;
  private group = new THREE.Group();
  private ua: THREE.Vector2;
  private ub: THREE.Vector2;
  private L: number;
  private W: number;
  state: TennisState;
  private wait = 0;
  /** who touched the ball last, and bounces since */
  private last: 0 | 1 | -1 = -1;
  private bounces = 0;
  private mode: "solo" | "host" | "view";
  /** side 0 is the near half (negative a) */
  private mine: 0 | 1;
  private remote = { b: 0, a: 0, hit: 0, aim: 0 };
  private seenHit = 0;
  private acts = { hit: 0, aim: 0 };
  private send?: (i: TennisInput) => void;
  private sentAt = 0;
  private target: TennisSnap | null = null;
  private lastKey = "";

  constructor(
    private scene: THREE.Scene,
    private court: Court,
    me: THREE.Object3D,
    other: THREE.Object3D,
    private animate: Animate,
    private onState: (s: TennisState) => void,
    opts: {
      mode?: "solo" | "host" | "view";
      mySide?: 0 | 1;
      names?: [string, string];
      send?: (i: TennisInput) => void;
    } = {},
  ) {
    this.mode = opts.mode ?? "solo";
    this.mine = opts.mySide ?? 0;
    this.send = opts.send;
    this.L = court.len / 2;
    this.W = court.wid / 2;
    this.ua = new THREE.Vector2(Math.cos(court.turn), -Math.sin(court.turn));
    this.ub = new THREE.Vector2(Math.sin(court.turn), Math.cos(court.turn));
    const mk = (g: THREE.Object3D, side: 0 | 1): Pl => ({
      g,
      a: side === 0 ? -this.L - 0.5 : this.L + 0.5,
      b: 0,
      va: 0,
      vb: 0,
      t: 0,
      cd: 0,
    });
    // ps[0] is the near side, ps[1] the far side
    this.ps = this.mine === 0 ? [mk(me, 0), mk(other, 1)] : [mk(other, 0), mk(me, 1)];
    this.group.add(other);
    this.ballMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 12, 8),
      new THREE.MeshStandardMaterial({ color: 0xff8a1f, roughness: 0.5 }),
    );
    this.ballMesh.castShadow = true;
    this.shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.05, 12),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25 }),
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.group.add(this.ballMesh, this.shadow);
    scene.add(this.group);
    const names = opts.names ?? ["You", "Coach Kareem"];
    this.state = {
      score: [0, 0],
      server: 0,
      phase: "serve",
      msg: "",
      canHit: false,
      myServe: false,
      names,
      mySide: this.mine,
    };
    this.serveSetup();
  }

  /* ---------- coordinates ---------- */
  private world(a: number, b: number) {
    return {
      x: this.court.x + this.ua.x * a + this.ub.x * b,
      z: this.court.z + this.ua.y * a + this.ub.y * b,
    };
  }
  private local(dx: number, dz: number) {
    return { a: dx * this.ua.x + dz * this.ua.y, b: dx * this.ub.x + dz * this.ub.y };
  }
  private yaw(da: number, db: number) {
    return Math.atan2(this.ua.x * da + this.ub.x * db, this.ua.y * da + this.ub.y * db);
  }
  /** The camera looks down the court from your end. */
  camYaw() {
    const dir = this.mine === 0 ? 1 : -1;
    return Math.atan2(-this.ua.x * dir, -this.ua.y * dir);
  }
  myWorld() {
    const p = this.ps[this.mine];
    return this.world(p.a, p.b);
  }
  ballWorld() {
    return this.world(this.ball.a, this.ball.b);
  }

  /* ---------- serving ---------- */
  private serveSetup() {
    const s = this.state;
    for (const [i, p] of this.ps.entries()) {
      p.a = i === 0 ? -this.L - 0.5 : this.L + 0.5;
      p.b = i === s.server ? 0.25 * (i === 0 ? 1 : -1) : -0.25 * (i === 0 ? 1 : -1);
      p.va = p.vb = 0;
    }
    const sv = this.ps[s.server];
    Object.assign(this.ball, {
      a: sv.a + (s.server === 0 ? 0.35 : -0.35),
      b: sv.b,
      y: TH + 0.3,
      va: 0,
      vb: 0,
      vy: 0,
    });
    this.last = -1;
    this.bounces = 0;
    s.phase = "serve";
    s.msg =
      s.server === this.mine
        ? "Your serve: tap Hit"
        : `${s.names[s.server === 0 ? 0 : 1]} to serve`;
    if (this.mode === "solo" && s.server !== this.mine) this.wait = 1.4;
  }

  /* ---------- your button ---------- */
  hit(aim: number) {
    if (this.mode === "view") {
      this.acts.hit++;
      this.acts.aim = aim;
      this.sentAt = 0;
      return;
    }
    this.hitFor(this.mine, aim);
  }
  private hitFor(side: 0 | 1, aim: number) {
    const s = this.state;
    const p = this.ps[side];
    if (s.phase === "serve") {
      if (s.server !== side) return;
      this.strike(side, aim, true);
      s.phase = "rally";
      s.msg = "";
      return;
    }
    if (s.phase !== "rally" || p.cd > 0) return;
    const B = this.ball;
    const d = Math.hypot(B.a - p.a, B.b - p.b);
    // a fair return: the ball has bounced once on your side and is not on the floor
    if (d > REACH || B.y > TH + 1.3 || B.y < TH - 0.4 || this.last === side || this.bounces !== 1) {
      p.cd = 0.35; // a swing and a miss
      return;
    }
    this.strike(side, aim, false);
  }
  /** Send the ball to the other half, deep, a little left or right. */
  private strike(side: 0 | 1, aim: number, serve: boolean) {
    const dir = side === 0 ? 1 : -1;
    const B = this.ball;
    const ta = dir * (this.L * (serve ? 0.55 : 0.4 + Math.random() * 0.45));
    const tb = THREE.MathUtils.clamp(
      (serve ? -this.ps[side].b : aim * this.W * 0.8) + (Math.random() - 0.5) * 0.4,
      -this.W + 0.12,
      this.W - 0.12,
    );
    const y0 = Math.max(B.y, TH + 0.15);
    const da = ta - B.a,
      db = tb - B.b,
      dist = Math.hypot(da, db);
    const T = THREE.MathUtils.clamp(dist / 5.5, 0.5, 0.8);
    B.va = da / T;
    B.vb = db / T;
    // up and over the net, landing on the table: y(T) = TH
    B.vy = (0.5 * G * T * T - (y0 - TH)) / T;
    B.y = y0;
    this.last = side;
    this.bounces = 0;
    this.ps[side].cd = 0.3;
  }

  /* ---------- every frame ---------- */
  step(dt: number, move: { x: number; z: number } | null) {
    if (this.mode === "view") {
      this.stepView(dt, move);
      return;
    }
    const s = this.state;
    for (const p of this.ps) p.cd = Math.max(0, p.cd - dt);
    if (s.phase === "over") {
      this.place();
      this.emit();
      return;
    }
    if (this.wait > 0) {
      this.wait -= dt;
      if (this.wait <= 0) {
        if (s.phase === "point") this.serveSetup();
        else if (s.phase === "serve" && this.mode === "solo" && s.server !== this.mine)
          this.hitFor(s.server, (Math.random() - 0.5) * 1.6);
      }
      this.place();
      this.emit();
      return;
    }
    // you
    const want = move ? this.local(move.x, move.z) : { a: 0, b: 0 };
    const me = this.ps[this.mine];
    if (s.phase === "rally") this.steer(me, this.mine, want.a, want.b, dt);
    else if (s.phase === "serve") this.steer(me, this.mine, 0, want.b, dt);
    // the other side: the computer, or the other real player
    const op = (1 - this.mine) as 0 | 1;
    const o = this.ps[op];
    if (this.mode === "solo") this.think(op, dt);
    else {
      this.steer(o, op, this.remote.a, this.remote.b, dt);
      if (this.remote.hit > this.seenHit) {
        this.seenHit = this.remote.hit;
        this.hitFor(op, this.remote.aim);
      }
    }
    if (s.phase === "rally") this.stepBall(dt);
    this.place();
    this.emit();
  }
  private steer(p: Pl, side: 0 | 1, da: number, db: number, dt: number) {
    const d = Math.hypot(da, db);
    const sp = 4;
    const ta = d > 0.05 ? (da / Math.max(1, d)) * sp : 0,
      tb = d > 0.05 ? (db / Math.max(1, d)) * sp : 0;
    const k = 1 - Math.exp(-dt * 10);
    p.va += (ta - p.va) * k;
    p.vb += (tb - p.vb) * k;
    p.a += p.va * dt;
    p.b += p.vb * dt;
    // stay at your own end of the table
    p.a =
      side === 0
        ? THREE.MathUtils.clamp(p.a, -this.L - 2, -this.L - 0.3)
        : THREE.MathUtils.clamp(p.a, this.L + 0.3, this.L + 2);
    p.b = THREE.MathUtils.clamp(p.b, -this.W - 1, this.W + 1);
  }
  /** The computer runs to where the ball will come down and hits it back. */
  private think(side: 0 | 1, dt: number) {
    const p = this.ps[side];
    const B = this.ball;
    const s = this.state;
    const ta = side === 0 ? -this.L - 0.5 : this.L + 0.5;
    let tb = 0;
    if (s.phase === "rally" && this.last !== side && Math.abs(B.va) > 0.1) {
      // where the ball will cross this end of the table
      const t = (ta - B.a) / B.va;
      if (t > 0) tb = B.b + B.vb * t;
    }
    this.steer(p, side, (ta - p.a) * 0.9, (tb - p.b) * 0.9, dt * 0.9);
    p.t += dt;
    if (s.phase === "rally" && this.last !== side && this.bounces === 1) {
      const d = Math.hypot(B.a - p.a, B.b - p.b);
      if (d < REACH * 0.9 && B.y > TH - 0.3 && p.cd === 0) {
        if (Math.random() < 0.85) this.hitFor(side, (Math.random() - 0.5) * 1.8);
        else p.cd = 0.8; // missed it
      }
    }
  }
  private stepBall(dt: number) {
    const B = this.ball;
    const prevA = B.a,
      prevY = B.y;
    B.a += B.va * dt;
    B.b += B.vb * dt;
    B.y += B.vy * dt;
    B.vy -= G * dt;
    // the net
    if (Math.sign(prevA) !== Math.sign(B.a) && B.y < NET_H && Math.abs(B.b) < this.W + 0.15) {
      this.point(this.last === 0 ? 1 : 0, "Into the net!");
      return;
    }
    const onTable = Math.abs(B.a) <= this.L && Math.abs(B.b) <= this.W;
    if (B.vy < 0 && prevY >= TH && B.y <= TH + 0.02 && onTable) {
      B.y = TH + 0.02;
      B.vy = -B.vy * 0.85;
      B.va *= 0.95;
      B.vb *= 0.95;
      this.bounces++;
      const side: 0 | 1 = B.a < 0 ? 0 : 1;
      if (this.bounces === 1 && side === this.last) {
        this.point(this.last === 0 ? 1 : 0, "Out!");
        return;
      }
      if (this.bounces >= 2) {
        // bounced twice: the player on that side didn't get it back
        this.point(side === 0 ? 1 : 0, "Too slow!");
        return;
      }
    }
    // on the floor
    if (B.y <= 0.05) {
      if (this.bounces === 0) this.point(this.last === 0 ? 1 : 0, "Out!");
      else this.point(this.last === 0 ? 0 : 1, "Missed it!");
      return;
    }
    if (Math.abs(B.a) > this.L + 6 || Math.abs(B.b) > this.W + 5)
      this.point(this.last === 0 ? 1 : 0, "Out!");
  }
  private point(to: 0 | 1, why: string) {
    const s = this.state;
    s.score[to]++;
    const [a, b] = s.score;
    if ((a >= WIN || b >= WIN) && Math.abs(a - b) >= 2) {
      s.phase = "over";
      s.won = s.score[this.mine] > s.score[1 - this.mine];
      s.msg = s.won ? "Game! You won. Alhamdulillah!" : "Match over. Well played!";
      this.emit();
      return;
    }
    s.phase = "point";
    s.msg = `${why} Point to ${to === this.mine ? "you" : s.names[to === 0 ? 0 : 1]}.`;
    // the server changes every 2 points
    if ((a + b) % 2 === 0) s.server = s.server === 0 ? 1 : 0;
    this.wait = 1.8;
  }

  /* ---------- online ---------- */
  setRemote(i: TennisInput) {
    this.remote = i;
  }
  snapshot(): TennisSnap {
    const r = (n: number) => Math.round(n * 100) / 100;
    const [p0, p1] = this.ps;
    const B = this.ball;
    const s = this.state;
    return {
      p: [r(p0.a), r(p0.b), r(p1.a), r(p1.b)],
      ball: [r(B.a), r(B.b), r(B.y), r(B.va), r(B.vb), r(B.vy)],
      score: [...s.score],
      server: s.server,
      phase: s.phase,
      msg: s.msg,
      last: this.last,
      bn: this.bounces,
    };
  }
  applySnapshot(n: TennisSnap) {
    this.target = n;
    const s = this.state;
    s.score = n.score;
    s.server = n.server;
    s.phase = n.phase;
    s.msg = n.msg;
    this.last = n.last;
    this.bounces = n.bn ?? 0;
    if (n.phase === "over") s.won = n.score[this.mine] > n.score[1 - this.mine];
  }
  private stepView(dt: number, move: { x: number; z: number } | null) {
    const T = this.target;
    const k = 1 - Math.exp(-dt * 12);
    const want = move ? this.local(move.x, move.z) : { a: 0, b: 0 };
    const me = this.ps[this.mine];
    // move straight away on this phone; the running phone has the final say
    this.steer(me, this.mine, want.a, want.b, dt);
    if (T) {
      const ka = 1 - Math.exp(-dt * 3);
      const mA = T.p[this.mine * 2],
        mB = T.p[this.mine * 2 + 1];
      me.a += (mA - me.a) * ka;
      me.b += (mB - me.b) * ka;
      const o = this.ps[1 - this.mine];
      o.a += (T.p[(1 - this.mine) * 2] - o.a) * k;
      o.b += (T.p[(1 - this.mine) * 2 + 1] - o.b) * k;
      const B = this.ball;
      B.a += (T.ball[0] - B.a) * k;
      B.b += (T.ball[1] - B.b) * k;
      B.y += (T.ball[2] - B.y) * k;
    }
    this.sentAt -= dt;
    if (this.send && this.sentAt <= 0) {
      this.sentAt = 0.1;
      const r = (n: number) => Math.round(n * 100) / 100;
      this.send({ a: r(want.a), b: r(want.b), hit: this.acts.hit, aim: this.acts.aim });
    }
    this.place();
    this.emit();
  }

  /* ---------- drawing ---------- */
  private place() {
    for (const [i, p] of this.ps.entries()) {
      const w = this.world(p.a, p.b);
      p.g.position.set(w.x, 0, w.z);
      // face the net (or the ball)
      const fa = i === 0 ? 1 : -1;
      p.g.rotation.y = this.yaw(fa, (this.ball.b - p.b) * 0.3);
      p.t += 0.016;
      const sp = Math.hypot(p.va, p.vb);
      this.animate(p.g, p.t * 9, Math.min(1, sp / 3), sp > 4 ? 5 : 2.2);
    }
    const w = this.world(this.ball.a, this.ball.b);
    this.ballMesh.position.set(w.x, this.ball.y, w.z);
    const over = Math.abs(this.ball.a) <= this.L && Math.abs(this.ball.b) <= this.W;
    this.shadow.position.set(w.x, over && this.ball.y >= TH ? TH + 0.01 : 0.03, w.z);
  }
  private emit() {
    const s = this.state;
    const me = this.ps[this.mine];
    const B = this.ball;
    s.myServe = s.phase === "serve" && s.server === this.mine;
    s.canHit =
      s.myServe ||
      (s.phase === "rally" &&
        this.last !== this.mine &&
        this.bounces === 1 &&
        Math.hypot(B.a - me.a, B.b - me.b) < REACH + 0.4);
    const key = JSON.stringify([s.score, s.phase, s.msg, s.canHit, s.myServe, s.won]);
    if (key === this.lastKey) return;
    this.lastKey = key;
    this.onState({ ...s, score: [...s.score] });
  }
  dispose() {
    this.group.removeFromParent();
  }
}
