import * as THREE from "three";
import {
  CITY_CENTER,
  DISTRICTS,
  centerOf,
  cityOf,
  districtById,
  halfOf,
  type District,
} from "./content";
import { VEHICLE_INFO, randomCarColor, vehicleMesh, type VehicleKind } from "./vehicles";

/* Traffic: cars, keke, danfos and the Hisbah van drive on the right along the city's
   roads, keep their distance, and stop for people and for your car. Danfos stop at
   bus stops; you can wait at a stop, board, ride and get off. */

type P = { x: number; z: number; v: number };

export class Path {
  pts: P[];
  cum: number[] = [0];
  length: number;
  constructor(pts: P[]) {
    this.pts = pts;
    for (let i = 1; i < pts.length; i++)
      this.cum.push(this.cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z));
    this.length = this.cum[this.cum.length - 1];
  }
  private i = 0;
  at(s: number) {
    s = ((s % this.length) + this.length) % this.length;
    // the last index is a good start: vehicles move forward a little each frame
    let i = this.i;
    if (this.cum[i] > s || (this.cum[i + 1] ?? Infinity) < s) {
      let lo = 0,
        hi = this.cum.length - 2;
      while (lo < hi) {
        const m = (lo + hi + 1) >> 1;
        if (this.cum[m] <= s) lo = m;
        else hi = m - 1;
      }
      i = lo;
    }
    this.i = i;
    const a = this.pts[i],
      b = this.pts[Math.min(i + 1, this.pts.length - 1)];
    const seg = this.cum[i + 1] - this.cum[i] || 1;
    const t = (s - this.cum[i]) / seg;
    return {
      x: a.x + (b.x - a.x) * t,
      z: a.z + (b.z - a.z) * t,
      h: Math.atan2(-(b.z - a.z), b.x - a.x),
      v: Math.min(a.v, b.v),
    };
  }
  /** The distance along the path closest to a point. */
  nearest(x: number, z: number) {
    let best = Infinity,
      bs = 0;
    for (let i = 0; i < this.pts.length - 1; i++) {
      const a = this.pts[i],
        b = this.pts[i + 1];
      const dx = b.x - a.x,
        dz = b.z - a.z,
        L2 = dx * dx + dz * dz || 1;
      const t = THREE.MathUtils.clamp(((x - a.x) * dx + (z - a.z) * dz) / L2, 0, 1);
      const d = Math.hypot(a.x + dx * t - x, a.z + dz * t - z);
      if (d < best) {
        best = d;
        bs = this.cum[i] + t * Math.sqrt(L2);
      }
    }
    return { s: bs, d: best };
  }
}

/** Points along a road's centre line, shifted to the right-hand lane. */
function lane(center: [number, number][], off: number, v: number): P[] {
  const out: P[] = [];
  for (let i = 0; i < center.length; i++) {
    const nrm = (a: [number, number], b: [number, number]) => {
      const dx = b[0] - a[0],
        dz = b[1] - a[1],
        L = Math.hypot(dx, dz) || 1;
      return [-dz / L, dx / L];
    };
    const n1 = i > 0 ? nrm(center[i - 1], center[i]) : null;
    const n2 = i < center.length - 1 ? nrm(center[i], center[i + 1]) : null;
    let nx = (n1?.[0] ?? 0) + (n2?.[0] ?? 0),
      nz = (n1?.[1] ?? 0) + (n2?.[1] ?? 0);
    const L = Math.hypot(nx, nz) || 1;
    nx /= L;
    nz /= L;
    out.push({ x: center[i][0] + nx * off, z: center[i][1] + nz * off, v });
  }
  return out;
}

/** The Hajj sites: pilgrims on foot, no cars, buses or taxis driving through. */
export const NO_TRAFFIC = new Set(["mina", "arafat"]);
const sideOf = (d: District) => (d.origin.x > centerOf(d).x ? -1 : 1);
export const roadEndOf = (d: District): [number, number] => [
  d.origin.x + sideOf(d) * (halfOf(d).x - 6),
  d.origin.z,
];
const RING = 23;

