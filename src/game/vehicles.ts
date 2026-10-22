import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/* Vehicles of IlmCity. Each one is a single coloured mesh (one draw call), facing +x.
   No real brand names or logos: the luxury car is simply "the executive saloon". */

export type VehicleKind =
  | "small"
  | "sedan"
  | "suv"
  | "luxury"
  | "danfo"
  | "keke"
  | "hisbah"
  | "pickup"
  | "truck"
  | "tanker"
  | "tipper";

export const VEHICLE_INFO: Record<
  VehicleKind,
  { name: string; blurb: string; length: number; width: number; top: number }
> = {
  small: {
    name: "City Hatch",
    blurb: "Small, cheap to run, easy to park.",
    length: 3.6,
    width: 1.7,
    top: 24,
  },
  sedan: {
    name: "Family Saloon",
    blurb: "Comfortable for the whole family.",
    length: 4.5,
    width: 1.85,
    top: 30,
  },
  pickup: {
    name: "Work Pickup",
    blurb: "Carries market goods and building blocks.",
    length: 5.0,
    width: 1.95,
    top: 28,
  },
  suv: {
    name: "Jeep SUV",
    blurb: "High seat, strong engine, made for any road.",
    length: 4.8,
    width: 2.0,
    top: 33,
  },
  luxury: {
    name: "Executive Saloon",
    blurb: "Long, quiet and fast. The top car in Lagos.",
    length: 5.2,
    width: 1.95,
    top: 38,
  },
  danfo: { name: "Danfo", blurb: "The yellow bus of Lagos.", length: 5.8, width: 2.1, top: 22 },
  keke: { name: "Keke", blurb: "Three wheels, always around.", length: 2.6, width: 1.3, top: 16 },
  truck: {
    name: "Trailer",
    blurb: "A long trailer carrying goods across the country.",
    length: 11,
    width: 2.5,
    top: 20,
  },
  tanker: {
    name: "Fuel Tanker",
    blurb: "Carries petrol to the filling stations.",
    length: 9.5,
    width: 2.5,
    top: 19,
  },
  tipper: {
    name: "Tipper",
    blurb: "Sand and gravel for building sites.",
    length: 7.5,
    width: 2.45,
    top: 20,
  },
  hisbah: {
    name: "Hisbah Patrol",
    blurb: "The Hisbah patrol van.",
    length: 5.6,
    width: 2.1,
    top: 22,
  },
};

const material = new THREE.MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.45,
  metalness: 0.25,
});

type Piece = THREE.BufferGeometry;
function colored(g: THREE.BufferGeometry, color: number) {
  const geo = g.index ? g.toNonIndexed() : g;
  g.dispose();
  const c = new THREE.Color(color).convertSRGBToLinear();
  const n = geo.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) arr.set([c.r, c.g, c.b], i * 3);
  geo.setAttribute("color", new THREE.Float32BufferAttribute(arr, 3));
  if (!geo.attributes.uv)
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(n * 2), 2));
  return geo;
}
/** A box from y0 up, optionally narrowing at the top (for windscreens). */
function bx(
  w: number,
  h: number,
  d: number,
  color: number,
  x: number,
  y0: number,
  z: number,
  topX = 1,
  topZ = 1,
  shiftX = 0,
) {
  const g = new THREE.BoxGeometry(w, h, d);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++)
    if (p.getY(i) > 0) {
      p.setX(i, p.getX(i) * topX + shiftX);
      p.setZ(i, p.getZ(i) * topZ);
    }
  g.computeVertexNormals();
  g.translate(x, y0 + h / 2, z);
  return colored(g, color);
}
function wheel(x: number, z: number, r: number, w = 0.3): Piece[] {
  const t = new THREE.CylinderGeometry(r, r, w, 16);
  t.rotateX(Math.PI / 2);
  t.translate(x, r, z);
  const rim = new THREE.CylinderGeometry(r * 0.55, r * 0.55, w + 0.02, 10);
  rim.rotateX(Math.PI / 2);
  rim.translate(x, r, z);
  return [colored(t, 0x17181a), colored(rim, 0xb8bcc2)];
}

const GLASS = 0x1e2a33,
  BLACK = 0x1a1b1d,
  CHROME = 0xd8dce0,
  LIGHT = 0xfff6d8,
  TAIL = 0xc8262a;

