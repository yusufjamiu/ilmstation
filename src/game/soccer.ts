/* A football match on a pitch in the 3D world: you and a computer teammate with a keeper
   against a computer team. Move with the stick, keys or by tapping; Pass and Shoot
   buttons kick the ball. Two halves; a draw goes to penalties. */

import * as THREE from "three";

export type MatchPitch = {
  /** centre of the playing area (world) */
  x: number;
  z: number;
  len: number;
  wid: number;
  turn: number;
};
export type MatchState = {
  score: [number, number];
  /** seconds left in the half */
  clock: number;
  half: 1 | 2;
  phase: "kickoff" | "play" | "goal" | "half" | "pens" | "over";
  msg: string;
  /** you have the ball (Pass and Shoot work) */
  hasBall: boolean;
  /** penalties: what you do now */
  pen: null | { you: "shoot" | "save"; taken: [number, number]; scored: [number, number] };
  /** the side that won, when over */
  won?: boolean;
  /** a draw (online matches have no penalties) */
  draw?: boolean;
  myGoals: number;
  /** names of the two sides, and yours */
  labels: [string, string];
  myTeam: 0 | 1;
};
/** One player on the pitch: you, another real player, or the computer. */
export type Slot = {
  key: string;
  team: 0 | 1;
  gk: boolean;
  ctrl: "me" | "remote" | "cpu";
  name: string;
};
/** What a real player sends to the phone running the match. */
export type NetInput = { a: number; b: number; shoot: number; pass: number };
/** The match as the running phone sees it, sent to everyone else ten times a second. */
export type Snapshot = {
  ps: Record<string, [number, number, number, number, number]>;
  ball: [number, number, number, number, number, number];
  owner: string | null;
  score: [number, number];
  clock: number;
  half: 1 | 2;
  phase: MatchState["phase"];
  msg: string;
  goals: Record<string, number>;
};
type Kit = (team: 0 | 1, i: number, name: string, human: boolean) => THREE.Object3D;
type Animate = (g: THREE.Object3D, phase: number, amount: number, speed?: number) => void;

type P = {
  key: string;
  ctrl: Slot["ctrl"];
  name: string;
  /** where the running phone says this player is (online, watching) */
  ta?: number;
  tb?: number;
  g: THREE.Object3D;
  team: 0 | 1;
  gk: boolean;
  me: boolean;
  a: number;
  b: number;
  va: number;
  vb: number;
  face: number;
  cd: number;
  t: number;
  home: [number, number];
};

const HALF_SECONDS = 120;
const GOAL_HALF = 2.9;
const BAR = 2.2;

export class Soccer {
  private ps: P[] = [];
  private ball = { a: 0, b: 0, y: 0.11, va: 0, vb: 0, vy: 0 };
  private ballMesh: THREE.Mesh;
  private owner: P | null = null;
  private ua: THREE.Vector2;
  private ub: THREE.Vector2;
  private L: number;
  private W: number;
  state: MatchState;
  private wait = 0;
  private kickoffTeam: 0 | 1 = 0;
  private group = new THREE.Group();
  private pens = {
    order: [] as (0 | 1)[],
    i: 0,
    scored: [0, 0] as [number, number],
    taken: [0, 0] as [number, number],
  };
  private penShot: { aim: number; dive: number } | null = null;
  /** solo: you and the computer; host: this phone runs an online match; view: another phone does */
  private mode: "solo" | "host" | "view";
  private myKey: string;
  private send?: (i: NetInput) => void;
  private inputs = new Map<string, NetInput>();
  private seen = new Map<string, { shoot: number; pass: number }>();
  private acts = { shoot: 0, pass: 0 };
  private sentAt = 0;
  private goalsBy: Record<string, number> = {};
  private ballTarget: Snapshot["ball"] | null = null;