/** A tour through the whole city: out of the City Junction to each area and back. */
function tourPath(order: string[]) {
  const pts: P[] = [];
  const C = centerOf(districtById(order[0]));
  const angleOf = (d: District) => {
    const [x, z] = roadEndOf(d);
    return Math.atan2(z - C.z, x - C.x);
  };
  let prevAngle: number | null = null;
  for (const id of order) {
    const d = DISTRICTS.find((x) => x.id === id)!;
    const a = angleOf(d);
    // round the roundabout (always the same way) to this area's exit
    if (prevAngle !== null) {
      let b = prevAngle;
      let to = a;
      while (to <= b) to += Math.PI * 2;
      for (b += 0.2; b < to; b += 0.2)
        pts.push({ x: C.x + Math.cos(b) * RING, z: C.z + Math.sin(b) * RING, v: 9 });
    }
    const ring: [number, number] = [C.x + Math.cos(a) * 30, C.z + Math.sin(a) * 30];
    const near = roadEndOf(d);
    const far: [number, number] = [d.origin.x - sideOf(d) * (halfOf(d).x - 20), d.origin.z];
    const inArea = (q: P) =>
      Math.abs(q.x - d.origin.x) < halfOf(d).x - 8 && Math.abs(q.z - d.origin.z) < 30;
    const leg = (c: [number, number][]) =>
      lane(c, 3.3, 20).map((q) => (inArea(q) ? { ...q, v: 11 } : q));
    pts.push(...leg([ring, near, far]));
    pts.push(...leg([far, near, ring]));
    prevAngle = a;
  }
  // close the loop round the roundabout
  const first = DISTRICTS.find((x) => x.id === order[0])!;
  let b = prevAngle!;
  let to = angleOf(first);
  while (to <= b) to += Math.PI * 2;
  for (b += 0.2; b < to; b += 0.2)
    pts.push({ x: C.x + Math.cos(b) * RING, z: C.z + Math.sin(b) * RING, v: 9 });
  pts.push({ ...pts[0] });
  return new Path(pts);
}

/** Up and down one street inside an area. */
function streetLoop(d: District, z: number, v = 10) {
  const x0 = d.origin.x - (halfOf(d).x - 20),
    x1 = d.origin.x + (halfOf(d).x - 20),
    zz = d.origin.z + z;
  const pts = [
    ...lane(
      [
        [x0, zz],
        [x1, zz],
      ],
      3,
      v,
    ),
    ...lane(
      [
        [x1, zz],
        [x0, zz],
      ],
      3,
      v,
    ),
  ];
  pts.push({ ...pts[0] });
  return new Path(pts);
}

export type Vehicle = {
  kind: VehicleKind;
  mesh: THREE.Mesh;
  path: Path;
  s: number;
  v: number;
  vmax: number;
  dwell: number;
  lastStop: number;
  /** a passenger asked to get off at the next stop */
  stopNext?: boolean;
  lastHail: number;
  half: number;
};
export type BusStop = {
  id: string;
  path: Path;
  /** turn of the shelter so its back faces away from the road */
  rot: number;
  district: string;
  name: string;
  s: number;
  /** where people wait, on the pavement */
  x: number;
  z: number;
  heading: number;
};

export class Traffic {
  vehicles: Vehicle[] = [];
  tour: Path;
  /** every city's danfo loop */
  tours: Path[] = [];
  shuttle!: Path;
  shuttles: Path[] = [];
  stops: BusStop[] = [];
  /** set by the game: the stop the player is waiting at */
  waitingAt: string | null = null;
  /** set by the game: the bus the player is riding */
  riding: Vehicle | null = null;
  fast = false;
  /** where a walking player stands (kekes stop for them) */
  hail: { x: number; z: number } | null = null;
  onStop?: (bus: Vehicle, stop: BusStop) => void;
  private rnd: () => number;