function car(kind: VehicleKind, color: number): Piece[] {
  const I = VEHICLE_INFO[kind];
  const L = I.length,
    W = I.width;
  const out: Piece[] = [];
  const r = kind === "suv" ? 0.46 : kind === "small" ? 0.34 : 0.38;
  const bodyH = kind === "suv" ? 0.95 : kind === "luxury" ? 0.62 : kind === "small" ? 0.72 : 0.7;
  const y0 = r * 0.95;
  out.push(bx(L, bodyH, W, color, 0, y0, 0, 0.98, 0.96));
  // cabin
  const cabL = kind === "small" ? L * 0.62 : kind === "suv" ? L * 0.66 : L * 0.52;
  const cabH = kind === "suv" ? 0.85 : kind === "small" ? 0.75 : 0.66;
  const cabX = kind === "small" ? -L * 0.08 : kind === "suv" ? -L * 0.1 : -L * 0.06;
  if (kind === "pickup") {
    out.push(bx(L * 0.36, 0.75, W * 0.94, GLASS, L * 0.12, y0 + bodyH, 0, 0.8, 0.9, -0.12));
    out.push(bx(L * 0.3, 0.06, W * 0.84, color, L * 0.1, y0 + bodyH + 0.75, 0));
    out.push(bx(L * 0.45, 0.45, 0.08, color, -L * 0.25, y0 + bodyH, W * 0.46));
    out.push(bx(L * 0.45, 0.45, 0.08, color, -L * 0.25, y0 + bodyH, -W * 0.46));
    out.push(bx(0.08, 0.45, W * 0.9, color, -L * 0.48, y0 + bodyH, 0));
  } else {
    const slope = kind === "suv" ? 0.88 : 0.72;
    out.push(bx(cabL, cabH, W * 0.92, GLASS, cabX, y0 + bodyH, 0, slope, 0.88));
    // roof and pillars in the body colour
    out.push(bx(cabL * slope * 0.96, 0.07, W * 0.82, color, cabX, y0 + bodyH + cabH - 0.02, 0));
    for (const s of [1, -1])
      out.push(bx(0.12, cabH, 0.05, color, cabX, y0 + bodyH, s * W * 0.43, 1, 1));
    if (kind === "suv") {
      for (const s of [1, -1])
        out.push(bx(cabL * 0.7, 0.06, 0.06, BLACK, cabX, y0 + bodyH + cabH + 0.05, s * W * 0.36));
      out.push(bx(0.25, 0.7, 0.7, BLACK, -L / 2 - 0.1, y0 + 0.25, 0)); // spare wheel
    }
  }
  // lights, grille, bumpers, mirrors
  for (const s of [1, -1]) {
    out.push(bx(0.06, 0.18, W * 0.22, LIGHT, L / 2, y0 + bodyH * 0.55, s * W * 0.33));
    out.push(bx(0.06, 0.16, W * 0.2, TAIL, -L / 2, y0 + bodyH * 0.6, s * W * 0.34));
    out.push(bx(0.18, 0.12, 0.2, color, cabX + cabL * 0.32, y0 + bodyH + 0.08, s * (W / 2 + 0.06)));
  }
  out.push(
    bx(
      0.06,
      bodyH * 0.35,
      W * 0.36,
      kind === "luxury" ? CHROME : BLACK,
      L / 2 + 0.01,
      y0 + bodyH * 0.18,
      0,
    ),
  );
  out.push(
    bx(0.2, 0.22, W * 1.01, kind === "luxury" ? CHROME : 0x2a2c30, L / 2 - 0.05, y0 - 0.02, 0),
  );
  out.push(bx(0.2, 0.22, W * 1.01, 0x2a2c30, -L / 2 + 0.05, y0 - 0.02, 0));
  if (kind === "luxury")
    for (const s of [1, -1])
      out.push(bx(L * 0.8, 0.04, 0.02, CHROME, 0, y0 + bodyH * 0.55, s * (W / 2 + 0.005)));
  const wx = L / 2 - r - 0.35;
  for (const x of [wx, -wx]) for (const s of [1, -1]) out.push(...wheel(x, s * (W / 2 - 0.12), r));
  return out;
}