  constructor(
    private scene: THREE.Scene,
    private pitch: MatchPitch,
    private me: THREE.Object3D,
    kit: Kit,
    private animate: Animate,
    private onState: (s: MatchState) => void,
    opts: {
      slots?: Slot[];
      mode?: "solo" | "host" | "view";
      myKey?: string;
      labels?: [string, string];
      send?: (i: NetInput) => void;
    } = {},
  ) {
    this.mode = opts.mode ?? "solo";
    this.myKey = opts.myKey ?? "me";
    this.send = opts.send;
    this.L = pitch.len / 2;
    this.W = pitch.wid / 2;
    this.ua = new THREE.Vector2(Math.cos(pitch.turn), -Math.sin(pitch.turn));
    this.ub = new THREE.Vector2(Math.sin(pitch.turn), Math.cos(pitch.turn));
    const L = this.L,
      W = this.W;
    // solo: you, a teammate and a keeper (team 0, attacking +a) against three (team 1)
    const slots: Slot[] = opts.slots ?? [
      { key: "me", team: 0, gk: false, ctrl: "me", name: "You" },
      { key: "cpu1", team: 0, gk: false, ctrl: "cpu", name: "Teammate" },
      { key: "cpu2", team: 0, gk: true, ctrl: "cpu", name: "Keeper" },
      { key: "cpu3", team: 1, gk: false, ctrl: "cpu", name: "FC" },
      { key: "cpu4", team: 1, gk: false, ctrl: "cpu", name: "FC" },
      { key: "cpu5", team: 1, gk: true, ctrl: "cpu", name: "FC keeper" },
    ];
    const count = [0, 0];
    slots.forEach((sl, i) => {
      const side = sl.team === 0 ? -1 : 1;
      let a: number, b: number;
      if (sl.gk) {
        a = side * (L - 0.8);
        b = 0;
      } else {
        const k = count[sl.team]++;
        a = side * L * (0.22 + 0.22 * (k % 3));
        b = W * (k % 2 ? -0.38 : 0.32) * side;
      }
      const g = sl.ctrl === "me" ? me : kit(sl.team, i, sl.name, sl.ctrl === "remote");
      if (sl.ctrl !== "me") this.group.add(g);
      this.ps.push({
        key: sl.key,
        ctrl: sl.ctrl,
        name: sl.name,
        g,
        team: sl.team,
        gk: sl.gk,
        me: sl.ctrl === "me",
        a,
        b,
        va: 0,
        vb: 0,
        face: sl.team === 0 ? 0 : Math.PI,
        cd: 0,
        t: Math.random() * 5,
        home: [a, b],
      });
    });
    this.ballMesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.22, 1),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, flatShading: true }),
    );
    this.ballMesh.castShadow = true;
    const patch = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.225, 0),
      new THREE.MeshStandardMaterial({ color: 0x1d1d26, wireframe: true }),
    );
    this.ballMesh.add(patch);
    this.group.add(this.ballMesh);
    scene.add(this.group);
    this.state = {
      score: [0, 0],
      clock: HALF_SECONDS,
      half: 1,
      phase: "kickoff",
      msg: "Bismillah! Kick off.",
      hasBall: false,
      pen: null,
      myGoals: 0,
      labels: opts.labels ?? ["YOU", "FC"],
      myTeam: slots.find((x) => x.ctrl === "me")?.team ?? 0,
    };
    this.kickoff(0);
  }

  /** Your player (the first one if you are only watching). */
  private get mine() {
    return this.ps.find((p) => p.me) ?? this.ps[0];
  }

  /* ---------- coordinates ---------- */
  private world(a: number, b: number) {
    return {
      x: this.pitch.x + this.ua.x * a + this.ub.x * b,
      z: this.pitch.z + this.ua.y * a + this.ub.y * b,
    };
  }
  /** Turn a world direction into pitch directions. */
  private local(dx: number, dz: number) {
    return { a: dx * this.ua.x + dz * this.ua.y, b: dx * this.ub.x + dz * this.ub.y };
  }
  /** Facing angle (world rotation.y) for a pitch direction. */
  private yaw(da: number, db: number) {
    const dx = this.ua.x * da + this.ub.x * db,
      dz = this.ua.y * da + this.ub.y * db;
    return Math.atan2(dx, dz);
  }
  /** Camera yaw that looks down the pitch towards the goal you attack. */
  camYaw() {
    return Math.atan2(-this.ua.x, -this.ua.y);
  }
  /** Where you are, in the world (for the camera). */
  myWorld() {
    const p = this.mine;
    return this.world(p.a, p.b);
  }
  /** The camera looks towards the goal your team attacks. */
  camYawFor() {
    const t = this.state.myTeam;
    return t === 0 ? this.camYaw() : this.camYaw() + Math.PI;
  }

  /* ---------- set pieces ---------- */
  private kickoff(team: 0 | 1) {
    this.kickoffTeam = team;
    for (const p of this.ps) {
      p.a = p.home[0];
      p.b = p.home[1];
      p.va = p.vb = 0;
    }
    // the kicking team's striker stands on the ball
    const k = this.ps.find((p) => p.team === team && !p.gk)!;
    k.a = team === 0 ? -0.6 : 0.6;
    k.b = 0;
    Object.assign(this.ball, { a: 0, b: 0, y: 0.11, va: 0, vb: 0, vy: 0 });
    this.owner = null;
    this.wait = 1.6;
    this.state.phase = "kickoff";
    this.place();
  }

  /* ---------- your buttons ---------- */
  shoot() {
    if (this.state.phase === "pens") return;
    if (this.mode === "view") {
      this.acts.shoot++;
      this.sentAt = 0;
      return;
    }
    this.shootFor(this.mine);
  }
  pass() {
    if (this.mode === "view") {
      this.acts.pass++;
      this.sentAt = 0;
      return;
    }
    this.passFor(this.mine);
  }
  private shootFor(me: P) {
    if (this.owner !== me) return;
    const attack = me.team === 0 ? 1 : -1;
    // aim for the goal, a little towards where you face
    const ga = attack * (this.L + 0.5),
      gb = THREE.MathUtils.clamp(
        me.b + Math.sin(me.face - this.yaw(attack, 0)) * -4 * attack,
        -2.4,
        2.4,
      );
    const da = ga - me.a,
      db = gb - me.b,
      d = Math.hypot(da, db);
    const power = Math.min(24, 13 + d * 0.5);
    this.kick(me, (da / d) * power, (db / d) * power, 1.5 + Math.random() * 2.2);
  }
  private passFor(me: P) {
    if (this.owner !== me) return;
    const attack = me.team === 0 ? 1 : -1;
    const mates = this.ps.filter((q) => q.team === me.team && !q.gk && q !== me);
    if (!mates.length) return;
    // the teammate furthest forward, leading the pass a little ahead of them
    const mate = mates.sort((x, y) => y.a * attack - x.a * attack)[0];
    const ta = mate.a + mate.va * 0.4 + attack,
      tb = mate.b + mate.vb * 0.4;
    const da = ta - me.a,
      db = tb - me.b,
      d = Math.hypot(da, db) || 1;
    const power = Math.min(16, 5 + d * 0.9);
    this.kick(me, (da / d) * power, (db / d) * power, 0.3);
  }
  /** Online: a position changes hands (someone left, or came off the bench). */
  setCtrl(key: string, ctrl: "remote" | "cpu", name: string) {
    const p = this.ps.find((q) => q.key === key);
    if (!p || p.me) return;
    p.ctrl = ctrl;
    p.name = name;
    if (ctrl === "cpu") this.inputs.delete(key);
    this.seen.delete(key);
  }
  /** Online: what a real player is pressing (from the phone running the match). */
  setInput(key: string, i: NetInput) {
    this.inputs.set(key, i);
  }
  /** Penalties: aim (or dive) left, middle or right. */
  penalty(side: -1 | 0 | 1) {
    const pen = this.state.pen;
    if (this.state.phase !== "pens" || !pen || this.penShot) return;
    const cpu = ([-1, 0, 1] as const)[Math.floor(Math.random() * 3)];
    if (pen.you === "shoot") this.penShot = { aim: side, dive: cpu };
    else this.penShot = { aim: cpu, dive: side };
    const shooterTeam = pen.you === "shoot" ? 0 : 1;
    const s = this.ps.find((p) => p.team === shooterTeam && !p.gk)!;
    const spotA = shooterTeam === 0 ? this.L - 5 : -this.L + 5;
    const dir = shooterTeam === 0 ? 1 : -1;
    Object.assign(this.ball, { a: spotA, b: 0, y: 0.11 });
    const tb = this.penShot.aim * 2.2;
    const da = dir * 5.6,
      d = Math.hypot(da, tb);
    this.kick(s, (da / d) * 17, (tb / d) * 17, 1 + Math.random());
  }

  private kick(p: P, va: number, vb: number, vy: number) {
    this.owner = null;
    p.cd = 0.45;
    Object.assign(this.ball, { va, vb, vy, y: Math.max(this.ball.y, 0.15) });
  }

  /* ---------- every frame ---------- */
  step(dt: number, move: { x: number; z: number } | null) {
    const s = this.state;
    if (this.mode === "view") {
      this.stepView(dt, move);
      return;
    }
    if (s.phase === "over") return;
    if (this.wait > 0) {
      this.wait -= dt;
      if (this.wait <= 0) {
        if (s.phase === "goal") this.kickoff(this.kickoffTeam);
        else if (s.phase === "half") {
          s.half = 2;
          s.clock = HALF_SECONDS;
          this.kickoff(1);
          s.msg = "Second half!";
        } else if (s.phase === "kickoff") {
          s.phase = "play";
          s.msg = "";
          // the kicking side plays it short to start
          this.owner = this.ps.find((p) => p.team === this.kickoffTeam && !p.gk)!;
        } else if (s.phase === "pens") this.nextPenalty();
      }
      this.place();
      this.emit();
      return;
    }
    if (s.phase === "pens") {
      this.stepPens(dt);
      this.place();
      this.emit();
      return;
    }
    s.clock -= dt;
    if (s.clock <= 0) {
      s.clock = 0;
      if (s.half === 1) {
        s.phase = "half";
        s.msg = "Half time. Drink some water!";
        this.wait = 3;
      } else this.fullTime();
      this.emit();
      return;
    }

    // you
    const want = move ? this.local(move.x, move.z) : { a: 0, b: 0 };
    for (const p of this.ps) {
      if (p.ctrl === "me") this.steer(p, want.a, want.b, 6.2, dt);
      else if (p.ctrl === "remote") {
        // another real player: move as they push, kick when they press
        const i = this.inputs.get(p.key);
        this.steer(p, i?.a ?? 0, i?.b ?? 0, 6.2, dt);
        if (i) {
          const was = this.seen.get(p.key) ?? { shoot: i.shoot, pass: i.pass };
          if (i.shoot > was.shoot) this.shootFor(p);
          if (i.pass > was.pass) this.passFor(p);
          this.seen.set(p.key, { shoot: i.shoot, pass: i.pass });
        }
      } else this.think(p, dt);
    }
    for (const p of this.ps) {
      p.a = THREE.MathUtils.clamp(p.a + p.va * dt, -this.L - 1, this.L + 1);
      p.b = THREE.MathUtils.clamp(p.b + p.vb * dt, -this.W - 1, this.W + 1);
      p.cd = Math.max(0, p.cd - dt);
    }
    this.stepBall(dt);
    this.place();
    this.emit();
  }

  private steer(p: P, da: number, db: number, speed: number, dt: number) {
    const d = Math.hypot(da, db);
    const ta = d > 0.05 ? (da / Math.max(1, d)) * speed : 0,
      tb = d > 0.05 ? (db / Math.max(1, d)) * speed : 0;
    const k = 1 - Math.exp(-dt * 10);
    p.va += (ta - p.va) * k;
    p.vb += (tb - p.vb) * k;
    if (Math.hypot(p.va, p.vb) > 0.4) p.face = this.yaw(p.va, p.vb);
  }

  private think(p: P, dt: number) {
    const B = this.ball;
    const attack = p.team === 0 ? 1 : -1;
    const ownGoal = -attack * this.L;
    if (p.gk) {
      // stay on the line and follow the ball across
      const ta = ownGoal + attack * 0.8,
        tb = THREE.MathUtils.clamp(B.b * 0.8, -GOAL_HALF + 0.3, GOAL_HALF - 0.3);
      if (this.owner === p) {
        p.t += dt;
        if (p.t > 1) {
          p.t = 0;
          const mate = this.ps.filter((q) => q.team === p.team && !q.gk)[
            Math.random() < 0.5 ? 0 : 1
          ];
          const da = mate.a - p.a,
            db = mate.b - p.b,
            d = Math.hypot(da, db) || 1;
          this.kick(p, (da / d) * 14, (db / d) * 14, 3);
        }
        p.va = p.vb = 0;
        return;
      }
      this.steer(p, ta - p.a, tb - p.b, 5, dt);
      return;
    }
    const mates = this.ps.filter((q) => q.team === p.team && !q.gk && q !== p);
    const toBall = Math.hypot(B.a - p.a, B.b - p.b);
    const nearestOfTeam = this.ps
      .filter((q) => q.team === p.team && !q.gk)
      .sort((x, y) => Math.hypot(B.a - x.a, B.b - x.b) - Math.hypot(B.a - y.a, B.b - y.b))[0];
    const speed = p.team === 0 ? 5.6 : 5.0;
    if (this.owner === p) {
      // run at goal; shoot when close; pass if blocked
      const goalA = attack * this.L;
      const dist = Math.abs(goalA - p.a);
      const blocker = this.ps.find(
        (q) =>
          q.team !== p.team &&
          Math.abs(q.b - p.b) < 1.2 &&
          (q.a - p.a) * attack > 0 &&
          (q.a - p.a) * attack < 3,
      );
      if (dist < 9 && p.cd === 0) {
        const tb = (Math.random() < 0.5 ? -1 : 1) * (1 + Math.random() * 1.6);
        const da = goalA - p.a,
          db = tb - p.b,
          d = Math.hypot(da, db);
        const power = 15 + Math.random() * 6;
        this.kick(p, (da / d) * power, (db / d) * power, 0.8 + Math.random() * 1.8);
        return;
      }
      if (blocker && mates[0] && p.cd === 0 && Math.random() < dt * 3) {
        const m = mates[0];
        const da = m.a - p.a,
          db = m.b - p.b,
          d = Math.hypot(da, db) || 1;
        this.kick(p, (da / d) * Math.min(15, 5 + d), (db / d) * Math.min(15, 5 + d), 0.3);
        return;
      }
      p.t += dt;
      this.steer(p, attack * 4, Math.sin(p.t * 1.7) * 2 - p.b * 0.3, speed * 0.85, dt);
      return;
    }
    const teamHas = this.owner && this.owner.team === p.team;
    if (!teamHas && p === nearestOfTeam) {
      // chase the ball (or the player who has it)
      this.steer(p, B.a - p.a, B.b - p.b, speed, dt);
      return;
    }
    // hold a position: ahead of the ball when attacking, between ball and goal when defending
    const ta = teamHas
      ? THREE.MathUtils.clamp(B.a + attack * 5, -this.L + 3, this.L - 3)
      : THREE.MathUtils.clamp((B.a + ownGoal) / 2, -this.L + 2, this.L - 2);
    const tb = THREE.MathUtils.clamp(p.home[1] * 1.2 - B.b * 0.2, -this.W + 1, this.W - 1);
    const d = Math.hypot(ta - p.a, tb - p.b);
    this.steer(p, ta - p.a, tb - p.b, d > 1 ? speed * 0.8 : 0, dt);
    void toBall;
  }

  private stepBall(dt: number) {
    const B = this.ball;
    if (this.owner) {
      // dribbling: the ball rolls just in front of the player's feet
      const p = this.owner;
      const dir = new THREE.Vector2(p.va, p.vb);
      if (dir.lengthSq() < 0.01) dir.set(p.team === 0 ? 1 : -1, 0);
      dir.normalize();
      B.a = p.a + dir.x * 0.65;
      B.b = p.b + dir.y * 0.65;
      B.y = 0.11;
      B.va = p.va;
      B.vb = p.vb;
      B.vy = 0;
      // tackles: an opponent right on the ball can win it
      for (const q of this.ps)
        if (q.team !== p.team && q.cd === 0 && Math.hypot(q.a - B.a, q.b - B.b) < 0.7) {
          const chance = q.ctrl !== "cpu" ? 0.8 : p.ctrl !== "cpu" ? 0.35 : 0.5;
          if (Math.random() < chance * dt * 4) {
            this.owner = q;
            p.cd = 0.8;
          }
        }
      return;
    }
    B.a += B.va * dt;
    B.b += B.vb * dt;
    B.y += B.vy * dt;
    B.vy -= 9.8 * dt;
    if (B.y <= 0.11) {
      B.y = 0.11;
      if (B.vy < -1.5) B.vy = -B.vy * 0.45;
      else B.vy = 0;
      const f = Math.exp(-dt * 1.1);
      B.va *= f;
      B.vb *= f;
    }
    // side lines: the ball bounces back in
    if (Math.abs(B.b) > this.W + 0.4) {
      B.b = Math.sign(B.b) * (this.W + 0.4);
      B.vb = -B.vb * 0.5;
    }
    // goal lines
    if (Math.abs(B.a) > this.L) {
      const side = B.a > 0 ? 1 : -1;
      if (Math.abs(B.b) < GOAL_HALF && B.y < BAR) {
        this.goal(side > 0 ? 0 : 1);
        return;
      }
      B.a = side * this.L;
      B.va = -B.va * 0.4;
      // a goal kick for the defending keeper
      const gk = this.ps.find((p) => p.gk && (p.team === 0 ? -1 : 1) === side);
      if (gk) {
        this.owner = gk;
        gk.t = 0;
      }
      return;
    }
    // keepers save what comes at them
    for (const p of this.ps)
      if (p.gk && p.cd === 0) {
        const d = Math.hypot(p.a - B.a, p.b - B.b);
        const speed = Math.hypot(B.va, B.vb);
        if (d < 1.1 && B.y < 2) {
          if (speed < 6) {
            this.owner = p;
            p.t = 0;
          } else if (Math.random() < 0.55) {
            B.va = -B.va * 0.35;
            B.vb = (Math.random() - 0.5) * 8;
            B.vy = 2;
            p.cd = 0.6;
          } else p.cd = 0.6;
        }
      }
    // anyone else can trap a slow ball
    const speed = Math.hypot(B.va, B.vb);
    for (const p of this.ps) {
      if (p.gk || p.cd > 0 || B.y > 1) continue;
      const human = p.ctrl !== "cpu";
      if (Math.hypot(p.a - B.a, p.b - B.b) < (human ? 0.9 : 0.75) && speed < (human ? 14 : 11)) {
        this.owner = p;
        break;
      }
    }
  }

  private goal(team: 0 | 1) {
    const s = this.state;
    s.score[team]++;
    const scorer = this.lastToucher();
    if (scorer && scorer.team === team)
      this.goalsBy[scorer.key] = (this.goalsBy[scorer.key] ?? 0) + 1;
    if (this.mode === "solo")
      s.msg =
        team === 0
          ? scorer?.me
            ? "GOAL! Masha Allah!"
            : "GOAL! Your teammate scores!"
          : "Goal for IlmWorld FC.";
    else
      s.msg = `GOAL for ${s.labels[team]}!${scorer && scorer.team === team && scorer.ctrl !== "cpu" ? ` ${scorer.name} scores.` : ""}`;
    s.phase = "goal";
    this.owner = null;
    this.wait = 2.2;
    this.kickoffTeam = team === 0 ? 1 : 0;
  }
  private lastToucher() {
    // close enough: whoever is nearest the ball when it went in, from the scoring side
    const B = this.ball;
    return [...this.ps].sort(
      (x, y) => Math.hypot(B.a - x.a, B.b - x.b) - Math.hypot(B.a - y.a, B.b - y.b),
    )[0];
  }

  private fullTime() {
    const s = this.state;
    if (this.mode !== "solo" && s.score[0] === s.score[1]) {
      s.phase = "over";
      s.msg = "Full time: a draw. Well played, everyone!";
      this.emit();
      return;
    }
    if (s.score[0] !== s.score[1]) {
      s.phase = "over";
      s.won = s.score[0] > s.score[1];
      s.msg = s.won ? "Full time. You won! Alhamdulillah." : "Full time. Well played!";
      this.emit();
      return;
    }
    // penalties: 3 each, then sudden death
    s.phase = "pens";
    s.msg = "A draw! Penalties: 3 each.";
    this.pens = { order: [], i: 0, scored: [0, 0], taken: [0, 0] };
    this.wait = 2;
  }
  private nextPenalty() {
    const P = this.pens;
    const team: 0 | 1 = P.i % 2 === 0 ? 0 : 1;
    this.penShot = null;
    this.state.pen = {
      you: team === 0 ? "shoot" : "save",
      taken: [...P.taken],
      scored: [...P.scored],
    };
    this.state.msg =
      team === 0 ? "Your penalty: pick a corner." : "Their penalty: pick where to dive.";
    // line everyone up
    const spotA = team === 0 ? this.L - 5 : -this.L + 5;
    for (const p of this.ps) {
      p.va = p.vb = 0;
      if (p.gk) {
        p.a = p.team === 0 ? -this.L + 0.6 : this.L - 0.6;
        p.b = 0;
      } else {
        p.a = spotA * 0.3;
        p.b = (this.ps.indexOf(p) - 2.5) * 1.2;
      }
    }
    const taker = this.ps.find((p) => p.team === team && !p.gk)!;
    taker.a = spotA - (team === 0 ? 1.2 : -1.2);
    taker.b = 0;
    Object.assign(this.ball, { a: spotA, b: 0, y: 0.11, va: 0, vb: 0, vy: 0 });
    this.owner = null;
  }
  private stepPens(dt: number) {
    if (!this.penShot) return;
    const B = this.ball;
    const P = this.pens;
    const team: 0 | 1 = P.i % 2 === 0 ? 0 : 1;
    const gk = this.ps.find((p) => p.gk && p.team !== team)!;
    gk.b += (this.penShot.dive * 2.2 - gk.b) * Math.min(1, dt * 6);
    B.a += B.va * dt;
    B.b += B.vb * dt;
    B.y = Math.max(0.11, B.y + B.vy * dt);
    B.vy -= 9.8 * dt;
    if (Math.abs(B.a) >= this.L) {
      const scored = this.penShot.aim !== this.penShot.dive;
      P.taken[team]++;
      if (scored) {
        P.scored[team]++;
        if (team === 0) this.goalsBy[this.mine.key] = (this.goalsBy[this.mine.key] ?? 0) + 1;
      }
      this.state.msg = scored ? "GOAL!" : "Saved!";
      P.i++;
      this.penShot = null;
      this.state.pen = {
        you: team === 0 ? "save" : "shoot",
        taken: [...P.taken],
        scored: [...P.scored],
      };
      // decided?
      const [s0, s1] = P.scored,
        [t0, t1] = P.taken;
      const left0 = Math.max(0, 3 - t0),
        left1 = Math.max(0, 3 - t1);
      const done =
        (t0 <= 3 && t1 <= 3 && (s0 > s1 + left1 || s1 > s0 + left0)) ||
        (t0 >= 3 && t1 >= 3 && t0 === t1 && s0 !== s1);
      if (done) {
        const s = this.state;
        s.phase = "over";
        s.won = s0 > s1;
        s.pen = null;
        s.msg = s.won
          ? `You won ${s0}–${s1} on penalties! Alhamdulillah.`
          : `They won ${s1}–${s0} on penalties. Well played!`;
        return;
      }
      this.wait = 1.6;
    }
  }

  /* ---------- online ---------- */
  /** The running phone: the whole match in a small message. */
  snapshot(): Snapshot {
    const r = (n: number) => Math.round(n * 100) / 100;
    const ps: Snapshot["ps"] = {};
    for (const p of this.ps) ps[p.key] = [r(p.a), r(p.b), r(p.face), r(p.va), r(p.vb)];
    const B = this.ball;
    const s = this.state;
    return {
      ps,
      ball: [r(B.a), r(B.b), r(B.y), r(B.va), r(B.vb), r(B.vy)],
      owner: this.owner?.key ?? null,
      score: [...s.score],
      clock: Math.round(s.clock * 10) / 10,
      half: s.half,
      phase: s.phase,
      msg: s.msg,
      goals: { ...this.goalsBy },
    };
  }
  /** Another phone: show the match as the running phone sends it. */
  applySnapshot(n: Snapshot) {
    for (const p of this.ps) {
      const v = n.ps[p.key];
      if (!v) continue;
      [p.ta, p.tb] = [v[0], v[1]];
      if (!p.me) {
        p.face = v[2];
        p.va = v[3];
        p.vb = v[4];
      }
    }
    this.ballTarget = n.ball;
    this.owner = this.ps.find((p) => p.key === n.owner) ?? null;
    const s = this.state;
    Object.assign(s, {
      score: n.score,
      clock: n.clock,
      half: n.half,
      phase: n.phase,
      msg: n.msg,
    });
    this.goalsBy = n.goals ?? {};
  }
  private stepView(dt: number, move: { x: number; z: number } | null) {
    const k = 1 - Math.exp(-dt * 12);
    const want = move ? this.local(move.x, move.z) : { a: 0, b: 0 };
    for (const p of this.ps) {
      if (p.me) {
        // move straight away on this phone, and settle where the running phone has you
        this.steer(p, want.a, want.b, 6.2, dt);
        p.a += p.va * dt;
        p.b += p.vb * dt;
        if (p.ta !== undefined && p.tb !== undefined) {
          const kk = 1 - Math.exp(-dt * 3);
          p.a += (p.ta - p.a) * kk;
          p.b += (p.tb - p.b) * kk;
        }
      } else if (p.ta !== undefined && p.tb !== undefined) {
        p.a += (p.ta + p.va * 0.05 - p.a) * k;
        p.b += (p.tb + p.vb * 0.05 - p.b) * k;
      }
    }
    const B = this.ball,
      T = this.ballTarget;
    if (T) {
      B.a += (T[0] - B.a) * k;
      B.b += (T[1] - B.b) * k;
      B.y += (T[2] - B.y) * k;
      B.va = T[3];
      B.vb = T[4];
    }
    this.sentAt -= dt;
    if (this.send && this.sentAt <= 0) {
      this.sentAt = 0.1;
      const r = (n: number) => Math.round(n * 100) / 100;
      this.send({ a: r(want.a), b: r(want.b), shoot: this.acts.shoot, pass: this.acts.pass });
    }
    this.place();
    this.emit();
  }

  /* ---------- drawing ---------- */
  private place() {
    for (const p of this.ps) {
      const w = this.world(p.a, p.b);
      p.g.position.set(w.x, 0, w.z);
      p.g.rotation.y = p.face;
      p.t += 0.016;
      const sp = Math.hypot(p.va, p.vb);
      this.animate(p.g, p.t * 9, Math.min(1, sp / 3), sp > 4.5 ? 5 : 2.2);
    }
    const w = this.world(this.ball.a, this.ball.b);
    this.ballMesh.position.set(w.x, this.ball.y, w.z);
    const sp = Math.hypot(this.ball.va, this.ball.vb);
    this.ballMesh.rotation.x += sp * 0.05;
    this.ballMesh.rotation.z += sp * 0.03;
  }
  private last = "";
  private emit() {
    const s = this.state;
    s.hasBall = this.owner === this.mine && this.mine.me;
    s.myGoals = this.goalsBy[this.myKey] ?? this.goalsBy[this.mine.key] ?? 0;
    if (s.phase === "over" && !s.pen) {
      const t = s.myTeam;
      s.draw = s.score[0] === s.score[1] && this.mode !== "solo";
      if (this.mode !== "solo" || s.score[0] !== s.score[1]) s.won = s.score[t] > s.score[1 - t];
    }
    const key = JSON.stringify([
      s.score,
      Math.ceil(s.clock),
      s.half,
      s.phase,
      s.msg,
      s.hasBall,
      s.pen,
      s.won,
    ]);
    if (key === this.last) return;
    this.last = key;
    this.onState({ ...s, score: [...s.score], pen: s.pen ? { ...s.pen } : null });
  }

  dispose() {
    this.group.removeFromParent();
    this.ballMesh.geometry.dispose();
  }
}