  constructor(
    private scene: THREE.Scene,
    rnd: () => number,
  ) {
    this.rnd = rnd;
    // the danfo loop visits every main area in turn round the City Junction
    // one danfo loop per city
    const tours = new Map<string, Path>();
    const tours2: Path[] = [];
    for (const city of Object.keys(CITY_CENTER)) {
      const C = CITY_CENTER[city];
      const roots = DISTRICTS.filter((d) => !d.parent && cityOf(d) === city)
        .map((d) => {
          const [x, z] = roadEndOf(d);
          return { id: d.id, a: Math.atan2(z - C.z, x - C.x) };
        })
        .sort((a, b) => a.a - b.a)
        .map((r) => r.id);
      if (!roots.length) continue;
      tours.set(city, tourPath(roots));
      const half = [...roots.slice(2), ...roots.slice(0, 2)].filter((_, i) => i % 2 === 0);
      if (half.length > 1) tours2.push(tourPath(half));
    }
    this.tour = tours.get("lagos")!;
    this.tours = [...tours.values()];

    // two bus stops per area, one on each side of the main street
    for (const d of DISTRICTS) {
      if (d.parent) continue;
      const sd = sideOf(d);
      for (const dir of [1, -1]) {
        // dir 1: coming into the area, dir -1: leaving it
        const x = d.origin.x + sd * 70;
        const travel = dir === 1 ? -sd : sd; // +1 = going east
        const z = d.origin.z + travel * 8.6; // the right-hand pavement
        const tour = tours.get(cityOf(d))!;
        const near = tour.nearest(x, d.origin.z + travel * 3);
        this.stops.push({
          id: `${d.id}-${dir > 0 ? "in" : "out"}`,
          path: tour,
          rot: z > d.origin.z ? 0 : Math.PI,
          district: d.id,
          name: `${d.busStop ?? d.name} Bus Stop`,
          s: near.s,
          x,
          z,
          heading: travel > 0 ? 0 : Math.PI,
        });
      }
    }
    // shuttles along the roads that join linked areas: up Ikorodu Road to the market,
    // Isheri–Igando Road to Powerline, Ajah–Badore Road to Badore
    this.shuttles = [];
    const branches: [District, District][] = [];
    for (const root of DISTRICTS.filter((d) => !d.parent))
      for (const child of DISTRICTS.filter((c) => c.parent === root.id))
        branches.push([root, child]);
    for (const [root, first] of branches) {
      let chain: District[] = [root, first];
      for (;;) {
        const next = DISTRICTS.find((d) => d.parent === chain[chain.length - 1].id);
        if (!next) break;
        chain.push(next);
      }
      // buses go as far as the gate of Mina, not on into the Hajj sites
      const cut = chain.findIndex((d) => NO_TRAFFIC.has(d.id));
      const gate = cut > 0 ? chain[cut] : null;
      if (cut > 0) chain = chain.slice(0, cut);
      if (chain.length < 2 && !gate) continue;
      const east = (gate ?? chain[1]).link === "east";
      const top = chain[chain.length - 1];
      let sp: P[];
      if (east) {
        const z = root.origin.z,
          xs = root.origin.x + 30,
          xe = top.origin.x + (halfOf(top).x - 22);
        sp = [
          ...lane(
            [
              [xs, z],
              [xe, z],
            ],
            3.3,
            13,
          ),
          ...lane(
            [
              [xe, z],
              [xs, z],
            ],
            3.3,
            13,
          ),
        ];
      } else {
        const cx = root.origin.x,
          zs = root.origin.z + 40,
          ze = gate ? gate.origin.z + halfOf(gate).z + 14 : top.origin.z - (halfOf(top).z - 12);
        sp = [
          ...lane(
            [
              [cx, zs],
              [cx, ze],
            ],
            3.3,
            14,
          ),
          ...lane(
            [
              [cx, ze],
              [cx, zs],
            ],
            3.3,
            14,
          ),
        ];
      }
      sp.push({ ...sp[0] });
      const path = new Path(sp);
      this.shuttles.push(path);
      for (const d of chain)
        for (const fwd of [true, false]) {
          // fwd: travelling away from the root (north, or east)
          let x: number, z: number, laneX: number, laneZ: number, rot: number;
          if (east) {
            x = d.origin.x + 22;
            z = d.origin.z + (fwd ? 8.6 : -8.6);
            laneX = x;
            laneZ = d.origin.z + (fwd ? 3.3 : -3.3);
            rot = fwd ? 0 : Math.PI;
          } else {
            x = root.origin.x + (fwd ? 8.6 : -8.6);
            z = d.origin.z + 22;
            laneX = root.origin.x + (fwd ? 3.3 : -3.3);
            laneZ = z;
            rot = fwd ? Math.PI / 2 : -Math.PI / 2;
          }
          this.stops.push({
            id: `${d.id}-${east ? (fwd ? "e" : "w") : fwd ? "n" : "s"}`,
            path,
            rot,
            district: d.id,
            name: `${d.busStop ?? d.name} Bus Stop`,
            s: path.nearest(laneX, laneZ).s,
            x,
            z,
            heading: rot,
          });
        }
    }
    this.shuttle = this.shuttles[0];
    this.stops.sort((a, b) => a.s - b.s);

    const add = (kind: VehicleKind, path: Path, s: number, color?: number) => {
      // Makkah and Madinah (far west on the world map) have city buses and taxis
      const saudi = path.at(0).x < -3000;
      const mesh = vehicleMesh(kind, color ?? randomCarColor(rnd), saudi);
      scene.add(mesh);
      const vmax = VEHICLE_INFO[kind].top * (0.75 + rnd() * 0.25);
      this.vehicles.push({
        kind,
        mesh,
        path,
        s,
        v: 0,
        vmax,
        dwell: 0,
        lastStop: -1,
        lastHail: 0,
        half: VEHICLE_INFO[kind].length / 2,
      });
    };
    for (const tour of this.tours) {
      const L = tour.length;
      for (let i = 0; i < 4; i++) add("danfo", tour, (L / 4) * i + 40);
      add("hisbah", tour, L * 0.6);
    }
    const kinds: VehicleKind[] = [
      "sedan",
      "small",
      "suv",
      "sedan",
      "luxury",
      "pickup",
      "small",
      "sedan",
    ];
    for (const tour of this.tours) {
      // Lagos roads are busy
      const n = tour === this.tour ? 22 : 10;
      for (let i = 0; i < n; i++) add(kinds[i % kinds.length], tour, (tour.length / n) * i + 120);
    }
    // lorries on the expressways: trailers, fuel tankers and tippers
    const lorries: [VehicleKind, number][] = [
      ["truck", 0x1f4f9a],
      ["tanker", 0xf4f4f0],
      ["tipper", 0xc8862a],
      ["truck", 0xc8262a],
      ["truck", 0x2d5a3d],
      ["tanker", 0xf2c230],
      ["tipper", 0x3a3f46],
      ["truck", 0xf4f4f0],
    ];
    for (const tour of this.tours) {
      // Lagos gets most of them; Ilorin and the Saudi cities a few
      const n = tour === this.tour ? 16 : 4;
      for (let i = 0; i < n; i++) {
        const [k, c] = lorries[i % lorries.length];
        add(k, tour, (tour.length / n) * i + 260, c);
      }
    }
    for (const tour2 of tours2)
      for (let i = 0; i < 8; i++) add(kinds[(i + 3) % kinds.length], tour2, (tour2.length / 8) * i);
    for (const sh of this.shuttles) {
      const SL = sh.length;
      add("danfo", sh, 30);
      add("danfo", sh, SL / 2 + 30);
      const n = Math.max(2, Math.round(SL / 300));
      for (let i = 0; i < n; i++) add(kinds[(i + 1) % kinds.length], sh, (SL / n) * i + 80);
    }
    for (const d of DISTRICTS) {
      if (NO_TRAFFIC.has(d.id)) continue;
      d.streets.forEach((st, k) => {
        const p = streetLoop(d, st.z, k === 0 ? 11 : 8);
        if (k === 0) {
          add("keke", p, rnd() * p.length, 0xf2c230);
          add(kinds[Math.floor(rnd() * kinds.length)], p, rnd() * p.length);
        } else
          add(
            rnd() < 0.5 ? "keke" : kinds[Math.floor(rnd() * kinds.length)],
            p,
            rnd() * p.length,
            rnd() < 0.5 ? 0x2f9a4a : undefined,
          );
      });
    }
    for (const v of this.vehicles) this.place(v);
  }