function bus(kind: "danfo" | "hisbah" | "citybus"): Piece[] {
  const L = 5.8,
    W = 2.1,
    r = 0.42;
  const main = kind === "danfo" ? 0xf2c230 : 0xf4f4f0;
  const stripe = kind === "danfo" ? 0x111111 : kind === "citybus" ? 0x0e6b3a : 0x1d7a3a;
  const out: Piece[] = [];
  out.push(bx(L, 1.0, W, main, 0, r, 0));
  out.push(bx(L * 0.98, 0.9, W, GLASS, -0.05, r + 1.0, 0, 1, 1));
  out.push(bx(L * 0.98, 0.25, W * 1.0, main, -0.05, r + 1.9, 0, 0.98, 0.96));
  out.push(bx(0.3, 0.9, W * 0.9, GLASS, L / 2 - 0.1, r + 1.0, 0, 0.5, 1, -0.1)); // sloped windscreen
  for (const s of [1, -1]) {
    out.push(bx(L * 1.002, 0.12, 0.02, stripe, 0, r + 0.55, s * (W / 2 + 0.005)));
    out.push(bx(L * 1.002, 0.12, 0.02, stripe, 0, r + 0.8, s * (W / 2 + 0.005)));
    for (let i = 0; i < 5; i++)
      out.push(bx(0.08, 0.9, 0.02, main, -L / 2 + 0.5 + i * 1.15, r + 1.0, s * (W / 2 + 0.005)));
    out.push(bx(0.06, 0.2, 0.35, LIGHT, L / 2, r + 0.55, s * 0.7));
    out.push(bx(0.06, 0.2, 0.3, TAIL, -L / 2, r + 0.6, s * 0.75));
  }
  out.push(bx(0.2, 0.24, W * 1.01, 0x2a2c30, L / 2 - 0.05, r - 0.05, 0));
  if (kind === "citybus") {
    // the city bus: air-conditioning on the roof and a destination board
    out.push(bx(2.2, 0.3, 1.5, 0xdcdcd8, -0.6, r + 2.15, 0));
    out.push(bx(0.06, 0.25, W * 0.7, 0x111111, L / 2 + 0.01, r + 1.72, 0));
    out.push(bx(0.07, 0.12, W * 0.5, 0xf2a03a, L / 2 + 0.02, r + 1.72, 0));
  } else if (kind === "danfo") {
    // roof rack with a bag on it
    for (const x of [-1.8, 0, 1.4]) out.push(bx(0.06, 0.12, W * 0.9, BLACK, x, r + 2.15, 0));
    out.push(bx(1.2, 0.35, 1.0, 0x6a3f8a, -0.6, r + 2.27, 0));
  } else {
    out.push(bx(0.5, 0.18, 1.4, 0x1d7a3a, 0.6, r + 2.15, 0));
    out.push(bx(0.3, 0.14, 0.45, 0x2fd06a, 0.6, r + 2.33, 0.35));
    out.push(bx(0.3, 0.14, 0.45, 0xffffff, 0.6, r + 2.33, -0.35));
  }
  for (const x of [L / 2 - 1.1, -L / 2 + 1.1])
    for (const s of [1, -1]) out.push(...wheel(x, s * (W / 2 - 0.14), r));
  return out;
}

/** Lorries: a cab at the front (+x) and a trailer, a fuel tank or a tipper body behind. */
function lorry(kind: "truck" | "tanker" | "tipper", color: number): Piece[] {
  const I = VEHICLE_INFO[kind];
  const L = I.length,
    W = I.width,
    r = 0.52;
  const out: Piece[] = [];
  const cabL = 2.2;
  const cx = L / 2 - cabL / 2;
  // the chassis
  out.push(bx(L - 0.4, 0.3, W * 0.7, 0x2a2c30, -0.2, r * 0.8, 0));
  // the cab: painted, a big windscreen, a sun visor and mirrors
  out.push(bx(cabL, 1.5, W, color, cx, r + 0.2, 0));
  out.push(bx(cabL * 0.98, 0.9, W * 0.98, color, cx, r + 1.7, 0, 0.94, 0.98));
  out.push(bx(0.05, 0.75, W * 0.86, GLASS, L / 2 + 0.01, r + 1.75, 0));
  for (const s of [1, -1]) {
    out.push(bx(cabL * 0.5, 0.6, 0.04, GLASS, cx + 0.2, r + 1.8, s * (W / 2 + 0.01)));
    out.push(bx(0.08, 0.5, 0.12, BLACK, L / 2 - 0.1, r + 1.6, s * (W / 2 + 0.25)));
    out.push(bx(0.06, 0.22, 0.4, LIGHT, L / 2 + 0.02, r + 0.55, s * (W * 0.32)));
    out.push(bx(0.06, 0.2, 0.3, TAIL, -L / 2 + 0.02, r + 0.6, s * (W * 0.36)));
  }
  out.push(bx(0.12, 0.35, W * 1.02, 0x2a2c30, L / 2 - 0.05, r - 0.1, 0)); // bumper
  out.push(bx(0.06, 0.5, W * 0.5, CHROME, L / 2 + 0.01, r + 0.7, 0)); // grille
  const back = L - cabL - 0.3;
  const bx0 = -L / 2 + back / 2;
  if (kind === "truck") {
    // a tall box trailer
    out.push(bx(back, 2.6, W, 0xeeeeea, bx0, r + 0.6, 0));
    for (const s of [1, -1])
      out.push(bx(back * 0.96, 0.5, 0.02, color, bx0, r + 2.4, s * (W / 2 + 0.005)));
  } else if (kind === "tanker") {
    // a round silver fuel tank with a red band
    const t = new THREE.CylinderGeometry(1.15, 1.15, back, 18);
    t.rotateZ(Math.PI / 2);
    t.translate(bx0, r + 0.6 + 1.15, 0);
    out.push(colored(t, 0xd6dadf));
    const band = new THREE.CylinderGeometry(1.17, 1.17, 0.5, 18);
    band.rotateZ(Math.PI / 2);
    band.translate(bx0, r + 0.6 + 1.15, 0);
    out.push(colored(band, 0xc8262a));
    out.push(bx(back * 0.8, 0.12, 0.6, 0x9aa0a6, bx0, r + 2.9, 0)); // catwalk on top
  } else {
    // an open steel tipper body full of sand
    out.push(bx(back, 1.2, W, color, bx0, r + 0.6, 0, 1.03, 1.03));
    out.push(bx(back * 0.95, 0.25, W * 0.9, 0xd9b77a, bx0, r + 1.6, 0, 0.8, 0.8));
  }
  const axles =
    kind === "truck" ? [L / 2 - 1.2, -L / 2 + 1.0, -L / 2 + 2.3] : [L / 2 - 1.2, -L / 2 + 1.3];
  for (const x of axles) for (const s of [1, -1]) out.push(...wheel(x, s * (W / 2 - 0.2), r, 0.4));
  return out;
}