  private place(v: Vehicle) {
    const p = v.path.at(v.s);
    v.mesh.position.set(p.x, 0, p.z);
    v.mesh.rotation.y = p.h;
  }

  /** Bring a danfo to the stop the player is waiting at, arriving in a few seconds. */
  summon(stopId: string) {
    const stop = this.stops.find((s) => s.id === stopId);
    if (!stop) return;
    const L = stop.path.length;
    const ahead = (b: Vehicle) => (((stop.s - b.s) % L) + L) % L;
    const buses = this.vehicles.filter(
      (b) => b.kind === "danfo" && b !== this.riding && b.path === stop.path,
    );
    const soon = buses.find((b) => ahead(b) < 160);
    if (soon) return;
    const b = buses.sort((x, y) => ahead(x) - ahead(y))[buses.length - 1];
    // drop it in somewhere on the road with no other vehicle there
    for (const back of [90, 105, 120, 140, 160, 75, 60]) {
      const p = stop.path.at(stop.s - back);
      const clear = this.vehicles.every(
        (u) => u === b || Math.hypot(u.mesh.position.x - p.x, u.mesh.position.z - p.z) > 12,
      );
      b.s = (((stop.s - back) % L) + L) % L;
      if (clear) break;
    }
    b.v = 10;
    b.dwell = 0;
    this.place(b);
  }
  /** The bus now waiting at the player's stop, if any. */
  busAt(stopId: string) {
    const stop = this.stops.find((s) => s.id === stopId);
    if (!stop) return null;
    return (
      this.vehicles.find(
        (b) =>
          b.kind === "danfo" && b.path === stop.path && b.dwell > 0 && Math.abs(b.s - stop.s) < 4,
      ) ?? null
    );
  }
  nextStop(b: Vehicle) {
    const L = b.path.length;
    let best: BusStop | null = null,
      bd = Infinity;
    for (const st of this.stops) {
      if (st.path !== b.path) continue;
      const d = (((st.s - b.s) % L) + L) % L;
      if (d > 3 && d < bd) {
        bd = d;
        best = st;
      }
    }
    return best;
  }

  private tmp = new THREE.Vector2();
  update(dt: number, obstacles: { x: number; z: number; r: number }[], cam: THREE.Vector3) {
    const vs = this.vehicles;
    for (const v of vs) {
      if (v.dwell > 0) {
        v.dwell -= dt;
        v.v = 0;
        continue;
      }
      const p = v.path.at(v.s);
      const fx = Math.cos(p.h),
        fz = -Math.sin(p.h);
      let target = Math.min(v.vmax, p.v * (v.kind === "keke" ? 0.8 : 1));
      if (v === this.riding && this.fast) target *= 2.2;
      const look = 3 + v.half + v.v * 0.9;
      // r: how far the thing reaches along the road; w: half its width
      const block = (x: number, z: number, r: number, w: number) => {
        const dx = x - v.mesh.position.x,
          dz = z - v.mesh.position.z;
        const fwd = dx * fx + dz * fz,
          lat = Math.abs(-dx * fz + dz * fx);
        if (fwd > 0 && fwd < look + r && lat < 1.1 + w)
          target = Math.min(target, Math.max(0, (fwd - v.half - r - 2) * 1.6));
      };
      for (const o of obstacles) block(o.x, o.z, o.r, o.r);
      // a keke slows down beside someone standing at the roadside, in case they want a ride
      if (v.kind === "keke" && this.hail && v.mesh.visible) {
        const d = Math.hypot(this.hail.x - v.mesh.position.x, this.hail.z - v.mesh.position.z);
        if (d < 5 && v.lastHail < performance.now() - 15000) {
          v.dwell = 5;
          v.lastHail = performance.now();
        }
      }
      for (const u of vs)
        if (u !== v && u.mesh.visible !== false)
          block(u.mesh.position.x, u.mesh.position.z, u.half, 1);
      // danfos stop at bus stops
      if (v.kind === "danfo") {
        const L = v.path.length;
        for (let i = 0; i < this.stops.length; i++) {
          const st = this.stops[i];
          if (st.path !== v.path) continue;
          const d = (((st.s - v.s) % L) + L) % L;
          if (i === v.lastStop) continue;
          const back = L - d; // just passed it
          if (d > 160 && !(back < 4 && v === this.riding && v.stopNext)) continue;
          const want =
            this.waitingAt === st.id ||
            (v === this.riding && v.stopNext) ||
            (v !== this.riding && (i * 7 + v.mesh.id) % 3 === 0);
          if (!want) continue;
          if (d < 0.6 || back < 4) {
            v.dwell = v === this.riding ? 3 : 4.5;
            v.lastStop = i;
            v.s = st.s;
            v.v = 0;
            this.onStop?.(v, st);
            break;
          }
          target = Math.min(target, Math.max(1.2, Math.sqrt(2 * 8 * d)));
        }
      }
      const acc = target > v.v ? 6 : 14;
      v.v += THREE.MathUtils.clamp(target - v.v, -acc * dt, acc * dt);
      // never drive into the vehicle in front
      const ns = (v.s + v.v * dt) % v.path.length;
      const np = v.path.at(ns);
      let hit = false;
      for (const u of vs) {
        if (u === v) continue;
        const dx = u.mesh.position.x - np.x,
          dz = u.mesh.position.z - np.z;
        const fwd = dx * fx + dz * fz,
          lat = Math.abs(-dx * fz + dz * fx);
        if (fwd > 0 && fwd < v.half + u.half + 0.6 && lat < 2.1) {
          hit = true;
          break;
        }
      }
      if (hit) {
        v.v = 0;
        continue;
      }
      v.s = ns;
      const q = v.path.at(v.s);
      v.mesh.position.set(q.x, 0, q.z);
      // turn smoothly
      let dh = q.h - v.mesh.rotation.y;
      while (dh > Math.PI) dh -= Math.PI * 2;
      while (dh < -Math.PI) dh += Math.PI * 2;
      v.mesh.rotation.y += dh * Math.min(1, dt * 8);
      this.tmp.set(q.x - cam.x, q.z - cam.z);
      v.mesh.visible = this.tmp.lengthSq() < 320 * 320;
    }
  }
}