function keke(color: number): Piece[] {
  const out: Piece[] = [];
  out.push(bx(2.3, 0.65, 1.25, color, -0.2, 0.3, 0, 1, 0.95));
  out.push(bx(0.5, 0.75, 0.7, color, 0.95, 0.3, 0, 0.6, 0.8)); // nose
  out.push(bx(0.08, 0.7, 1.0, GLASS, 0.85, 0.95, 0, 1, 0.9));
  out.push(bx(2.4, 0.08, 1.35, 0x1d6f3a, -0.25, 1.95, 0)); // canopy
  for (const [x, z] of [
    [0.8, 0.55],
    [0.8, -0.55],
    [-1.3, 0.62],
    [-1.3, -0.62],
  ])
    out.push(bx(0.05, 1.0, 0.05, BLACK, x, 0.95, z));
  out.push(bx(0.9, 0.5, 0.05, 0x1d6f3a, -0.9, 1.0, 0.64));
  out.push(bx(0.9, 0.5, 0.05, 0x1d6f3a, -0.9, 1.0, -0.64));
  out.push(...wheel(1.0, 0, 0.27, 0.16));
  out.push(...wheel(-1.0, 0.6, 0.29, 0.2));
  out.push(...wheel(-1.0, -0.6, 0.29, 0.2));
  return out;
}

const CAR_COLORS = [
  0xf4f4f2, 0x1a1a1c, 0x9aa0a6, 0x7a1f24, 0x1f3f7a, 0x2d5a3d, 0xc8c2b4, 0x3a3f46, 0xb0662a,
];
export const randomCarColor = (r: () => number) => CAR_COLORS[Math.floor(r() * CAR_COLORS.length)];

const cache = new Map<string, THREE.BufferGeometry>();
/** One mesh per vehicle, facing +x, wheels on the ground. */
/** `saudi`: in Makkah and Madinah the danfo is a white city bus and the keke is a taxi. */
export function vehicleMesh(kind: VehicleKind, color = 0xf4f4f2, saudi = false) {
  const key = kind + color + (saudi ? "sa" : "");
  let geo = cache.get(key);
  if (!geo) {
    const parts =
      saudi && kind === "danfo"
        ? bus("citybus")
        : saudi && kind === "keke"
          ? [...car("sedan", 0xf4f4f2), bx(0.8, 0.22, 0.4, 0xf2c230, -0.27, 1.72, 0)]
          : kind === "danfo" || kind === "hisbah"
            ? bus(kind)
            : kind === "keke"
              ? keke(color)
              : kind === "truck" || kind === "tanker" || kind === "tipper"
                ? lorry(kind, color)
                : car(kind, color);
    geo = mergeGeometries(parts, false)!;
    parts.forEach((p) => p.dispose());
    geo.computeBoundingSphere();
    cache.set(key, geo);
  }
  const m = new THREE.Mesh(geo, material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
