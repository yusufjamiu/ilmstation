import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  BILLBOARDS,
  STREETS,
  AD_EMAIL,
  DISTRICTS,
  CITY_CENTER,
  JUNCTION_NAME,
  centerOf,
  cityOf,
  houseStyleOf,
  isPrimeArea,
  districtById,
  halfOf,
  fullName,
  rootOf,
  regionOf,
  type Billboard,
  type District,
  type Landmark,
} from "./content";
import { darkness, type Clock } from "./time";
import { Soccer, type MatchState, type NetInput, type Slot, type Snapshot } from "./soccer";
import {
  Batch,
  fillingStation,
  MAT,
  MAT2,
  TARRED,
  campus,
  compound,
  faculty,
  field,
  groundGeo,
  hangout,
  sistersCorner,
  policeStation,
  mansion,
  office,
  powerLine,
  datePalmInto,
  MAT3,
  boxGeo,
  shopRow,
  stallRow,
  type Compound,
} from "./buildings";
import { Traffic, type Vehicle } from "./traffic";
import { RopeRig, type RopeMode, type RopeState } from "./rope";
import { Tennis, type Court, type TennisInput, type TennisSnap, type TennisState } from "./tennis";
import { VEHICLE_INFO, vehicleMesh, type VehicleKind } from "./vehicles";
import {
  forgetHuman,
  gesture,
  humansReady,
  makeHuman,
  poseHuman,
  releasePose,
  type Pose,
  setGait,
  sitHuman,
  tickHumans,
  type Outfit,
  rigBat,
  rigSwing,
  rigCarry,
  rigSweep,
  type Carry,
} from "./humans";

/* IlmCity 3D engine: one Lekki district, three interiors, a car and walking neighbours.
   Everything is built from simple low-poly shapes so the first load stays small. */

export type InteriorKind =
  "masjid" | "home" | "madrasah" | "restaurant" | "mall" | "upstairs" | "boutique";
export type Context = { id: string; label: string } | null;
export type EngineEvents = {
  onContext: (c: Context) => void;
  onAction: (id: string) => void;
  onPlace: (name: string) => void;
  /** The arrival drive into a new area started (true) or finished (false). */
  onCinematic?: (on: boolean) => void;
  /** an area of another city has just been built (its plots and shops need painting) */
  onAreaBuilt?: (id: string) => void;
  onRide?: (info: { next: string; stopping: boolean; fast: boolean; kmh: number } | null) => void;
};

type Box = { x0: number; x1: number; z0: number; z1: number };
export type WorkKind = "porter" | "caretaker" | "rider";
type JobStep = { x: number; z: number; label: string; act: "pick" | "drop" | "sweep" };
type Zone = {
  /** a zone for something not yet bought is switched off */
  off?: boolean;
  id: string;
  label: string;
  x: number;
  z: number;
  r: number;
  scene: "out" | InteriorKind;
};
type Walker = {
  g: THREE.Group;
  route: [number, number][];
  k: number;
  wait: number;
  t: number;
  name?: string;
  female?: boolean;
  district?: string;
  talking?: boolean;
  hisbah?: boolean;
  /** sits in one place (students at a meeting point) */
  seated?: boolean;
  /** a pilgrim in Makkah or Madinah: no name tag, does not stop to talk */
  pilgrim?: boolean;
};

const PALETTE = {
  grass: 0x8fae5d,
  sand: 0xe6d3a6,
  road: 0x4d5157,
  kerb: 0xd8ccb0,
  line: 0xf2c94c,
  water: 0x3f9db5,
  plaza: 0xeee5d0,
  dome: 0x2f8f83,
  gold: 0xe6b84a,
  white: 0xf4efe4,
  terracotta: 0xb8573a,
};

const mats = new Map<string, THREE.MeshStandardMaterial>();
function mat(color: number, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  const key = color + JSON.stringify(extra);
  let m = mats.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.9,
      metalness: 0,
      flatShading: true,
      ...extra,
    });
    mats.set(key, m);
  }
  return m;
}
type PlotState = {
  kind: "tolet" | "rented" | "land" | "owned" | "building" | "built" | "taken" | "forsale";
  floors?: number;
  by?: string;
  stage?: number;
};
type SignKind = "tolet" | "land" | "ownland" | "sold" | "building" | "mine" | "taken" | "forsale";
function box(w: number, h: number, d: number, color: number, x = 0, y = 0, z = 0, cast = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.position.set(x, y + h / 2, z);
  m.castShadow = cast;
  m.receiveShadow = true;
  return m;
}
function cyl(rt: number, rb: number, h: number, color: number, seg = 8) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(color));
  m.castShadow = true;
  return m;
}

/** A text sprite that always faces the camera. */
function label(
  text: string,
  opts: { bg?: string; fg?: string; size?: number; bold?: boolean } = {},
) {
  const size = opts.size ?? 1;
  const c = document.createElement("canvas"),
    ctx = c.getContext("2d")!;
  const font = `${opts.bold === false ? 500 : 700} 44px "Work Sans", system-ui, sans-serif`;
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width) + 48;
  c.width = w;
  c.height = 72;
  ctx.font = font;
  ctx.fillStyle = opts.bg ?? "rgba(16,32,30,0.85)";
  ctx.beginPath();
  ctx.roundRect(0, 0, w, 72, 20);
  ctx.fill();
  ctx.fillStyle = opts.fg ?? "#f4efe4";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, 38);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, depthWrite: false, transparent: true }),
  );
  s.scale.set((w / 72) * 0.9 * size, 0.9 * size, 1);
  s.renderOrder = 10;
  return s;
}

/** A two-sided sign: seen from behind, the picture is flipped so the words still read
    left to right (instead of showing mirror writing). */
function bothWays<T extends THREE.Material>(m: T): T {
  m.side = THREE.DoubleSide;
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace(
      "#include <map_fragment>",
      `#ifdef USE_MAP
        vec2 readUv = gl_FrontFacing ? vMapUv : vec2(1.0 - vMapUv.x, vMapUv.y);
        diffuseColor *= texture2D( map, readUv );
      #endif`,
    );
  };
  m.customProgramCacheKey = () => "both-ways";
  return m;
}

function canvasPlane(
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, W: number, H: number) => void,
  px = 512,
) {
  const c = document.createElement("canvas");
  c.width = px;
  c.height = Math.round((px * h) / w);
  const ctx = c.getContext("2d")!;
  draw(ctx, c.width, c.height);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    bothWays(new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })),
  );
  return { mesh: m, tex, canvas: c };
}

type Limbs = {
  armL: THREE.Object3D;
  armR: THREE.Object3D;
  legL: THREE.Object3D;
  legR: THREE.Object3D;
  body: THREE.Object3D;
};
const SKINS = [0x5a3620, 0x6b4428, 0x7a4e2e, 0x8d5a36, 0xa86f45, 0xc58b5c];
const smooth = new Map<number, THREE.MeshStandardMaterial>();
function skinMat(color: number) {
  let m = smooth.get(color);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: 0.75 });
    smooth.set(color, m);
  }
  return m;
}
function part(geo: THREE.BufferGeometry, color: number, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, skinMat(color));
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}
const capsule = (r: number, len: number) => new THREE.CapsuleGeometry(r, len, 4, 10);

/** A low-poly person with real arms and legs that swing when walking.
    Brothers wear a kaftan, trousers and kufi; sisters wear an abaya and hijab. */
function person(
  robe: number,
  opts: {
    cap?: number | null;
    hijab?: number;
    skin?: number;
    trousers?: number;
    seed?: number;
    outfit?: Outfit;
    beard?: boolean;
  } = {},
) {
  const g = new THREE.Group();
  const seed = opts.seed ?? Math.floor(robe % 7);
  const skin = opts.skin ?? SKINS[seed % SKINS.length];
  const female = opts.hijab !== undefined;
  if (humansReady()) {
    const h = makeHuman({
      outfit: opts.outfit ?? (female ? "abaya" : seed % 3 === 1 ? "kaftan" : "thobe"),
      robe,
      skin,
      trousers: opts.trousers ?? (seed % 2 ? 0x2d3138 : robe),
      cap: opts.cap === undefined ? 0xffffff : opts.cap,
      hijab: opts.hijab,
      beard: opts.beard ?? seed % 2 === 0,
      shoe: [0x2a1d14, 0x111111, 0x6b4a2e][seed % 3],
    });
    g.add(h);
    g.userData.human = true;
    const sh = new THREE.Mesh(
      new THREE.CircleGeometry(0.5, 20),
      new THREE.MeshBasicMaterial({
        color: 0,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
      }),
    );
    sh.rotation.x = -Math.PI / 2;
    sh.position.y = 0.02;
    g.add(sh);
    return g;
  }
  const trousers = opts.trousers ?? (female ? robe : 0x3a3f46);
  const body = new THREE.Group();
  g.add(body);

  // legs: pivot at the hip so they swing
  const leg = (side: number) => {
    const hip = new THREE.Group();
    hip.position.set(0.11 * side, 0.92, 0);
    hip.add(part(capsule(0.085, 0.62), female ? robe : trousers, 0, -0.42, 0));
    hip.add(part(new THREE.BoxGeometry(0.15, 0.09, 0.28), 0x2a2420, 0, -0.86, 0.05));
    body.add(hip);
    return hip;
  };
  const legL = leg(-1),
    legR = leg(1);

  // torso and clothing
  if (female) {
    const abaya = part(new THREE.CylinderGeometry(0.2, 0.36, 1.12, 14, 1, true), robe, 0, 0.66, 0);
    (abaya.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
    body.add(abaya);
    body.add(part(capsule(0.2, 0.36), robe, 0, 1.3, 0));
  } else {
    body.add(part(capsule(0.2, 0.4), robe, 0, 1.28, 0));
    body.add(part(new THREE.CylinderGeometry(0.21, 0.27, 0.42, 14), robe, 0, 0.9, 0));
  }

  // arms: pivot at the shoulder
  const arm = (side: number) => {
    const sh = new THREE.Group();
    sh.position.set(0.27 * side, 1.5, 0);
    sh.add(part(capsule(0.07, 0.5), robe, 0, -0.3, 0));
    sh.add(part(new THREE.SphereGeometry(0.07, 10, 8), skin, 0, -0.64, 0));
    body.add(sh);
    return sh;
  };
  const armL = arm(-1),
    armR = arm(1);

  // neck, head, face
  body.add(part(new THREE.CylinderGeometry(0.07, 0.08, 0.12, 10), skin, 0, 1.63, 0));
  const head = part(new THREE.SphereGeometry(0.16, 16, 12), skin, 0, 1.8, 0);
  head.scale.set(1, 1.08, 1);
  body.add(head);
  const eye = new THREE.SphereGeometry(0.022, 8, 6);
  body.add(part(eye, 0x1a1412, -0.055, 1.82, 0.145), part(eye, 0x1a1412, 0.055, 1.82, 0.145));
  if (female) {
    const open = 1.0;
    const hijab = part(
      new THREE.SphereGeometry(0.185, 18, 14, Math.PI / 2 + open, Math.PI * 2 - open * 2),
      opts.hijab!,
      0,
      1.81,
      0,
    );
    (hijab.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
    hijab.scale.set(1, 1.1, 1);
    body.add(hijab);
    body.add(part(new THREE.CylinderGeometry(0.17, 0.3, 0.3, 16), opts.hijab!, 0, 1.55, -0.01));
  } else {
    body.add(
      part(new THREE.CylinderGeometry(0.15, 0.16, 0.12, 16), opts.cap ?? 0xffffff, 0, 1.96, 0),
    );
    if (seed % 2 === 0) {
      const beard = part(
        new THREE.SphereGeometry(0.12, 12, 8, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.4),
        0x1d1712,
        0,
        1.79,
        0.035,
      );
      body.add(beard);
    }
  }

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.42, 16),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  g.add(shadow);
  g.userData.limbs = { armL, armR, legL, legR, body } satisfies Limbs;
  g.scale.setScalar(1.15);
  return g;
}

/** A passenger plane, nose along +z: body, wings, tail and engines. */
export function planeMesh(stripe: number) {
  const g = new THREE.Group();
  const white = 0xf4f6f8;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 22, 16), mat(white));
  body.rotation.x = Math.PI / 2;
  body.position.y = 2.6;
  const nose = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 10), mat(white));
  nose.scale.set(1, 1, 1.6);
  nose.position.set(0, 2.6, 11);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(1.5, 4, 16), mat(white));
  tail.rotation.x = -Math.PI / 2;
  tail.position.set(0, 2.6, -13);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(1.52, 1.52, 18, 16, 1, true), mat(stripe));
  band.rotation.x = Math.PI / 2;
  band.scale.set(1, 1, 0.2);
  band.position.set(0, 2.2, 0);
  const wing = box(20, 0.25, 4, white, 0, 2, 1);
  const fin = box(0.3, 4, 3, stripe, 0, 3.6, -12);
  const tailWing = box(7, 0.2, 2, white, 0, 3.4, -12);
  const engines = [-5, 5].map((x) => {
    const e = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 3, 12), mat(0x9aa0a6));
    e.rotation.x = Math.PI / 2;
    e.position.set(x, 1.4, 2);
    return e;
  });
  for (const m of [body, nose, tail, band, ...engines]) m.castShadow = true;
  g.add(body, nose, tail, band, wing, fin, tailWing, ...engines);
  return g;
}

/** A table tennis bat: a round rubber face on a wooden handle, held at the handle. */
function batMesh(face: number) {
  const g = new THREE.Group();
  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(0.028, 0.1, 0.022),
    new THREE.MeshStandardMaterial({ color: 0xc89a5a, roughness: 0.7 }),
  );
  handle.position.set(0, 0.02, 0.03);
  const blade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.075, 0.014, 20),
    new THREE.MeshStandardMaterial({ color: face, roughness: 0.6 }),
  );
  blade.rotation.x = Math.PI / 2;
  blade.position.set(0, 0.12, 0.05);
  blade.castShadow = true;
  g.add(handle, blade);
  return g;
}

/** Swing arms and legs; `amount` 0 = standing still, 1 = full walk. */
function animatePerson(g: THREE.Object3D, phase: number, amount: number, speed = 2.2) {
  if (g.userData.human) {
    setGait(g, amount, speed);
    return;
  }
  const l = g.userData.limbs as Limbs | undefined;
  if (!l) return;
  const s = Math.sin(phase) * 0.55 * amount;
  l.legL.rotation.x = s;
  l.legR.rotation.x = -s;
  l.armL.rotation.x = -s * 0.9;
  l.armR.rotation.x = s * 0.9;
  l.body.position.y = Math.abs(Math.cos(phase)) * 0.05 * amount;
}

/** Sitting on the masjid carpet, legs folded. */
function sitPerson(g: THREE.Object3D) {
  if (g.userData.human) {
    sitHuman(g);
    return;
  }
  const l = g.userData.limbs as Limbs | undefined;
  if (!l) return;
  l.legL.rotation.x = -1.45;
  l.legR.rotation.x = -1.45;
  l.armL.rotation.x = -0.5;
  l.armR.rotation.x = -0.5;
  l.body.position.y = -0.62;
}

function palm(x: number, z: number, s = 1) {
  const g = new THREE.Group();
  const trunk = cyl(0.14 * s, 0.24 * s, 5 * s, 0x8a6a3e, 6);
  trunk.position.y = 2.5 * s;
  trunk.rotation.z = 0.08;
  g.add(trunk);
  for (let i = 0; i < 7; i++) {
    const leaf = box(0.5 * s, 0.06, 2.6 * s, i % 2 ? 0x3f7d3a : 0x4f8f45);
    leaf.geometry.translate(0, 0, 1.2 * s);
    leaf.position.set(0.2 * s, 5 * s, 0);
    leaf.rotation.set(0.45, (i / 7) * Math.PI * 2, 0);
    g.add(leaf);
  }
  g.position.set(x, 0, z);
  return g;
}
function tree(x: number, z: number, s = 1) {
  const g = new THREE.Group();
  const t = cyl(0.18 * s, 0.25 * s, 1.6 * s, 0x7a5a3a, 6);
  t.position.y = 0.8 * s;
  g.add(t);
  // a full, round crown of three leafy clumps
  const shades = [0x4f8a3f, 0x5f9e3a, 0x3f7d3a];
  const seed = Math.abs(Math.round(x * 7 + z * 13));
  for (const [dx, dy, dz, r] of [
    [0, 2.5, 0, 1.45],
    [0.75, 2.15, 0.35, 1.0],
    [-0.65, 2.25, -0.4, 1.05],
  ]) {
    const c = new THREE.Mesh(
      new THREE.IcosahedronGeometry(r * s, 1),
      mat(shades[(seed + Math.round(dx * 10)) % 3]),
    );
    c.position.set(dx * s, dy * s, dz * s);
    c.castShadow = true;
    g.add(c);
  }
  g.position.set(x, 0, z);
  return g;
}

function crescent(color = PALETTE.gold) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, 0.5, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0.2, 0.08, 0.42, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const m = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth: 0.08, bevelEnabled: false }),
    mat(color, { metalness: 0.4, roughness: 0.4 }),
  );
  return m;
}

/** A yellow Lagos city bus, nose pointing along +x. */
/** The bus that drives you between areas: yellow in Nigeria, white and green in Saudi Arabia. */
function makeBus(saudi = false) {
  const bus = new THREE.Group();
  bus.add(box(8, 2.6, 2.6, saudi ? 0xf4f4f0 : 0xf2c230, 0, 0.5, 0));
  if (saudi) bus.add(box(8.04, 0.25, 2.66, 0x0e6b3a, 0, 1.15, 0, false));
  bus.add(box(7.4, 0.9, 2.64, 0x2a3a44, 0, 1.6, 0, false));
  bus.add(box(8.04, 0.3, 2.64, 0x1d1f22, 0, 0.6, 0, false));
  bus.add(box(0.1, 1.1, 2.2, 0x2a3a44, 4.02, 1.4, 0, false));
  const wheel = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 12);
  for (const [wx, wz] of [
    [-2.6, 1.2],
    [2.6, 1.2],
    [-2.6, -1.2],
    [2.6, -1.2],
  ]) {
    const w = new THREE.Mesh(wheel, mat(0x1d1f22));
    w.rotation.x = Math.PI / 2;
    w.position.set(wx, 0.5, wz);
    bus.add(w);
  }
  return bus;
}

export class IlmCityEngine {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(45, 1, 0.5, 600);
  private sun = new THREE.DirectionalLight(0xffe2b8, 2.2);
  private hemi = new THREE.HemisphereLight(0xdde9f2, 0xa88a62, 1.1);
  private winMat = new THREE.MeshStandardMaterial({
    color: 0x34525a,
    emissive: 0xffc878,
    emissiveIntensity: 0,
    flatShading: true,
  });
  private lampMat = new THREE.MeshStandardMaterial({
    color: 0xfff3c4,
    emissive: 0xffd27a,
    emissiveIntensity: 0,
  });
  private colliders: Record<string, Box[]> = {
    out: [],
    masjid: [],
    home: [],
    madrasah: [],
    restaurant: [],
    mall: [],
    upstairs: [],
    boutique: [],
  };
  private zones: Zone[] = [];
  private tappables: THREE.Object3D[] = [];
  private walkers: Walker[] = [];
  private dg = new THREE.Group();
  private district!: District;
  private camYaw = 0;
  private interiorName = "";
  private player = person(0xf4efe4, { cap: 0x2f8f83 });
  private car = new THREE.Group();
  private carHeading = 0;
  private carSpeed = 0;
  private driving = false;
  private where: "out" | InteriorKind = "out";
  private outPos = new THREE.Vector3(-60, 0, 10);
  private interiorOrigin: Record<InteriorKind, THREE.Vector3> = {
    masjid: new THREE.Vector3(1000, 0, 0),
    home: new THREE.Vector3(1100, 0, 0),
    madrasah: new THREE.Vector3(1200, 0, 0),
    restaurant: new THREE.Vector3(1300, 0, 0),
    mall: new THREE.Vector3(1420, 0, 0),
    upstairs: new THREE.Vector3(1100, 0, 60),
    boutique: new THREE.Vector3(1300, 0, 60),
  };
  private input = new THREE.Vector2();
  private keys = new Set<string>();
  private tapTarget: THREE.Vector3 | null = null;
  private tapPlanned: THREE.Vector3 | null = null;
  private walkT = 0;
  private ctx: Context = null;
  private place = "";
  private raf = 0;
  private last = performance.now();
  private clock: Clock | null = null;
  private resizeObs: ResizeObserver;
  private raycaster = new THREE.Raycaster();
  private ground!: THREE.Mesh;
  private marker = new THREE.Mesh(
    new THREE.RingGeometry(0.4, 0.6, 24),
    new THREE.MeshBasicMaterial({
      color: 0x45b8a8,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    }),
  );

  constructor(
    private host: HTMLElement,
    private ev: EngineEvents,
    start?: {
      district?: string;
      x?: number;
      z?: number;
      car?: { x: number; z: number; heading: number };
    },
  ) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.domElement.style.display = "block";
    this.renderer.domElement.style.touchAction = "none";
    host.appendChild(this.renderer.domElement);
    // the phone ran out of graphics memory: go to smooth graphics so it doesn't happen again
    // the graphics card gave up: each time, ask less of it so it settles instead of looping
    this.renderer.domElement.addEventListener("webglcontextlost", () => {
      this.lost++;
      setTimeout(() => {
        if (this.disposed) return;
        if (!this.low) {
          this.setQuality("low", true);
          this.onSlowPhone?.();
        } else this.lite();
      }, 0);
    });

    this.scene.background = new THREE.Color(0x9fd3e8);
    this.scene.fog = new THREE.Fog(0x9fd3e8, 70, 260);
    this.scene.add(this.hemi);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    const sc = this.sun.shadow.camera;
    sc.left = -45;
    sc.right = 45;
    sc.top = 45;
    sc.bottom = -45;
    sc.near = 1;
    sc.far = 220;
    this.sun.shadow.bias = -0.0005;
    this.scene.add(this.sun, this.sun.target);

    this.buildCar();
    this.buildInteriors();
    this.startId = start?.district ?? "lekki";
    this.buildWorld();
    this.buildTraffic();
    this.district = districtById(start?.district ?? "lekki");
    const home = districtById("lekki").origin;
    if (start?.car) {
      this.car.position.set(start.car.x, 0, start.car.z);
      this.carHeading = start.car.heading;
      this.car.rotation.y = start.car.heading;
    } else this.car.position.set(home.x - 16, 0, home.z + 9.8);
    this.outPos.set(this.district.origin.x - 60, 0, this.district.origin.z + 10);

    this.scene.add(this.player);
    if (start?.x !== undefined && start.z !== undefined && this.free(start.x, start.z, 0.6))
      this.player.position.set(start.x, 0, start.z);
    else this.standAt(this.outPos.x, this.outPos.z);
    this.marker.rotation.x = -Math.PI / 2;
    this.marker.position.y = 0.05;
    this.marker.visible = false;
    this.scene.add(this.marker);

    this.resizeObs = new ResizeObserver(() => this.resize());
    this.resizeObs.observe(host);
    this.resize();
    const el = this.renderer.domElement;
    el.addEventListener("pointerdown", this.onPointerDown);
    el.addEventListener("pointermove", this.onPointerMove);
    el.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("keydown", this.onKey);
    window.addEventListener("keyup", this.onKeyUp);
    this.raf = requestAnimationFrame(this.loop);
    // once you are in and playing, quietly build the other cities
    setTimeout(() => this.buildInBackground(), 2500);
  }

  /* ---------------- public API ---------------- */
  setInput(x: number, y: number) {
    this.input.set(x, y);
    if (x || y) {
      this.tapTarget = null;
      this.marker.visible = false;
    }
  }
  setClock(c: Clock) {
    this.clock = c;
    this.applyLight();
  }
  isDriving() {
    return this.driving;
  }
  private bikeKind: "city" | "mountain" | "racing" | null = null;
  /** how far the rider is lifted onto the saddle now */
  private bikeLift = 0;
  private bikeObj: THREE.Object3D | null = null;
  private bikeWheels: THREE.Object3D[] = [];
  private bikeMult = 1;
  private bikeColor = 0x1f6f63;
  /** Ride a bicycle (or get off it, with null): faster than walking, outside only. */
  /** A bicycle, its front facing +z, wheels on the ground. */
  private makeBike(kind: "city" | "mountain" | "racing", color: number) {
    const wheels: THREE.Object3D[] = [];
    const g = new THREE.Group();
    const frame = mat(color, { roughness: 0.4, metalness: 0.4 });
    const dark = mat(0x1a1b1d, { roughness: 0.6 });
    const steel = mat(0xc9cfd4, { roughness: 0.3, metalness: 0.6 });
    const R = kind === "mountain" ? 0.36 : 0.34;
    for (const z of [0.55, -0.55]) {
      const w = new THREE.Group();
      const tyre = new THREE.Mesh(
        new THREE.TorusGeometry(R, kind === "mountain" ? 0.06 : 0.035, 8, 20),
        dark,
      );
      tyre.rotation.y = Math.PI / 2;
      w.add(tyre);
      for (let k = 0; k < 3; k++) {
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.01, R * 2, 0.01), steel);
        spoke.rotation.x = (k * Math.PI) / 3;
        w.add(spoke);
      }
      w.position.set(0, R, z);
      g.add(w);
      wheels.push(w);
    }
    const bar = (len: number, x0: number, y0: number, z0: number, ax: number, m = frame) => {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, len, 6), m);
      b.position.set(x0, y0, z0);
      b.rotation.x = ax;
      g.add(b);
      return b;
    };
    // the frame: down tube, top tube, seat tube, forks and stays
    bar(0.75, 0, R + 0.28, 0.12, 0.95);
    bar(0.62, 0, R + 0.5, 0.05, Math.PI / 2 - 0.15);
    bar(0.55, 0, R + 0.28, -0.12, -0.3);
    bar(0.55, 0, R + 0.22, 0.5, 0.25);
    bar(0.5, 0, R + 0.12, -0.35, Math.PI / 2 - 0.5);
    // seat, handlebars, pedals
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.05, 0.26), dark);
    seat.position.set(0, R + 0.6, -0.22);
    g.add(seat);
    const hb = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, kind === "racing" ? 0.42 : 0.6, 6),
      kind === "racing" ? dark : steel,
    );
    hb.rotation.z = Math.PI / 2;
    hb.position.set(0, R + 0.62, 0.42);
    g.add(hb);
    for (const s of [1, -1]) {
      const pedal = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.08), dark);
      pedal.position.set(s * 0.16, R - 0.05, 0);
      g.add(pedal);
    }
    g.traverse((o) => (o.castShadow = true));
    return { g, wheels };
  }
  setBike(kind: "city" | "mountain" | "racing" | null, color = 0x1f6f63) {
    if (this.bikeObj) {
      this.bikeObj.removeFromParent();
      this.bikeObj = null;
    }
    this.liftRider(0);
    this.bikeWheels = [];
    this.bikeKind = kind;
    this.bikeColor = color;
    if (!kind) return;
    this.bikeMult = kind === "racing" ? 2.1 : kind === "mountain" ? 1.85 : 1.6;
    const { g, wheels } = this.makeBike(kind, color);
    this.bikeWheels = wheels;
    this.player.add(g);
    this.bikeObj = g;
    this.syncBike();
  }
  private liftRider(y: number) {
    if (y === this.bikeLift) return;
    for (const c of this.player.children) if (c !== this.bikeObj) c.position.y += y - this.bikeLift;
    this.bikeLift = y;
  }
  private tired = false;
  /** Worn out (no sleep): you walk and ride slowly. */
  setTired(on: boolean) {
    this.tired = on;
  }
  isCycling() {
    return !!this.bikeKind;
  }
  /** Stand somewhere outside, facing a way (the start of a race). */
  placePlayer(x: number, z: number, yaw: number) {
    if (this.where !== "out") return;
    this.player.position.set(x, 0, z);
    this.player.rotation.y = yaw;
    this.tapTarget = null;
    this.marker.visible = false;
    this.camYaw = yaw + Math.PI;
    this.snapCamera();
  }
  /** The bicycle stays outside: indoors you walk. */
  private syncBike() {
    const on = !!this.bikeObj && this.where === "out";
    if (this.bikeObj) this.bikeObj.visible = on;
    this.liftRider(on ? 0.62 : 0);
  }
  private teacherTag: { g: THREE.Object3D; tag: THREE.Object3D } | null = null;
  /** The madrasah teacher is the sheikh of that madrasah's street. */
  setTeacher(name: string) {
    const t = this.teacherTag;
    if (!t) return;
    t.g.remove(t.tag);
    const tt = label(name, { size: 0.7, bold: false });
    tt.position.copy(t.tag.position);
    t.g.add(tt);
    t.tag = tt;
  }
  scenePlace() {
    return this.where;
  }
  playerPos() {
    return { x: this.player.position.x, z: this.player.position.z, where: this.where };
  }

  enterInterior(kind: InteriorKind, name = "") {
    this.interiorName = name;
    if (kind === "home") {
      this.setDuplex(false);
      // the newcomers' flats in Lekki and Ikeja are in a glass tower
      this.setGlassFlat(isPrimeArea(this.district.id) && this.district.id !== "lekki");
    }
    this.outPos.copy(this.player.position);
    this.where = kind;
    const o = this.interiorOrigin[kind];
    this.player.position.set(o.x, 0, o.z + 5.5);
    this.player.rotation.y = Math.PI;
    this.tapTarget = null;
    this.marker.visible = false;
    this.applyLight();
    this.snapCamera();
  }
  exitInterior() {
    if (this.where === "out") return;
    this.where = "out";
    this.player.position.copy(this.outPos);
    this.applyLight();
    this.snapCamera();
  }
  enterCar() {
    this.driving = true;
    this.player.visible = false;
    this.tapTarget = null;
    this.marker.visible = false;
  }
  exitCar() {
    this.driving = false;
    this.carSpeed = 0;
    const side = new THREE.Vector3(
      Math.sin(this.carHeading),
      0,
      Math.cos(this.carHeading),
    ).multiplyScalar(2.6);
    const p = this.car.position.clone().add(side);
    if (!this.free(p.x, p.z, 0.6)) p.copy(this.car.position).sub(side);
    this.standAt(p.x, p.z, this.car.position);
    this.player.visible = true;
  }
  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.resizeObs.disconnect();
    window.removeEventListener("keydown", this.onKey);
    window.removeEventListener("keyup", this.onKeyUp);
    const el = this.renderer.domElement;
    el.removeEventListener("pointerdown", this.onPointerDown);
    el.removeEventListener("pointermove", this.onPointerMove);
    el.removeEventListener("pointerup", this.onPointerUp);
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  /* ---------------- world ---------------- */
  private addCollider(
    scene: keyof IlmCityEngine["colliders"],
    x0: number,
    x1: number,
    z0: number,
    z1: number,
  ) {
    const ox = scene === "out" ? this.ox : 0,
      oz = scene === "out" ? this.oz : 0;
    this.colliders[scene].push({ x0: x0 + ox, x1: x1 + ox, z0: z0 + oz, z1: z1 + oz });
  }

  /** Builds one area into its own group at its place on the Lagos map. */
  /** Areas not built yet (in other cities), with the empty group waiting for them. */
  private placeholders = new Map<string, THREE.Group>();
  private startId = "lekki";
  /** Build the areas of a city now, if they are still waiting. */
  ensureCity(city: string) {
    for (const id of [...this.placeholders.keys()])
      if (cityOf(districtById(id)) === city) this.buildLater(id);
  }
  /** Build one waiting area (keeping the engine's building state as it was). */
  private buildLater(id: string) {
    if (!this.placeholders.has(id)) return;
    const keep = { dg: this.dg, ox: this.ox, oz: this.oz, batch: this.curBatch };
    this.buildDistrict(id);
    this.dg = keep.dg;
    this.ox = keep.ox;
    this.oz = keep.oz;
    this.curBatch = keep.batch;
    this.applyLight();
    this.ev.onAreaBuilt?.(id);
  }
  /** While you play, build the other cities one area at a time. */
  private buildInBackground() {
    if (this.disposed) return;
    // the nearest waiting area to you first
    const p = this.player.position;
    const here = cityOf(this.district);
    const next = [...this.placeholders.keys()]
      .filter((id) => cityOf(districtById(id)) === here)
      .sort((a, b) => {
        const A = districtById(a).origin,
          B = districtById(b).origin;
        return Math.hypot(A.x - p.x, A.z - p.z) - Math.hypot(B.x - p.x, B.z - p.z);
      })[0];
    if (!next) {
      // nothing left in this city: look again later (you may have travelled)
      setTimeout(() => this.buildInBackground(), 4000);
      return;
    }
    setTimeout(
      () => {
        if (this.disposed) return;
        // not while travelling or in a cut-scene: wait for a calm moment
        if (!this.cine) this.buildLater(next);
        this.buildInBackground();
      },
      this.cine ? 1500 : 400,
    );
  }
  private disposed = false;
  private buildDistrict(id: string) {
    const D = districtById(id);
    this.ox = D.origin.x;
    this.oz = D.origin.z;
    const waiting = this.placeholders.get(id);
    if (waiting) {
      this.placeholders.delete(id);
      this.dg = waiting;
    } else {
      this.dg = new THREE.Group();
      this.dg.position.set(D.origin.x, 0, D.origin.z);
      this.scene.add(this.dg);
      this.areaGroups.push({ g: this.dg, x: D.origin.x, z: D.origin.z });
    }
    const side = D.origin.x > centerOf(D).x ? -1 : 1; // the end of the main street facing the junction
    this.reserved.push(
      { x0: this.ox - 84, x1: this.ox - 60, z0: this.oz + 8, z1: this.oz + 22 },
      { x0: this.ox - 22, x1: this.ox - 10, z0: this.oz + 7, z1: this.oz + 13 },
    );
    const S = this.dg;
    const batch = new Batch();
    this.curBatch = batch;
    const rnd = mulberry(D.id.length * 97 + D.name.charCodeAt(0));

    // Lekki's beach and the ocean
    const H = halfOf(D);
    // the towns of Makkah and Madinah are paved stone, not desert (Mina and Arafat stay open plains)
    if (D.holy && D.id !== "mina" && D.id !== "arafat") {
      const pv = new THREE.Mesh(groundGeo(H.x * 2, H.z * 2, 3), MAT.pavement());
      pv.position.set(0, 0.008, 0);
      pv.receiveShadow = true;
      S.add(pv);
    }
    const southEdge = D.lagoon ? 76 : H.z - 1;
    const north = -(H.z - 4); // the northern end of the cross road
    const XR = H.x - 16; // how far streets run either side of the cross road
    if (D.lagoon) {
      const beach = new THREE.Mesh(new THREE.PlaneGeometry(260, 14), mat(PALETTE.sand));
      beach.rotation.x = -Math.PI / 2;
      beach.position.set(0, 0.01, 71);
      beach.receiveShadow = true;
      S.add(beach);
      const water = new THREE.Mesh(
        new THREE.PlaneGeometry(400, 160),
        new THREE.MeshStandardMaterial({ color: PALETTE.water, roughness: 0.25, metalness: 0.1 }),
      );
      water.rotation.x = -Math.PI / 2;
      water.position.set(0, -0.15, 156);
      S.add(water);
      for (let x = -94; x < 94; x += 9)
        batch.addObject(palm(x + rnd() * 3, 68 + rnd() * 4, 0.9 + rnd() * 0.3));
    }
    if (D.lagoon) this.addCollider("out", -200, 200, southEdge, 300);

    // roads: each named street runs east-west; one link road crosses them
    const road = (x: number, z: number, w: number, d: number) => {
      const pave = w > d ? [w + 2, d + 10] : [w + 10, d + 2];
      const k = new THREE.Mesh(groundGeo(pave[0], pave[1], 2), MAT.pavement());
      k.position.set(x, 0.02, z);
      k.receiveShadow = true;
      S.add(k);
      const kerb = new THREE.Mesh(groundGeo(w + 0.7, d + 0.7, 2), mat(0xe9e4d8));
      kerb.position.set(x, 0.03, z);
      S.add(kerb);
      const r = new THREE.Mesh(groundGeo(w, d, 4), MAT.asphalt());
      r.position.set(x, 0.04, z);
      r.receiveShadow = true;
      S.add(r);
    };
    const dashMat = new THREE.MeshBasicMaterial({ color: PALETTE.line });
    const zs = D.streets.map((st) => st.z);
    D.streets.forEach((st) => {
      road(0, st.z, st.z === 0 ? H.x * 2 - 10 : H.x * 2 - 24, 12);
      for (let x = -XR; x < XR; x += 6) {
        if (Math.abs(x) < 8) continue;
        const d = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.25), dashMat);
        d.rotation.x = -Math.PI / 2;
        d.position.set(x, 0.06, st.z);
        batch.addObject(d);
      }
      this.streetSign(-8.5, st.z + 8.5, st.id, Math.PI / 4);
      this.streetSign(44, st.z + 8.5, st.id, 0);
      this.streetSign(-60, st.z + 8.5, st.id, 0);
    });
    const crossEnd = southEdge - 6;
    // in Makkah and Madinah the Haram is north of the main road: the cross road only runs south
    const crossTop = D.holy ? -8 : north;
    road(0, (crossTop + crossEnd) / 2, 12, crossEnd - crossTop);
    for (let z = crossTop; z < crossEnd; z += 6) {
      if (zs.some((sz) => Math.abs(z - sz) < 8)) continue;
      const d = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 3), dashMat);
      d.rotation.x = -Math.PI / 2;
      d.position.set(0, 0.06, z);
      batch.addObject(d);
    }
    zs.forEach((sz) => {
      for (let i = -4; i <= 4; i++) {
        for (const [x, z, rx] of [
          [i * 1.2, sz + 8.2, 0],
          [i * 1.2, sz - 8.2, 0],
          [8.2, sz + i * 1.2, 1],
          [-8.2, sz + i * 1.2, 1],
        ] as [number, number, number][]) {
          const zc = new THREE.Mesh(
            new THREE.PlaneGeometry(rx ? 3 : 0.6, rx ? 0.6 : 3),
            mat(0xf4f1ea),
          );
          zc.rotation.x = -Math.PI / 2;
          zc.position.set(x, 0.06, z);
          batch.addObject(zc);
        }
      }
    });

    // landmarks along their streets, front doors facing the street
    D.landmarks.forEach((l) => this.buildLandmark(l, D));
    if (D.campus) this.buildCampusWall(D);
    if (!D.landmarks.some((l) => l.kind === "market")) this.buildLocalMarket(D, XR);
    if (!D.landmarks.some((l) => l.kind === "home")) this.buildEstate(D, XR, rnd);

    // bus park
    this.buildBusPark(-72, 15, !!D.holy);

    // billboards beside the main street
    const spots: [number, number, number][] = [];
    for (const sz of zs)
      for (const [x, dz, r] of [
        [14, -14, 0],
        [-72, -14, 0],
        [70, 14.5, Math.PI],
        [44, -14, 0],
        [-40, 14.5, Math.PI],
      ] as [number, number, number][])
        spots.push([x, sz + dz, r]);
    let si = 0;
    // no adverts on the Hajj sites
    BILLBOARDS.filter((b) => b.district === D.id && D.id !== "mina" && D.id !== "arafat").forEach(
      (b) => {
        while (si < spots.length) {
          const [x, z, r] = spots[si++];
          if (this.boxFree(x - 8, x + 8, z - 1.8, z + 1.8)) {
            this.billboard(b, x, z, r);
            break;
          }
        }
      },
    );

    // a football pitch and the sisters' corner take three plots in a row
    const play = this.choosePlayPlots(D, zs, H, southEdge);
    // hold the pitch, sisters' corner and police station plots, so the shops built before
    // them (eatery, dealer, mall, boutique) don't land on top of them
    const playHold: Box[] = [];
    if (play && !D.holy) {
      const hold = (sz: number, north: boolean, x: number) => {
        const cz = north ? sz - 21.5 : sz + 21.5;
        playHold.push({
          x0: this.ox + x - 12,
          x1: this.ox + x + 12,
          z0: this.oz + cz - 11,
          z1: this.oz + cz + 11,
        });
      };
      for (const x of play.xs) hold(play.sz, play.north, x);
      if (play.police) hold(play.police.sz, play.police.north, play.police.x);
    }
    const ghosts: Box[] = [];
    // Lagos compounds line both sides of every street
    zs.forEach((sz, si) => {
      let num = 1 + si * 40;
      for (const north of [true, false]) {
        const cz = north ? sz - 21.5 : sz + 21.5;
        if (!north && cz + 10 > southEdge - 3) continue;
        for (let x = -(H.x - 26); x <= H.x - 26; x += 24) {
          if (Math.abs(x) < 16) continue;
          if (!this.boxFree(x - 11, x + 11, cz - 10, cz + 10)) continue;
          if (zs.some((z2) => z2 !== sz && Math.abs(cz - z2) < 18)) continue;
          const id = `${D.id}-${num}`;
          const r1 = rnd();
          const st = D.streets[si];
          const landShare = st.land ?? D.land ?? 0.13;
          const land = r1 < landShare;
          const shops = !land && r1 < landShare + (D.shops ?? 0.2);
          // every house is open to players now (the dice is still rolled, so plots keep their
          // numbers and looks)
          let toLet = false;
          if (!land && !shops) {
            rnd();
            toLet = true;
          }
          if (
            play &&
            ((play.sz === sz && play.north === north && play.xs.includes(x)) ||
              (play.police?.sz === sz && play.police.north === north && play.police.x === x))
          ) {
            // this plot is the pitch or the sisters' corner; draw the house it replaces into a
            // throwaway batch so every later plot keeps the same number and look as before
            const turn0 = north ? 0 : Math.PI;
            const ghost = shops
              ? shopRow(new Batch(true), { x, z: cz, turn: turn0, rnd }).colliders
              : !land
                ? compound(new Batch(true), {
                    x,
                    z: cz,
                    turn: turn0,
                    number: num,
                    rnd,
                    style: houseStyleOf(D),
                  }).colliders
                : [];
            // while the streets are laid out, the replaced house still takes up its space
            for (const g of ghost) {
              const box = {
                x0: g.x0 + this.ox,
                x1: g.x1 + this.ox,
                z0: g.z0 + this.oz,
                z1: g.z1 + this.oz,
              };
              ghosts.push(box);
              this.reserved.push(box);
            }
            num += 2;
            continue;
          }
          const turn = north ? 0 : Math.PI;
          let c: Compound;
          if (land) {
            // an empty plot: bare earth and corner beacons
            const earth = new THREE.Mesh(groundGeo(21, 19, 3), MAT.plain(0xc4a06a));
            earth.position.set(x, 0.03, cz);
            batch.addObject(earth);
            for (const [bx, bz] of [
              [-10.5, -9.5],
              [10.5, -9.5],
              [-10.5, 9.5],
              [10.5, 9.5],
            ]) {
              const post = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.6, 0.3),
                MAT.plain(0xd8d2c2),
              );
              post.position.set(x + bx, 0.3, cz + bz);
              batch.addObject(post);
            }
            const front = cz + (north ? 10 : -10);
            c = {
              colliders: [],
              door: { x, z: front },
              gate: { x, z: front + (north ? 0.5 : -0.5) },
              floors: 0,
              number: num,
            };
          } else if (shops) {
            const row = shopRow(batch, { x, z: cz, turn, rnd });
            const front = cz + (north ? 10 : -10);
            c = {
              colliders: row.colliders,
              door: { x, z: front },
              gate: { x, z: front },
              floors: 1,
              number: num,
            };
            row.units.forEach((u, k) =>
              this.addShopUnit(
                `${D.id}-${num}-${k}`,
                "shop",
                u.center,
                u.front,
                D,
                STREETS[D.streets[si].id].name,
              ),
            );
          } else c = compound(batch, { x, z: cz, turn, number: num, rnd, style: houseStyleOf(D) });
          num += 2;
          for (const b of c.colliders) this.addCollider("out", b.x0, b.x1, b.z0, b.z1);

          this.reserved.push({
            x0: this.ox + x - 11,
            x1: this.ox + x + 11,
            z0: this.oz + cz - 10,
            z1: this.oz + cz + 10,
          });
          this.plots.push({
            ...c,
            id,
            kind: land ? "land" : shops ? "shops" : "house",
            toLet,
            district: D.id,
            street: STREETS[D.streets[si].id].name,
            streetZ: sz,
            x,
            z: cz,
          });
          if (land || toLet) {
            const zone: Zone = {
              id: "plot:" + id,
              label: "",
              x: this.ox + c.gate.x,
              z: this.oz + c.gate.z,
              r: 3.4,
              scene: "out",
            };
            this.zones.push(zone);
            this.plotFx.set(id, { zone });
          }
        }
      }
    });
    this.reserved = this.reserved.filter((r) => !ghosts.includes(r));
    this.reserved.push(...playHold);
    this.buildEatery(D);
    this.buildRestaurant(D);
    if (D.id === "ikeja" || D.id === "lekki") this.buildDealer(D);
    if (D.id === "ikeja") this.buildMall(D);
    if (
      ["lekki", "ikeja", "akoka", "agege", "ikorodu", "fate", "ilorincentral", "tanke"].includes(
        D.id,
      )
    )
      this.buildBoutique(D);
    this.reserved = this.reserved.filter((r) => !playHold.includes(r));
    if (play && !D.holy) this.buildPlay(D, play);
    // the tennis court gets its own lot, clear of the pitch and the sisters' corner
    if (!D.holy) this.buildCourt(D);
    // quiet residential closes behind the main streets, lined with houses ready to let
    if (!D.campus) this.buildCloses(D, zs, D.holy ? -8 : north, southEdge, batch);
    // Manaar University College, going up at the end of Sheikh Habeeb Adewuyi Street
    if (D.id === "ikorodu") this.buildManaarSite(batch, -110);
    const wires = new THREE.Group();
    if (!D.holy) zs.forEach((sz) => powerLine(batch, -XR, XR, sz - 9.8, wires));
    // beautified streets: palms, flower beds and green-and-white flags along the pavements
    D.streets
      .filter((st) => st.decor)
      .forEach((st) => {
        const flowers = [0xd23b6a, 0xf2c230, 0xf07a2a, 0xb05ad0];
        let k = 0;
        for (let x = -XR + 6; x <= XR - 6; x += 12) {
          if (Math.abs(x) < 14) continue;
          for (const side of [-1, 1]) {
            const z = st.z + side * 10.5;
            if (!this.boxFree(x - 0.8, x + 0.8, z - 0.8, z + 0.8)) continue;
            this.addCollider(
              "out",
              x - (k % 2 ? 1.2 : 0.4),
              x + (k % 2 ? 1.2 : 0.4),
              z - 0.45,
              z + 0.45,
            );
            if (k % 2 === 0) {
              if (D.holy) datePalmInto(batch, x, z, 0.75);
              else batch.addObject(palm(x, z, 0.85));
            } else {
              const bed = new THREE.Mesh(
                new THREE.BoxGeometry(2.4, 0.35, 0.9),
                MAT.plain(0xd8d2c2),
              );
              bed.position.set(x, 0.17, z);
              batch.addObject(bed);
              for (let f = -1; f <= 1; f++) {
                const fl = new THREE.Mesh(
                  new THREE.IcosahedronGeometry(0.28, 0),
                  MAT.plain(flowers[(k + f + 1) % 4]),
                );
                fl.position.set(x + f * 0.7, 0.55, z);
                batch.addObject(fl);
              }
            }
            if (k % 4 === 1) {
              const pole = new THREE.Mesh(
                new THREE.CylinderGeometry(0.04, 0.05, 5.5, 6),
                MAT.plain(0xd8dce0, 0.3),
              );
              pole.position.set(x + 1.6, 2.75, z);
              batch.addObject(pole);
              if (D.holy) {
                // the Saudi flag: green with the shahadah and a white sword
                const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.26, 0.8), MAT.plain(0x006c35));
                fl.position.set(x + 1.6 + 0.63, 5.0, z);
                batch.addObject(fl);
                const sw = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.06), MAT.plain(0xfdfdfd));
                sw.position.set(x + 1.6 + 0.63, 4.82, z + 0.01);
                batch.addObject(sw);
                const tx = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.16), MAT.plain(0xe8f2ea));
                tx.position.set(x + 1.6 + 0.63, 5.12, z + 0.01);
                batch.addObject(tx);
              } else
                for (const [i, c] of [0x1f8a3a, 0xfdfdfd, 0x1f8a3a].entries()) {
                  const band = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.8), MAT.plain(c));
                  band.position.set(x + 1.6 + 0.21 + i * 0.42, 5.0, z);
                  batch.addObject(band);
                }
            }
            k++;
          }
        }
      });
    S.add(wires);

    // street lamps
    const lampPole = new THREE.CylinderGeometry(0.08, 0.1, 5, 6),
      lampHead = new THREE.SphereGeometry(0.32, 8, 6);
    const lamps: [number, number][] = [];
    zs.forEach((sz) => {
      for (let x = -(XR - 6); x <= XR - 6; x += 20) {
        if (Math.abs(x) <= 8) continue;
        if (this.boxFree(x - 0.5, x + 0.5, sz + 7.5, sz + 8.5)) lamps.push([x, sz + 8]);
        if (this.boxFree(x + 9.5, x + 10.5, sz - 8.5, sz - 7.5)) lamps.push([x + 10, sz - 8]);
      }
    });
    const poleMesh = new THREE.InstancedMesh(lampPole, mat(0x5a5f66), lamps.length);
    const headMesh = new THREE.InstancedMesh(lampHead, this.lampMat, lamps.length);
    const m4 = new THREE.Matrix4();
    lamps.forEach(([x, z], i) => {
      this.addCollider("out", x - 0.2, x + 0.2, z - 0.2, z + 0.2);
      m4.makeTranslation(x, 2.5, z);
      poleMesh.setMatrixAt(i, m4);
      m4.makeTranslation(x, 5.1, z);
      headMesh.setMatrixAt(i, m4);
    });
    S.add(poleMesh, headMesh);

    // greenery
    const clear = (x: number, z: number) =>
      this.free(x + this.ox, z + this.oz, 3) &&
      this.boxFree(x - 2, x + 2, z - 2, z + 2) &&
      Math.abs(x) > 10 &&
      Math.abs(z) > 12 &&
      zs.every((sz) => Math.abs(z - sz) > 11) &&
      z < southEdge - 8;
    let n = 0;
    for (let i = 0; i < 700 && n < 60; i++) {
      const x = -XR + rnd() * XR * 2,
        z = north + rnd() * (southEdge - 8 - north);
      if (!clear(x, z)) continue;
      const isPalm = rnd() < 0.55,
        sc = isPalm ? 0.8 + rnd() * 0.3 : 0.9 + rnd() * 0.4;
      // date palms in Makkah and Madinah, neem trees on Arafat
      if (D.holy) datePalmInto(batch, x, z, sc);
      else batch.addObject(isPalm ? palm(x, z, sc) : tree(x, z, sc));
      this.addCollider("out", x - 0.45, x + 0.45, z - 0.45, z + 0.45);
      n++;
    }

    // welcome gate where the expressway meets the main street
    this.welcomeGate(D, side);

    // (no made-up neighbours on the pavements: the people you meet outside are real players)
    rnd(); // keeps the rest of the area's random layout as it was

    // the Hisbah officer on patrol
    {
      const officers = ["Musa", "Abubakar", "Sulaiman", "Idris", "Yunus"];
      const name =
        "Hisbah Officer " + officers[DISTRICTS.findIndex((d) => d.id === D.id) % officers.length];
      const g = person(0x5f6b48, {
        outfit: "hisbah",
        cap: 0x2e5b2e,
        trousers: 0x5f6b48,
        beard: true,
        seed: 3,
      });
      const tag = label(name, { size: 0.7, bg: "rgba(46,91,46,0.92)" });
      tag.position.y = 2.65;
      g.add(tag);
      const route: [number, number][] = [
        [side * 60, 9],
        [-side * 70, 9],
        [-side * 70, -9],
        [side * 60, -9],
      ];
      g.position.set(route[0][0], 0, route[0][1]);
      S.add(g);
      this.walkers.push({ g, route, k: 1, wait: 2, t: 0, name, district: D.id, hisbah: true });
    }

    // Mina and Arafat are shown as in the days of Hajj: crowds of pilgrims
    if (D.id === "arafat" || D.id === "mina") this.buildPilgrims(D, S);
    // Madinah: bicycles for hire by the street
    if (D.id === "nabawi" || D.id === "quba") this.buildBikeDock(D, S);

    for (const m of batch.build()) S.add(m);
    this.ox = 0;
    this.oz = 0;
  }

  /** A row of green hire bicycles in their docks, with a pay point. */
  private buildBikeDock(D: District, S: THREE.Object3D) {
    let at: { x: number; z: number; rot: number } | null = null;
    // along the main street, away from the welcome arch at the area's ends
    const xs: number[] = [];
    for (let x = 14; x < halfOf(D).x - 50; x += 3) xs.push(x, -x - 15);
    for (const z of D.streets.flatMap((st) => [st.z + 10.5, st.z - 10.5]))
      for (const x of xs) {
        if (at) break;
        let ok = this.boxFree(x - 1, x + 15, z - 0.8, z + 0.8);
        for (let k = 0; k <= 14 && ok; k += 2)
          if (!this.free(this.ox + x + k, this.oz + z, 0.7)) ok = false;
        if (ok)
          at = {
            x: x + 7,
            z,
            rot: D.streets.some((st) => Math.abs(z - st.z - 10.5) < 0.1) ? 0 : Math.PI,
          };
      }
    if (!at) return;
    const g = new THREE.Group();
    g.position.set(at.x, 0, at.z);
    g.rotation.y = at.rot;
    // the dock rail, the bikes side by side, the pay point with its sign
    g.add(box(14, 0.12, 0.25, 0x5a5f66, 0, 0.05, -0.7));
    // side by side, front wheels in the docks
    for (let i = 0; i < 8; i++) {
      const { g: b } = this.makeBike("city", 0x2fa84f);
      b.position.set(-6 + i * 1.3, 0, 0.2);
      b.rotation.y = Math.PI;
      g.add(b);
      g.add(box(0.12, 0.9, 0.12, 0x2fa84f, -6 + i * 1.3, 0, -0.7));
    }
    g.add(box(0.7, 2, 0.5, 0x2fa84f, -8.5, 0, -0.4));
    const sign = this.signBoard("Madinah Bike · hire", 4, 0.8, "#2fa84f", "#ffffff");
    sign.position.set(-8.5, 2.6, -0.4);
    g.add(sign);
    S.add(g);
    const cos = Math.cos(at.rot),
      sin = Math.sin(at.rot);
    const lx = -8.5,
      lz = 1.2;
    this.zones.push({
      id: "bikehire:" + D.id,
      label: "🚲 Hire a bicycle",
      x: this.ox + at.x + lx * cos + lz * sin,
      z: this.oz + at.z - lx * sin + lz * cos,
      r: 2.5,
      scene: "out",
    });
  }
  private tawaf: {
    bodies: THREE.InstancedMesh;
    heads: THREE.InstancedMesh;
    people: { r: number; a: number; w: number }[];
    world: { x: number; z: number };
    t: number;
  } | null = null;
  /** Hundreds of pilgrims circling the Kaaba seven times, anticlockwise, closer in and faster
      near the Kaaba, slower further out. */
  private buildTawafCrowd(g: THREE.Group, IN: number) {
    const rnd = mulberry(7007);
    const people: { r: number; a: number; w: number }[] = [];
    for (let i = 0; i < 1500; i++) {
      // packed close to the Kaaba, thinner towards the colonnades
      const r = 8.5 + Math.pow(rnd(), 1.6) * (IN - 12);
      // walking pace: about 1.1 m/s, a little slower in the thick of the crowd
      people.push({ r, a: rnd() * Math.PI * 2, w: (0.9 + rnd() * 0.5) / r });
    }
    const body = new THREE.CylinderGeometry(0.2, 0.3, 1.35, 7);
    body.translate(0, 0.68, 0);
    const head = new THREE.SphereGeometry(0.16, 8, 6);
    head.translate(0, 1.52, 0);
    const mk = (geo: THREE.BufferGeometry) => {
      const m = new THREE.InstancedMesh(geo, mat(0xffffff, { roughness: 0.9 }), people.length);
      m.castShadow = true;
      m.frustumCulled = false;
      g.add(m);
      return m;
    };
    const bodies = mk(body),
      heads = mk(head);
    const c = new THREE.Color();
    const skins = [0x8d5a3b, 0x6b4430, 0xc68a5e, 0xe0b48a, 0x5a3a28];
    people.forEach((_, i) => {
      const sister = rnd() < 0.35;
      bodies.setColorAt(i, c.setHex(sister && rnd() < 0.5 ? 0x1d1d22 : 0xf6f5ef));
      heads.setColorAt(i, c.setHex(sister ? 0xf6f5ef : skins[i % skins.length]));
    });
    this.tawaf = {
      bodies,
      heads,
      people,
      world: { x: g.position.x + this.ox, z: g.position.z + this.oz },
      t: 1,
    };
    this.stepTawaf(0, true);
  }
  private stepTawaf(dt: number, first = false) {
    const T = this.tawaf;
    if (!T) return;
    // only while someone is near enough to see it, a few times a second
    const p = this.camera.position;
    if (!first && Math.hypot(p.x - T.world.x, p.z - T.world.z) > 260) return;
    T.t += dt;
    if (dt && T.t < 0.06) return;
    const step = T.t;
    T.t = 0;
    const M4 = new THREE.Matrix4(),
      q = new THREE.Quaternion(),
      up = new THREE.Vector3(0, 1, 0),
      one = new THREE.Vector3(1, 1, 1),
      v = new THREE.Vector3();
    T.people.forEach((pp, i) => {
      // anticlockwise seen from above: the Kaaba stays on the pilgrim's left
      pp.a += pp.w * step;
      const x = Math.cos(pp.a) * pp.r,
        z = -Math.sin(pp.a) * pp.r;
      q.setFromAxisAngle(up, Math.atan2(-Math.sin(pp.a), -Math.cos(pp.a)));
      M4.compose(v.set(x, 0, z), q, one);
      T.bodies.setMatrixAt(i, M4);
      T.heads.setMatrixAt(i, M4);
    });
    T.bodies.instanceMatrix.needsUpdate = true;
    T.heads.instanceMatrix.needsUpdate = true;
  }
  /** Pilgrims in ihram filling the plain: in Arafat most stand facing the Ka'bah with their
      hands raised in du'a, many round Jabal ar-Rahmah; in Mina they walk between the tents and
      the Jamarat. Drawn as a few instanced meshes, so thousands cost little. */
  private buildPilgrims(D: District, S: THREE.Object3D) {
    const arafat = D.id === "arafat";
    const H = halfOf(D);
    const rnd = mulberry(arafat ? 9091 : 9092);
    const n = arafat ? 900 : 600;
    const kaaba = districtById("haram").origin;
    const spots: {
      x: number;
      z: number;
      ry: number;
      dua: boolean;
      sister: boolean;
      crouch: boolean;
    }[] = [];
    for (let tries = 0; spots.length < n && tries < n * 6; tries++) {
      let x: number, z: number;
      let crouch = false;
      const roll = rnd();
      if (arafat && roll < 0.2) {
        // Muzdalifah: pilgrims resting on the ground and picking up pebbles
        x = (rnd() * 2 - 1) * (H.x - 10);
        z = -72 + (rnd() * 2 - 1) * 12;
        crouch = rnd() < 0.6;
      } else if (arafat && roll < 0.55) {
        // round the foot of the Mount of Mercy
        const a = rnd() * Math.PI * 2,
          r = 24 + rnd() * 34;
        x = Math.cos(a) * r;
        z = -48 + Math.sin(a) * r;
      } else {
        x = (rnd() * 2 - 1) * (H.x - 8);
        z = (rnd() * 2 - 1) * (H.z - 8);
      }
      if (Math.abs(x) > H.x - 4 || Math.abs(z) > H.z - 4) continue;
      if (!this.free(this.ox + x, this.oz + z, 0.6)) continue;
      // keep the way into the area and the bus stop clear
      if (Math.abs(x + 60) < 22 && Math.abs(z - 12) < 10) continue;
      const toK = Math.atan2(kaaba.x - (this.ox + x), kaaba.z - (this.oz + z));
      const dua = arafat ? rnd() < 0.65 : rnd() < 0.15;
      spots.push({
        x,
        z,
        ry: (dua || arafat) && !crouch ? toK + (rnd() - 0.5) * 0.4 : rnd() * Math.PI * 2,
        dua: dua && !crouch,
        sister: rnd() < 0.35,
        crouch,
      });
    }
    const body = new THREE.CylinderGeometry(0.2, 0.3, 1.35, 7);
    body.translate(0, 0.68, 0);
    const head = new THREE.SphereGeometry(0.16, 8, 6);
    head.translate(0, 1.52, 0);
    const arm = new THREE.BoxGeometry(0.09, 0.55, 0.09);
    const arms = mergeGeometries(
      [-1, 1].map((sx) => {
        const g = arm.clone();
        g.translate(0, 0.27, 0);
        g.rotateX(-0.5);
        g.translate(sx * 0.2, 1.25, 0.05);
        return g;
      }),
      false,
    )!;
    const mk = (g: THREE.BufferGeometry, count: number) => {
      const m = new THREE.InstancedMesh(g, mat(0xffffff, { roughness: 0.9 }), count);
      m.castShadow = true;
      m.receiveShadow = true;
      return m;
    };
    const bodies = mk(body, spots.length),
      heads = mk(head, spots.length),
      hands = mk(arms, Math.max(1, spots.filter((p) => p.dua).length));
    const M4 = new THREE.Matrix4(),
      q = new THREE.Quaternion(),
      up = new THREE.Vector3(0, 1, 0),
      one = new THREE.Vector3(1, 1, 1),
      low = new THREE.Vector3(1, 0.62, 1),
      c = new THREE.Color();
    const skins = [0x8d5a3b, 0x6b4430, 0xc68a5e, 0xe0b48a, 0x5a3a28];
    let h = 0;
    spots.forEach((p, i) => {
      q.setFromAxisAngle(up, p.ry);
      M4.compose(new THREE.Vector3(p.x, 0, p.z), q, p.crouch ? low : one);
      bodies.setMatrixAt(i, M4);
      heads.setMatrixAt(i, M4);
      // brothers in the two white sheets; sisters in white or black with their heads covered
      bodies.setColorAt(i, c.setHex(p.sister && rnd() < 0.5 ? 0x1d1d22 : 0xf6f5ef));
      heads.setColorAt(
        i,
        c.setHex(p.sister ? (rnd() < 0.6 ? 0xf6f5ef : 0x1d1d22) : skins[i % skins.length]),
      );
      if (p.dua) {
        hands.setMatrixAt(h, M4);
        hands.setColorAt(h, c.setHex(p.sister ? 0xf6f5ef : skins[i % skins.length]));
        h++;
      }
    });
    hands.count = h;
    for (const m of [bodies, heads, hands]) {
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      S.add(m);
    }
  }

  /** The whole city: every area, the expressways, the City Junction, ocean and lagoon. */
  private buildWorld() {
    const S = this.scene;
    // the city floor is tarred everywhere (land for sale shows its own sand)
    const ground = new THREE.Mesh(groundGeo(2300, 2700, 10), TARRED());
    ground.position.set(150, -0.01, -480);
    ground.receiveShadow = true;
    S.add(ground);
    const water = (w: number, d: number, x: number, z: number, round = false) => {
      const m = new THREE.Mesh(
        round ? new THREE.CircleGeometry(1, 48) : new THREE.PlaneGeometry(w, d),
        new THREE.MeshStandardMaterial({ color: PALETTE.water, roughness: 0.25, metalness: 0.1 }),
      );
      m.rotation.x = -Math.PI / 2;
      if (round) m.scale.set(w, d, 1);
      m.position.set(x, -0.005, z);
      S.add(m);
    };
    // Atlantic Ocean along the south, Lagos Lagoon between Ikorodu and Lekki
    water(2000, 500, 50, 790);
    const sand = new THREE.Mesh(new THREE.PlaneGeometry(2000, 16), mat(PALETTE.sand));
    sand.rotation.x = -Math.PI / 2;
    sand.position.set(50, 0, 534);
    S.add(sand);
    this.colliders.out.push({ x0: -1000, x1: 1100, z0: 541, z1: 1200 });
    // the small lagoon south of Manaar Gardens Estate
    water(140, 38, 575, 130, true);
    this.colliders.out.push({ x0: 445, x1: 705, z0: 98, z1: 162 });
    // world edges
    this.colliders.out.push({ x0: -1100, x1: -800, z0: -1900, z1: 900 });
    this.colliders.out.push({ x0: 1060, x1: 1400, z0: -1900, z1: 900 });
    // the north edge: Ikorodu reaches further north than the rest of the city
    // (the Lagos airport road goes north from Ikeja, past the edge)
    this.colliders.out.push({ x0: -1100, x1: 10, z0: -1900, z1: -680 });
    // (the road goes on north from the airport to Ikeja GRA)
    this.colliders.out.push({ x0: 10, x1: 250, z0: -1900, z1: -1092 });
    this.colliders.out.push({ x0: 250, x1: 420, z0: -1900, z1: -680 });
    // every other city: its own ground (sand in Saudi Arabia), with edges all round
    for (const city of Object.keys(CITY_CENTER).filter((c) => c !== "lagos")) {
      const il = DISTRICTS.filter((d) => cityOf(d) === city);
      if (!il.length) continue;
      const x0 = Math.min(...il.map((d) => d.origin.x - halfOf(d).x)) - 70,
        x1 = Math.max(...il.map((d) => d.origin.x + halfOf(d).x)) + 70,
        z0 = Math.min(...il.map((d) => d.origin.z - halfOf(d).z)) - 70,
        z1 = Math.max(...il.map((d) => d.origin.z + halfOf(d).z)) + 70;
      const holyCity = il.some((d) => d.holy);
      const g2 = new THREE.Mesh(
        groundGeo(x1 - x0, z1 - z0, 10),
        holyCity ? mat(0xd9c49a) : TARRED(),
      );
      g2.position.set((x0 + x1) / 2, -0.01, (z0 + z1) / 2);
      g2.receiveShadow = true;
      S.add(g2);
      this.colliders.out.push(
        { x0: x0 - 300, x1: x0, z0: z0 - 300, z1: z1 + 300 },
        { x0: x1, x1: x1 + 300, z0: z0 - 300, z1: z1 + 300 },
        { x0, x1, z0: z0 - 300, z1: z0 },
        { x0, x1, z0: z1, z1: z1 + 300 },
      );
    }
    this.colliders.out.push({ x0: 420, x1: 1200, z0: -1900, z1: -1612 });

    // only the city you start in is built now; the other cities are built a little at a
    // time once you are playing (or at once, if you travel there first)
    const S0 = districtById(this.startId);
    const startCity = cityOf(S0);
    for (const d of DISTRICTS) {
      // the area you start in and the areas close around it are built before you see anything
      const near =
        cityOf(d) === startCity &&
        Math.hypot(d.origin.x - S0.origin.x, d.origin.z - S0.origin.z) < 520;
      if (near) this.buildDistrict(d.id);
      else {
        const g = new THREE.Group();
        g.position.set(d.origin.x, 0, d.origin.z);
        this.scene.add(g);
        this.areaGroups.push({ g, x: d.origin.x, z: d.origin.z });
        this.placeholders.set(d.id, g);
      }
    }

    // a roundabout at the heart of each city
    for (const [cid, c] of Object.entries(CITY_CENTER)) {
      const J = new THREE.Group();
      J.position.set(c.x, 0, c.z);
      S.add(J);
      const ring = new THREE.Mesh(new THREE.RingGeometry(16, 30, 48), mat(PALETTE.road));
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.04;
      ring.receiveShadow = true;
      J.add(ring);
      const island = new THREE.Mesh(new THREE.CircleGeometry(16, 40), mat(0x7f9e52));
      island.rotation.x = -Math.PI / 2;
      island.position.y = 0.05;
      J.add(island);
      const monument = new THREE.Group();
      monument.add(box(3, 1, 3, 0xd9d1bd));
      const pillar = cyl(0.8, 1.1, 9, 0xece6d6, 8);
      pillar.position.y = 5.5;
      monument.add(pillar);
      const top = crescent();
      top.scale.setScalar(2);
      top.position.set(-0.4, 11.4, 0);
      monument.add(top);
      J.add(monument);
      this.colliders.out.push({ x0: c.x - 3, x1: c.x + 3, z0: c.z - 3, z1: c.z + 3 });
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        J.add(palm(Math.cos(a) * 11, Math.sin(a) * 11, 0.9));
      }
      const jl = label(JUNCTION_NAME[cid], { bg: "rgba(31,111,99,0.9)", size: 1.6 });
      jl.position.set(0, 14, 0);
      J.add(jl);
    }
    // roads joining linked areas (Ikorodu Road, Isheri–Igando Road, Ajah–Badore Road)
    for (const d of DISTRICTS) {
      if (!d.parent) continue;
      const p = districtById(d.parent);
      const east = d.link === "east";
      const south = d.link === "south";
      // a = along the road, from the parent to this area
      const a0 = east
        ? p.origin.x + halfOf(p).x - 6
        : south
          ? p.origin.z + (halfOf(p).z - 4)
          : p.origin.z - (halfOf(p).z - 4);
      const a1 = east
        ? d.origin.x - halfOf(d).x + 6
        : south
          ? d.origin.z - halfOf(d).z + 7
          : d.origin.z + halfOf(d).z - 7;
      const len = Math.abs(a1 - a0),
        mid = (a0 + a1) / 2;
      const at = (along: number, across: number): [number, number] =>
        east ? [along, d.origin.z + across] : [d.origin.x + across, along];
      const put = (m: THREE.Mesh, along: number, y: number) => {
        const [x, z] = at(along, 0);
        m.position.set(x, y, z);
        if (east) m.rotation.y = Math.PI / 2;
      };
      const k = new THREE.Mesh(groundGeo(22, len, 2), MAT.pavement());
      put(k, mid, 0.02);
      S.add(k);
      const r = new THREE.Mesh(groundGeo(12, len, 4), MAT.asphalt());
      put(r, mid, 0.04);
      S.add(r);
      const lo = Math.min(a0, a1),
        hi = Math.max(a0, a1);
      for (let v = lo + 3; v < hi - 3; v += 6) {
        const m = new THREE.Mesh(
          new THREE.PlaneGeometry(0.25, 3),
          new THREE.MeshBasicMaterial({ color: PALETTE.line }),
        );
        m.rotation.x = -Math.PI / 2;
        const [x, z] = at(v, 0);
        m.position.set(x, 0.06, z);
        if (east) m.rotation.z = Math.PI / 2;
        this.worldBatch.addObject(m);
      }
      const t = label(d.highway, { bg: "rgba(42,58,52,0.9)", size: 1.1 });
      const [tx, tz] = at(mid, 9);
      t.position.set(tx, 6, tz);
      S.add(t);
      for (let v = lo + 6; v < hi - 6; v += 14) {
        const [x1, z1] = at(v, -13),
          [x2, z2] = at(v + 7, 13);
        this.worldBatch.addObject(palm(x1, z1, 0.9));
        this.worldBatch.addObject(palm(x2, z2, 0.9));
      }
    }
    // expressways from the junction to the end of each main street
    DISTRICTS.filter((d) => !d.parent).forEach((d) => {
      const c = centerOf(d);
      const [ax, az] = this.roadEnd(d);
      const dx = ax - c.x,
        dz = az - c.z;
      const len0 = Math.hypot(dx, dz);
      this.expressway(c.x + (dx / len0) * 24, c.z + (dz / len0) * 24, ax, az, d.highway);
    });
    this.buildFillingStations();
    this.buildArena();
    // the lagoon with its bridges, and the city that fills the land between the areas
    this.buildLagoon();
    this.buildCityFill();

    // big roadside billboards along every expressway and Ikorodu Road
    const roadside = new THREE.Group();
    this.scene.add(roadside);
    const keepDg = this.dg;
    this.dg = roadside;
    for (const d of DISTRICTS) {
      const boards = BILLBOARDS.filter((b) => b.district === "road:" + d.id);
      if (!boards.length) continue;
      let x0: number, z0: number, x1: number, z1: number;
      if (d.parent) {
        const p = districtById(d.parent);
        [x0, z0, x1, z1] = [
          d.origin.x,
          p.origin.z - halfOf(p).z,
          d.origin.x,
          d.origin.z + halfOf(d).z,
        ];
        if (d.link === "east")
          [x0, z0, x1, z1] = [
            p.origin.x + halfOf(p).x,
            p.origin.z,
            d.origin.x - halfOf(d).x,
            d.origin.z,
          ];
        else if (d.link === "south")
          [x0, z0, x1, z1] = [
            d.origin.x,
            p.origin.z + halfOf(p).z,
            d.origin.x,
            d.origin.z - halfOf(d).z,
          ];
      } else {
        const c = centerOf(d);
        const [ex, ez] = this.roadEnd(d);
        const ax = ex - c.x,
          az = ez - c.z;
        const L = Math.hypot(ax, az);
        [x0, z0, x1, z1] = [
          c.x + (ax / L) * 40,
          c.z + (az / L) * 40,
          ex - (ax / L) * 30,
          ez - (az / L) * 30,
        ];
      }
      const dx = x1 - x0,
        dz = z1 - z0,
        L = Math.hypot(dx, dz) || 1;
      const nx = -dz / L,
        nz = dx / L;
      boards.forEach((b, i) => {
        const f = (i + 1) / (boards.length + 1);
        const side = i % 2 ? 1 : -1;
        const off = d.parent ? 16 : 17;
        const x = x0 + dx * f + nx * side * off,
          z = z0 + dz * f + nz * side * off;
        this.billboard(b, x, z, Math.atan2(-nx * side, -nz * side));
      });
    }
    this.dg = keepDg;
    for (const m of this.worldBatch.build()) this.scene.add(m);
  }

  /** The sports arena: its centre, half its width and depth, and the track's middle line. */
  private arena: { x: number; z: number; hw: number; hd: number; S: number; rm: number } | null =
    null;
  /** The points a runner or rider must pass, in order, for one lap (the finish line first). */
  arenaCheckpoints() {
    const A = this.arena;
    if (!A) return null;
    const half = A.S / 2;
    return {
      r: 7,
      pts: [
        { x: A.x, z: A.z + A.rm },
        { x: A.x + half + A.rm, z: A.z },
        { x: A.x, z: A.z - A.rm },
        { x: A.x - half - A.rm, z: A.z },
      ],
    };
  }
  /** IlmWorld Sports Arena: a running track round a football field, stands, floodlights and a
      start and finish arch. Races (running and cycling) are held here. */
  private buildArena() {
    const S = 84,
      r1 = 27,
      r2 = 36,
      rm = (r1 + r2) / 2;
    const hw = S / 2 + r2 + 10,
      hd = r2 + 22;
    const segs = this.roadSegments();
    const clear = (x: number, z: number) => {
      for (const d of DISTRICTS) {
        const H = halfOf(d);
        if (Math.abs(x - d.origin.x) < H.x + hw + 12 && Math.abs(z - d.origin.z) < H.z + hd + 12)
          return false;
      }
      for (let i = -4; i <= 4; i++)
        for (let k = -2; k <= 2; k++) {
          const px = x + (i / 4) * hw,
            pz = z + (k / 2) * hd;
          for (const sg of segs) if (IlmCityEngine.distToSeg(px, pz, sg) < 14) return false;
        }
      for (const f of this.fuelSpots)
        if (Math.abs(f.x - x) < hw + 20 && Math.abs(f.z - z) < hd + 20) return false;
      return true;
    };
    // the open land nearest the middle of the mainland, inside the city's edges
    const L = IlmCityEngine.LAGOON;
    let at: { x: number; z: number } | null = null;
    let best = Infinity;
    for (let x = -700; x <= 960; x += 10)
      for (let z = -640; z <= 480; z += 10) {
        if (x - hw < -780 || x + hw > 1040 || z + hd > 520 || z - hd < -660) continue;
        if (x + hw > L.x0 && x - hw < L.x1 && z + hd > L.z0 - 10 && z - hd < L.z1 + 10) continue;
        if (x + hw > 425 && x - hw < 725 && z + hd > 88 && z - hd < 172) continue;
        if (Math.hypot(x, z) < 90) continue;
        const d = Math.hypot(x + 60, z + 300);
        if (d >= best || !clear(x, z)) continue;
        best = d;
        at = { x, z };
      }
    if (!at) return;
    this.arena = { ...at, hw, hd, S, rm };
    const g = new THREE.Group();
    g.position.set(at.x, 0, at.z);
    this.scene.add(g);
    const stadium = (r: number) => {
      const sh = new THREE.Shape();
      sh.moveTo(-S / 2, -r);
      sh.lineTo(S / 2, -r);
      sh.absarc(S / 2, 0, r, -Math.PI / 2, Math.PI / 2, false);
      sh.lineTo(-S / 2, r);
      sh.absarc(-S / 2, 0, r, Math.PI / 2, (Math.PI * 3) / 2, false);
      return sh;
    };
    const ring = (ro: number, ri: number, color: number, y: number) => {
      const sh = stadium(ro);
      sh.holes.push(stadium(ri) as unknown as THREE.Path);
      const geo = new THREE.ShapeGeometry(sh, 24);
      geo.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(geo, mat(color, { roughness: 0.9 }));
      m.position.y = y;
      m.receiveShadow = true;
      g.add(m);
    };
    // the apron, the track, its white lane lines and the field inside
    const apron = new THREE.Mesh(groundGeo(hw * 2, hd * 2, 3), mat(0xc9c6bd));
    apron.position.y = 0.02;
    apron.receiveShadow = true;
    g.add(apron);
    ring(r2 + 1.2, r1 - 1.2, 0x5f9e48, 0.03);
    ring(r2, r1, 0xb5523b, 0.045);
    for (let k = 0; k <= 8; k++) {
      const rr = r1 + (k * (r2 - r1)) / 8;
      ring(rr + 0.06, rr - 0.06, 0xf4f4f0, 0.055);
    }
    const field = new THREE.Mesh(
      new THREE.ShapeGeometry(stadium(r1 - 1.2), 24).rotateX(-Math.PI / 2),
      mat(0x5f9e48, { roughness: 0.95 }),
    );
    field.position.y = 0.035;
    g.add(field);
    // a football pitch marked inside
    const lineM = mat(0xf4f4f0);
    for (const [w, d, x, z] of [
      [90, 0.15, 0, -22],
      [90, 0.15, 0, 22],
      [0.15, 44, -45, 0],
      [0.15, 44, 45, 0],
      [0.15, 44, 0, 0],
    ]) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), lineM);
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, 0.06, z);
      g.add(m);
    }
    for (const x of [-45, 45]) g.add(box(0.15, 2.4, 7.3, 0xf4f4f0, x, 0, 0));
    // the start and finish line across the front straight, and its arch
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.5, r2 - r1), lineM);
    fl.rotation.x = -Math.PI / 2;
    fl.position.set(0, 0.07, rm);
    g.add(fl);
    for (const z of [r1 - 1.5, r2 + 1.5]) {
      g.add(box(0.5, 6, 0.5, 0x1f6f63, 0, 0, z));
      this.colliders.out.push({
        x0: at.x - 0.3,
        x1: at.x + 0.3,
        z0: at.z + z - 0.3,
        z1: at.z + z + 0.3,
      });
    }
    const banner = this.signBoard("START · FINISH", r2 - r1 + 4, 1.4, "#1f6f63", "#ffffff");
    banner.position.set(0, 6.2, rm);
    g.add(banner);
    const back = this.signBoard("START · FINISH", r2 - r1 + 4, 1.4, "#1f6f63", "#ffffff");
    back.position.set(0, 6.2, rm - 0.05);
    back.rotation.y = Math.PI;
    g.add(back);
    // the stand along the back straight, with a roof
    const sz = -(r2 + 4);
    for (let t = 0; t < 5; t++) {
      g.add(box(S + 20, 0.6 + t * 0.6, 2, 0x9aa0a6, 0, 0, sz - t * 2));
      g.add(
        box(
          S + 16,
          0.35,
          0.6,
          [0x1f6f63, 0xe6b84a, 0x2a4a7a][t % 3],
          0,
          0.6 + t * 0.6,
          sz - t * 2 + 0.3,
        ),
      );
    }
    g.add(box(S + 24, 0.4, 13, 0xf4f4f0, 0, 9, sz - 5));
    for (const x of [-S / 2 - 10, 0, S / 2 + 10]) g.add(box(0.4, 9, 0.4, 0x5a5f66, x, 0, sz - 10));
    this.colliders.out.push({
      x0: at.x - S / 2 - 12,
      x1: at.x + S / 2 + 12,
      z0: at.z + sz - 11,
      z1: at.z + sz + 1,
    });
    const name = this.signBoard("IlmWorld Sports Arena", 22, 2.2, "#10201e", "#e6b84a");
    name.position.set(0, 10.8, sz + 1.6);
    g.add(name);
    // floodlights at the four corners
    for (const [x, z] of [
      [-hw + 4, -hd + 4],
      [hw - 4, -hd + 4],
      [-hw + 4, hd - 4],
      [hw - 4, hd - 4],
    ]) {
      g.add(box(0.5, 18, 0.5, 0x5a5f66, x, 0, z));
      g.add(box(3, 1.6, 0.6, 0xf4f4f0, x, 18, z));
      this.colliders.out.push({
        x0: at.x + x - 0.4,
        x1: at.x + x + 0.4,
        z0: at.z + z - 0.4,
        z1: at.z + z + 0.4,
      });
    }
    // where races are entered: by the finish line
    this.zones.push({
      id: "arena",
      label: "🏁 Races",
      x: at.x + 6,
      z: at.z + r2 + 4,
      r: 4,
      scene: "out",
    });
    const t = label("🏁 IlmWorld Sports Arena · running and cycling races", {
      size: 1.1,
      bg: "rgba(16,32,30,0.9)",
    });
    t.position.set(at.x, 13, at.z + hd - 4);
    this.scene.add(t);
  }
  /** Where filling stations stand (kept clear of the city's other buildings). */
  private fuelSpots: { x: number; z: number }[] = [];
  /** A Barakah Oil filling station beside each expressway, where it reaches its area. */
  private buildFillingStations() {
    const segs = this.roadSegments();
    for (const d of DISTRICTS) {
      if (d.parent || d.holy) continue;
      const c = centerOf(d);
      const [ex, ez] = this.roadEnd(d);
      const L = Math.hypot(c.x - ex, c.z - ez);
      if (L < 90) continue;
      const ux = (c.x - ex) / L,
        uz = (c.z - ez) / L;
      // try either side of the road, a little way out of the area
      let placed = false;
      for (const along of [44, 64, 84])
        for (const side of [1, -1]) {
          if (placed) continue;
          const nx = -uz * side,
            nz = ux * side;
          const x = ex + ux * along + nx * 26,
            z = ez + uz * along + nz * 26;
          const clearOfAreas = DISTRICTS.every(
            (o) =>
              Math.abs(x - o.origin.x) > halfOf(o).x + 18 ||
              Math.abs(z - o.origin.z) > halfOf(o).z + 18,
          );
          const L2 = IlmCityEngine.LAGOON;
          const inLagoon = x > L2.x0 - 20 && x < L2.x1 + 20 && z > L2.z0 - 20 && z < L2.z1 + 20;
          // clear of every road except its own
          const roadsOk = segs.every(
            (sg) =>
              IlmCityEngine.distToSeg(x, z, sg) > 20 ||
              Math.abs(IlmCityEngine.distToSeg(x, z, sg) - 26) < 1,
          );
          if (!clearOfAreas || inLagoon || !roadsOk) continue;
          // its front faces the road
          const turn = Math.atan2(-nx, -nz);
          const built = fillingStation(this.worldBatch, { x, z, turn });
          for (const b of built.colliders) this.colliders.out.push(b);
          for (const sp of built.spots)
            this.zones.push({
              id: "fuel:" + d.id,
              label: sp.label,
              x: sp.x,
              z: sp.z,
              r: 3.2,
              scene: "out",
            });
          const t = label(`⛽ Barakah Oil · ${d.name}`, { size: 1, bg: "rgba(29,122,58,0.92)" });
          t.position.set(x, 8, z);
          this.scene.add(t);
          this.fuelSpots.push({ x, z });
          placed = true;
        }
    }
  }

  /* ---------------- the megacity ---------------- */
  /** Every road between areas, as straight segments (for keeping buildings off them). */
  private roadSegments() {
    const segs: [number, number, number, number][] = [];
    for (const d of DISTRICTS) {
      if (d.parent) {
        const p = districtById(d.parent);
        if (d.link === "east")
          segs.push([p.origin.x + halfOf(p).x, d.origin.z, d.origin.x - halfOf(d).x, d.origin.z]);
        else if (d.link === "south")
          segs.push([d.origin.x, p.origin.z + halfOf(p).z, d.origin.x, d.origin.z - halfOf(d).z]);
        else
          segs.push([d.origin.x, p.origin.z - halfOf(p).z, d.origin.x, d.origin.z + halfOf(d).z]);
      } else {
        const [ax, az] = this.roadEnd(d);
        const c = centerOf(d);
        segs.push([c.x, c.z, ax, az]);
      }
    }
    return segs;
  }
  private static distToSeg(x: number, z: number, s: [number, number, number, number]) {
    const [x0, z0, x1, z1] = s;
    const dx = x1 - x0,
      dz = z1 - z0;
    const t = Math.max(0, Math.min(1, ((x - x0) * dx + (z - z0) * dz) / (dx * dx + dz * dz || 1)));
    return Math.hypot(x - (x0 + dx * t), z - (z0 + dz * t));
  }
  /** The Lagos Lagoon between the mainland and the island, crossed by three bridges. */
  private static LAGOON = { x0: -460, x1: 470, z0: 172, z1: 214 };
  private buildLagoon() {
    const L = IlmCityEngine.LAGOON;
    const S = this.scene;
    const w = new THREE.Mesh(
      new THREE.PlaneGeometry(L.x1 - L.x0, L.z1 - L.z0),
      new THREE.MeshStandardMaterial({ color: PALETTE.water, roughness: 0.25, metalness: 0.1 }),
    );
    w.rotation.x = -Math.PI / 2;
    w.position.set((L.x0 + L.x1) / 2, -0.004, (L.z0 + L.z1) / 2);
    S.add(w);
    // where roads cross the water, build a bridge; the rest of the water is out of bounds
    const crossings: { x0: number; x1: number; seg: [number, number, number, number] }[] = [];
    for (const seg of this.roadSegments()) {
      const [x0, z0, x1, z1] = seg;
      if (Math.max(z0, z1) < L.z0 || Math.min(z0, z1) > L.z1) continue;
      const xAt = (z: number) => x0 + ((x1 - x0) * (z - z0)) / (z1 - z0 || 1);
      const a = xAt(L.z0 - 4),
        b = xAt(L.z1 + 4);
      crossings.push({ x0: Math.min(a, b) - 9, x1: Math.max(a, b) + 9, seg });
    }
    crossings.sort((p, q) => p.x0 - q.x0);
    let x = L.x0;
    for (const c of crossings) {
      if (c.x0 > x) this.colliders.out.push({ x0: x, x1: c.x0, z0: L.z0, z1: L.z1 });
      x = Math.max(x, c.x1);
    }
    if (x < L.x1) this.colliders.out.push({ x0: x, x1: L.x1, z0: L.z0, z1: L.z1 });
    const names = ["Ijora Bridge", "Eko Bridge", "Third Mainland Bridge"];
    const rail = MAT.plain(0xd8d2c2),
      pillar = MAT.plain(0xb9b2a2);
    const b = new Batch();
    crossings.forEach((c, i) => {
      const [x0, z0, x1, z1] = c.seg;
      const len0 = Math.hypot(x1 - x0, z1 - z0);
      const ux = (x1 - x0) / len0,
        uz = (z1 - z0) / len0;
      const nx = -uz,
        nz = ux;
      const ry = Math.atan2(ux, uz);
      // the stretch of road over the water, a little longer on each bank
      const tAt = (z: number) => (z - z0) / (uz || 1e-6);
      const t0 = Math.min(tAt(L.z0 - 6), tAt(L.z1 + 6)),
        t1 = Math.max(tAt(L.z0 - 6), tAt(L.z1 + 6));
      const len = t1 - t0,
        tm = (t0 + t1) / 2;
      const cx = x0 + ux * tm,
        cz = z0 + uz * tm;
      for (const side of [-1, 1]) {
        b.box(0.5, 1.1, len, rail, cx + nx * side * 9, 0, cz + nz * side * 9, ry);
        for (let t = -len / 2 + 4; t < len / 2; t += 9)
          b.box(
            1.2,
            1.6,
            1.2,
            pillar,
            cx + nx * side * 9 + ux * t,
            -1.5,
            cz + nz * side * 9 + uz * t,
            ry,
          );
        // keep people on the bridge
        const ex = cx + nx * side * 9.3,
          ez = cz + nz * side * 9.3;
        for (let t = -len / 2; t < len / 2; t += 3)
          this.colliders.out.push({
            x0: ex + ux * t - 0.5,
            x1: ex + ux * t + 0.5,
            z0: ez + uz * t - 0.5,
            z1: ez + uz * t + 0.5,
          });
      }
      // lamp posts with arches
      for (let t = -len / 2 + 6; t < len / 2; t += 18)
        for (const side of [-1, 1])
          b.box(
            0.2,
            6,
            0.2,
            MAT.plain(0x5a5f66),
            cx + nx * side * 9 + ux * t,
            1.1,
            cz + nz * side * 9 + uz * t,
            ry,
          );
      const tag = label(names[i % names.length], { bg: "rgba(31,111,99,0.92)", size: 1.2 });
      tag.position.set(cx + nx * 11, 5, cz + nz * 11);
      S.add(tag);
    });
    for (const m of b.build()) S.add(m);
    const lt = label("Lagos Lagoon", { bg: "rgba(42,58,52,0.85)", size: 1.6 });
    lt.position.set(-250, 6, (L.z0 + L.z1) / 2);
    S.add(lt);
    const oc = label("Atlantic Ocean · Bar Beach", { bg: "rgba(42,58,52,0.85)", size: 1.8 });
    oc.position.set(150, 7, 560);
    S.add(oc);
  }
  /** Lagos is a megacity: the land between the areas is full of buildings, richer in
      Lekki and Ikeja, crowded and poorer in Ajegunle. Each block is one solid box. */
  private buildCityFill() {
    const rnd = mulberry(4242);
    const segs = this.roadSegments();
    const L = IlmCityEngine.LAGOON;
    const CELL = 16;
    const owner = (x: number, z: number) => {
      let best: District | null = null,
        bd = Infinity;
      for (const d of DISTRICTS) {
        const H = halfOf(d);
        const dx = Math.max(0, Math.abs(x - d.origin.x) - H.x),
          dz = Math.max(0, Math.abs(z - d.origin.z) - H.z);
        const dd = Math.hypot(dx, dz);
        if (dd < bd) {
          bd = dd;
          best = d;
        }
      }
      return { d: best!, dist: bd };
    };
    const blocked = (x: number, z: number) => {
      const r = CELL / 2 + 2;
      if (x < -790 || x > 1050 || z > 520) return true;
      if (x < 420 && z < -672) return true;
      if (z < -1605) return true;
      if (Math.hypot(x, z) < 50) return true;
      if (x > L.x0 - r && x < L.x1 + r && z > L.z0 - r && z < L.z1 + r) return true;
      if (x > 425 && x < 725 && z > 88 && z < 172) return true; // the small lagoon
      // Manaar University College's building site, west of Igbe Laara
      if (x > 340 && x < 462 && z > -610 && z < -512) return true;
      for (const f of this.fuelSpots) if (Math.hypot(x - f.x, z - f.z) < 26) return true;
      const A = this.arena;
      if (A && Math.abs(x - A.x) < A.hw + 14 && Math.abs(z - A.z) < A.hd + 14) return true;
      for (const s of segs) if (IlmCityEngine.distToSeg(x, z, s) < 15 + CELL / 2) return true;
      for (const d of DISTRICTS) {
        const H = halfOf(d);
        if (Math.abs(x - d.origin.x) < H.x + r && Math.abs(z - d.origin.z) < H.z + r) return true;
      }
      return false;
    };
    const glass = MAT2.glass(),
      zinc = MAT.zinc(0x8a6a4a),
      zinc2 = MAT.zinc(0x9aa0a6);
    const paints = [0xf2ead6, 0xe9d8b4, 0xdfe7e2, 0xf4e0c8, 0xe6d2d2, 0xd8e2ea, 0xf0f0ea];
    const faded = [0xcfc3a8, 0xbfae92, 0xc9bfae, 0xb8a990, 0xd2c6b0];
    const batches = new Map<string, Batch>();
    const batchFor = (d: District) => {
      let b = batches.get(d.id);
      if (!b) {
        b = new Batch();
        batches.set(d.id, b);
      }
      return b;
    };
    for (let x = -780; x <= 1040; x += CELL)
      for (let z = -1600; z <= 510; z += CELL) {
        if (blocked(x, z)) continue;
        const { d, dist } = owner(x, z);
        if (dist > 120) continue; // open land far from any area
        // thinner towards the edge of the city
        if (rnd() < dist / 160) continue;
        const tier = d.tier ?? 2;
        const b = batchFor(d);
        const lx = x - d.origin.x,
          lz = z - d.origin.z;
        const pick = <T>(a: T[]) => a[Math.floor(rnd() * a.length)];
        if (tier === 1) {
          if (rnd() < 0.45) {
            const h = 16 + rnd() * 40;
            const w = 9 + rnd() * 4;
            b.box(w, h, w, glass, lx, 0, lz);
            b.box(w + 0.6, 0.8, w + 0.6, MAT.plain(0xe9ecee, 0.3), lx, h, lz);
          } else {
            const h = 6 + rnd() * 5;
            b.box(11, h, 10, MAT.plaster(pick(paints)), lx, 0, lz);
            b.box(11.6, 0.5, 10.6, MAT.plain(0xfdfbf5), lx, h, lz);
            b.box(13, 0.15, 12, MAT.paving(), lx, 0.02, lz);
          }
        } else if (tier === 2) {
          const h = 3.4 * (1 + Math.floor(rnd() * 3));
          b.box(11 + rnd() * 2, h, 10 + rnd() * 2, MAT.plaster(pick(paints)), lx, 0, lz);
          if (rnd() < 0.6)
            b.box(12.5, 0.4, 11.5, MAT.zinc(pick([0x8a3b2b, 0x3d5a7a, 0x2f6a4a])), lx, h, lz);
        } else if (tier === 3) {
          const h = 3.2 * (1 + Math.floor(rnd() * 2.5));
          b.box(13, h, 12.5, MAT.plaster(pick(faded)), lx, 0, lz);
          b.box(13.4, 0.35, 12.9, rnd() < 0.5 ? zinc : zinc2, lx, h, lz);
        } else {
          // crowded one-room houses with rusty zinc roofs
          for (let k = 0; k < 4; k++) {
            const sx = lx + (k % 2 ? 3.6 : -3.6) + (rnd() - 0.5),
              sz = lz + (k < 2 ? 3.6 : -3.6) + (rnd() - 0.5);
            const h = 2.6 + rnd() * 0.8;
            b.box(6.4, h, 6, MAT.plaster(pick(faded)), sx, 0, sz);
            const roof = new THREE.BoxGeometry(7, 0.2, 6.6);
            b.add(roof, rnd() < 0.7 ? zinc : zinc2, sx, h + 0.15, sz, rnd() * 0.1, true);
          }
        }
        this.fillCells.add(`${Math.round((x + 780) / CELL)},${Math.round((z + 1600) / CELL)}`);
      }
    for (const [id, b] of batches) {
      const g = this.areaGroup(id);
      for (const m of b.build()) {
        // background buildings: no shadows, to keep phones fast
        m.castShadow = false;
        m.receiveShadow = false;
        g.add(m);
      }
    }
  }

  /** Where an area's main street meets its expressway. */
  private roadEnd(d: District): [number, number] {
    const side = d.origin.x > centerOf(d).x ? -1 : 1;
    return [d.origin.x + side * (halfOf(d).x - 6), d.origin.z];
  }

  private expressway(x0: number, z0: number, x1: number, z1: number, name: string) {
    const S = this.scene;
    const dx = x1 - x0,
      dz = z1 - z0,
      len = Math.hypot(dx, dz);
    const g = new THREE.Group();
    g.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2);
    g.rotation.y = Math.atan2(dx, dz);
    const k = new THREE.Mesh(groundGeo(19, len + 2, 2), MAT.pavement());
    k.position.y = 0.02;
    k.receiveShadow = true;
    g.add(k);
    const r = new THREE.Mesh(groundGeo(15, len, 4), MAT.asphalt());
    r.position.y = 0.04;
    r.receiveShadow = true;
    g.add(r);
    const dash = new THREE.MeshBasicMaterial({ color: PALETTE.line });
    for (let t = -len / 2 + 4; t < len / 2 - 4; t += 8) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 4), dash);
      m.rotation.x = -Math.PI / 2;
      m.position.set(0, 0.06, t);
      g.add(m);
    }
    for (let t = -len / 2 + 14; t < len / 2 - 14; t += 26) {
      g.add(palm(-12.5, t, 0.9));
      g.add(palm(12.5, t + 13, 0.9));
      for (const [lx, lt] of [
        [-12.5, t],
        [12.5, t + 13],
      ]) {
        const a = g.rotation.y;
        const wx = g.position.x + lx * Math.cos(a) + lt * Math.sin(a),
          wz = g.position.z - lx * Math.sin(a) + lt * Math.cos(a);
        this.colliders.out.push({ x0: wx - 0.45, x1: wx + 0.45, z0: wz - 0.45, z1: wz + 0.45 });
      }
    }
    this.worldBatch.addObject(g);
    for (const f of [0.2, 0.5, 0.8]) {
      const t = label(name, { bg: "rgba(42,58,52,0.9)", size: 1.1 });
      t.position.set(x0 + dx * f, 6.5, z0 + dz * f);
      S.add(t);
    }
  }

  /** The area the player is in, or null on an expressway. */
  areaAt(x: number, z: number) {
    return (
      DISTRICTS.find(
        (d) => Math.abs(x - d.origin.x) < halfOf(d).x && Math.abs(z - d.origin.z) < halfOf(d).z,
      ) ?? null
    );
  }
  /** Which expressway the player is on, if any. */
  private roadAt(x: number, z: number) {
    for (const d of DISTRICTS) {
      if (d.parent) {
        const p = districtById(d.parent);
        if (d.link === "east") {
          if (Math.abs(z - d.origin.z) < 12 && x > p.origin.x && x < d.origin.x) return d.highway;
        } else if (d.link === "south") {
          if (Math.abs(x - d.origin.x) < 12 && z < d.origin.z && z > p.origin.z) return d.highway;
        } else if (Math.abs(x - d.origin.x) < 12 && z > d.origin.z && z < p.origin.z)
          return d.highway;
        continue;
      }
      const c = centerOf(d);
      const [ex, ez] = this.roadEnd(d);
      const ax = ex - c.x,
        az = ez - c.z,
        px = x - c.x,
        pz = z - c.z;
      const t = Math.max(0, Math.min(1, (px * ax + pz * az) / (ax * ax + az * az)));
      if (Math.hypot(px - ax * t, pz - az * t) < 11) return d.highway;
    }
    for (const [id, c] of Object.entries(CITY_CENTER))
      if (Math.hypot(x - c.x, z - c.z) < 34) return JUNCTION_NAME[id];
    return null;
  }

  private reserved: Box[] = [];
  private worldBatch = new Batch();
  private areaGroups: { g: THREE.Group; x: number; z: number; onGpu?: boolean }[] = [];
  /** Let the graphics card forget a far-away area (it is sent again when you come back),
   *  so phones don't run out of graphics memory as you travel. */
  private freeArea(a: { g: THREE.Group; onGpu?: boolean }) {
    a.onGpu = false;
    const keep = new Set<object>();
    const maps = (m: THREE.Mesh) =>
      (Array.isArray(m.material) ? m.material : m.material ? [m.material] : []).map(
        (x) => (x as THREE.MeshBasicMaterial).map,
      );
    for (const b of this.areaGroups)
      if (b.g.visible)
        b.g.traverse((o) => {
          const m = o as THREE.Mesh;
          if (m.geometry) keep.add(m.geometry);
          if (m.isMesh) for (const t of maps(m)) if (t) keep.add(t);
        });
    a.g.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry && !keep.has(m.geometry)) m.geometry.dispose();
      if (m.isMesh) for (const t of maps(m)) if (t && !keep.has(t)) t.dispose();
    });
  }
  /** Every compound in the city (for rent, sale and visits). */
  plots: (Compound & {
    id: string;
    kind: "house" | "land" | "shops";
    toLet: boolean;
    district: string;
    street: string;
    streetZ: number;
    x: number;
    z: number;
    /** a smaller plot (the closes): its width and depth */
    pw?: number;
    pd?: number;
  })[] = [];
  private ox = 0;
  private oz = 0;
  private boxFree(x0: number, x1: number, z0: number, z1: number) {
    x0 += this.ox;
    x1 += this.ox;
    z0 += this.oz;
    z1 += this.oz;
    for (const b of [...this.colliders.out, ...this.reserved])
      if (x0 < b.x1 && x1 > b.x0 && z0 < b.z1 && z1 > b.z0) return false;
    return true;
  }

  private buildLandmark(l: Landmark, D: District) {
    const sz = D.streets.find((s) => s.id === l.street)?.z ?? 0;
    if (l.kind === "haram") this.buildHaram(l, D);
    else if (l.kind === "nabawi") this.buildNabawi(l, D);
    else if (l.kind === "jamarat") this.buildJamarat(l, sz, D);
    else if (l.kind === "rahmah") this.buildRahmah(l, D, sz);
    else if (l.kind === "clocktower") this.buildClockTower(l.x, sz - 30, l.name);
    else if (l.kind === "masjid") {
      this.buildMasjid(l.x, sz - 23, l);
      // the famous mosques of Madinah keep their own shape: minarets and white domes
      if (l.id === "masjid-quba") this.masjidCrown(l.x, sz - 23, 4, 6);
      if (l.id === "masjid-qiblatayn") this.masjidCrown(l.x, sz - 23, 2, 2);
      if (l.id === "masjid-qiblatayn") this.mountUhud(D);
    } else if (l.kind === "school") this.buildSchool(l.x, sz - 20, l);
    else if (l.kind === "home") this.buildHome(l.x, sz - 17);
    else if (l.kind === "souq") this.buildSouq(l.x, sz - 19, l);
    else if (l.kind === "market") this.buildMarket(D);
    else {
      const south = l.side === "s";
      const d = l.depth ?? 30,
        w = l.width ?? 30;
      const cz = south ? sz + 11 + d / 2 : sz - 11 - d / 2;
      const turn = south ? Math.PI : 0;
      const b = this.curBatch;
      const o = { x: l.x, z: cz, turn, width: w, depth: d, floors: l.floors ?? 2, name: l.name };
      let seats: { x: number; z: number; face: number }[] = [];
      const built =
        l.kind === "campus"
          ? campus(b, { ...o, classes: l.classes ?? [] })
          : l.kind === "mansion"
            ? mansion(b, o)
            : l.kind === "faculty"
              ? faculty(b, o)
              : l.kind === "field"
                ? (() => {
                    const f = field(b, o);
                    this.registerPitch(`field:${l.id}`, f.pitch);
                    return f;
                  })()
                : l.kind === "hangout"
                  ? (() => {
                      const h = hangout(b, o);
                      seats = h.seats;
                      return h;
                    })()
                  : office(b, {
                      ...o,
                      color: l.brand?.color ?? 0x1f6f63,
                      accent: l.brand?.accent ?? 0xffffff,
                    });
      if (seats.length) this.seatStudents(seats, D);
      if (l.kind === "station") {
        // the white high-speed train waiting at the platform behind the station
        const pz = south ? cz + d / 2 + 6 : cz - d / 2 - 6;
        const train = new THREE.Group();
        const body = 0xf4f4f0;
        for (let c = 0; c < 3; c++) {
          const x0 = l.x - 32 + c * 21;
          train.add(box(20, 3.4, 3.2, body, x0, 0.5, pz));
          train.add(box(20.05, 0.35, 3.25, 0x9a7a3a, x0, 1.6, pz));
          train.add(box(18, 0.9, 3.25, 0x2a3a44, x0, 2.3, pz));
        }
        const nose = new THREE.Mesh(new THREE.ConeGeometry(1.75, 6, 12), mat(body));
        nose.rotation.z = -Math.PI / 2;
        nose.scale.set(1, 1, 0.9);
        nose.position.set(l.x - 32 + 2 * 21 + 13, 2.2, pz);
        train.add(nose);
        train.add(box(70, 0.5, 6, 0xb8b2a4, l.x - 11, 0, pz)); // the platform
        this.dg.add(train);
        this.addCollider("out", l.x - 46, l.x + 26, pz - 3, pz + 3);
        this.reserved.push({
          x0: this.ox + l.x - 48,
          x1: this.ox + l.x + 28,
          z0: this.oz + pz - 5,
          z1: this.oz + pz + 5,
        });
        const t = label("🚄 " + l.name, { size: 1.1, bg: "rgba(154,122,58,0.92)" });
        t.position.set(l.x, (l.floors ?? 2) * 4 + 4, cz);
        this.dg.add(t);
      }
      if (l.kind === "airport" && l.id === "makkah") {
        // the Hajj Terminal at Jeddah: a field of white tent roofs on tall pylons
        const tx0 = l.x + w / 2 + 10;
        for (let i = 0; i < 4; i++)
          for (let k = 0; k < 2; k++) {
            const x = tx0 + 9 + i * 19,
              z = cz - 9 + k * 19 * (south ? 1 : -1) * -1;
            const tent = new THREE.Mesh(
              new THREE.ConeGeometry(9.5, 7, 4, 1, true),
              mat(0xf8f8f4, { side: THREE.DoubleSide, roughness: 0.9 }),
            );
            tent.rotation.y = Math.PI / 4;
            tent.position.set(x, 13.5, z);
            tent.castShadow = true;
            this.dg.add(tent);
            const pole = cyl(0.35, 0.45, 17, 0xd9d9d9, 8);
            pole.position.set(x, 8.5, z);
            this.dg.add(pole);
            this.addCollider("out", x - 0.5, x + 0.5, z - 0.5, z + 0.5);
          }
        const ht = label("Hajj Terminal", { size: 1.4, bg: "rgba(29,107,58,0.92)" });
        ht.position.set(tx0 + 38, 19, cz);
        this.dg.add(ht);
        this.reserved.push({
          x0: this.ox + tx0,
          x1: this.ox + tx0 + 80,
          z0: this.oz + cz - 30,
          z1: this.oz + cz + 30,
        });
      }
      if (l.kind === "airport" && l.id === "madinah") {
        // Madinah's terminal: a row of tall white arches across its front
        const fz = south ? cz - d / 2 - 1.5 : cz + d / 2 + 1.5;
        for (let i = 0; i < 7; i++) {
          const x = l.x - w / 2 + 6 + i * ((w - 12) / 6);
          const arch = new THREE.Mesh(
            new THREE.TorusGeometry(5, 0.6, 8, 20, Math.PI),
            mat(0xf8f8f4),
          );
          arch.position.set(x, 9, fz);
          this.dg.add(arch);
          for (const s2 of [-5, 5]) {
            const p2 = cyl(0.6, 0.6, 9, 0xf8f8f4, 8);
            p2.position.set(x + s2, 4.5, fz);
            this.dg.add(p2);
            this.addCollider("out", x + s2 - 0.7, x + s2 + 0.7, fz - 0.7, fz + 0.7);
          }
        }
      }
      if (l.kind === "airport") {
        // a plane parked on the apron behind the terminal
        const plane = planeMesh(l.brand?.color ?? 0x2f4a7a);
        const pz = south ? cz + d / 2 + 16 : cz - d / 2 - 16;
        plane.position.set(l.x, 0, pz);
        plane.rotation.y = Math.PI / 2;
        this.dg.add(plane);
        this.addCollider("out", l.x - 11, l.x + 11, pz - 10, pz + 10);
        const t = label("✈️ " + l.name, { size: 1.2, bg: "rgba(31,74,122,0.92)" });
        t.position.set(l.x, (l.floors ?? 2) * 4 + 4, cz);
        this.dg.add(t);
      }
      if (l.kind === "field" || l.kind === "hangout")
        this.reserved.push({
          x0: this.ox + l.x - w / 2,
          x1: this.ox + l.x + w / 2,
          z0: this.oz + cz - d / 2,
          z1: this.oz + cz + d / 2,
        });
      for (const c of built.colliders) this.addCollider("out", c.x0, c.x1, c.z0, c.z1);
      for (const sp of built.spots) {
        if (sp.key === "gate" && l.kind === "campus") {
          const t = label(sp.label, { size: 1.1 });
          t.position.set(sp.x, sp.labelY ?? 6, sp.z);
          this.dg.add(t);
          continue;
        }
        const id = l.kind === "campus" ? `campus:${l.id}:${sp.key}` : `${l.kind}:${l.id}`;
        const text =
          l.kind === "campus"
            ? sp.label
            : l.kind === "faculty"
              ? "Enter " + l.name.split(" · ")[0]
              : l.kind === "field"
                ? "Play football"
                : l.kind === "airport"
                  ? "✈️ Fly to another city"
                  : l.kind === "station"
                    ? "🚄 Take the Haramain train"
                    : l.kind === "hangout"
                      ? "Sit and gist"
                      : "Visit " + l.name;
        this.zones.push({
          id,
          label: text,
          x: sp.x + this.ox,
          z: sp.z + this.oz,
          r: 2.6,
          scene: "out",
        });
        const t = label(sp.label, { size: l.kind === "campus" ? 0.65 : 0.9 });
        t.position.set(sp.x, sp.labelY ?? 4, sp.z);
        this.dg.add(t);
      }
    }
  }
  private curBatch = new Batch();

  /** A building site at the west end of a street (just past the area's last houses):
      the hoarding, a concrete frame going up with scaffolding, a tower crane, sand,
      blocks, a site office and workers in hard hats. */
  private buildManaarSite(b: Batch, sz: number) {
    const x0 = -128,
      x1 = -214,
      zN = sz - 58,
      zS = sz + 8;
    // the street carries on to the site gate
    const road = new THREE.Mesh(groundGeo(x0 - x1 + 4, 9, 4), MAT.asphalt());
    road.position.set((x0 + x1) / 2, 0.04, sz);
    road.receiveShadow = true;
    this.dg.add(road);
    const cx = (x0 + x1) / 2,
      cz = (zN + sz - 6) / 2;
    // the ground inside: red earth
    const dirt = new THREE.Mesh(groundGeo(x0 - x1 - 6, sz - 6 - zN, 3), mat(0xb07a4e));
    dirt.position.set(cx - 2, 0.03, cz);
    dirt.receiveShadow = true;
    this.dg.add(dirt);
    // the hoarding: blue zinc sheets with a gap for the gate
    const zinc = MAT.plain(0x2a5a8a, 0.6);
    const fence = (ax: number, az: number, bx: number, bz: number) => {
      const along = Math.abs(bx - ax) > Math.abs(bz - az);
      const len = Math.hypot(bx - ax, bz - az);
      b.box(along ? len : 0.2, 2.6, along ? 0.2 : len, zinc, (ax + bx) / 2, 0, (az + bz) / 2);
      this.addCollider(
        "out",
        Math.min(ax, bx) - 0.2,
        Math.max(ax, bx) + 0.2,
        Math.min(az, bz) - 0.2,
        Math.max(az, bz) + 0.2,
      );
    };
    const fz = sz - 6;
    fence(x0 - 2, fz, cx + 6, fz);
    fence(cx - 6, fz, x1 + 2, fz);
    fence(x0 - 2, zN, x1 + 2, zN);
    fence(x0 - 2, zN, x0 - 2, fz);
    fence(x1 + 2, zN, x1 + 2, fz);
    // the big signboard over the hoarding
    const sign = this.signBoard("MANAAR UNIVERSITY COLLEGE", 22, 2.2, "#1f6f63", "#ffffff");
    sign.position.set(cx + 18, 5.2, fz + 0.4);
    this.dg.add(sign);
    for (const px of [cx + 8, cx + 28]) {
      b.box(0.3, 4.2, 0.3, MAT.plain(0x5a5f66, 0.5), px, 0, fz + 0.4);
    }
    const sub = this.signBoard(
      "Under construction · coming soon, in shaa Allah",
      22,
      1,
      "#e6b84a",
      "#2a1c05",
    );
    sub.position.set(cx + 18, 3.6, fz + 0.42);
    this.dg.add(sub);
    // the concrete frame: three floors cast, the fourth's columns rising
    const fzc0 = zN + 24;
    const fx = cx - 8,
      fzc = fzc0,
      FW = 40,
      FD = 22,
      FH = 3.6,
      grey = MAT.plain(0xa9a49a, 0.95),
      wet = MAT.plain(0x8e897f, 0.95);
    for (let f = 0; f <= 3; f++) b.box(FW, 0.35, FD, f === 3 ? wet : grey, fx, f * FH, fzc);
    for (let f = 0; f < 4; f++)
      for (let ix = 0; ix <= 5; ix++)
        for (let iz = 0; iz <= 2; iz++) {
          if (f === 3 && (ix + iz) % 2) continue; // the top floor's columns half done
          const x = fx - FW / 2 + 0.4 + (ix * (FW - 0.8)) / 5,
            z = fzc - FD / 2 + 0.4 + (iz * (FD - 0.8)) / 2;
          b.box(0.55, f === 3 ? FH * 0.6 : FH, 0.55, grey, x, f * FH + 0.35, z);
          if (f === 3) b.box(0.08, 1.6, 0.08, MAT.plain(0x6a4a3a), x, f * FH + 0.35 + FH * 0.6, z);
        }
    // block walls started on the ground floor
    b.box(FW * 0.6, 2.2, 0.2, MAT.plain(0xc9c2b2), fx - FW * 0.2, 0.35, fzc + FD / 2 - 0.3);
    this.addCollider("out", fx - FW / 2, fx + FW / 2, fzc - FD / 2, fzc + FD / 2);
    // scaffolding up the front: poles and boards
    const pole = MAT.plain(0x8a8f96, 0.4),
      plank = MAT.plain(0x9a6a3a);
    for (let x = fx - FW / 2; x <= fx + FW / 2; x += 2.5)
      b.box(0.08, FH * 4, 0.08, pole, x, 0, fzc + FD / 2 + 1.1);
    for (let f = 1; f <= 3; f++) b.box(FW, 0.08, 1, plank, fx, f * FH, fzc + FD / 2 + 0.7);
    // the tower crane: a lattice mast, the jib, the counterweight and a hook
    const kx = fx + FW / 2 + 6,
      kz = fzc - 4,
      KH = 26,
      yellow = MAT.plain(0xf2c230, 0.5);
    for (const [ax, az] of [
      [-0.7, -0.7],
      [0.7, -0.7],
      [-0.7, 0.7],
      [0.7, 0.7],
    ])
      b.box(0.18, KH, 0.18, yellow, kx + ax, 0, kz + az);
    for (let y = 1.5; y < KH; y += 3) {
      b.box(1.6, 0.12, 0.12, yellow, kx, y, kz - 0.7);
      b.box(1.6, 0.12, 0.12, yellow, kx, y, kz + 0.7);
      b.box(0.12, 0.12, 1.6, yellow, kx - 0.7, y, kz);
      b.box(0.12, 0.12, 1.6, yellow, kx + 0.7, y, kz);
    }
    b.box(2.4, 2, 2.4, MAT.plain(0x2a2f36, 0.5), kx, KH, kz); // the cab
    b.box(34, 0.9, 1.1, yellow, kx - 17 + 1, KH + 2, kz); // the jib over the building
    b.box(10, 0.9, 1.1, yellow, kx + 6, KH + 2, kz); // the counter-jib
    b.box(2.6, 2, 1.6, MAT.plain(0x7a7a7a), kx + 10, KH + 0.6, kz); // counterweight
    b.box(0.6, 4, 0.6, yellow, kx, KH + 2.9, kz);
    b.box(0.04, 14, 0.04, MAT.plain(0x222222), kx - 22, KH - 12, kz);
    b.box(1.4, 0.8, 1.4, MAT.plain(0x9a958a), kx - 22, KH - 13, kz); // a load of blocks
    this.addCollider("out", kx - 1, kx + 1, kz - 1, kz + 1);
    // sand, gravel, stacked blocks, a cement mixer and the site office
    const heap = (x: number, z: number, r: number, c: number) => {
      const m = new THREE.Mesh(new THREE.ConeGeometry(r, r * 0.8, 14), mat(c));
      m.position.set(x, (r * 0.8) / 2, z);
      m.castShadow = true;
      this.dg.add(m);
      this.addCollider("out", x - r * 0.7, x + r * 0.7, z - r * 0.7, z + r * 0.7);
    };
    heap(x0 - 10, fz - 8, 3.2, 0xd9b77a);
    heap(x0 - 17, fz - 6, 2.4, 0x8a8a84);
    for (let i = 0; i < 3; i++) {
      b.box(2.6, 1.2, 1.4, MAT.plain(0xbcb5a5), x1 + 12 + i * 3.2, 0, fz - 6);
      this.addCollider("out", x1 + 10.7 + i * 3.2, x1 + 13.3 + i * 3.2, fz - 6.8, fz - 5.2);
    }
    const mixer = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 1.6, 12), mat(0xe67e22));
    mixer.rotation.z = 0.6;
    mixer.position.set(x0 - 24, 1.3, fz - 9);
    this.dg.add(mixer);
    b.box(6, 2.8, 2.6, MAT.plain(0xf4efe4), x1 + 8, 0, zN + 5); // the site office
    b.box(1, 2, 0.05, MAT.door(0x5a3a22), x1 + 8, 0, zN + 6.33);
    this.addCollider("out", x1 + 5, x1 + 11, zN + 3.7, zN + 6.3);
    // workers in hard hats
    const spots: [number, number, number][] = [
      [x0 - 12, fz - 12, 2.2],
      [fx - 6, fzc + FD / 2 + 3, 3.1],
      [fx + 10, fzc + FD / 2 + 3.4, 0.3],
      [x1 + 15, fz - 9, 1.2],
    ];
    spots.forEach(([x, z, h], i) => {
      const w = person(i % 2 ? 0x2a4a7a : 0xe67e22, {
        cap: 0xf2c230,
        seed: 70 + i,
        outfit: "kaftan",
      });
      w.position.set(x, 0, z);
      w.rotation.y = h;
      this.dg.add(w);
    });
    // what's being built, at the gate
    this.zones.push({
      id: "construction:manaar-uni",
      label: "Manaar University College (being built)",
      x: this.ox + cx,
      z: this.oz + fz + 2,
      r: 4,
      scene: "out",
    });
    // a tall label over the site, seen from down the street
    const t = label("🏗️ Manaar University College · being built", {
      size: 1.6,
      bg: "rgba(31,111,99,0.92)",
    });
    t.position.set(cx, 34, fzc0);
    this.dg.add(t);
    // signposts along the street pointing to the site
    for (const px of [-20, -70]) {
      const post = this.signBoard("◀ Manaar University College", 7, 0.9, "#1f6f63", "#ffffff");
      post.position.set(px, 3.2, sz - 6.2);
      this.dg.add(post);
      const back = this.signBoard("◀ Manaar University College", 7, 0.9, "#1f6f63", "#ffffff");
      back.position.set(px, 3.2, sz - 6.3);
      back.rotation.y = Math.PI;
      this.dg.add(back);
      b.box(0.15, 3.6, 0.15, MAT.plain(0x5a5f66, 0.5), px - 3.6, 0, sz - 6.25);
      b.box(0.15, 3.6, 0.15, MAT.plain(0x5a5f66, 0.5), px + 3.6, 0, sz - 6.25);
    }
  }

  /** Narrow tarred closes in the space between the main streets, with compounds on both
      sides wall to wall, the way Lagos neighbourhoods are packed. Most houses are to let. */
  private buildCloses(D: District, zs: number[], top: number, bottom: number, batch: Batch) {
    const H = halfOf(D);
    let h = 7;
    for (const ch of D.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const rnd = mulberry(h);
    const NAMES = D.holy
      ? [
          "Al-Rahmah",
          "Al-Noor",
          "Al-Huda",
          "As-Salam",
          "Al-Barakah",
          "Al-Ihsan",
          "Al-Falah",
          "Al-Hijrah",
        ]
      : [
          "Sabr",
          "Ihsan",
          "Tawakkul",
          "Ikhlas",
          "Huda",
          "Noor",
          "Salam",
          "Ukhuwwah",
          "Hikmah",
          "Birr",
        ];
    // what the main streets already cover (road plus a row of compounds each side)
    const cov = zs.map((z) => [z - 32, z + 32]).sort((a, b) => a[0] - b[0]);
    const bands: [number, number][] = [];
    let cur = top + 2;
    for (const [a, b] of cov) {
      if (a > cur) bands.push([cur, a]);
      cur = Math.max(cur, b);
    }
    if (bottom - 2 > cur) bands.push([cur, bottom - 2]);
    const lanes: { lz: number; sides: number[]; depth: number }[] = [];
    for (const [a, b] of bands) {
      const L = b - a;
      if (L >= 36)
        lanes.push({ lz: (a + b) / 2, sides: [-1, 1], depth: Math.min(20, (L - 7) / 2 - 0.5) });
      else if (L >= 24) lanes.push({ lz: a + 3.5, sides: [1], depth: Math.min(20, L - 8) });
    }
    const asphalt = MAT.asphalt();
    const kerb = MAT.plain(0xe9e4d8);
    const PW = 18,
      STEP = 19;
    let built = 0;
    lanes.forEach((ln, li) => {
      const name = `${NAMES[(h + li) % NAMES.length]} ${D.holy ? "Street" : "Close"}`;
      let num = 2;
      // which stretches of the lane have houses on them
      const cells: number[] = [];
      for (let x = -(H.x - 14); x <= H.x - 14; x += STEP) {
        if (Math.abs(x) < 16 || built >= 44) continue;
        if (!this.boxFree(x - STEP / 2, x + STEP / 2, ln.lz - 3, ln.lz + 3)) continue;
        let here = false;
        for (const sd of ln.sides) {
          const d = ln.depth;
          const cz = ln.lz + sd * (3.2 + d / 2);
          if (!this.boxFree(x - PW / 2, x + PW / 2, cz - d / 2, cz + d / 2)) continue;
          const r1 = rnd();
          const land = r1 < 0.08;
          const toLet = !land && r1 < 0.85;
          const id = `${D.id}-c${li}-${num}`;
          const turn = sd < 0 ? 0 : Math.PI;
          let c: Compound;
          if (land) {
            const earth = new THREE.Mesh(groundGeo(PW - 1, d - 1, 3), MAT.plain(0xc4a06a));
            earth.position.set(x, 0.03, cz);
            batch.addObject(earth);
            const front = cz - sd * (d / 2);
            c = {
              colliders: [],
              door: { x, z: front },
              gate: { x, z: front - sd * 0.5 },
              floors: 0,
              number: num,
            };
          } else
            c = compound(batch, {
              x,
              z: cz,
              turn,
              width: PW,
              depth: d,
              number: num,
              rnd,
              style: houseStyleOf(D),
            });
          for (const b of c.colliders) this.addCollider("out", b.x0, b.x1, b.z0, b.z1);
          this.reserved.push({
            x0: this.ox + x - PW / 2,
            x1: this.ox + x + PW / 2,
            z0: this.oz + cz - d / 2,
            z1: this.oz + cz + d / 2,
          });
          this.plots.push({
            ...c,
            id,
            kind: land ? "land" : "house",
            toLet,
            district: D.id,
            street: name,
            streetZ: ln.lz,
            x,
            z: cz,
            pw: PW,
            pd: d,
          });
          if (land || toLet) {
            const zone: Zone = {
              id: "plot:" + id,
              label: "",
              x: this.ox + c.gate.x,
              z: this.oz + c.gate.z,
              r: 3.4,
              scene: "out",
            };
            this.zones.push(zone);
            this.plotFx.set(id, { zone });
          }
          num += 1;
          built++;
          here = true;
        }
        if (here) cells.push(x);
      }
      if (!cells.length) return;
      // the tarred lane under the houses; it runs on to the cross road where it can
      cells.sort((a, b) => a - b);
      const runs: [number, number][] = [];
      for (const x of cells) {
        const last = runs[runs.length - 1];
        if (last && x - last[1] <= STEP + 0.1) last[1] = x;
        else runs.push([x, x]);
      }
      for (const run of runs) {
        let x0 = run[0] - STEP / 2,
          x1 = run[1] + STEP / 2;
        if (x0 > 0 && x0 - 6 < STEP + 2 && this.boxFree(6, x0, ln.lz - 3, ln.lz + 3)) x0 = 6;
        if (x1 < 0 && -6 - x1 < STEP + 2 && this.boxFree(x1, -6, ln.lz - 3, ln.lz + 3)) x1 = -6;
        const len = x1 - x0,
          cx = (x0 + x1) / 2;
        const kb = new THREE.Mesh(groundGeo(len, 7, 2), kerb);
        kb.position.set(cx, 0.025, ln.lz);
        batch.addObject(kb);
        const rd = new THREE.Mesh(groundGeo(len, 6, 4), asphalt);
        rd.position.set(cx, 0.035, ln.lz);
        batch.addObject(rd);
        this.reserved.push({
          x0: this.ox + x0,
          x1: this.ox + x1,
          z0: this.oz + ln.lz - 3.5,
          z1: this.oz + ln.lz + 3.5,
        });
      }
      const t = label(name, { size: 0.8, bg: "rgba(31,111,99,0.9)" });
      t.position.set(cells[0] < 0 && cells[cells.length - 1] < 0 ? -16 : 16, 3.2, ln.lz - 4);
      this.dg.add(t);
    });
  }

  /** Three plots in a row, free of everything, for the pitch and the sisters' corner. */
  private choosePlayPlots(
    D: District,
    zs: number[],
    H: { x: number; z: number },
    southEdge: number,
  ): {
    sz: number;
    north: boolean;
    xs: number[];
    field: boolean;
    police: { sz: number; north: boolean; x: number } | null;
  } | null {
    const field = !D.landmarks.some((l) => l.kind === "field");
    const slots: number[] = [];
    for (let x = -(H.x - 26); x <= H.x - 26; x += 24) if (Math.abs(x) >= 16) slots.push(x);
    const rows: [number, boolean][] = [];
    const north = Math.min(...zs),
      south = Math.max(...zs);
    rows.push([north, true], [south, false]);
    for (const sz of zs) rows.push([sz, true], [sz, false]);
    for (const [sz, isNorth] of rows) {
      const cz = isNorth ? sz - 21.5 : sz + 21.5;
      if (!isNorth && cz + 10 > southEdge - 3) continue;
      if (zs.some((z2) => z2 !== sz && Math.abs(cz - z2) < 18)) continue;
      // try the far end first, then the other end
      for (const set of [slots.slice(-3), slots.slice(0, 3)]) {
        if (set.length < 3 || set[2] - set[0] !== 48) continue;
        if (!set.every((x) => this.boxFree(x - 11, x + 11, cz - 10, cz + 10))) continue;
        // and one more free plot for the police station, as near the cross road as possible
        let police: { sz: number; north: boolean; x: number } | null = null;
        for (const [sz2, n2] of [[0, false], [0, true], ...rows] as [number, boolean][]) {
          if (!zs.includes(sz2)) continue;
          const cz2 = n2 ? sz2 - 21.5 : sz2 + 21.5;
          if (!n2 && cz2 + 10 > southEdge - 3) continue;
          if (zs.some((z2) => z2 !== sz2 && Math.abs(cz2 - z2) < 18)) continue;
          const x2 = [...slots]
            .sort((m, n) => Math.abs(m) - Math.abs(n))
            .find(
              (x) =>
                !(sz2 === sz && n2 === isNorth && set.includes(x)) &&
                this.boxFree(x - 11, x + 11, cz2 - 10, cz2 + 10),
            );
          if (x2 !== undefined) {
            police = { sz: sz2, north: n2, x: x2 };
            break;
          }
        }
        return { sz, north: isNorth, xs: set, field, police };
      }
    }
    return null;
  }
  private buildPlay(
    D: District,
    p: {
      sz: number;
      north: boolean;
      xs: number[];
      field: boolean;
      police: { sz: number; north: boolean; x: number } | null;
    },
  ) {
    const cz = p.north ? p.sz - 21.5 : p.sz + 21.5;
    const turn = p.north ? 0 : Math.PI;
    const b = this.curBatch;
    // the sisters' corner on the plot nearest the cross road, the pitch on the other two
    const xs = [...p.xs].sort((m, n) => Math.abs(m) - Math.abs(n));
    const cornerX = xs[0],
      pitchX = (xs[1] + xs[2]) / 2;
    const put = (
      built: {
        colliders: { x0: number; x1: number; z0: number; z1: number }[];
        spots: { key: string; x: number; z: number; label: string; labelY?: number }[];
      },
      id: string,
      text: string,
      x0: number,
      x1: number,
      zc = cz,
    ) => {
      for (const k of built.colliders) this.addCollider("out", k.x0, k.x1, k.z0, k.z1);
      this.reserved.push({
        x0: this.ox + x0,
        x1: this.ox + x1,
        z0: this.oz + zc - 10,
        z1: this.oz + zc + 10,
      });
      for (const sp of built.spots) {
        this.zones.push({
          id,
          label: text,
          x: sp.x + this.ox,
          z: sp.z + this.oz,
          r: 3,
          scene: "out",
        });
        const t = label(sp.label, { size: 0.8 });
        t.position.set(sp.x, sp.labelY ?? 4, sp.z);
        this.dg.add(t);
      }
    };
    if (p.field) {
      const f = field(b, {
        small: true,
        x: pitchX,
        z: cz,
        turn,
        width: 44,
        depth: 19.5,
        name: `${D.name} Football Pitch`,
      });
      put(f, `field:${D.id}-pitch`, "Play football", pitchX - 22, pitchX + 22);
      this.registerPitch(`field:${D.id}-pitch`, f.pitch);
    }
    if (p.police) {
      const q = p.police;
      const pz = q.north ? q.sz - 21.5 : q.sz + 21.5;
      const ps = policeStation(b, {
        x: q.x,
        z: pz,
        turn: q.north ? 0 : Math.PI,
        width: 21,
        depth: 19.5,
        name: `${D.name} Police Station`,
      });
      put(ps, `police:${D.id}`, "Police station", q.x - 10.5, q.x + 10.5, pz);
    }
    const sc = sistersCorner(b, {
      x: cornerX,
      z: cz,
      turn,
      width: 21,
      depth: 19.5,
      name: "Sisters' Corner",
    });
    put(sc, `sisters:${D.id}`, "Sisters' Corner · skipping", cornerX - 10.5, cornerX + 10.5);
    const names = ["Sister Zainab", "Sister Habibah", "Sister Rodiyah", "Sister Aishat"];
    const ropers: THREE.Object3D[] = [];
    sc.spots2.forEach((st, i) => {
      const g = person([0x8a2f4f, 0x2a4a6a, 0x5a3f6a, 0x3d5a4a][i], {
        hijab: [0xe9e2d0, 0x1d1d26, 0xd8c8a8, 0x8a2f4f][i],
        seed: 40 + i,
      });
      const tag = label(names[i], { size: 0.6, bold: false });
      tag.position.y = 2.5;
      g.add(tag);
      g.position.set(st.x, 0, st.z);
      g.rotation.y = st.face;
      if (i === 3) sitPerson(g);
      else ropers.push(g);
      this.dg.add(g);
      this.walkers.push({
        g,
        route: [[st.x, st.z]],
        k: 0,
        wait: 0,
        t: 0,
        name: names[i],
        female: true,
        district: D.id,
        seated: true,
      });
    });
    {
      const [l, r, m, w] = sc.spots2;
      this.ropes.set(
        `sisters:${D.id}`,
        new RopeRig(
          this.dg,
          {
            left: l,
            right: r,
            mid: m,
            wait: { x: w.x + (m.x - w.x) * 0.3, z: w.z + (m.z - w.z) * 0.3 },
            face: m.face,
          },
          ropers as [THREE.Object3D, THREE.Object3D, THREE.Object3D],
          this.player,
          animatePerson,
          (name) => {
            const g = person(0x5a3f6a, { hijab: 0xe9e2d0, seed: name.length });
            const tag = label(name, { size: 0.6, bold: false });
            tag.position.y = 2.5;
            g.add(tag);
            return g;
          },
        ),
      );
    }
  }

  /* ---------------- lost things on the ground ---------------- */
  private found: { id: string; mesh: THREE.Object3D } | null = null;
  /** Drop something someone lost on a pavement in this area; returns its id. */
  dropFound(kind: "wallet" | "phone" | "bag" | "ring") {
    if (this.found || this.where !== "out") return null;
    const D = this.district;
    const H = halfOf(D);
    const p = this.player.position;
    for (let i = 0; i < 30; i++) {
      const st = D.streets[Math.floor(Math.random() * D.streets.length)];
      const x = D.origin.x + (Math.random() * 2 - 1) * (H.x - 30);
      const z = D.origin.z + st.z + (Math.random() < 0.5 ? 9 : -9);
      const d = Math.hypot(x - p.x, z - p.z);
      if (d < 15 || d > 70 || !this.free(x, z, 0.8)) continue;
      const g = new THREE.Group();
      const color = { wallet: 0x5a3a22, phone: 0x1d1d26, bag: 0x2a4a6a, ring: 0xe6b84a }[kind];
      const m =
        kind === "ring"
          ? new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 8, 16), mat(color))
          : new THREE.Mesh(
              new THREE.BoxGeometry(
                kind === "bag" ? 0.6 : 0.35,
                kind === "bag" ? 0.4 : 0.06,
                kind === "bag" ? 0.3 : 0.22,
              ),
              mat(color),
            );
      m.position.y = kind === "bag" ? 0.2 : 0.06;
      if (kind === "ring") m.rotation.x = Math.PI / 2;
      g.add(m);
      const glow = new THREE.Mesh(
        new THREE.RingGeometry(0.45, 0.6, 24),
        new THREE.MeshBasicMaterial({ color: 0xf2c230, transparent: true, opacity: 0.8 }),
      );
      glow.rotation.x = -Math.PI / 2;
      glow.position.y = 0.05;
      g.add(glow);
      g.position.set(x, 0, z);
      this.scene.add(g);
      const id = "found:" + kind;
      this.found = { id, mesh: g };
      this.zones.push({ id, label: "Pick it up", x, z, r: 2.2, scene: "out" });
      return id;
    }
    return null;
  }
  clearFound() {
    if (!this.found) return;
    this.scene.remove(this.found.mesh);
    const id = this.found.id;
    this.zones = this.zones.filter((z) => z.id !== id);
    this.found = null;
  }
  hasFound() {
    return !!this.found;
  }
  /** Take the player straight to a place (the police station after an arrest). */
  putAtZone(id: string) {
    const z = this.zones.find((zz) => zz.id === id);
    if (!z) return false;
    if (this.where !== "out") this.exitInterior();
    if (this.driving) this.exitCar();
    this.player.position.set(z.x, 0, z.z + 1.5);
    this.tapTarget = null;
    this.snapCamera();
    return true;
  }

  /* ---------------- football ---------------- */
  /** Every pitch in the city, by the id of its zone (field:...). */
  pitches = new Map<
    string,
    {
      x: number;
      z: number;
      len: number;
      wid: number;
      turn: number;
      stand: { x: number; z: number };
    }
  >();
  private match: Soccer | null = null;
  private matchTap: THREE.Vector3 | null = null;
  private matchZone = "";
  private registerPitch(
    id: string,
    p: {
      x: number;
      z: number;
      len: number;
      wid: number;
      turn: number;
      stand: { x: number; z: number };
    },
  ) {
    this.pitches.set(id, {
      ...p,
      x: p.x + this.ox,
      z: p.z + this.oz,
      stand: { x: p.stand.x + this.ox, z: p.stand.z + this.oz },
    });
  }
  /** Start a match on this pitch: you, a teammate and a keeper against the computer;
      or, online, a match between real players (this phone runs it, or shows it). */
  startMatch(
    zoneId: string,
    onState: (s: MatchState) => void,
    online?: {
      mode: "host" | "view";
      slots: Slot[];
      myKey: string;
      labels: [string, string];
      send?: (i: NetInput) => void;
      /** watching from the bench: you keep walking */
      spectate?: boolean;
    },
  ) {
    const p = this.pitches.get(zoneId);
    if (!p) return false;
    if (this.match) this.endMatch(true);
    if (this.driving) this.exitCar();
    if (this.where !== "out") this.exitInterior();
    this.tapTarget = null;
    this.marker.visible = false;
    this.matchZone = zoneId;
    const kit = (team: 0 | 1, i: number, name: string, human: boolean) => {
      const g = person(team === 0 ? 0x1f6f63 : 0xd8682a, {
        cap: team === 0 ? 0x1f6f63 : 0xffffff,
        trousers: 0xf4f1ea,
        seed: 70 + i,
      });
      // everyone's name over their head; real players stand out
      const tag = label(name, {
        size: human ? 0.65 : 0.5,
        bold: human,
        bg: team === 0 ? "rgba(31,111,99,0.9)" : "rgba(216,104,42,0.9)",
      });
      tag.position.y = 2.6;
      g.add(tag);
      return g;
    };
    this.spectating = !!online?.spectate;
    // you change into your team's jersey for the match
    let me: THREE.Object3D = this.player;
    if (!this.spectating) {
      const myTeam = online ? (online.slots.find((x) => x.key === online.myKey)?.team ?? 0) : 0;
      const j = person(myTeam === 0 ? 0x1f6f63 : 0xd8682a, {
        cap: myTeam === 0 ? 0x1f6f63 : 0xffffff,
        trousers: 0xf4f1ea,
        seed: 7,
      });
      const tag = label("You", { size: 0.7, bg: "rgba(242,194,48,0.95)", fg: "#2a1c05" });
      tag.position.y = 2.75;
      j.add(tag);
      // a gold arrow over your head and a ring at your feet
      const arrow = new THREE.Mesh(
        new THREE.ConeGeometry(0.22, 0.4, 4),
        new THREE.MeshBasicMaterial({ color: 0xf2c230 }),
      );
      arrow.rotation.x = Math.PI;
      arrow.position.y = 3.35;
      j.add(arrow);
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.55, 0.72, 24),
        new THREE.MeshBasicMaterial({ color: 0xf2c230, transparent: true, opacity: 0.85 }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.04;
      j.add(ring);
      j.position.copy(this.player.position);
      this.scene.add(j);
      this.player.visible = false;
      this.jersey = j;
      me = j;
    }
    this.match = new Soccer(this.scene, p, me, kit, animatePerson, onState, online);
    if (!this.spectating) {
      const w = this.match.myWorld();
      this.matchCam.set(w.x, 0, w.z);
      this.camYaw = this.match.camYawFor();
      this.snapCamera();
    }
    return true;
  }
  private spectating = false;
  /** you, in your team's jersey, during a match */
  private jersey: THREE.Object3D | null = null;
  private matchCam = new THREE.Vector3();
  /** Online: the running phone hears what each real player presses. */
  matchInput(key: string, i: NetInput) {
    this.match?.setInput(key, i);
  }
  matchSetCtrl(key: string, ctrl: "remote" | "cpu", name: string) {
    this.match?.setCtrl(key, ctrl, name);
  }
  matchSnapshot(): Snapshot | null {
    return this.match && !this.spectating ? this.match.snapshot() : null;
  }
  matchApply(s: Snapshot) {
    this.match?.applySnapshot(s);
  }
  isSpectating() {
    return this.spectating;
  }
  /** Players in the match on the pitch are drawn by the match, not walking in the city. */
  private hiddenRemotes = new Set<string>();
  hideRemotes(uids: string[]) {
    this.hiddenRemotes = new Set(uids);
    for (const [uid, r] of this.remotes) r.g.visible = !this.hiddenRemotes.has(uid);
  }
  /* ---------------- tennis ---------------- */
  private tennis: Tennis | null = null;
  private tennisCam = new THREE.Vector3();
  startTennis(
    zoneId: string,
    onState: (s: TennisState) => void,
    online?: {
      mode: "host" | "view";
      mySide: 0 | 1;
      names: [string, string];
      send?: (i: TennisInput) => void;
    },
  ) {
    const c = this.courts.get(zoneId);
    if (!c || this.where !== "out") return false;
    this.endTennis();
    this.tennisZone = zoneId;
    if (this.driving) this.exitCar();
    this.tapTarget = null;
    this.marker.visible = false;
    const names = online?.names ?? ["You", "Coach Kareem"];
    const otherName = names[online ? 1 - online.mySide : 1];
    const other = person(online ? 0x5a3f6a : 0xf4f1ea, {
      cap: 0xffffff,
      trousers: 0xf4f1ea,
      seed: 33,
    });
    const tag = label(otherName, { size: 0.6, bg: "rgba(47,111,168,0.92)" });
    tag.position.y = 2.6;
    other.add(tag);
    this.tennis = new Tennis(this.scene, c, this.player, other, animatePerson, onState, {
      mode: online?.mode ?? "solo",
      mySide: online?.mySide ?? 0,
      names,
      send: online?.send,
      bats: {
        hold: (g) => {
          const bat = batMesh(0xc62828);
          bat.scale.setScalar(1.3);
          if (rigBat(g, bat)) return;
          // the simple figure: the bat goes in the right hand
          const l = g.userData.limbs as Limbs | undefined;
          if (!l) return;
          bat.position.set(0, -0.7, 0.06);
          l.armR.add(bat);
          g.userData.bat = { mesh: bat, t: 1 };
        },
        swing: (g) => {
          rigSwing(g);
          if (g.userData.bat) g.userData.bat.t = 0;
        },
        pose: (g, dt) => {
          const b = g.userData.bat as { t: number } | undefined;
          const l = g.userData.limbs as Limbs | undefined;
          if (!b || !l) return;
          b.t = Math.min(1, b.t + dt / 0.32);
          const k = b.t < 1 ? Math.sin(b.t * Math.PI) : 0;
          l.armR.rotation.x = -1.1 - 0.4 * k;
          l.armR.rotation.y = 0.3 - 1.2 * k;
        },
      },
    });
    const w = this.tennis.myWorld();
    this.tennisCam.set(w.x, 0, w.z);
    this.camYaw = this.tennis.camYaw();
    this.snapCamera();
    return true;
  }
  tennisHit() {
    if (!this.tennis) return;
    const v = this.moveVec();
    this.tennis.hit(THREE.MathUtils.clamp(v.x, -1, 1) * (this.tennisSide() === 0 ? -1 : 1));
  }
  private tennisSide() {
    return this.tennis?.state.mySide ?? 0;
  }
  tennisRemote(i: TennisInput) {
    this.tennis?.setRemote(i);
  }
  tennisSnapshot() {
    return this.tennis?.snapshot() ?? null;
  }
  tennisApply(s: TennisSnap) {
    this.tennis?.applySnapshot(s);
  }
  inTennis() {
    return !!this.tennis;
  }
  endTennis() {
    if (!this.tennis) return;
    rigBat(this.player, null);
    const pb = this.player.userData.bat as { mesh: THREE.Object3D } | undefined;
    if (pb) {
      pb.mesh.removeFromParent();
      delete this.player.userData.bat;
      const l = this.player.userData.limbs as Limbs | undefined;
      if (l) l.armR.rotation.y = 0;
    }
    this.tennis.dispose();
    this.tennis = null;
    // step back out to the front of the table tennis spot, where you came in
    const z = this.zones.find((q) => q.id === this.tennisZone);
    if (z) {
      this.player.position.set(z.x, 0, z.z);
      this.player.rotation.y = 0;
    }
    this.snapCamera();
  }
  private tennisZone = "";
  private stepTennis(v: THREE.Vector2, dt: number) {
    const t = this.tennis!;
    let move: { x: number; z: number } | null = null;
    if (v.lengthSq() > 0.01) {
      const fx = -Math.sin(this.camYaw),
        fz = -Math.cos(this.camYaw);
      const rx = Math.cos(this.camYaw),
        rz = -Math.sin(this.camYaw);
      move = { x: rx * v.x + fx * v.y, z: rz * v.x + fz * v.y };
    }
    t.step(dt, move);
    const me = t.myWorld(),
      b = t.ballWorld();
    const tx = me.x + (b.x - me.x) * 0.45,
      tz = me.z + (b.z - me.z) * 0.45;
    const k = 1 - Math.exp(-dt * 4);
    this.tennisCam.x += (tx - this.tennisCam.x) * k;
    this.tennisCam.z += (tz - this.tennisCam.z) * k;
    if (performance.now() - this.lastDrag > 2500)
      this.camYaw = lerpAngle(this.camYaw, t.camYaw(), 1 - Math.exp(-dt * 2));
  }

  /* ---------------- skipping rope ---------------- */
  private ropes = new Map<string, RopeRig>();
  private rope: RopeRig | null = null;
  /** Join the rope at this Sisters' Corner (you must be standing there). */
  startRope(zoneId: string, mode: RopeMode, onState: (s: RopeState) => void) {
    const rig = this.ropes.get(zoneId);
    if (!rig || this.where !== "out" || this.driving) return false;
    this.endRope();
    this.rope = rig;
    this.tapTarget = null;
    this.marker.visible = false;
    rig.start(mode, onState);
    return true;
  }
  ropeTap() {
    this.rope?.tap();
  }
  ropeAgain(role: "jump" | "turn") {
    this.rope?.again(role);
  }
  inRope() {
    return !!this.rope;
  }
  endRope() {
    if (!this.rope) return;
    const c = this.rope.centre();
    this.rope.stop();
    this.rope = null;
    // step out to the front of the corner
    this.player.position.set(c.x, 0, c.z);
    for (let k = 0; k < 12 && !this.free(this.player.position.x, this.player.position.z, 0.5); k++)
      this.player.position.z += 1;
  }

  matchAction(a: "shoot" | "pass" | "tackle" | "L" | "C" | "R") {
    const m = this.match;
    if (!m) return;
    if (a === "tackle") m.tackle();
    else if (a === "shoot") m.shoot();
    else if (a === "pass") m.pass();
    else m.penalty(a === "L" ? -1 : a === "C" ? 0 : 1);
  }
  inMatch() {
    return !!this.match && !this.spectating;
  }
  endMatch(quiet = false) {
    if (!this.match) return;
    const wasPlaying = !this.spectating;
    this.match.dispose();
    this.match = null;
    // back into your own clothes
    if (this.jersey) {
      this.player.position.set(this.jersey.position.x, 0, this.jersey.position.z);
      this.jersey.removeFromParent();
      this.jersey = null;
      this.player.visible = true;
    }
    this.spectating = false;
    this.matchTap = null;
    this.marker.visible = false;
    if (!wasPlaying || quiet) return;
    const p = this.pitches.get(this.matchZone);
    if (p) this.player.position.set(p.stand.x, 0, p.stand.z);
    this.player.rotation.y = 0;
    this.snapCamera();
  }
  /** The bench beside a pitch, where players wait for their turn. */
  benchOf(zoneId: string) {
    return this.pitches.get(zoneId)?.stand ?? null;
  }
  goToBench(zoneId: string) {
    const b = this.pitches.get(zoneId)?.stand;
    if (!b) return;
    if (this.where !== "out") this.exitInterior();
    this.player.position.set(b.x, 0, b.z);
    this.snapCamera();
  }
  private stepMatch(v: THREE.Vector2, dt: number) {
    const m = this.match!;
    let move: { x: number; z: number } | null = null;
    if (v.lengthSq() > 0.01) {
      this.matchTap = null;
      this.marker.visible = false;
      const fx = -Math.sin(this.camYaw),
        fz = -Math.cos(this.camYaw);
      const rx = Math.cos(this.camYaw),
        rz = -Math.sin(this.camYaw);
      move = { x: rx * v.x + fx * v.y, z: rz * v.x + fz * v.y };
    } else if (this.matchTap) {
      const me = m.myWorld();
      const dx = this.matchTap.x - me.x,
        dz = this.matchTap.z - me.z,
        d = Math.hypot(dx, dz);
      if (d < 0.5) {
        this.matchTap = null;
        this.marker.visible = false;
      } else move = { x: dx / d, z: dz / d };
    }
    m.step(dt, move);
    // the camera watches the play: between you and the ball, leaning to the ball
    const me = m.myWorld(),
      b = m.ballWorld();
    let tx = me.x + (b.x - me.x) * 0.6,
      tz = me.z + (b.z - me.z) * 0.6;
    const far = Math.hypot(tx - me.x, tz - me.z);
    if (far > 9) {
      tx = me.x + ((tx - me.x) / far) * 9;
      tz = me.z + ((tz - me.z) / far) * 9;
    }
    if (this.matchCam.lengthSq() === 0) this.matchCam.set(tx, 0, tz);
    const k = 1 - Math.exp(-dt * 4);
    this.matchCam.x += (tx - this.matchCam.x) * k;
    this.matchCam.z += (tz - this.matchCam.z) * k;
  }

  /** Muslim students, brothers and sisters, sitting and talking at a meeting point. */
  private seatStudents(seats: { x: number; z: number; face: number }[], D: District) {
    const names = [
      "Brother Abdulrahman",
      "Sister Halimah",
      "Brother Mubarak",
      "Sister Faridah",
      "Brother Lukman",
      "Sister Nafisah",
    ];
    const robes = [0x2f4a7a, 0x8a2f4f, 0x3d8a5a, 0x5a3f6a, 0xb36a3a, 0x2a4a6a];
    seats.forEach((st, i) => {
      const name = names[i % names.length];
      const female = name.startsWith("Sister");
      const g = person(
        robes[i % robes.length],
        female
          ? { hijab: [0x1d1d26, 0xe9e2d0, 0x3d5a4a][i % 3], seed: 20 + i }
          : { cap: 0xffffff, seed: 20 + i },
      );
      const tag = label(name, { size: 0.6, bold: false });
      tag.position.y = 1.9;
      g.add(tag);
      g.position.set(st.x, 0.1, st.z);
      g.rotation.y = st.face;
      sitPerson(g);
      this.dg.add(g);
      this.walkers.push({
        g,
        route: [[st.x, st.z]],
        k: 0,
        wait: 0,
        t: 0,
        name,
        female,
        district: D.id,
        seated: true,
      });
    });
  }

  /* ---------------- shops and market stalls ---------------- */
  private shopFx = new Map<
    string,
    {
      kind: "shop" | "stall";
      sign: THREE.Mesh;
      blade: THREE.MeshBasicMaterial;
      shutter?: THREE.Mesh;
      zone: Zone;
      district: string;
      street: string;
    }
  >();
  /** Where a shop's sign and shutter go, from its centre towards its front. */
  private addShopUnit(
    id: string,
    kind: "shop" | "stall",
    center: { x: number; z: number },
    front: { x: number; z: number },
    D: District,
    street: string,
    opt: { parent?: THREE.Object3D; scene?: Zone["scene"]; ox?: number; oz?: number } = {},
  ) {
    const parent = opt.parent ?? this.dg;
    const dx = front.x - center.x,
      dz = front.z - center.z,
      L = Math.hypot(dx, dz);
    const ux = dx / L,
      uz = dz / L;
    const ry = Math.atan2(ux, uz);
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(kind === "shop" ? 4.6 : 4.4, kind === "shop" ? 0.95 : 1.3),
    );
    // a stall's board stands on top of its canopy, in front of the frill and the lights
    const sd = kind === "shop" ? 3.95 : 2.6;
    sign.position.set(center.x + ux * sd, kind === "shop" ? 4.25 : 3.85, center.z + uz * sd);
    sign.rotation.y = ry;
    parent.add(sign);
    if (kind === "stall") {
      // the board's frame and the two legs holding it up on the canopy
      const back = box(4.6, 1.5, 0.08, 0x5a3f22, 0, 0, 0, false);
      back.position.set(center.x + ux * (sd - 0.06), 3.85, center.z + uz * (sd - 0.06));
      back.rotation.y = ry;
      parent.add(back);
      for (const s of [-1.9, 1.9]) {
        const leg = box(0.1, 0.35, 0.1, 0x5a3f22, 0, 0, 0, false);
        leg.position.set(
          center.x + ux * (sd - 0.1) + uz * s,
          3.0,
          center.z + uz * (sd - 0.1) - ux * s,
        );
        parent.add(leg);
      }
    }
    // a small sign sticking out sideways, so you can read the name walking along the street
    const vx = uz,
      vz = -ux;
    const halfW = kind === "shop" ? 2.3 : 2.2;
    const bladeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const blade = new THREE.Group();
    for (const r of [0, Math.PI]) {
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 0.9), bladeMat);
      pl.rotation.y = r;
      blade.add(pl);
    }
    blade.add(box(2.4, 0.06, 0.06, 0x2a2a2a, 0, 0.48, 0, false));
    blade.position.set(
      center.x + ux * (sd + 1.25) + vx * (halfW - 0.1),
      kind === "shop" ? 3.1 : 2.5,
      center.z + uz * (sd + 1.25) + vz * (halfW - 0.1),
    );
    blade.rotation.y = ry + Math.PI / 2;
    parent.add(blade);
    let shutter: THREE.Mesh | undefined;
    if (kind === "shop") {
      shutter = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 3.5), MAT2.shutter());
      shutter.position.set(center.x + ux * 3.5, 1.75, center.z + uz * 3.5);
      shutter.rotation.y = ry;
      parent.add(shutter);
    }
    const zone: Zone = {
      id: (kind === "shop" ? "shop:" : "stall:") + id,
      label: "",
      x: front.x + (opt.ox ?? this.ox),
      z: front.z + (opt.oz ?? this.oz),
      r: 2.4,
      scene: opt.scene ?? "out",
    };
    this.zones.push(zone);
    this.shopFx.set(id, { kind, sign, blade: bladeMat, shutter, zone, district: D.id, street });
  }
  private shopTexCache = new Map<string, THREE.Texture>();
  /** Paint a shop's signboard: its name and up to three product pictures. */
  setShop(id: string, s: { name?: string; imgs?: string[]; open: boolean; label?: string }) {
    const fx = this.shopFx.get(id);
    if (!fx) return;
    fx.zone.label =
      s.label ??
      (s.name ? `${s.name}` : fx.kind === "shop" ? "Shop to let" : "Market space for rent");
    if (fx.shutter) {
      fx.shutter.scale.y = s.open ? 0.18 : 1;
      fx.shutter.position.y = s.open ? 3.2 : 1.75;
    }
    const cv = document.createElement("canvas");
    cv.width = 512;
    cv.height = fx.kind === "shop" ? 104 : 152;
    const c = cv.getContext("2d")!;
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const draw = (imgs: HTMLImageElement[]) => {
      const W = cv.width,
        H = cv.height;
      if (!s.name) {
        c.fillStyle = fx.kind === "shop" ? "#c62828" : "#fdfbf5";
        c.fillRect(0, 0, W, H);
        c.fillStyle = fx.kind === "shop" ? "#fff" : "#c62828";
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.font = "800 44px system-ui, sans-serif";
        c.fillText(fx.kind === "shop" ? "SHOP TO LET" : "SPACE FOR RENT", W / 2, H * 0.42);
        c.font = "600 22px system-ui, sans-serif";
        c.fillText(
          fx.kind === "shop" ? "Tap to view" : "₦2,000 a week · tap to rent",
          W / 2,
          H * 0.8,
        );
      } else {
        c.fillStyle = "#1f6f63";
        c.fillRect(0, 0, W, H);
        c.fillStyle = "#e6b84a";
        c.fillRect(0, H - 8, W, 8);
        const iw = imgs.length ? H - 20 : 0;
        imgs.slice(0, 3).forEach((im, i) => {
          const x = W - (i + 1) * (iw + 8);
          c.fillStyle = "#fff";
          c.fillRect(x - 3, 7, iw + 6, iw + 6);
          const r = Math.max(iw / im.width, iw / im.height);
          const sw = iw / r,
            sh = iw / r;
          c.drawImage(im, (im.width - sw) / 2, (im.height - sh) / 2, sw, sh, x, 10, iw, iw);
        });
        const tw = W - Math.min(3, imgs.length) * (iw + 8) - 20;
        c.fillStyle = "#fdf8ec";
        c.textAlign = "center";
        c.textBaseline = "middle";
        let size = 46;
        c.font = `800 ${size}px system-ui, sans-serif`;
        while (c.measureText(s.name).width > tw && size > 16) {
          size -= 2;
          c.font = `800 ${size}px system-ui, sans-serif`;
        }
        c.fillText(s.name, 10 + tw / 2, H / 2);
      }
      tex.needsUpdate = true;
    };
    // the side sign: just the name
    {
      const bc = document.createElement("canvas");
      bc.width = 256;
      bc.height = 100;
      const b = bc.getContext("2d")!;
      const rent = !s.name;
      b.fillStyle = rent ? "#fdfbf5" : "#1f6f63";
      b.fillRect(0, 0, 256, 100);
      b.strokeStyle = rent ? "#c62828" : "#e6b84a";
      b.lineWidth = 6;
      b.strokeRect(3, 3, 250, 94);
      b.fillStyle = rent ? "#c62828" : "#fdf8ec";
      b.textAlign = "center";
      b.textBaseline = "middle";
      const text = s.name ?? (fx.kind === "shop" ? "TO LET" : "FOR RENT");
      let size = 40;
      b.font = `800 ${size}px system-ui, sans-serif`;
      while (b.measureText(text).width > 230 && size > 14) {
        size -= 2;
        b.font = `800 ${size}px system-ui, sans-serif`;
      }
      b.fillText(text, 128, 52);
      const bt = new THREE.CanvasTexture(bc);
      bt.colorSpace = THREE.SRGBColorSpace;
      fx.blade.map?.dispose();
      fx.blade.map = bt;
      fx.blade.needsUpdate = true;
    }
    const srcs = (s.imgs ?? []).slice(0, 3);
    if (!srcs.length) draw([]);
    else
      Promise.all(
        srcs.map(
          (src) =>
            new Promise<HTMLImageElement | null>((res) => {
              const im = new Image();
              im.onload = () => res(im);
              im.onerror = () => res(null);
              im.src = src;
            }),
        ),
      ).then((list) => draw(list.filter((x): x is HTMLImageElement => !!x)));
    const old = fx.sign.material as THREE.MeshStandardMaterial;
    fx.sign.material = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 });
    if (old && old.map && old !== fx.sign.material) {
      old.map.dispose();
      old.dispose();
    }
  }
  shopInfo(id: string) {
    const fx = this.shopFx.get(id);
    if (!fx) return null;
    return { id, kind: fx.kind, district: fx.district, street: fx.street };
  }
  shopIds() {
    return [...this.shopFx.keys()];
  }

  /** A small neighbourhood market: a row of stalls facing a street, on the first free plot. */
  private buildLocalMarket(D: District, XR: number) {
    const streets = [...D.streets].sort((a, b) => Number(a.z === 0) - Number(b.z === 0));
    for (const st of streets)
      for (const north of [true, false])
        for (let cx = -(XR - 26); cx <= XR - 26; cx += 8) {
          if (Math.abs(cx) < 40) continue;
          const z = north ? st.z - 15 : st.z + 15;
          const band = north ? [st.z - 32, st.z - 10] : [st.z + 10, st.z + 32];
          if (!this.boxFree(cx - 25, cx + 25, band[0], band[1])) continue;
          const turn = north ? 0 : Math.PI;
          const row = stallRow(this.curBatch, {
            x0: north ? cx - 23 : -(cx + 23),
            x1: north ? cx + 23 : -(cx - 23),
            z,
            turn,
          });
          for (const c of row.colliders) this.addCollider("out", c.x0, c.x1, c.z0, c.z1);
          row.units.forEach((u, k) =>
            this.addShopUnit(
              `${D.id}-m${k}`,
              "stall",
              u.center,
              u.front,
              D,
              STREETS[st.id]?.name ?? D.name,
            ),
          );
          this.reserved.push({
            x0: this.ox + cx - 25,
            x1: this.ox + cx + 25,
            z0: this.oz + band[0],
            z1: this.oz + band[1],
          });
          const t = label(`${D.name} Market`, { size: 1.1, bg: "rgba(31,111,99,0.92)" });
          t.position.set(cx, 5.2, z);
          this.dg.add(t);
          this.marketSpot.set(D.id, { x: cx, z, sz: st.z, north });
          return;
        }
  }
  marketSpot = new Map<string, { x: number; z: number; sz?: number; north?: boolean }>();

  /** The eatery: a food truck parked on the pavement near the market. */
  private buildEatery(D: District) {
    const m = this.marketSpot.get(D.id);
    const sz = m?.sz ?? 0,
      north = m?.north ?? true;
    const z = sz + (north ? -8.4 : 8.4);
    const x0 = m?.x ?? 30;
    for (const dx of [30, -30, 38, -38, 46, -46, 54, -54, 22, -22]) {
      const x = x0 + dx;
      if (Math.abs(x) < 14 || Math.abs(x) > halfOf(D).x - 20) continue;
      if (!this.boxFree(x - 3.6, x + 3.6, z - 1.8, z + 1.8)) continue;
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      g.rotation.y = north ? 0 : Math.PI;
      // the truck, its serving hatch and awning
      g.add(box(6.6, 2.7, 2.6, 0xc8102e, 0, 0.55, 0));
      g.add(box(6.8, 0.25, 2.8, 0xf4f1ea, 0, 3.25, 0));
      g.add(box(3.6, 1.1, 0.06, 0x2a1c05, -0.6, 1.6, 1.31));
      g.add(box(4, 0.12, 1.3, 0xf2c230, -0.6, 2.75, 1.9));
      for (const wx of [-2.2, 2.2]) {
        const w = cyl(0.42, 0.42, 0.3, 0x1d1d26, 12);
        w.rotation.x = Math.PI / 2;
        w.position.set(wx, 0.42, 1.25);
        g.add(w);
      }
      const { mesh } = canvasPlane(
        5.6,
        1,
        (c, W, H) => {
          c.fillStyle = "#c8102e";
          c.fillRect(0, 0, W, H);
          c.fillStyle = "#fff";
          c.textAlign = "center";
          c.textBaseline = "middle";
          c.font = `800 ${Math.round(H * 0.55)}px "Work Sans", system-ui, sans-serif`;
          c.fillText("AL-BARAKAH BROAST", W / 2, H * 0.52);
        },
        512,
      );
      mesh.position.set(0, 3.9, 0.2);
      g.add(mesh);
      this.dg.add(g);
      this.addCollider("out", x - 3.4, x + 3.4, z - 1.4, z + 1.4);
      const fz = z + (north ? 2.8 : -2.8);
      this.zones.push({
        id: "eatery:" + D.id,
        label: "Eat at Al-Barakah Broast",
        x: x + this.ox,
        z: fz + this.oz,
        r: 2.8,
        scene: "out",
      });
      const t = label("Al-Barakah Broast · eatery", { size: 0.85, bg: "rgba(200,16,46,0.92)" });
      t.position.set(x, 5.2, z);
      this.dg.add(t);
      return;
    }
  }

  /** A walk-in restaurant near the market: go in, order at the counter, sit and eat. */
  private buildRestaurant(D: District) {
    const m = this.marketSpot.get(D.id);
    const sz = m?.sz ?? 0;
    const x0 = m?.x ?? 0;
    const W = 9,
      Dp = 6.5;
    const xs: number[] = [];
    for (let k = 3; k < 30; k++) xs.push(k * 6, -k * 6);
    const sides = [m?.north ?? true, !(m?.north ?? true)];
    const spots: { x: number; z: number; north: boolean }[] = [];
    for (const north of sides)
      for (const off of [9.6, 10.6, 12])
        for (const dx of xs) spots.push({ x: x0 + dx, z: sz + (north ? -off : off), north });
    for (const { x, z, north } of spots) {
      {
        if (Math.abs(x) < 14 || Math.abs(x) > halfOf(D).x - 12) continue;
        if (!this.boxFree(x - W / 2 - 0.4, x + W / 2 + 0.4, z - Dp / 2 - 0.4, z + Dp / 2 + 0.4))
          continue;
        const g = new THREE.Group();
        g.position.set(x, 0, z);
        g.rotation.y = north ? 0 : Math.PI;
        g.add(box(W, 4.2, Dp, 0xf3e6cf, 0, 0, 0));
        g.add(box(W + 0.4, 0.3, Dp + 0.4, 0x7a3b2a, 0, 4.2, 0));
        // glass front, door and a green awning
        g.add(box(3.2, 2.2, 0.08, 0x2c4a5e, -3, 0.9, Dp / 2 + 0.02));
        g.add(box(3.2, 2.2, 0.08, 0x2c4a5e, 3, 0.9, Dp / 2 + 0.02));
        g.add(box(1.6, 2.8, 0.1, 0x5a3a22, 0, 0, Dp / 2 + 0.03));
        g.add(box(W, 0.15, 1.6, 0x1f6f63, 0, 3.2, Dp / 2 + 0.8));
        const { mesh } = canvasPlane(
          8,
          1.1,
          (c, CW, CH) => {
            c.fillStyle = "#1f6f63";
            c.fillRect(0, 0, CW, CH);
            c.fillStyle = "#f2c230";
            c.textAlign = "center";
            c.textBaseline = "middle";
            c.font = `800 ${Math.round(CH * 0.5)}px "Work Sans", system-ui, sans-serif`;
            c.fillText("AL-MA'IDAH RESTAURANT", CW / 2, CH * 0.53);
          },
          512,
        );
        mesh.position.set(0, 3.75, Dp / 2 + 0.06);
        g.add(mesh);
        this.dg.add(g);
        this.addCollider("out", x - W / 2, x + W / 2, z - Dp / 2, z + Dp / 2);
        this.reserved.push({
          x0: this.ox + x - W / 2,
          x1: this.ox + x + W / 2,
          z0: this.oz + z - Dp / 2,
          z1: this.oz + z + Dp / 2,
        });
        const fz = z + (north ? Dp / 2 + 1.4 : -Dp / 2 - 1.4);
        this.zones.push({
          id: "door:restaurant:" + D.id,
          label: "Enter Al-Ma'idah Restaurant",
          x: x + this.ox,
          z: fz + this.oz,
          r: 2.2,
          scene: "out",
        });
        return;
      }
    }
  }
  /** A free lot beside the market street, for a building W wide and Dp deep. */
  private findLot(D: District, W: number, Dp: number) {
    const m = this.marketSpot.get(D.id);
    const x0 = m?.x ?? 0;
    const xs: number[] = [];
    for (let k = 3; k < 34; k++) xs.push(k * 6, -k * 6);
    // the market street first, then any other street with room
    const streets = [m?.sz ?? 0, ...D.streets.map((s) => s.z).filter((z) => z !== (m?.sz ?? 0))];
    for (const sz of streets)
      for (const north of [m?.north ?? true, !(m?.north ?? true)])
        for (const off of [Dp / 2 + 6.4, Dp / 2 + 7.4, Dp / 2 + 9])
          for (const dx of xs) {
            const x = x0 + dx,
              z = sz + (north ? -off : off);
            if (Math.abs(x) < 14 || Math.abs(x) > halfOf(D).x - W / 2 - 6) continue;
            if (Math.abs(z) > halfOf(D).z - Dp / 2 - 4) continue;
            if (!this.boxFree(x - W / 2 - 0.4, x + W / 2 + 0.4, z - Dp / 2 - 0.4, z + Dp / 2 + 0.4))
              continue;
            this.reserved.push({
              x0: this.ox + x - W / 2,
              x1: this.ox + x + W / 2,
              z0: this.oz + z - Dp / 2,
              z1: this.oz + z + Dp / 2,
            });
            this.addCollider("out", x - W / 2, x + W / 2, z - Dp / 2, z + Dp / 2);
            const fz = z + (north ? Dp / 2 + 1.6 : -Dp / 2 - 1.6);
            return { x, z, north, fz };
          }
    // no room along a street: any open ground in the area, facing the nearest street
    const H = halfOf(D);
    for (let r = 0; r < Math.max(H.x, H.z); r += 3)
      for (let x = -H.x + W / 2 + 6; x <= H.x - W / 2 - 6; x += 3)
        for (let z = -H.z + Dp / 2 + 6; z <= H.z - Dp / 2 - 6; z += 3) {
          if (
            Math.max(Math.abs(x - x0), Math.abs(z)) > r ||
            Math.max(Math.abs(x - x0), Math.abs(z)) <= r - 3
          )
            continue;
          // keep off the roads, the pavements and the parking bays
          if (Math.abs(x) < W / 2 + 8) continue;
          if (D.streets.some((st) => Math.abs(z - st.z) < Dp / 2 + 7)) continue;
          if (!this.boxFree(x - W / 2 - 0.4, x + W / 2 + 0.4, z - Dp / 2 - 0.4, z + Dp / 2 + 0.4))
            continue;
          this.reserved.push({
            x0: this.ox + x - W / 2,
            x1: this.ox + x + W / 2,
            z0: this.oz + z - Dp / 2,
            z1: this.oz + z + Dp / 2,
          });
          this.addCollider("out", x - W / 2, x + W / 2, z - Dp / 2, z + Dp / 2);
          const sz =
            D.streets.map((s) => s.z).sort((a, b) => Math.abs(a - z) - Math.abs(b - z))[0] ?? 0;
          const north = z < sz;
          const fz = z + (north ? Dp / 2 + 1.6 : -Dp / 2 - 1.6);
          return { x, z, north, fz };
        }
    return null;
  }
  private signBoard(text: string, w: number, h: number, bg: string, fg: string) {
    return canvasPlane(
      w,
      h,
      (c, CW, CH) => {
        c.fillStyle = bg;
        c.fillRect(0, 0, CW, CH);
        c.fillStyle = fg;
        c.textAlign = "center";
        c.textBaseline = "middle";
        let size = Math.round(CH * 0.52);
        c.font = `800 ${size}px "Work Sans", system-ui, sans-serif`;
        while (c.measureText(text).width > CW * 0.92 && size > 12) {
          size -= 2;
          c.font = `800 ${size}px "Work Sans", system-ui, sans-serif`;
        }
        c.fillText(text, CW / 2, CH * 0.53);
      },
      512,
    ).mesh;
  }
  /** A university behind its wall: a fence round the campus and a gate on the cross road
      with the university's name written big across it. Shops and houses stay outside. */
  private buildCampusWall(D: District) {
    const c = D.campus!;
    const H = halfOf(D);
    const z = c.z,
      x0 = -H.x + 1,
      x1 = H.x - 1,
      zb = -H.z + 1;
    const g = new THREE.Group();
    const wall = (ax: number, az: number, bx: number, bz: number) => {
      const len = Math.hypot(bx - ax, bz - az);
      const along = Math.abs(bx - ax) > Math.abs(bz - az);
      const w = new THREE.Mesh(
        new THREE.BoxGeometry(along ? len : 0.35, 2.2, along ? 0.35 : len),
        mat(0xe9e2d0),
      );
      w.position.set((ax + bx) / 2, 1.1, (az + bz) / 2);
      w.castShadow = true;
      w.receiveShadow = true;
      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(along ? len : 0.5, 0.18, along ? 0.5 : len),
        mat(0x1f6f63),
      );
      cap.position.set((ax + bx) / 2, 2.25, (az + bz) / 2);
      g.add(w, cap);
      this.addCollider(
        "out",
        Math.min(ax, bx) - 0.2,
        Math.max(ax, bx) + 0.2,
        Math.min(az, bz) - 0.2,
        Math.max(az, bz) + 0.2,
      );
    };
    // the front wall, open at the gate on the cross road
    wall(x0, z, -11.3, z);
    wall(11.3, z, x1, z);
    wall(x0, z, x0, zb);
    wall(x1, z, x1, zb);
    wall(x0, zb, x1, zb);
    // the gate: two pillars and a beam with the university's name
    for (const px of [-10.5, 10.5]) g.add(box(1.6, 8.4, 1.6, 0xd9d1bd, px, 0, z));
    g.add(box(22.6, 1.6, 1.4, 0x1f6f63, 0, 7, z));
    const front = this.signBoard(c.gate, 19, 1.3, "#1f6f63", "#ffffff");
    front.position.set(0, 7.8, z + 0.75);
    g.add(front);
    const back = this.signBoard(c.gate, 19, 1.3, "#1f6f63", "#ffffff");
    back.position.set(0, 7.8, z - 0.75);
    back.rotation.y = Math.PI;
    g.add(back);
    const hint = label("Main Gate · " + c.gate, { size: 0.8, bg: "rgba(31,111,99,0.92)" });
    hint.position.set(0, 10.4, z);
    g.add(hint);
    this.colliders.out.push(
      { x0: this.ox - 11.3, x1: this.ox - 9.7, z0: this.oz + z - 0.8, z1: this.oz + z + 0.8 },
      { x0: this.ox + 9.7, x1: this.ox + 11.3, z0: this.oz + z - 0.8, z1: this.oz + z + 0.8 },
    );
    this.dg.add(g);
  }
  /* ---------------- Makkah and Madinah ---------------- */
  /** Where the Kaaba, Safa and Marwah are (world), for tawaf and sa'i. */
  holy: {
    kaaba?: { x: number; z: number };
    safa?: { x: number; z: number };
    marwah?: { x: number; z: number };
  } = {};
  /** Al-Masjid Al-Haram: the colonnades round an open courtyard with the Kaaba in the middle,
      Maqam Ibrahim, the Zamzam taps, Safa and Marwah, tall minarets and the clock tower. */
  private buildHaram(l: Landmark, D: District) {
    const sz = D.streets.find((s) => s.id === l.street)?.z ?? 0;
    const C = { x: l.x, z: sz - 130 };
    const OUT = 88,
      IN = 46,
      H = 15;
    const g = new THREE.Group();
    g.position.set(C.x, 0, C.z);
    const white = 0xf3f0e7;
    // the marble courtyard (mataf) and the outer plaza
    const plaza = new THREE.Mesh(
      new THREE.PlaneGeometry(OUT * 2 + 30, OUT * 2 + 40),
      mat(0xe9e4d8),
    );
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(0, 0.025, 8);
    plaza.receiveShadow = true;
    g.add(plaza);
    const mataf = new THREE.Mesh(new THREE.PlaneGeometry(IN * 2, IN * 2), mat(0xfbfaf6));
    mataf.rotation.x = -Math.PI / 2;
    mataf.position.y = 0.04;
    mataf.receiveShadow = true;
    g.add(mataf);
    // the colonnades: four wings, with the King Abdulaziz Gate on the south
    const wing = (x0: number, x1: number, z0: number, z1: number) => {
      const w = x1 - x0,
        d = z1 - z0;
      g.add(box(w, H, d, white, (x0 + x1) / 2, 0, (z0 + z1) / 2));
      g.add(box(w + 0.6, 1.2, d + 0.6, 0xd9cfb8, (x0 + x1) / 2, H, (z0 + z1) / 2));
      this.addCollider("out", C.x + x0, C.x + x1, C.z + z0, C.z + z1);
    };
    wing(-OUT, OUT, -OUT, -IN); // north
    wing(-OUT, -IN, -IN, IN); // west
    wing(IN, OUT, -IN, IN); // east
    wing(-OUT, -9, IN, OUT); // south, left of the gate
    wing(9, OUT, IN, OUT); // south, right of the gate
    // arches facing the courtyard and the street
    const archMat = mat(0x8a7a5a, { side: THREE.DoubleSide });
    const arches = (y: number, z: number, x0: number, x1: number, n: number, face: number) => {
      for (let i = 0; i < n; i++) {
        const x = x0 + ((i + 0.5) * (x1 - x0)) / n;
        const a = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 5.2), archMat);
        a.position.set(x, y, z + face * 0.06);
        if (face < 0) a.rotation.y = Math.PI;
        g.add(a);
      }
    };
    arches(3, OUT, -OUT + 2, -11, 12, 1);
    arches(3, OUT, 11, OUT - 2, 12, 1);
    arches(3, -IN, -IN + 2, IN - 2, 14, 1);
    arches(3, IN, -IN + 2, -11, 6, -1);
    arches(3, IN, 11, IN - 2, 6, -1);
    // the gate: an arch with two minarets
    g.add(box(20, 2.4, 6, 0xd9cfb8, 0, H - 1.2, OUT - 3));
    const gateSign = this.signBoard("KING ABDULAZIZ GATE", 16, 1.1, "#5a4a2a", "#f3e2b0");
    gateSign.position.set(0, H - 3, OUT + 0.1);
    g.add(gateSign);
    const minaret = (x: number, z: number, h: number) => {
      const shaft = cyl(1.6, 2, h, 0xf3f0e7, 8);
      shaft.position.set(x, h / 2, z);
      g.add(shaft);
      for (const y of [h * 0.45, h * 0.75]) {
        const bal = cyl(2.5, 2.5, 0.8, 0xd9cfb8, 8);
        bal.position.set(x, y, z);
        g.add(bal);
      }
      const top = new THREE.Mesh(new THREE.ConeGeometry(1.4, 6, 8), mat(0xc9a227));
      top.position.set(x, h + 3, z);
      g.add(top);
      const c = crescent();
      c.scale.setScalar(1.2);
      c.position.set(x - 0.3, h + 7.2, z);
      g.add(c);
      this.addCollider("out", C.x + x - 2.2, C.x + x + 2.2, C.z + z - 2.2, C.z + z + 2.2);
    };
    minaret(-12, OUT + 2, 62);
    minaret(12, OUT + 2, 62);
    for (const [x, z] of [
      [-OUT, -OUT],
      [OUT, -OUT],
      [-OUT, OUT],
      [OUT, OUT],
    ])
      minaret(x, z, 56);
    // the Kaaba: black kiswah with its gold band, the door, Hijr Ismail and the Black Stone
    const K = new THREE.Group();
    K.add(box(12, 15, 12, 0x111111));
    const band = box(12.15, 1.2, 12.15, 0xc9a227, 0, 10.4, 0);
    K.add(band);
    // the door, on the face just after the Black Stone (the Multazam is between them)
    K.add(box(0.2, 3.6, 2.4, 0xc9a227, 6.05, 2.2, 2.4));
    const stone = new THREE.Mesh(
      new THREE.TorusGeometry(0.45, 0.14, 8, 16),
      mat(0xc0c4c8, { metalness: 0.6, roughness: 0.3 }),
    );
    stone.position.set(6.05, 1.5, 6.05);
    stone.rotation.y = Math.PI / 4;
    K.add(stone);
    const hijr = new THREE.Mesh(new THREE.TorusGeometry(7.5, 0.45, 8, 28, Math.PI), mat(0xe9e4d8));
    // Hijr Ismail: the low curved wall on the far side, part of the Kaaba
    hijr.rotation.x = -Math.PI / 2;
    hijr.position.set(0, 0.6, -6);
    K.add(hijr);
    g.add(K);
    this.addCollider("out", C.x - 6.2, C.x + 6.2, C.z - 6.2, C.z + 6.2);
    // Maqam Ibrahim: a small gold-and-glass cage
    const maqam = new THREE.Group();
    maqam.add(cyl(0.9, 1.1, 0.6, 0xd9cfb8, 12));
    const cage = cyl(0.8, 0.8, 2.2, 0xc9a227, 12);
    cage.position.y = 1.7;
    maqam.add(cage);
    const capm = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.9, 12), mat(0xc9a227));
    capm.position.y = 3.2;
    maqam.add(capm);
    // in front of the Kaaba's door
    maqam.position.set(15, 0, 2.4);
    g.add(maqam);
    this.addCollider("out", C.x + 14, C.x + 16, C.z + 1.4, C.z + 3.4);
    // the start of each round: a line from the Black Stone and a green light on the wall
    const line = new THREE.Mesh(new THREE.PlaneGeometry(0.35, IN - 9), mat(0x6b4426));
    line.rotation.x = -Math.PI / 2;
    line.rotation.z = Math.PI / 4;
    line.position.set(Math.SQRT1_2 * (IN / 2 + 3), 0.06, Math.SQRT1_2 * (IN / 2 + 3));
    g.add(line);
    const lamp = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.2, 0.3),
      new THREE.MeshBasicMaterial({ color: 0x2bd47a, toneMapped: false }),
    );
    lamp.position.set(IN - 0.4, 7, IN - 0.4);
    lamp.rotation.y = Math.PI / 4;
    g.add(lamp);
    const bl = label("Black Stone line · start and end of each round", {
      size: 0.7,
      bg: "rgba(31,140,80,0.9)",
    });
    bl.position.set(Math.SQRT1_2 * 20, 3, Math.SQRT1_2 * 20);
    g.add(bl);
    // worshippers sitting in rings round the Kaaba, waiting for the next salah
    for (let ring = 0; ring < 2; ring++) {
      const rr = 27 + ring * 3,
        n = 18 + ring * 4;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + ring * 0.12;
        const x = Math.cos(a) * rr,
          z = Math.sin(a) * rr;
        if (x > 12 && Math.abs(z) < 8) continue; // keep the way to the Maqam clear
        const f = (i + ring) % 4 === 3;
        const pg = f
          ? person(0x1d1d26, { hijab: 0xf4f4ef, seed: 80 + i })
          : person([0xf7f7f2, 0xe8e2d4, 0xf4efe4][i % 3], { cap: 0xffffff, seed: 80 + i });
        pg.position.set(x, 0.1, z);
        pg.rotation.y = Math.atan2(-x, -z);
        if (!sitHuman(pg)) sitPerson(pg);
        g.add(pg);
      }
    }
    // Zamzam taps along the west colonnade
    for (let i = 0; i < 5; i++) {
      const t = box(1.6, 1.1, 0.6, 0xc0c4c8, -IN + 1.2, 0, -8 + i * 4);
      g.add(t);
    }
    // the Mas'a: a two-storey marble gallery down the east side, from Safa to Marwah,
    // with the green lights in the middle where men hasten
    this.buildMasa(g, IN, H, C);
    this.dg.add(g);
    // the Abraj Al-Bait with the Makkah clock tower, across the road from the King Abdulaziz Gate
    this.buildAbraj(C.x, sz);
    // hotels round the Haram
    this.buildHotelRing(C, OUT, sz);
    // keep houses off the whole Haram and its plaza
    this.reserved.push({
      x0: this.ox + C.x - OUT - 14,
      x1: this.ox + C.x + OUT + 14,
      z0: this.oz + C.z - OUT - 14,
      z1: this.oz + sz - 10,
    });
    // places to tap
    const W = (x: number, z: number) => ({ x: this.ox + C.x + x, z: this.oz + C.z + z });
    const kz = W(0, 0),
      safa = W(IN - 6, -IN + 6),
      marwah = W(IN - 6, IN - 6);
    this.holy.kaaba = kz;
    this.holy.safa = safa;
    this.holy.marwah = marwah;
    const zone = (id: string, label2: string, p: { x: number; z: number }, r = 3.4) =>
      this.zones.push({ id, label: label2, x: p.x, z: p.z, r, scene: "out" });
    zone("kaaba:tawaf", "🕋 Tawaf around the Kaaba", W(0, 9.5), 4);
    zone("maqam", "Pray behind Maqam Ibrahim", W(19, 2.4));
    zone("zamzam", "💧 Drink Zamzam", W(-IN + 3.5, 0));
    zone("safa:sai", "Sa'i between Safa and Marwah", W(IN - 6, -IN + 10));
    zone(`door:masjid:${l.id}`, `Enter ${l.name} for salah`, W(0, OUT + 4), 4);
    // a great crowd making tawaf, the Kaaba on their left
    this.buildTawafCrowd(g, IN);
    // pilgrims in ihram walking round the Kaaba, the Kaaba on their left
    for (let i = 0; i < 18; i++) {
      const r = 10 + (i % 4) * 3.2;
      const route: [number, number][] = [];
      const a0 = (i / 18) * Math.PI * 2;
      for (let k = 0; k < 16; k++) {
        const a = a0 + (k / 16) * Math.PI * 2;
        route.push([C.x + Math.cos(a) * r, C.z - Math.sin(a) * r]);
      }
      const female = i % 3 === 2;
      const pg = female
        ? person(0x1d1d26, { hijab: i % 2 ? 0xf4f4ef : 0x1d1d26, seed: i })
        : person(0xf7f7f2, { cap: null, seed: i, outfit: "thobe" });
      pg.position.set(route[0][0], 0, route[0][1]);
      this.dg.add(pg);
      this.walkers.push({ g: pg, route, k: 1, wait: i * 0.3, t: 0, district: D.id, pilgrim: true });
    }
  }

  /** The Mas'a inside the east colonnade: a marble walkway between the rocks of Safa (north)
      and Marwah (south), under two storeys of arches, with green lights over the middle. */
  private buildMasa(g: THREE.Group, IN: number, H: number, C: { x: number; z: number }) {
    const x0 = IN - 13,
      x1 = IN,
      L = IN - 2;
    const cx = (x0 + x1) / 2;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, L * 2), mat(0xf8f6f0));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(cx, 0.05, 0);
    floor.receiveShadow = true;
    g.add(floor);
    // the upper floor and the roof, held up on rows of columns facing the Kaaba
    g.add(box(x1 - x0, 0.9, L * 2, 0xece6d6, cx, 7, 0));
    g.add(box(x1 - x0, 0.9, L * 2, 0xe2dacb, cx, H - 0.9, 0));
    for (let z = -L + 3; z <= L - 3; z += 6) {
      for (const y of [0, 7.9]) {
        const col = cyl(0.5, 0.6, y ? H - 0.9 - 7.9 : 7, 0xf3f0e7, 10);
        col.position.set(x0 + 0.6, y + (y ? (H - 0.9 - 7.9) / 2 : 3.5), z);
        g.add(col);
      }
      const arch = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.3, 6, 12, Math.PI), mat(0xd9cfb8));
      arch.rotation.y = Math.PI / 2;
      arch.position.set(x0 + 0.6, 4.4, z + 3);
      g.add(arch);
      // the dividing rail down the middle of the Mas'a
      g.add(box(0.15, 1, 5.2, 0xc9a227, cx + 1, 0, z + 3));
    }
    // the colonnade is solid except for three ways in from the courtyard
    for (const [za, zb] of [
      [-L, -L + 8],
      [-L + 14, -6],
      [6, L - 14],
      [L - 8, L],
    ])
      this.addCollider("out", C.x + x0, C.x + x0 + 1.2, C.z + za, C.z + zb);
    // green lights on the ceiling between the two green columns
    const green = new THREE.MeshBasicMaterial({ color: 0x2bd47a, toneMapped: false });
    for (const dx of [-3, 0, 3]) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.12, 24), green);
      strip.position.set(cx + dx, 6.5, 0);
      g.add(strip);
    }
    for (const z of [-12, 12]) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 6.5, 0.8), green);
      pillar.position.set(cx + 4.5, 3.25, z);
      g.add(pillar);
    }
    const gl = label("Green lights · brothers hasten here", {
      size: 0.8,
      bg: "rgba(31,140,80,0.9)",
    });
    gl.position.set(cx, 5.6, 0);
    g.add(gl);
    // Safa and Marwah: the rocks of the two hills under their domes
    const hill = (z: number, name: string, ar: string) => {
      const rock = new THREE.Group();
      for (const [dx, dy, dz, rr] of [
        [0, 0.9, 0, 2.6],
        [1.6, 0.5, 1.2, 1.7],
        [-1.5, 0.6, -1, 1.9],
        [0.4, 1.6, -0.6, 1.5],
      ]) {
        const m2 = new THREE.Mesh(new THREE.DodecahedronGeometry(rr, 0), mat(0x8a7560));
        m2.position.set(dx, dy, dz);
        m2.rotation.set(dx, dz, dy);
        m2.castShadow = true;
        rock.add(m2);
      }
      rock.scale.set(1, 0.75, 1);
      rock.position.set(cx, 0, z);
      g.add(rock);
      const guard = new THREE.Mesh(
        new THREE.CylinderGeometry(4.2, 4.2, 1.1, 24, 1, true),
        mat(0xe8f2f6, { transparent: true, opacity: 0.35, side: THREE.DoubleSide }),
      );
      guard.position.set(cx, 0.55, z);
      g.add(guard);
      const drum = cyl(5, 5, 2, 0xece6d6, 20);
      drum.position.set(cx, H + 1, z);
      g.add(drum);
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(5, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2),
        mat(0xd9d4c8),
      );
      dome.position.set(cx, H + 2, z);
      g.add(dome);
      const t = label(`${name} · ${ar}`, { size: 1.1, bg: "rgba(31,111,99,0.92)" });
      t.position.set(cx, 5.2, z);
      g.add(t);
    };
    hill(-L + 4, "Safa", "الصفا");
    hill(L - 4, "Marwah", "المروة");
  }

  /** A clock face: white with a gold ring, Arabic numerals and "Allahu Akbar" above. */
  private clockFace(r: number) {
    const { mesh } = canvasPlane(
      r * 2,
      r * 2.6,
      (c, W, Hh) => {
        c.fillStyle = "#1d6b3a";
        c.fillRect(0, 0, W, Hh);
        const R = W / 2 - 8,
          cx = W / 2,
          cy = Hh - W / 2;
        c.fillStyle = "#f3d27a";
        c.font = `700 ${Math.round(W * 0.12)}px serif`;
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText("الله أكبر", cx, (Hh - W) / 2 + 4);
        c.beginPath();
        c.arc(cx, cy, R, 0, Math.PI * 2);
        c.fillStyle = "#c9a227";
        c.fill();
        c.beginPath();
        c.arc(cx, cy, R * 0.9, 0, Math.PI * 2);
        c.fillStyle = "#fbfaf4";
        c.fill();
        const nums = ["١٢", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩", "١٠", "١١"];
        c.fillStyle = "#1d1d1d";
        c.font = `700 ${Math.round(R * 0.16)}px serif`;
        nums.forEach((n, i) => {
          const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
          c.fillText(n, cx + Math.cos(a) * R * 0.74, cy + Math.sin(a) * R * 0.74);
        });
        c.strokeStyle = "#1d1d1d";
        c.lineCap = "round";
        c.lineWidth = R * 0.05;
        c.beginPath();
        c.moveTo(cx, cy);
        c.lineTo(cx + R * 0.35, cy - R * 0.3);
        c.stroke();
        c.lineWidth = R * 0.035;
        c.beginPath();
        c.moveTo(cx, cy);
        c.lineTo(cx - R * 0.05, cy - R * 0.62);
        c.stroke();
      },
      512,
    );
    return mesh;
  }

  /** The Abraj Al-Bait: a stone podium with hotel towers, and the clock tower in the middle
      with its four great clock faces, a green-lit crown and a golden crescent. */
  private buildAbraj(hx: number, sz: number) {
    const cx = hx + 82,
      cz = sz + 54;
    const PW = 120,
      PD = 64,
      PH = 18;
    const T = new THREE.Group();
    T.position.set(cx, 0, cz);
    const facade = (
      w: number,
      h: number,
      d: number,
      c: number,
      x: number,
      y: number,
      z: number,
    ) => {
      const m = new THREE.Mesh(boxGeo(w, h, d, 3.3), MAT3.facade(c));
      m.position.set(x, y + h / 2, z);
      m.castShadow = true;
      m.receiveShadow = true;
      T.add(m);
      return m;
    };
    // the podium: shopping halls with arches at street level
    facade(PW, PH, PD, 0xe6dcc6, 0, 0, 0);
    T.add(box(PW + 1, 1, PD + 1, 0xcbb894, 0, PH, 0));
    const archMat = mat(0x8a7a5a, { side: THREE.DoubleSide });
    for (let i = 0; i < 18; i++) {
      const a = new THREE.Mesh(new THREE.PlaneGeometry(4, 6), archMat);
      a.position.set(-PW / 2 + 4 + i * ((PW - 8) / 17), 3.2, -PD / 2 - 0.06);
      a.rotation.y = Math.PI;
      T.add(a);
    }
    // six hotel towers on the podium
    for (const [x, z, h, w] of [
      [-46, -18, 70, 16],
      [-46, 16, 88, 16],
      [-24, 22, 62, 14],
      [24, 22, 62, 14],
      [46, 16, 88, 16],
      [46, -18, 70, 16],
    ]) {
      facade(w, h, w, 0xeae2d0, x, PH, z);
      T.add(box(w + 1.5, 2.5, w + 1.5, 0xcbb894, x, PH + h, z));
      T.add(box(w * 0.6, 6, w * 0.6, 0xe6dcc6, x, PH + h + 2.5, z));
      const sp = new THREE.Mesh(new THREE.ConeGeometry(1.2, 8, 6), mat(0xc9a227));
      sp.position.set(x, PH + h + 12.5, z);
      T.add(sp);
    }
    // the clock tower
    const S = 26;
    const shaftH = 150;
    facade(S, shaftH, S, 0xece6d6, 0, PH, -4);
    const yc = PH + shaftH;
    T.add(box(S + 6, 2, S + 6, 0xcbb894, 0, yc, -4));
    T.add(box(S + 4, 38, S + 4, 0xf0ebdf, 0, yc + 2, -4));
    for (const ry of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      const f = this.clockFace(14);
      f.position.set(
        Math.sin(ry) * ((S + 4) / 2 + 0.1),
        yc + 2 + 19,
        -4 + Math.cos(ry) * ((S + 4) / 2 + 0.1),
      );
      f.rotation.y = ry;
      T.add(f);
    }
    // the crown: tiers lit green at night, then the gold spire and crescent
    const greenM = new THREE.MeshStandardMaterial({
      color: 0x1d6b3a,
      emissive: 0x2bd47a,
      emissiveIntensity: 0.5,
    });
    let y = yc + 40;
    for (const [w, h] of [
      [S + 2, 6],
      [S - 4, 8],
      [S - 10, 8],
    ]) {
      const tier = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), greenM);
      tier.position.set(0, y + h / 2, -4);
      T.add(tier);
      T.add(box(w + 1, 0.8, w + 1, 0xf0ebdf, 0, y + h, -4));
      y += h + 0.8;
    }
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(6, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      mat(0xc9a227, { metalness: 0.6, roughness: 0.3 }),
    );
    dome.position.set(0, y, -4);
    T.add(dome);
    const spire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 2.2, 34, 10),
      mat(0xc9a227, { metalness: 0.6, roughness: 0.3 }),
    );
    spire.position.set(0, y + 6 + 17, -4);
    T.add(spire);
    const tc = crescent();
    tc.scale.setScalar(4);
    tc.position.set(-1, y + 6 + 38, -4);
    T.add(tc);
    this.dg.add(T);
    this.addCollider("out", cx - PW / 2, cx + PW / 2, cz - PD / 2, cz + PD / 2);
    this.reserved.push({
      x0: this.ox + cx - PW / 2 - 4,
      x1: this.ox + cx + PW / 2 + 4,
      z0: this.oz + cz - PD / 2 - 4,
      z1: this.oz + cz + PD / 2 + 4,
    });
    const tl = label("Abraj Al-Bait · Makkah Clock Tower", { size: 2, bg: "rgba(31,111,99,0.9)" });
    tl.position.set(cx, PH + 6, cz - PD / 2);
    this.dg.add(tl);
  }

  /** Tall hotels on the blocks round the Haram, the way pilgrims see Makkah. */
  private buildHotelRing(C: { x: number; z: number }, OUT: number, sz: number) {
    const names = [
      "Hilton Suites",
      "Swissotel",
      "Dar Al-Tawhid",
      "Al-Safwa Towers",
      "Hotel Makkah",
      "Le Meridien",
      "Elaf Ajyad",
      "Al-Marwa Rayhaan",
    ];
    let k = 0;
    for (const side of [-1, 1])
      for (const z of [C.z - 70, C.z, C.z + 62]) {
        if (z > sz - 34) continue;
        for (const dx of [OUT + 30, OUT + 62, OUT + 94]) {
          const x = C.x + side * dx;
          const w = 22,
            d = 20;
          if (!this.boxFree(x - w / 2 - 2, x + w / 2 + 2, z - d / 2 - 2, z + d / 2 + 2)) continue;
          const h = 40 + ((k * 37) % 50);
          const m = new THREE.Mesh(
            boxGeo(w, h, d, 3.3),
            MAT3.facade([0xeae2d0, 0xe6dcc6, 0xf2ece0, 0xdccfb4][k % 4]),
          );
          m.position.set(x, h / 2, z);
          m.castShadow = true;
          m.receiveShadow = true;
          this.dg.add(m);
          this.dg.add(box(w + 1.2, 1.6, d + 1.2, 0xcbb894, x, h, z));
          const sign = this.signBoard(names[k % names.length], w * 0.8, 2, "#1d6b3a", "#f3e2b0");
          sign.position.set(x, h - 3, z + d / 2 + 0.1);
          this.dg.add(sign);
          const sign2 = this.signBoard(names[k % names.length], w * 0.8, 2, "#1d6b3a", "#f3e2b0");
          sign2.position.set(x, h - 3, z - d / 2 - 0.1);
          sign2.rotation.y = Math.PI;
          this.dg.add(sign2);
          this.addCollider("out", x - w / 2, x + w / 2, z - d / 2, z + d / 2);
          this.reserved.push({
            x0: this.ox + x - w / 2 - 2,
            x1: this.ox + x + w / 2 + 2,
            z0: this.oz + z - d / 2 - 2,
            z1: this.oz + z + d / 2 + 2,
          });
          k++;
        }
      }
  }

  /** The Jamarat in Mina: a long bridge of four floors with the three stone pillars rising
      through it, each in its oval basin. */
  private buildJamarat(l: Landmark, sz: number, D: District) {
    const C = { x: l.x, z: sz - 34 };
    const L = 150,
      Wd = 22;
    const g = new THREE.Group();
    g.position.set(C.x, 0, C.z);
    const slab = 0xe6e2d8,
      col = 0xd8d2c4;
    for (const y of [6, 12, 18, 24]) {
      g.add(box(L, y === 24 ? 0.6 : 1, Wd, slab, 0, y - 1, 0));
      if (y < 24) {
        // railings along both sides of each floor
        for (const zz of [-Wd / 2, Wd / 2]) g.add(box(L, 1.1, 0.15, 0x9aa3a8, 0, y, zz));
      }
    }
    // white shade canopies on the roof
    for (let x = -L / 2 + 8; x < L / 2; x += 16) {
      const c = new THREE.Mesh(
        new THREE.ConeGeometry(6, 3, 4, 1, true),
        mat(0xf8f8f4, { side: THREE.DoubleSide }),
      );
      c.rotation.y = Math.PI / 4;
      c.position.set(x, 25.5, 0);
      g.add(c);
    }
    for (let x = -L / 2 + 2; x <= L / 2 - 2; x += 12)
      for (const zz of [-Wd / 2 + 1, Wd / 2 - 1]) {
        const c = cyl(0.7, 0.7, 23.4, col, 10);
        c.position.set(x, 11.7, zz);
        g.add(c);
        this.addCollider("out", C.x + x - 0.8, C.x + x + 0.8, C.z + zz - 0.8, C.z + zz + 0.8);
      }
    // ramps up at each end
    for (const sx of [-1, 1]) {
      const ramp = box(30, 0.8, 10, slab, 0, 0, 0);
      ramp.position.set(sx * (L / 2 + 14), 3, -Wd / 2 + 6);
      ramp.rotation.z = sx * -0.2;
      g.add(ramp);
    }
    // the three pillars: Al-Ula (smallest, by Masjid Al-Khayf), Al-Wusta, Al-Aqabah
    const names: [number, string, string][] = [
      [48, "Al-Jamrah Al-Ula", "ula"],
      [0, "Al-Jamrah Al-Wusta", "wusta"],
      [-48, "Al-Jamrah Al-Aqabah", "aqabah"],
    ];
    for (const [x, name, id] of names) {
      g.add(box(3, 30, 14, 0x8d8a84, x, 0, 0));
      for (const y of [0, 6, 12, 18]) {
        // the oval basin round the pillar on every floor
        const rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.08, 6, 28), mat(0x6f6a62));
        rim.scale.set(5.5, 10, 1);
        rim.rotation.x = Math.PI / 2;
        rim.position.set(x, y + 0.9, 0);
        g.add(rim);
      }
      const t = label(name, { size: 1.2, bg: "rgba(31,111,99,0.92)" });
      t.position.set(x, 7.6, Wd / 2 + 1);
      g.add(t);
      this.addCollider("out", C.x + x - 5.5, C.x + x + 5.5, C.z - 9.5, C.z + 9.5);
      this.zones.push({
        id: `jamarat:${id}`,
        label: `Stone ${name} · 7 pebbles`,
        x: this.ox + C.x + x,
        z: this.oz + C.z + 11.5,
        r: 3.4,
        scene: "out",
      });
    }
    const big = label("The Jamarat · الجمرات", { size: 2.2, bg: "rgba(31,111,99,0.92)" });
    big.position.set(0, 30, 0);
    g.add(big);
    this.dg.add(g);
    this.reserved.push({
      x0: this.ox + C.x - L / 2 - 46,
      x1: this.ox + C.x + L / 2 + 46,
      z0: this.oz + C.z - Wd / 2 - 4,
      z1: this.oz + C.z + Wd / 2 + 4,
    });
    // pilgrims walking along under the bridge
    for (let i = 0; i < 14; i++) {
      const z = C.z + (i % 2 ? 6 : -6) + (i % 3) - 1;
      const route: [number, number][] = [
        [C.x - L / 2 + 6, z],
        [C.x + L / 2 - 6, z],
      ];
      const pg =
        i % 3 === 2
          ? person(0x1d1d26, { hijab: 0xf4f4ef, seed: 60 + i })
          : person(0xf7f7f2, { cap: null, seed: 60 + i, outfit: "thobe" });
      const t0 = (i / 14) * L;
      pg.position.set(C.x - L / 2 + 6 + t0, 0, z);
      this.dg.add(pg);
      this.walkers.push({
        g: pg,
        route,
        k: 1,
        wait: i * 0.7,
        t: 0,
        district: D.id,
        pilgrim: true,
      });
    }
  }

  /** Jabal ar-Rahmah: a rocky hill on the plain of Arafat with steps up to its white pillar,
      and the gravel of Muzdalifah where pilgrims pick up pebbles. */
  private buildRahmah(l: Landmark, D: District, sz: number) {
    const C = { x: l.x, z: sz - 48 };
    const g = new THREE.Group();
    g.position.set(C.x, 0, C.z);
    const rock = [0x8a7560, 0x9a836a, 0x7a6550];
    let k = 0;
    for (const [dx, dy, dz, r] of [
      [0, 4, 0, 16],
      [-10, 2, 6, 11],
      [11, 2, 4, 10],
      [4, 2, -10, 11],
      [-8, 1, -9, 9],
      [0, 10, -2, 10],
      [3, 15, -1, 6],
      [14, 1, -6, 7],
      [-15, 1, -2, 8],
    ]) {
      const m = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), mat(rock[k++ % 3]));
      m.position.set(dx, dy - r * 0.35, dz);
      m.scale.y = 0.7;
      m.castShadow = true;
      m.receiveShadow = true;
      g.add(m);
    }
    // the white pillar on the summit
    g.add(box(1.6, 8, 1.6, 0xf8f8f4, 2, 16.5, -1));
    // steps up the south face
    for (let i = 0; i < 18; i++)
      g.add(box(3.2, 0.5, 1.4, 0xd9cfb8, 1 + i * 0.05, i * 0.95, 17 - i * 0.95));
    const t = label("Jabal ar-Rahmah · جبل الرحمة", { size: 1.8, bg: "rgba(31,111,99,0.92)" });
    t.position.set(2, 28, -1);
    g.add(t);
    this.dg.add(g);
    this.addCollider("out", C.x - 20, C.x + 20, C.z - 18, C.z + 14);
    this.reserved.push({
      x0: this.ox + C.x - 30,
      x1: this.ox + C.x + 30,
      z0: this.oz + C.z - 30,
      z1: this.oz + C.z + 22,
    });
    this.zones.push({
      id: "arafat:wuquf",
      label: "🤲 Stand at Arafat and make du'a",
      x: this.ox + C.x + 2,
      z: this.oz + C.z + 19,
      r: 4,
      scene: "out",
    });
    // the gravel of Muzdalifah, by its street
    const mz = D.streets.find((s) => s.id === "muzdalifah")?.z;
    if (mz !== undefined) {
      const px = 70,
        pz = mz + 14;
      const gravel = new THREE.Mesh(groundGeo(26, 12, 2), MAT.plain(0xa8987e));
      gravel.position.set(px, 0.05, pz);
      this.dg.add(gravel);
      for (let i = 0; i < 40; i++) {
        const p = new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.12 + (i % 3) * 0.04, 0),
          mat(0x6f6a62),
        );
        p.position.set(px - 12 + ((i * 37) % 24), 0.1, pz - 5 + ((i * 53) % 10));
        this.dg.add(p);
      }
      const t2 = label("Muzdalifah · المزدلفة", { size: 1.2, bg: "rgba(31,111,99,0.92)" });
      t2.position.set(px, 3.5, pz);
      this.dg.add(t2);
      this.reserved.push({
        x0: this.ox + px - 14,
        x1: this.ox + px + 14,
        z0: this.oz + pz - 7,
        z1: this.oz + pz + 7,
      });
      this.zones.push({
        id: "muzdalifah:pebbles",
        label: "Pick up pebbles for the Jamarat",
        x: this.ox + px,
        z: this.oz + pz,
        r: 5,
        scene: "out",
      });
    }
  }

  /** A slender stone clock tower with four faces (by the Prophet's Mosque in Madinah). */
  private buildClockTower(x: number, z: number, name: string) {
    const T = new THREE.Group();
    T.position.set(x, 0, z);
    T.add(box(10, 3, 10, 0xd9cfb8, 0, 0, 0));
    const shaft = new THREE.Mesh(boxGeo(6, 40, 6, 3.3), MAT3.facade(0xeee6d4));
    shaft.position.y = 3 + 20;
    shaft.castShadow = true;
    T.add(shaft);
    T.add(box(8, 1, 8, 0xcbb894, 0, 43, 0));
    T.add(box(7.5, 9, 7.5, 0xf3efe4, 0, 44, 0));
    for (const ry of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      const f = this.clockFace(3.2);
      f.position.set(Math.sin(ry) * 3.8, 48.5, Math.cos(ry) * 3.8);
      f.rotation.y = ry;
      T.add(f);
    }
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(3.6, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      mat(0x2e8b57, { roughness: 0.45 }),
    );
    dome.position.y = 53;
    T.add(dome);
    const c = crescent();
    c.scale.setScalar(1.4);
    c.position.set(-0.4, 58.5, 0);
    T.add(c);
    this.dg.add(T);
    this.addCollider("out", x - 5, x + 5, z - 5, z + 5);
    this.reserved.push({
      x0: this.ox + x - 7,
      x1: this.ox + x + 7,
      z0: this.oz + z - 7,
      z1: this.oz + z + 7,
    });
    const t = label(name, { size: 1.2, bg: "rgba(46,139,87,0.92)" });
    t.position.set(x, 8, z + 6);
    this.dg.add(t);
  }

  /** Tall white minarets at the corners and a row of white domes on a mosque's roof. */
  private masjidCrown(cx: number, cz: number, minarets: number, domes: number) {
    const W = 34,
      D = 22,
      H = 7.6;
    const g = new THREE.Group();
    g.position.set(cx, 0, cz);
    const corners: [number, number][] = [
      [-W / 2 - 1.5, D / 2 + 1.5],
      [W / 2 + 1.5, D / 2 + 1.5],
      [-W / 2 - 1.5, -D / 2 - 1.5],
      [W / 2 + 1.5, -D / 2 - 1.5],
    ];
    for (const [x, z] of corners.slice(0, minarets)) {
      const sh = cyl(0.9, 1.1, 28, 0xf8f6f0, 8);
      sh.position.set(x, 14, z);
      g.add(sh);
      const bal = cyl(1.5, 1.5, 0.6, 0xe6e0d0, 8);
      bal.position.set(x, 21, z);
      g.add(bal);
      const top = new THREE.Mesh(new THREE.ConeGeometry(1, 3.5, 8), mat(0xf8f6f0));
      top.position.set(x, 29.7, z);
      g.add(top);
      const c = crescent();
      c.scale.setScalar(0.6);
      c.position.set(x - 0.2, 32.2, z);
      g.add(c);
      this.addCollider("out", cx + x - 1.2, cx + x + 1.2, cz + z - 1.2, cz + z + 1.2);
    }
    for (let i = 0; i < domes; i++) {
      const x = domes === 1 ? 0 : -W / 2 + 5 + (i * (W - 10)) / (domes - 1);
      const r = i === Math.floor(domes / 2) ? 3.6 : 2.4;
      const d = new THREE.Mesh(
        new THREE.SphereGeometry(r, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2),
        mat(0xf8f6f0, { roughness: 0.5 }),
      );
      d.position.set(x, H + 0.6, -2);
      d.castShadow = true;
      g.add(d);
    }
    this.dg.add(g);
  }

  /** Mount Uhud: a long red-brown ridge on the north edge of the area. */
  private mountUhud(D: District) {
    const H = halfOf(D);
    const g = new THREE.Group();
    const cols = [0x9a5a3a, 0x8a4f34, 0xa8653f];
    for (let i = 0; i < 14; i++) {
      const r = 18 + ((i * 7) % 12);
      const m = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), mat(cols[i % 3]));
      m.scale.set(1.3, 0.75, 0.8);
      m.position.set(-H.x + 10 + i * ((H.x * 2 - 20) / 13), r * 0.3, -H.z - 26 - (i % 3) * 6);
      m.castShadow = true;
      g.add(m);
    }
    const t = label("Mount Uhud · جبل أحد", { size: 2, bg: "rgba(46,139,87,0.92)" });
    t.position.set(0, 34, -H.z - 30);
    g.add(t);
    this.dg.add(g);
  }

  /** Al-Masjid An-Nabawi: a great white mosque with many minarets, the Green Dome, and a
      courtyard of white umbrellas. */
  private buildNabawi(l: Landmark, D: District) {
    const sz = D.streets.find((s) => s.id === l.street)?.z ?? 0;
    const C = { x: l.x, z: sz - 125 };
    const W = 160,
      Dd = 96,
      H = 16;
    const g = new THREE.Group();
    g.position.set(C.x, 0, C.z);
    const hall = box(W, H, Dd, 0xf3efe4, 0, 0, -10);
    g.add(hall);
    g.add(box(W + 1, 1.4, Dd + 1, 0xd9cfb8, 0, H, -10));
    this.addCollider("out", C.x - W / 2, C.x + W / 2, C.z - 10 - Dd / 2, C.z - 10 + Dd / 2);
    // arches along the front
    const archMat = mat(0x8a7a5a, { side: THREE.DoubleSide });
    for (let i = 0; i < 26; i++) {
      const x = -W / 2 + 3 + i * ((W - 6) / 25);
      if (Math.abs(x) < 6) continue;
      const a = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 6), archMat);
      a.position.set(x, 3.5, -10 + Dd / 2 + 0.06);
      g.add(a);
    }
    g.add(box(10, 9, 1, 0xc9a227, 0, 0, -10 + Dd / 2 + 0.3)); // the main door
    // the Green Dome over the resting place of the Prophet ﷺ, and a silver dome beside it
    const dome = (x: number, z: number, r: number, color: number) => {
      const drum = cyl(r * 0.9, r * 0.9, 3, 0xece6d6, 20);
      drum.position.set(x, H + 1.5, z);
      g.add(drum);
      const d = new THREE.Mesh(
        new THREE.SphereGeometry(r, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2),
        mat(color, { roughness: 0.45 }),
      );
      d.scale.y = 1.35;
      d.position.set(x, H + 3, z);
      d.castShadow = true;
      g.add(d);
      const c = crescent();
      c.position.set(x - 0.3, H + 3 + r * 1.35 + 1.4, z);
      g.add(c);
    };
    dome(W / 2 - 22, Dd / 2 - 28, 7, 0x2e8b57);
    dome(-10, -10, 6, 0xb8bec4);
    // ten minarets
    const minaret = (x: number, z: number, h: number) => {
      const shaft = cyl(1.5, 1.9, h, 0xf3efe4, 8);
      shaft.position.set(x, h / 2, z);
      g.add(shaft);
      for (const y of [h * 0.5, h * 0.78]) {
        const bal = cyl(2.4, 2.4, 0.8, 0xd9cfb8, 8);
        bal.position.set(x, y, z);
        g.add(bal);
      }
      const top = new THREE.Mesh(new THREE.ConeGeometry(1.4, 6, 8), mat(0x2e8b57));
      top.position.set(x, h + 3, z);
      g.add(top);
      const c = crescent();
      c.position.set(x - 0.3, h + 6.8, z);
      g.add(c);
      this.addCollider("out", C.x + x - 2, C.x + x + 2, C.z + z - 2, C.z + z + 2);
    };
    for (const x of [-W / 2, -W / 4, 0, W / 4, W / 2]) minaret(x, -10 - Dd / 2, 52);
    for (const x of [-W / 2, -12, 12, W / 2]) minaret(x, -10 + Dd / 2 + 2, 56);
    // the courtyard with its white umbrellas
    const court = new THREE.Mesh(new THREE.PlaneGeometry(W, 70), mat(0xf6f3ea));
    court.rotation.x = -Math.PI / 2;
    court.position.set(0, 0.03, -10 + Dd / 2 + 35);
    court.receiveShadow = true;
    g.add(court);
    for (let i = 0; i < 6; i++)
      for (const zz of [52, 72]) {
        const x = -W / 2 + 16 + i * ((W - 32) / 5);
        const pole = cyl(0.25, 0.3, 9, 0xd9d9d9, 8);
        pole.position.set(x, 4.5, zz);
        g.add(pole);
        const canopy = new THREE.Mesh(
          new THREE.ConeGeometry(8, 3, 4, 1, true),
          mat(0xf8f8f4, { side: THREE.DoubleSide }),
        );
        canopy.rotation.y = Math.PI / 4;
        canopy.position.set(x, 9.2, zz);
        canopy.castShadow = true;
        g.add(canopy);
        this.addCollider("out", C.x + x - 0.4, C.x + x + 0.4, C.z + zz - 0.4, C.z + zz + 0.4);
      }
    // Jannat al-Baqi: the walled graveyard to the east, rows of plain stones in the sand
    {
      const bx = W / 2 + 48,
        bz = -10,
        BW = 64,
        BD = 80;
      const sand = new THREE.Mesh(groundGeo(BW, BD, 3), MAT.plain(0xd8c49a));
      sand.position.set(bx, 0.04, bz);
      g.add(sand);
      for (const [w, d, x, z] of [
        [BW, 0.6, 0, -BD / 2],
        [BW, 0.6, 0, BD / 2],
        [0.6, BD, -BW / 2, 0],
        [0.6, BD, BW / 2, 0],
      ] as [number, number, number, number][]) {
        g.add(box(w, 2.4, d, 0xece6d6, bx + x, 0, bz + z));
        this.addCollider(
          "out",
          C.x + bx + x - w / 2,
          C.x + bx + x + w / 2,
          C.z + bz + z - d / 2,
          C.z + bz + z + d / 2,
        );
      }
      for (let i = 0; i < 140; i++) {
        const x = bx - BW / 2 + 3 + ((i * 7.3) % (BW - 6)),
          z = bz - BD / 2 + 3 + Math.floor((i * 7.3) / (BW - 6)) * 5;
        if (z > bz + BD / 2 - 3) break;
        g.add(box(0.3, 0.5, 0.2, 0x8a8478, x, 0, z));
      }
      const t2 = label("Jannat al-Baqi · البقيع", { size: 1.4, bg: "rgba(46,139,87,0.92)" });
      t2.position.set(bx, 5, bz + BD / 2 + 1);
      g.add(t2);
      this.reserved.push({
        x0: this.ox + C.x + bx - BW / 2 - 4,
        x1: this.ox + C.x + bx + BW / 2 + 4,
        z0: this.oz + C.z + bz - BD / 2 - 4,
        z1: this.oz + C.z + bz + BD / 2 + 4,
      });
    }
    this.dg.add(g);
    this.reserved.push({
      x0: this.ox + C.x - W / 2 - 10,
      x1: this.ox + C.x + W / 2 + 10,
      z0: this.oz + C.z - 10 - Dd / 2 - 10,
      z1: this.oz + sz - 10,
    });
    const P = (x: number, z: number) => ({ x: this.ox + C.x + x, z: this.oz + C.z + z });
    this.zones.push({
      id: `door:masjid:${l.id}`,
      label: `Enter ${l.name}`,
      ...P(0, -10 + Dd / 2 + 4),
      r: 4,
      scene: "out",
    });
    this.zones.push({
      id: "nabawi:salam",
      label: "Send salam to the Prophet ﷺ",
      ...P(W / 2 - 22, -10 + Dd / 2 + 5),
      r: 4,
      scene: "out",
    });
    const t = label(l.name, { size: 1.8, bg: "rgba(46,139,87,0.92)" });
    t.position.set(C.x, H + 14, C.z - 10 + Dd / 2);
    this.dg.add(t);
    // visitors in the courtyard
    for (let i = 0; i < 12; i++) {
      const x0 = -W / 2 + 12 + (i % 6) * 26,
        zz = C.z - 10 + Dd / 2 + 10 + (i % 2) * 22;
      const route: [number, number][] = [
        [C.x + x0, zz],
        [C.x + x0 + 20, zz + 8],
      ];
      const female = i % 3 === 1;
      const pg = female
        ? person(0x1d1d26, { hijab: 0x1d1d26, seed: 40 + i })
        : person([0xf7f7f2, 0xe8e2d4, 0xf4efe4][i % 3], { cap: 0xffffff, seed: 40 + i });
      pg.position.set(route[0][0], 0, route[0][1]);
      this.dg.add(pg);
      this.walkers.push({ g: pg, route, k: 1, wait: i * 0.5, t: 0, district: D.id, pilgrim: true });
    }
  }

  /* ---------------- Jumu'ah: worshippers fill the mosques on Friday ---------------- */
  private jumuahOn = false;
  private jumuahCrowds = new Map<string, THREE.Group>();
  /** Turn the Friday crowd on or off (rows of worshippers outside the mosques of your area). */
  setJumuah(on: boolean) {
    this.jumuahOn = on;
    if (!on) {
      for (const g of this.jumuahCrowds.values()) {
        g.traverse((c) => forgetHuman(c));
        g.removeFromParent();
      }
      this.jumuahCrowds.clear();
      return;
    }
    const D = this.district;
    if (!D || this.jumuahCrowds.has(D.id) || D.holy) return;
    const g = new THREE.Group();
    const H = halfOf(D);
    const doors = this.zones.filter(
      (z) =>
        z.scene === "out" &&
        z.id.startsWith("door:masjid:") &&
        Math.abs(z.x - D.origin.x) < H.x &&
        Math.abs(z.z - D.origin.z) < H.z,
    );
    let n = 0;
    for (const z of doors)
      for (let row = 0; row < 2; row++)
        for (let i = -3; i <= 3; i++) {
          const x = z.x + i * 1.6,
            zz = z.z + 3.5 + row * 1.8;
          if (!this.freeOut(x, zz, 0.3)) continue;
          const female = row === 1 && i > 1;
          const p = female
            ? person(0x1d1d26, { hijab: [0x1d1d26, 0xe9e2d0][n % 2], seed: n })
            : person([0xf4efe4, 0xcdb38a, 0xe8e2d4, 0x2f4a7a][n % 4], { cap: 0xffffff, seed: n });
          p.position.set(x, 0, zz);
          p.rotation.y = Math.PI; // facing the mosque
          sitPerson(p);
          g.add(p);
          n++;
        }
    this.scene.add(g);
    this.jumuahCrowds.set(D.id, g);
  }

  /* ---------------- walking a set path (tawaf, sa'i) ---------------- */
  private pathWalk: {
    pts: { x: number; z: number }[];
    k: number;
    speed: number;
    onPoint?: (i: number) => void;
    onDone?: () => void;
    t: number;
  } | null = null;
  walkPath(
    pts: { x: number; z: number }[],
    speed: number,
    onPoint?: (i: number) => void,
    onDone?: () => void,
  ) {
    if (this.where !== "out" || !pts.length) return false;
    if (this.driving) this.exitCar();
    this.tapTarget = null;
    this.marker.visible = false;
    this.pathWalk = { pts, k: 0, speed, onPoint, onDone, t: 0 };
    return true;
  }
  stopPath() {
    this.pathWalk = null;
    animatePerson(this.player, 0, 0);
  }
  isWalkingPath() {
    return !!this.pathWalk;
  }
  private stepPath(dt: number) {
    const w = this.pathWalk!;
    const p = this.player.position;
    let left = w.speed * dt;
    while (left > 0 && w.k < w.pts.length) {
      const q = w.pts[w.k];
      const dx = q.x - p.x,
        dz = q.z - p.z,
        d = Math.hypot(dx, dz);
      if (d > 0.01) this.player.rotation.y = Math.atan2(dx, dz);
      if (d <= left) {
        p.x = q.x;
        p.z = q.z;
        left -= d;
        const i = w.k++;
        w.onPoint?.(i);
      } else {
        p.x += (dx / d) * left;
        p.z += (dz / d) * left;
        left = 0;
      }
    }
    w.t += dt;
    animatePerson(this.player, w.t * 7, 1, w.speed);
    if (w.k >= w.pts.length) {
      const done = w.onDone;
      this.pathWalk = null;
      animatePerson(this.player, 0, 0);
      done?.();
    }
  }
  /** Seven rounds round the Kaaba, starting at the Black Stone, the Kaaba on your left. */
  /** Seven rounds round the Kaaba, anticlockwise from the Black Stone. `onMark` tells you
      where you are in each round (24 steps a round): 0 Black Stone, 2 the Multazam by the
      door, 9 Hijr Ismail, 18 the Yemeni corner, 19 the last stretch back to the Black Stone. */
  startTawaf(
    onRound: (n: number) => void,
    onDone: () => void,
    onMark?: (k: number, round: number) => void,
  ) {
    const K = this.holy.kaaba;
    if (!K) return false;
    const r = 9.5,
      per = 24;
    const pts: { x: number; z: number }[] = [];
    for (let i = 0; i <= 7 * per; i++) {
      const a = -Math.PI / 4 + (i / per) * Math.PI * 2;
      pts.push({ x: K.x + Math.cos(a) * r, z: K.z - Math.sin(a) * r });
    }
    onMark?.(0, 1);
    return this.walkPath(
      pts,
      6,
      (i) => {
        if (i > 0 && i % per === 0) onRound(i / per);
        if (i > 0 && i < 7 * per) onMark?.(i % per, Math.floor(i / per) + 1);
      },
      onDone,
    );
  }
  /** Seven walks between Safa and Marwah, starting at Safa, passing the green lights each way.
      Events: "safa", "marwah" (arriving), "green" and "greenEnd" (the stretch where men hasten). */
  startSai(
    onLeg: (n: number) => void,
    onDone: () => void,
    onEvent?: (ev: "safa" | "marwah" | "green" | "greenEnd", leg: number) => void,
  ) {
    const { safa, marwah } = this.holy;
    if (!safa || !marwah) return false;
    const mid = (f: number) => ({
      x: safa.x + (marwah.x - safa.x) * f,
      z: safa.z + (marwah.z - safa.z) * f,
    });
    const g1 = mid(0.35),
      g2 = mid(0.65);
    const pts = [safa];
    const kinds: ("safa" | "marwah" | "green" | "greenEnd")[] = ["safa"];
    for (let i = 1; i <= 7; i++) {
      const toMarwah = i % 2 === 1;
      pts.push(toMarwah ? g1 : g2, toMarwah ? g2 : g1, toMarwah ? marwah : safa);
      kinds.push("green", "greenEnd", toMarwah ? "marwah" : "safa");
    }
    onEvent?.("safa", 0);
    return this.walkPath(
      pts,
      8,
      (i) => {
        if (i === 0) return;
        const leg = Math.ceil(i / 3);
        onEvent?.(kinds[i], leg);
        if (i % 3 === 0) onLeg(leg);
      },
      onDone,
    );
  }
  /** Walk in through the gate of Al-Masjid Al-Haram (or An-Nabawi): you stand in the
      courtyard, facing the Kaaba (or the mosque). True if this is one of them. */
  enterHolyCourt(lid: string) {
    const z = this.zones.find((q) => q.id === "door:masjid:" + lid);
    if (!z) return false;
    if (this.driving) this.exitCar();
    if (lid === "masjid-al-haram" && this.holy.kaaba) {
      const K = this.holy.kaaba;
      this.standAt(K.x - 6, K.z + 33, z);
      this.player.rotation.y = Math.atan2(
        K.x - this.player.position.x,
        K.z - this.player.position.z,
      );
      this.camYaw = Math.atan2(this.player.position.x - K.x, this.player.position.z - K.z);
    } else {
      this.standAt(z.x + 6, z.z + 18, z);
      this.player.rotation.y = Math.PI;
      this.camYaw = 0;
    }
    this.tapTarget = null;
    this.snapCamera();
    return true;
  }

  /** IlmMotors: a glass showroom with cars on display. */
  private buildDealer(D: District) {
    const W = 14,
      Dp = 9;
    const lot = this.findLot(D, W, Dp + 4);
    if (!lot) return;
    const { x, z, north, fz } = lot;
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = north ? 0 : Math.PI;
    g.add(box(W, 4.6, Dp, 0xe9edf0, 0, 0, -2));
    g.add(box(W + 0.4, 0.3, Dp + 0.4, 0x2b3a4a, 0, 4.6, -2));
    g.add(box(W - 1, 3.6, 0.1, 0x6d8fa8, 0, 0.3, Dp / 2 - 1.95));
    const sign = this.signBoard("IlmMotors · Car Dealership", 10, 1.1, "#2b3a4a", "#f2c230");
    sign.position.set(0, 4.2, Dp / 2 - 1.85);
    g.add(sign);
    // cars on the forecourt
    (
      [
        ["suv", 0xc0392b, -3.6],
        ["luxury", 0x1d1d26, 3.6],
      ] as [VehicleKind, number, number][]
    ).forEach(([k, col, cx]) => {
      const m = vehicleMesh(k, col);
      m.position.set(cx, 0, Dp / 2 + 0.4);
      m.rotation.y = Math.PI / 2 + 0.3;
      g.add(m);
    });
    this.dg.add(g);
    this.zones.push({
      id: "dealer:" + D.id,
      label: "IlmMotors · buy a car",
      x: x + this.ox,
      z: fz + this.oz,
      r: 2.6,
      scene: "out",
    });
  }
  /** IlmWorld Fashion: a clothes shop with a glass front and a pink awning. */
  private buildBoutique(D: District) {
    const W = 13,
      Dp = 9;
    const lot = this.findLot(D, W, Dp + 3);
    if (!lot) return;
    const { x, z, north, fz } = lot;
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = north ? 0 : Math.PI;
    // the shop itself, with a deep window bay at the front for the mannequins
    g.add(box(W, 5, 6, 0xfbe3ec, 0, 0, -2.5));
    g.add(box(W, 1.3, 3.1, 0xfbe3ec, 0, 3.7, 2)); // above the window
    for (const sx of [-1, 1]) g.add(box(1, 3.7, 3.1, 0xfbe3ec, sx * (W / 2 - 0.5), 0, 2));
    g.add(box(W + 0.4, 0.35, Dp + 0.4, 0xd66bd0, 0, 5, -1));
    {
      // the shop window: glass you can see the clothes through
      const glass = new THREE.Mesh(
        new THREE.BoxGeometry(W - 2, 3.4, 0.1),
        new THREE.MeshStandardMaterial({
          color: 0xbfe6ee,
          transparent: true,
          opacity: 0.3,
          roughness: 0.1,
          metalness: 0.3,
          depthWrite: false,
        }),
      );
      glass.position.set(0, 2, Dp / 2 - 0.95);
      g.add(glass);
      g.add(box(W - 2, 0.15, 3, 0xf2a6b4, 0, 0.3, Dp / 2 - 2.4)); // the display floor
    }
    g.add(box(2.2, 3, 0.14, 0xffffff, 0, 0, Dp / 2 - 0.9)); // door frame
    const aw = new THREE.Mesh(
      new THREE.BoxGeometry(W, 0.1, 1.8),
      new THREE.MeshStandardMaterial({ color: 0xd66bd0 }),
    );
    aw.position.set(0, 3.9, Dp / 2);
    aw.rotation.x = 0.25;
    g.add(aw);
    for (let sx = -W / 2 + 0.3; sx < W / 2; sx += 0.6) {
      const sc = new THREE.Mesh(
        new THREE.CircleGeometry(0.3, 10, Math.PI, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0xd66bd0, side: THREE.DoubleSide }),
      );
      sc.position.set(sx, 3.62, Dp / 2 + 0.9);
      g.add(sc);
    }
    // clothes on show in the window
    const m1 = person(0x0f2a5a, { cap: 0xc9a227, outfit: "agbada", seed: 3 });
    m1.position.set(-3, 0.45, Dp / 2 - 2.2);
    const m2 = person(0x3a1f4a, { hijab: 0xe6d3a0, outfit: "lace", seed: 4 });
    m2.position.set(3, 0.45, Dp / 2 - 2.2);
    g.add(m1, m2);
    const sign = this.signBoard("IlmWorld Fashion", 9, 1.2, "#d66bd0", "#ffffff");
    sign.position.set(0, 4.5, Dp / 2 - 0.88);
    g.add(sign);
    this.dg.add(g);
    this.zones.push({
      id: "door:boutique:" + D.id,
      label: "Enter IlmWorld Fashion · clothes",
      x: x + this.ox,
      z: fz + this.oz,
      r: 2.6,
      scene: "out",
    });
  }
  /** IlmWorld Mall: a big building; inside, shop units for real sellers. */
  private buildMall(D: District) {
    const W = 20,
      Dp = 11;
    const lot = this.findLot(D, W, Dp);
    if (!lot) return;
    const { x, z, north, fz } = lot;
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = north ? 0 : Math.PI;
    g.add(box(W, 7, Dp, 0xf3ede2, 0, 0, 0));
    g.add(box(W + 0.6, 0.4, Dp + 0.6, 0x7a3b2a, 0, 7, 0));
    g.add(box(W - 3, 4.4, 0.1, 0x5b7c94, 0, 0.4, Dp / 2 + 0.02));
    g.add(box(3, 3, 0.12, 0x2a1c05, 0, 0, Dp / 2 + 0.06));
    const sign = this.signBoard("IlmWorld Mall", 12, 1.5, "#7a3b2a", "#fdf8ec");
    sign.position.set(0, 5.8, Dp / 2 + 0.08);
    g.add(sign);
    this.dg.add(g);
    this.zones.push({
      id: "door:mall:" + D.id,
      label: "Enter IlmWorld Mall",
      x: x + this.ox,
      z: fz + this.oz,
      r: 2.4,
      scene: "out",
    });
    // the shops inside
    const o = this.interiorOrigin.mall;
    const ig = this.mallGroup;
    const unit = (i: number, cx: number, cz: number, ux: number, uz: number) => {
      // partition walls either side of the unit
      const px = -uz,
        pz = ux;
      for (const s of [-1, 1]) {
        const w = box(
          0.25,
          3.8,
          6.6,
          0xd8cfc0,
          cx + px * s * 2.55 - ux * 0.3,
          0,
          cz + pz * s * 2.55 - uz * 0.3,
        );
        w.rotation.y = Math.atan2(ux, uz);
        ig.add(w);
      }
      const counter = box(3.2, 1, 0.8, 0x8a5a3a, cx + ux * 1.6, 0, cz + uz * 1.6);
      counter.rotation.y = Math.atan2(ux, uz);
      ig.add(counter);
      this.addShopUnit(
        `${D.id}-mall${i}`,
        "shop",
        { x: cx, z: cz },
        { x: cx + ux * 4.9, z: cz + uz * 4.9 },
        D,
        "IlmWorld Mall",
        { parent: ig, scene: "mall", ox: o.x, oz: o.z },
      );
    };
    let i = 0;
    for (const cx of [-10.2, -5.1, 0, 5.1, 10.2]) unit(i++, cx, -14 + 3.6, 0, 1);
    for (const cz of [-2, 3.4]) {
      unit(i++, -17 + 3.6, cz, 1, 0);
      unit(i++, 17 - 3.6, cz, -1, 0);
    }
  }
  private mallGroup = new THREE.Group();

  /** A covered table tennis spot beside the street: one table, open to everyone. */
  private courts = new Map<string, Court>();
  private buildCourt(D: District) {
    const W = 12,
      Dp = 10;
    const lot = this.findLot(D, W, Dp);
    if (!lot) return;
    const { x, z, north, fz } = lot;
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    // a smooth concrete floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, Dp), mat(0xb9b3a6));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.04;
    floor.receiveShadow = true;
    g.add(floor);
    // the shade: four posts and a green roof
    for (const [px, pz] of [
      [-W / 2 + 0.3, -Dp / 2 + 0.3],
      [W / 2 - 0.3, -Dp / 2 + 0.3],
      [-W / 2 + 0.3, Dp / 2 - 0.3],
      [W / 2 - 0.3, Dp / 2 - 0.3],
    ])
      g.add(box(0.22, 4.2, 0.22, 0xe9e2d0, px, 0, pz));
    g.add(box(W + 0.6, 0.18, Dp + 0.6, 0x1f6f63, 0, 4.2, 0));
    // the table: 2.74 m by 1.525 m, 76 cm high
    const len = 2.74,
      wid = 1.525,
      th = 0.76;
    const top = box(len, 0.05, wid, 0x1f4f9a, 0, th - 0.05, 0);
    top.castShadow = true;
    g.add(top);
    const line = (w: number, d: number, lx: number, lz: number) =>
      g.add(box(w, 0.006, d, 0xffffff, lx, th, lz));
    line(len, 0.02, 0, wid / 2 - 0.01);
    line(len, 0.02, 0, -wid / 2 + 0.01);
    line(0.02, wid, len / 2 - 0.01, 0);
    line(0.02, wid, -len / 2 + 0.01, 0);
    line(len, 0.006, 0, 0);
    for (const [lx, lz] of [
      [-len / 2 + 0.2, -wid / 2 + 0.15],
      [len / 2 - 0.2, -wid / 2 + 0.15],
      [-len / 2 + 0.2, wid / 2 - 0.15],
      [len / 2 - 0.2, wid / 2 - 0.15],
    ])
      g.add(box(0.06, th - 0.05, 0.06, 0x2a2f36, lx, 0, lz));
    const net = new THREE.Mesh(
      new THREE.PlaneGeometry(wid + 0.3, 0.1525),
      new THREE.MeshBasicMaterial({
        color: 0x1d1d26,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      }),
    );
    net.rotation.y = Math.PI / 2;
    net.position.set(0, th + 0.076, 0);
    g.add(net, box(0.02, 0.012, wid + 0.3, 0xffffff, 0, th + 0.15, 0));
    for (const pz of [-wid / 2 - 0.15, wid / 2 + 0.15])
      g.add(box(0.03, 0.17, 0.03, 0x2a2f36, 0, th - 0.02, pz));
    // benches to wait for your turn
    for (const bx of [-W / 2 + 1.6, W / 2 - 1.6]) {
      const bz = north ? -Dp / 2 + 1 : Dp / 2 - 1;
      g.add(box(2.2, 0.08, 0.45, 0x8a5a3a, bx, 0.45, bz));
      g.add(
        box(0.08, 0.45, 0.4, 0x5a3a24, bx - 1, 0, bz),
        box(0.08, 0.45, 0.4, 0x5a3a24, bx + 1, 0, bz),
      );
    }
    const sign = this.signBoard("Table Tennis · all welcome", 6, 0.8, "#1f4f9a", "#ffffff");
    sign.position.set(0, 3.5, north ? Dp / 2 + 0.32 : -Dp / 2 - 0.32);
    if (!north) sign.rotation.y = Math.PI;
    g.add(sign);
    this.dg.add(g);
    const id = "tennis:" + D.id;
    this.courts.set(id, { x: x + this.ox, z: z + this.oz, turn: 0, len, wid });
    this.zones.push({
      id,
      label: "Play table tennis",
      x: x + this.ox,
      z: fz + this.oz,
      r: 3,
      scene: "out",
    });
  }

  /** Is there a place with this id (or prefix) anywhere in the city? */
  hasZone(prefix: string) {
    return this.zones.some((z) => z.id.startsWith(prefix));
  }

  /* ---------------- a gold arrow showing the way ---------------- */
  private guide: { zone: Zone; arrow: THREE.Object3D } | null = null;
  /** Point the way to the nearest place with this id (in the scene you are in). */
  guideTo(prefix: string) {
    this.showPlotPhase(prefix);
    this.clearGuide();
    const p = this.player.position;
    const zone = this.zones
      .filter((z) => z.scene === this.where && !z.off && z.id.startsWith(prefix))
      .sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z))[0];
    if (!zone) return false;
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.9);
    shape.lineTo(0.55, 0.25);
    shape.lineTo(0.2, 0.25);
    shape.lineTo(0.2, -0.6);
    shape.lineTo(-0.2, -0.6);
    shape.lineTo(-0.2, 0.25);
    shape.lineTo(-0.55, 0.25);
    shape.closePath();
    const m = new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      new THREE.MeshBasicMaterial({
        color: 0xf2c230,
        transparent: true,
        opacity: 0.92,
        side: THREE.DoubleSide,
        depthTest: false,
      }),
    );
    m.rotation.x = -Math.PI / 2;
    m.renderOrder = 20;
    m.scale.setScalar(1.4);
    const arrow = new THREE.Group();
    arrow.add(m);
    // a small marker over the place you're going to
    const pin = new THREE.Mesh(
      new THREE.ConeGeometry(0.28, 0.6, 4),
      new THREE.MeshBasicMaterial({ color: 0xf2c230 }),
    );
    pin.rotation.x = Math.PI;
    pin.position.set(zone.x, 2.6, zone.z);
    pin.userData.pin = true;
    this.scene.add(arrow, pin);
    arrow.userData.pin = pin;
    this.guide = { zone, arrow };
    return true;
  }
  clearGuide() {
    if (!this.guide) return;
    (this.guide.arrow.userData.pin as THREE.Object3D).removeFromParent();
    this.guide.arrow.removeFromParent();
    this.guide = null;
  }
  private stepGuide(t: number) {
    const g = this.guide;
    if (!g) return;
    const p = this.player.position;
    const dx = g.zone.x - p.x,
      dz = g.zone.z - p.z,
      d = Math.hypot(dx, dz);
    if (g.zone.scene !== this.where || d < g.zone.r * 0.8) {
      this.clearGuide();
      return;
    }
    const ux = dx / d,
      uz = dz / d;
    const lead = 1.3 + Math.sin(t * 5) * 0.15;
    g.arrow.position.set(p.x + ux * lead, 0.08, p.z + uz * lead);
    // the arrow's tip points along +y of its shape: turn it towards the place
    g.arrow.rotation.y = Math.atan2(-ux, -uz);
    const pin = g.arrow.userData.pin as THREE.Object3D;
    pin.position.y = 2.6 + Math.sin(t * 4) * 0.15;
    pin.rotation.y = t * 2;
  }

  /* ---------------- playable jobs ---------------- */
  /* Some jobs are done with your own hands in the city: carry loads between market stalls,
     sweep the masjid yard, or deliver parcels to houses. A gold ring shows where to go
     next; walking into it does the task. */
  private job: {
    kind: WorkKind;
    steps: JobStep[];
    i: number;
    ring: THREE.Group;
    piles: Map<number, THREE.Object3D>;
    sweepT: number;
    onStep: (done: number, total: number, next: string | null) => void;
  } | null = null;
  private carrying: { mesh: THREE.Object3D; how: Carry } | null = null;
  private freeAt(x: number, z: number, r: number) {
    for (const b of this.colliders.out)
      if (x - r < b.x1 && x + r > b.x0 && z - r < b.z1 && z + r > b.z0) return false;
    return true;
  }
  /** A clear straight walk between two points. */
  private clearLine(x0: number, z0: number, x1: number, z1: number) {
    const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.8);
    for (let k = 1; k <= n; k++) {
      const f = k / n;
      if (!this.freeAt(x0 + (x1 - x0) * f, z0 + (z1 - z0) * f, 0.35)) return false;
    }
    return true;
  }
  private carryMesh(kind: "load" | "parcel" | "broom") {
    const g = new THREE.Group();
    if (kind === "load") {
      // a woven basket of yams and peppers, carried on the head
      const basket = cyl(0.42, 0.3, 0.26, 0xb98a4e, 12);
      basket.position.y = 0.13;
      g.add(basket);
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        const yam = new THREE.Mesh(
          new THREE.SphereGeometry(0.13, 8, 6),
          mat(k % 2 ? 0x7a4e2a : 0xc8102e),
        );
        yam.scale.set(1.4, 0.8, 0.8);
        yam.position.set(Math.cos(a) * 0.2, 0.3, Math.sin(a) * 0.2);
        g.add(yam);
      }
    } else if (kind === "parcel") {
      g.add(box(0.5, 0.36, 0.38, 0xc49a6c, 0, -0.18, 0.12));
      g.add(box(0.51, 0.05, 0.1, 0x2f8f3a, 0, 0, 0.12)); // tape
    } else {
      const stick = cyl(0.025, 0.025, 1.3, 0x8a5a3a, 6);
      stick.position.y = -0.55;
      g.add(stick);
      // a Nigerian broom: a bundle of palm sticks
      const bristle = cyl(0.04, 0.16, 0.45, 0xd8c37a, 8);
      bristle.position.y = -1.3;
      g.add(bristle);
    }
    return g;
  }
  private setCarry(kind: "load" | "parcel" | "broom" | null) {
    if (this.carrying) {
      rigCarry(this.player, null);
      this.carrying.mesh.removeFromParent();
      this.carrying = null;
    }
    if (!kind) return;
    const mesh = this.carryMesh(kind);
    const how: Carry = kind === "load" ? "head" : kind === "parcel" ? "hands" : "broom";
    this.carrying = { mesh, how };
    if (!rigCarry(this.player, mesh, how)) {
      // no animated body: hold it in a fixed place
      mesh.position.set(
        how === "broom" ? 0.35 : 0,
        how === "head" ? 2.15 : 1.1,
        how === "hands" ? 0.35 : 0,
      );
      this.player.add(mesh);
    }
  }
  /** Start a shift you work with your hands. Returns false if there is nowhere to work here. */
  startJob(kind: WorkKind, onStep: (done: number, total: number, next: string | null) => void) {
    this.stopJob();
    if (this.where !== "out") return false;
    const p = this.player.position;
    const near = (prefix: string, max: number) =>
      this.zones
        .filter((z) => z.scene === "out" && !z.off && z.id.startsWith(prefix))
        .map((z) => ({ z, d: Math.hypot(z.x - p.x, z.z - p.z) }))
        .filter((o) => o.d < max)
        .sort((a, b) => a.d - b.d)
        .map((o) => o.z);
    const steps: JobStep[] = [];
    if (kind === "porter") {
      const st = near("stall:", 90);
      if (st.length < 2) return false;
      // three trips, each to a stall further along
      const order = [st[0], ...st.slice(1).sort(() => Math.random() - 0.5)];
      for (let k = 0; k < 3; k++) {
        // a fresh stall for every pick-up and drop, so each trip is a real walk
        const a = order[(k * 2) % order.length],
          b = order[(k * 2 + 1) % order.length];
        steps.push({
          x: a.x,
          z: a.z,
          label: `Trip ${k + 1} of 3: pick up the load at the stall`,
          act: "pick",
        });
        steps.push({
          x: b.x,
          z: b.z,
          label: `Trip ${k + 1} of 3: carry it on your head to the next stall`,
          act: "drop",
        });
      }
    } else if (kind === "caretaker") {
      const door = near("door:masjid:", 60)[0];
      if (!door) return false;
      for (let tries = 0; tries < 300 && steps.length < 6; tries++) {
        const a = Math.random() * Math.PI * 2,
          r = 3 + Math.random() * 7;
        const x = door.x + Math.cos(a) * r,
          z = door.z + Math.sin(a) * r;
        if (!this.freeAt(x, z, 0.7) || !this.clearLine(door.x, door.z, x, z)) continue;
        // in the yard and on the pavement, never out on the road
        const D = this.district;
        if (D.streets.some((st) => Math.abs(z - D.origin.z - st.z) < 7)) continue;
        if (Math.abs(x - D.origin.x) < 7) continue;
        if (steps.some((s) => Math.hypot(s.x - x, s.z - z) < 2.2)) continue;
        steps.push({ x, z, label: "Sweep up the leaves", act: "sweep" });
      }
      if (steps.length < 3) return false;
      steps.push({
        x: door.x,
        z: door.z,
        label: "Put the broom back at the masjid door",
        act: "drop",
      });
    } else {
      const shop = [
        ...near("shop:", 150),
        ...near("door:boutique:", 150),
        ...near("door:mall:", 150),
        ...near("stall:", 150),
      ].sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z))[0];
      if (!shop) return false;
      const D = this.district;
      const homes = this.plots
        .filter((q) => q.district === D.id && q.kind === "house")
        .map((q) => ({
          x: D.origin.x + q.gate.x,
          // just outside the gate, on the street side
          z: D.origin.z + q.gate.z + Math.sign(q.streetZ - q.gate.z) * 1.6,
          street: q.street,
        }))
        .filter((h) => {
          const d = Math.hypot(h.x - shop.x, h.z - shop.z);
          return d > 15 && d < 110;
        })
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      if (homes.length < 2) return false;
      // visit them in a sensible order: always the nearest one next
      const route: typeof homes = [];
      let cx = shop.x,
        cz = shop.z;
      while (homes.length) {
        homes.sort((a, b) => Math.hypot(a.x - cx, a.z - cz) - Math.hypot(b.x - cx, b.z - cz));
        const h = homes.shift()!;
        route.push(h);
        cx = h.x;
        cz = h.z;
      }
      steps.push({
        x: shop.x,
        z: shop.z,
        label: `Collect ${route.length} parcels at the shop`,
        act: "pick",
      });
      route.forEach((h, k) =>
        steps.push({
          x: h.x,
          z: h.z,
          label: `Deliver parcel ${k + 1} of ${route.length} to the house on ${h.street}`,
          act: "drop",
        }),
      );
    }
    const ring = new THREE.Group();
    const disc = new THREE.Mesh(
      new THREE.RingGeometry(0.9, 1.2, 28),
      new THREE.MeshBasicMaterial({
        color: 0xf2c230,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = 0.06;
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 0.9, 3, 20, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xf2c230,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    beam.position.y = 1.5;
    ring.add(disc, beam);
    this.scene.add(ring);
    const piles = new Map<number, THREE.Object3D>();
    steps.forEach((s, k) => {
      if (s.act !== "sweep") return;
      const g = new THREE.Group();
      for (let n = 0; n < 9; n++) {
        const leaf = new THREE.Mesh(
          new THREE.CircleGeometry(0.12 + Math.random() * 0.08, 5),
          mat([0x9a6a2a, 0xc49a3a, 0x6d7a2a, 0x8a4a1a][n % 4]),
        );
        leaf.rotation.set(-Math.PI / 2, 0, Math.random() * 6);
        leaf.position.set(
          (Math.random() - 0.5) * 1.1,
          0.04 + n * 0.004,
          (Math.random() - 0.5) * 1.1,
        );
        g.add(leaf);
      }
      g.position.set(s.x, 0, s.z);
      this.scene.add(g);
      piles.set(k, g);
    });
    this.job = { kind, steps, i: 0, ring, piles, sweepT: 0, onStep };
    if (kind === "caretaker") this.setCarry("broom");
    this.placeRing();
    onStep(0, steps.length, steps[0].label);
    return true;
  }
  stopJob() {
    const j = this.job;
    if (!j) return;
    j.ring.removeFromParent();
    for (const g of j.piles.values()) g.removeFromParent();
    this.job = null;
    this.setCarry(null);
    this.clearGuide();
  }
  jobActive() {
    return !!this.job;
  }
  private placeRing() {
    const j = this.job!;
    const s = j.steps[j.i];
    j.ring.position.set(s.x, 0, s.z);
    this.pointAt(s.x, s.z);
  }
  /** The gold arrow, pointing at a spot rather than a place. */
  private pointAt(x: number, z: number) {
    const zone: Zone = { id: "job:spot", label: "", x, z, r: 1.4, scene: "out" };
    this.zones.push(zone);
    this.guideTo("job:spot");
    this.zones.splice(this.zones.indexOf(zone), 1);
  }
  private stepJob(dt: number, t: number) {
    const j = this.job;
    if (!j) return;
    if (this.where !== "out") return;
    const s = j.steps[j.i];
    const p = this.player.position;
    j.ring.rotation.y = t * 0.8;
    (j.ring.children[0] as THREE.Mesh).scale.setScalar(1 + Math.sin(t * 4) * 0.06);
    if (!this.guide) this.pointAt(s.x, s.z);
    if (Math.hypot(s.x - p.x, s.z - p.z) > 1.3) {
      j.sweepT = 0;
      return;
    }
    if (s.act === "sweep") {
      // stand on the pile and sweep for a moment
      if (j.sweepT === 0) rigSweep(this.player, 1.4);
      j.sweepT += dt;
      const pile = j.piles.get(j.i);
      if (pile) pile.scale.setScalar(Math.max(0.05, 1 - j.sweepT / 1.4));
      if (j.sweepT < 1.4) return;
      pile?.removeFromParent();
      j.piles.delete(j.i);
      j.sweepT = 0;
    } else if (s.act === "pick") {
      this.setCarry(j.kind === "porter" ? "load" : "parcel");
    } else {
      const more = j.i < j.steps.length - 1;
      // the broom stays in hand until the end; parcels until the last one is delivered
      if (!(j.kind === "rider" && more))
        this.setCarry(j.kind === "caretaker" && more ? "broom" : null);
    }
    j.i++;
    this.clearGuide();
    if (j.i >= j.steps.length) {
      const total = j.steps.length;
      const cb = j.onStep;
      this.stopJob();
      cb(total, total, null);
      return;
    }
    this.placeRing();
    j.onStep(j.i, j.steps.length, j.steps[j.i].label);
  }

  /* ---------------- food delivery ---------------- */
  private rider: {
    g: THREE.Group;
    man: THREE.Object3D;
    t: number;
    state: "coming" | "waiting" | "leaving";
    away: THREE.Vector3;
    near: boolean;
    onArrive: () => void;
    onNear: (near: boolean) => void;
    onCollect: () => void;
  } | null = null;
  /** A delivery bike with the food box on the back. */
  private deliveryBike() {
    const g = new THREE.Group();
    const wheel = (z: number) => {
      const w = cyl(0.32, 0.32, 0.12, 0x1d1d22, 14);
      w.rotation.z = Math.PI / 2;
      w.position.set(0, 0.32, z);
      return w;
    };
    g.add(wheel(0.62), wheel(-0.62));
    g.add(box(0.26, 0.28, 1.15, 0xc8102e, 0, 0.42, 0));
    g.add(box(0.36, 0.12, 0.6, 0x1d1d22, 0, 0.72, -0.12)); // seat
    const bar = box(0.7, 0.06, 0.06, 0x2a2a2a, 0, 1.05, 0.5);
    g.add(bar, box(0.06, 0.5, 0.06, 0x2a2a2a, 0, 0.58, 0.55));
    // the food box
    g.add(box(0.62, 0.55, 0.55, 0x2f8f3a, 0, 0.86, -0.62));
    g.add(box(0.64, 0.08, 0.57, 0xfdf8ec, 0, 1.24, -0.62));
    const tag = label("Ilm Food Delivery", { size: 0.36, bg: "rgba(47,143,58,0.95)" });
    tag.position.set(0, 1.55, -0.62);
    g.add(tag);
    const man = person(0x2f8f3a, { cap: 0x2f8f3a, trousers: 0x1d1d26, seed: 91 });
    man.position.set(0, 0.42, 0.05);
    man.scale.setScalar(0.92);
    g.add(man);
    return { g, man };
  }
  /**
   * A rider brings your order. They ride to you (or to your door if you are
   * indoors), call `onArrive`, then wait until you walk up to them (`onCollect`).
   */
  deliverFood(onArrive: () => void, onNear: (near: boolean) => void, onCollect: () => void) {
    if (this.rider) this.rider.g.removeFromParent();
    const { g, man } = this.deliveryBike();
    const t = this.where === "out" ? this.player.position : this.outPos;
    const a = Math.random() * Math.PI * 2;
    g.position.set(t.x + Math.cos(a) * 30, 0, t.z + Math.sin(a) * 30);
    this.scene.add(g);
    this.rider = {
      g,
      man,
      t: 0,
      state: "coming",
      away: g.position.clone(),
      near: false,
      onArrive,
      onNear,
      onCollect,
    };
  }
  /** Take the food from the rider (you must be standing by the bike). */
  collectFood() {
    const r = this.rider;
    if (!r || r.state !== "waiting" || !r.near) return false;
    r.state = "leaving";
    r.t = 0;
    r.onCollect();
    return true;
  }
  /** Where the rider is waiting, if they have arrived. */
  riderWaiting() {
    return this.rider?.state === "waiting";
  }
  private stepRider(dt: number) {
    const r = this.rider;
    if (!r) return;
    r.t += dt;
    const g = r.g;
    const goTo = (tx: number, tz: number, speed: number) => {
      const dx = tx - g.position.x,
        dz = tz - g.position.z,
        d = Math.hypot(dx, dz);
      if (d > 0.01) {
        const sp = Math.min(d, speed * dt);
        g.position.x += (dx / d) * sp;
        g.position.z += (dz / d) * sp;
        g.rotation.y = Math.atan2(dx, dz);
      }
      return d;
    };
    if (r.state === "coming") {
      const t = this.where === "out" ? this.player.position : this.outPos;
      const d = goTo(t.x, t.z, 9);
      if (d < 2.4 || r.t > 25) {
        if (d >= 2.4) g.position.set(t.x + 2, 0, t.z + 2);
        r.state = "waiting";
        r.onArrive();
      }
    } else if (r.state === "waiting") {
      const p = this.player.position;
      const near = this.where === "out" && Math.hypot(p.x - g.position.x, p.z - g.position.z) < 3.2;
      if (near !== r.near) {
        r.near = near;
        r.onNear(near);
      }
    } else {
      goTo(r.away.x, r.away.z, 9);
      if (r.t > 6) {
        g.removeFromParent();
        this.rider = null;
      }
    }
  }

  /** A block of flats near the market where new players live. */
  private buildEstate(D: District, XR: number, rnd: () => number) {
    const m = this.marketSpot.get(D.id);
    const streets = [...D.streets].sort(
      (a, b) => Math.abs(a.z - (m?.z ?? 0)) - Math.abs(b.z - (m?.z ?? 0)),
    );
    for (const st of streets)
      for (const north of [true, false]) {
        const xs: number[] = [];
        for (let x = -(XR - 14); x <= XR - 14; x += 6) if (Math.abs(x) > 16) xs.push(x);
        xs.sort((a, b) => Math.abs(a - (m?.x ?? 0)) - Math.abs(b - (m?.x ?? 0)));
        for (const cx of xs) {
          const cz = north ? st.z - 21.5 : st.z + 21.5;
          if (!this.boxFree(cx - 12, cx + 12, cz - 10.5, cz + 10.5)) continue;
          // Lekki and Ikeja: an apartment tower with as many flats as there are players (the
          // dry run keeps the area's random layout as it was); elsewhere a Lagos block of flats
          const prime = isPrimeArea(D.id);
          const c = compound(prime ? new Batch(true) : this.curBatch, {
            x: cx,
            z: cz,
            turn: north ? 0 : Math.PI,
            number: 1,
            rnd,
            floors: 3,
            width: 24,
            wall: 0xe8dcb5,
            style: prime ? houseStyleOf(D) : "storey",
          });
          if (prime) {
            this.buildTower(D, cx, cz, north);
            if (north) this.addCollider("out", cx - 10.5, cx + 10.5, cz - 8.5, cz + 7);
            else this.addCollider("out", cx - 10.5, cx + 10.5, cz - 7, cz + 8.5);
          } else for (const b of c.colliders) this.addCollider("out", b.x0, b.x1, b.z0, b.z1);
          this.reserved.push({
            x0: this.ox + cx - 12,
            x1: this.ox + cx + 12,
            z0: this.oz + cz - 10.5,
            z1: this.oz + cz + 10.5,
          });
          this.zones.push({
            id: "door:home:" + D.id,
            label: `${D.name} Estate`,
            x: this.ox + c.door.x,
            z: this.oz + c.door.z,
            r: 3,
            scene: "out",
          });
          const t = label(`${D.name} ${prime ? "Towers" : "Estate"} · flats for every player`, {
            size: 1.1,
            bg: "rgba(31,111,99,0.92)",
          });
          t.position.set(c.gate.x, prime ? 6 : 5, c.gate.z);
          this.dg.add(t);
          return;
        }
      }
  }
  /** An area's apartment tower: a podium with the entrance, then many floors of flats with
      balconies, a roof crown and the area's name. Every player who rents a flat in the area
      has their own flat in it. */
  private buildTower(D: District, cx: number, cz: number, north: boolean) {
    const g = new THREE.Group();
    g.position.set(cx, 0, cz);
    g.rotation.y = north ? 0 : Math.PI;
    const tier = D.tier ?? 2;
    const floors = tier === 1 ? 18 : tier === 2 ? 13 : 9;
    const FH = 3.2,
      W = 18,
      Dp = 14,
      bz = -1.5;
    const wall = tier === 1 ? 0xeef1f4 : D.city === "ilorin" ? 0xe7c49a : 0xe9dcc0;
    const trim = tier === 1 ? 0x2a4a7a : 0x1f6f63;
    const body = mat(wall, { roughness: 0.8 });
    const glass = MAT2.glass();
    const dark = mat(0x2a3a4a, { roughness: 0.3, metalness: 0.2 });
    // the podium: lobby glass and a canopy over the door
    g.add(box(W + 3, 4, Dp + 2, trim, 0, 0, bz));
    const lobby = new THREE.Mesh(new THREE.PlaneGeometry(W - 4, 3), glass);
    lobby.position.set(0, 1.7, bz + (Dp + 2) / 2 + 0.02);
    g.add(lobby);
    g.add(box(8, 0.3, 3.2, 0xf4f4f0, 0, 3.4, bz + (Dp + 2) / 2 + 1.5));
    // the tower
    const H = floors * FH;
    const tower = new THREE.Mesh(new THREE.BoxGeometry(W, H, Dp), body);
    tower.position.set(0, 4 + H / 2, bz);
    tower.castShadow = true;
    tower.receiveShadow = true;
    g.add(tower);
    // a window band on every floor, all four sides, and balconies on the front
    for (let f = 0; f < floors; f++) {
      const y = 4 + f * FH + 1.5;
      const front = new THREE.Mesh(new THREE.BoxGeometry(W + 0.06, 1.4, Dp + 0.06), dark);
      front.position.set(0, y, bz);
      g.add(front);
      const slab = new THREE.Mesh(new THREE.BoxGeometry(W + 0.2, 0.25, Dp + 0.2), body);
      slab.position.set(0, 4 + f * FH, bz);
      g.add(slab);
      if (f % 1 === 0)
        for (const bx of [-5.5, 0, 5.5]) {
          const bal = box(4, 0.2, 1.4, 0xf4f4f0, bx, 4 + f * FH + 0.05, bz + Dp / 2 + 0.7);
          g.add(bal);
          const rail = box(4, 0.9, 0.06, trim, bx, 4 + f * FH + 0.25, bz + Dp / 2 + 1.38, false);
          g.add(rail);
        }
    }
    // the crown on the roof
    g.add(box(W + 0.6, 0.6, Dp + 0.6, trim, 0, 4 + H, bz));
    g.add(box(W * 0.5, 3, Dp * 0.5, wall, 0, 4.6 + H, bz));
    const sign = this.signBoard(`${D.name} Towers`, 12, 1.6, "#1f6f63", "#ffffff");
    sign.position.set(0, 4.6 + H + 1.5, bz + Dp * 0.25 + 0.02);
    g.add(sign);
    this.dg.add(g);
  }
  /** Where the door of an area's estate (or Lekki's home) is. */
  homeDoor(area: string) {
    return (
      this.zones.find(
        (z) => z.id === "door:home:" + area || (area === "lekki" && z.id === "door:home:home"),
      ) ?? null
    );
  }
  /** Begin inside the family house; walking out puts you at its gate. */
  startAtPlot(id: string, name: string) {
    const p = this.plots.find((q) => q.id === IlmCityEngine.plotBase(id));
    if (p) this.setPhase(p.district, IlmCityEngine.plotPhase(id));
    const z = this.zones.find((zz) => zz.id === "plot:" + id);
    if (z) this.player.position.set(z.x, 0, z.z);
    if (p) this.district = districtById(p.district);
    this.enterInterior("home", name);
    this.setDuplex(!p?.type && (p?.floors ?? 1) >= 2);
    this.setGlassFlat(p?.type === "tower");
  }
  /** Begin the day inside your flat; walking out puts you at the estate gate. */
  startAtHome(area: string, name: string) {
    const d = this.homeDoor(area);
    if (d) {
      this.player.position.set(d.x, 0, d.z);
      this.district = districtById(area);
    }
    this.enterInterior("home", name);
  }

  /** Ikorodu Market: rows of stalls along Souq Road and two lanes behind it. */
  private buildMarket(D: District) {
    const H = halfOf(D);
    const b = this.curBatch;
    let k = 0;
    const lanes: [number, number][] = [
      [-14, 0],
      [14, Math.PI],
      [-38, 0],
      [38, Math.PI],
    ];
    for (const [z, turn] of lanes) {
      for (const [x0, x1] of [
        [-(H.x - 20), -10],
        [10, H.x - 20],
      ]) {
        const row = stallRow(b, { x0, x1, z, turn });
        for (const c of row.colliders) this.addCollider("out", c.x0, c.x1, c.z0, c.z1);
        for (const u of row.units)
          this.addShopUnit(`${D.id}-m${k++}`, "stall", u.center, u.front, D, "Souq Road");
      }
      // a paved walkway in front of the inner rows
      if (Math.abs(z) > 20) {
        const walk = new THREE.Mesh(groundGeo(H.x * 2 - 30, 7, 2), MAT.pavement());
        walk.position.set(0, 0.03, z + (turn === 0 ? 5.5 : -5.5));
        b.addObject(walk);
      }
    }
    this.reserved.push({
      x0: this.ox - H.x,
      x1: this.ox + H.x,
      z0: this.oz - 48,
      z1: this.oz + 48,
    });
  }

  private buildBusPark(x: number, z: number, saudi = false) {
    const S = this.dg;
    const pad = new THREE.Mesh(new THREE.PlaneGeometry(18, 9), mat(0x6a6e74));
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(x, 0.03, z + 1);
    pad.receiveShadow = true;
    S.add(pad);
    const shelter = new THREE.Group();
    shelter.position.set(x - 6, 0, z + 4);
    shelter.add(box(0.2, 2.8, 0.2, 0x5a5f66, -1.8, 0, 0), box(0.2, 2.8, 0.2, 0x5a5f66, 1.8, 0, 0));
    shelter.add(box(4.4, 0.2, 2, 0x1f6f63, 0, 2.8, -0.4));
    shelter.add(box(3.4, 0.5, 0.6, 0x8a5a3a, 0, 0, -0.6));
    S.add(shelter);
    // a yellow city bus
    const bus = new THREE.Group();
    bus.position.set(x + 3, 0, z);
    bus.add(box(8, 2.6, 2.6, saudi ? 0xf4f4f0 : 0xf2c230, 0, 0.5, 0));
    if (saudi) bus.add(box(8.04, 0.25, 2.66, 0x0e6b3a, 0, 1.15, 0, false));
    bus.add(box(7.4, 0.9, 2.64, 0x2a3a44, 0, 1.6, 0, false));
    bus.add(box(8.04, 0.3, 2.64, 0x1d1f22, 0, 0.6, 0, false));
    const wheel = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 12);
    [
      [-2.6, 1.2],
      [2.6, 1.2],
      [-2.6, -1.2],
      [2.6, -1.2],
    ].forEach(([wx, wz]) => {
      const w = new THREE.Mesh(wheel, mat(0x1d1f22));
      w.rotation.x = Math.PI / 2;
      w.position.set(wx, 0.5, wz);
      bus.add(w);
    });
    S.add(bus);
    this.addCollider("out", x + 3 - 4.2, x + 3 + 4.2, z - 1.5, z + 1.5);
    const t = label("Bus Park · travel", { size: 0.9, bg: "rgba(42,28,5,0.85)" });
    t.position.set(x - 6, 4.4, z + 4);
    S.add(t);
    this.zones.push({
      id: "bus",
      label: "Travel to another area",
      x: x - 6 + this.ox,
      z: z + 6 + this.oz,
      r: 3.6,
      scene: "out",
    });
  }

  /** Fast travel by bus or car: the trip plays on the Lagos map, then the vehicle drives in
      under the area's welcome gate and along the main street. */
  /** Arrive straight at a place (off a plane): outside, standing at its zone. */
  arriveAt(zoneId: string) {
    if (!this.zones.some((q) => q.id === zoneId))
      for (const id of [...this.placeholders.keys()]) this.buildLater(id);
    const z = this.zones.find((q) => q.id === zoneId);
    if (!z) return false;
    const D = this.areaAt(z.x, z.z);
    if (D) this.district = D;
    if (this.where !== "out") this.exitInterior();
    this.driving = false;
    this.player.visible = true;
    this.standAt(z.x, z.z + 3, z);
    this.tapTarget = null;
    this.snapCamera();
    return true;
  }
  /** Put the player down at (x, z), or at the nearest open spot if a wall or a building is
      there: first along the street, then all round. */
  private standAt(x: number, z: number, from?: { x: number; z: number }) {
    // a spot is good if you can stand there and, when we know where the road is, walk
    // straight to it from there (so you never land inside a walled yard)
    const reach = (px: number, pz: number) => {
      if (!from) return true;
      const n = Math.ceil(Math.hypot(px - from.x, pz - from.z) / 0.6);
      for (let k = 1; k < n; k++) {
        const f = k / n;
        if (!this.free(from.x + (px - from.x) * f, from.z + (pz - from.z) * f, 0.4)) return false;
      }
      return true;
    };
    const ok = (px: number, pz: number) => this.free(px, pz, 0.7) && reach(px, pz);
    let spot: [number, number] | null = ok(x, z) ? [x, z] : null;
    for (let d = 1; !spot && d <= 40; d++)
      for (const s of [-1, 1]) if (!spot && ok(x + s * d, z)) spot = [x + s * d, z];
    for (let r = 1; !spot && r <= 40; r++)
      for (let a = 0; !spot && a < 24; a++) {
        const px = x + Math.cos((a / 24) * Math.PI * 2) * r,
          pz = z + Math.sin((a / 24) * Math.PI * 2) * r;
        if (ok(px, pz)) spot = [px, pz];
      }
    if (!spot && from) spot = [from.x, from.z];
    const [px, pz] = spot ?? [x, z];
    this.player.position.set(px, 0, pz);
  }
  travel(id: string, byCar: boolean) {
    const D = districtById(id);
    this.ensureCity(cityOf(D));
    // your car stays at home: there's none in Makkah or Madinah
    this.car.visible = !D.holy && !this.impounded;
    this.where = "out";
    this.district = D;
    this.driving = false;
    this.player.visible = false;
    this.tapTarget = null;
    this.marker.visible = false;
    const side = D.origin.x > centerOf(D).x ? -1 : 1;
    const W = (x: number, z: number) => new THREE.Vector3(D.origin.x + x, 0, D.origin.z + z);
    let vehicle: THREE.Group;
    let path: THREE.Vector3[];
    const Hz = halfOf(D).z,
      Hx = halfOf(D).x;
    const dside = D.link === "east" ? -1 : side;
    // a south area is reached from the north: the same way in, mirrored
    const fromN = D.link === "south";
    if (byCar && fromN) {
      vehicle = this.car;
      path = [W(3, -(Hz + 40)), W(3, -20), W(-4, 9.8), W(-16, 9.8)];
    } else if (fromN) {
      vehicle = makeBus(!!D.holy);
      this.scene.add(vehicle);
      path = [W(3, -(Hz + 40)), W(3, -20), W(-6, 9.6), W(-52, 9.6)];
    } else if (byCar) {
      vehicle = this.car;
      path =
        D.parent && D.link !== "east"
          ? [W(3, Hz + 40), W(3, 20), W(-4, 9.8), W(-16, 9.8)]
          : [W(dside * (Hx + 38), -3), W(dside * 40, -3), W(-4, 9.8), W(-16, 9.8)];
    } else {
      vehicle = makeBus(!!D.holy);
      this.scene.add(vehicle);
      path =
        D.parent && D.link !== "east"
          ? [W(3, Hz + 40), W(3, 20), W(-6, 9.6), W(-52, 9.6)]
          : [W(dside * (Hx + 38), 3), W(dside * 40, 3), W(-6, 9.6), W(-52, 9.6)];
    }
    vehicle.position.copy(path[0]);
    vehicle.rotation.y = fromN
      ? -Math.PI / 2
      : D.parent && D.link !== "east"
        ? Math.PI / 2
        : dside > 0
          ? Math.PI
          : 0;
    this.player.position.copy(path[0]);
    this.cine = { vehicle, path, k: 1, byCar, hold: 0.6 };
    this.ev.onCinematic?.(true);
    this.applyLight();
    this.snapCamera();
    this.place = "";
  }
  private cine: {
    vehicle: THREE.Group;
    path: THREE.Vector3[];
    k: number;
    byCar: boolean;
    hold: number;
  } | null = null;

  private stepCinematic(dt: number) {
    const c = this.cine!;
    if (c.hold > 0) {
      c.hold -= dt;
      return;
    }
    const target = c.path[c.k];
    const v = c.vehicle.position;
    const dx = target.x - v.x,
      dz = target.z - v.z,
      d = Math.hypot(dx, dz);
    const step = (c.k === c.path.length - 1 && d < 10 ? Math.max(5, d * 1.6) : 16) * dt;
    if (d <= step) {
      v.set(target.x, 0, target.z);
      c.k++;
      if (c.k >= c.path.length) return this.endCinematic();
    } else {
      v.x += (dx / d) * step;
      v.z += (dz / d) * step;
      const want = Math.atan2(-dz, dx);
      let dr = want - c.vehicle.rotation.y;
      while (dr > Math.PI) dr -= Math.PI * 2;
      while (dr < -Math.PI) dr += Math.PI * 2;
      c.vehicle.rotation.y += dr * Math.min(1, dt * 6);
    }
    this.player.position.set(v.x, 0, v.z);
  }

  private endCinematic() {
    const c = this.cine!;
    this.cine = null;
    const o = this.district.origin;
    if (c.byCar) {
      this.carHeading = Math.PI;
      this.car.rotation.y = Math.PI;
      this.standAt(o.x - 16, o.z + 13, this.car.position);
    } else {
      c.vehicle.removeFromParent();
      this.standAt(o.x - 54, o.z + 13.5, c.vehicle.position);
    }
    this.player.rotation.y = Math.PI;
    this.camYaw = 0;
    this.player.visible = true;
    this.ev.onCinematic?.(false);
  }

  private welcomeGate(D: District, side: number) {
    const H = halfOf(D);
    const north = !!D.parent && D.link !== "east";
    const fromN = D.link === "south";
    const gx = north ? 0 : side * (H.x - 18);
    const gz = north ? (fromN ? -(H.z - 14) : H.z - 14) : 0;
    const g = new THREE.Group();
    g.position.set(gx, 0, gz);
    g.rotation.y = north ? (fromN ? Math.PI : 0) : (side * Math.PI) / 2;
    for (const x of [-8.6, 8.6]) {
      g.add(box(1.4, 7.5, 1.4, 0xece6d6, x, 0, 0));
      const cap = new THREE.Mesh(new THREE.ConeGeometry(1, 1.6, 8), mat(PALETTE.dome));
      cap.position.set(x, 8.3, 0);
      cap.castShadow = true;
      g.add(cap);
      const c = crescent();
      c.scale.setScalar(0.6);
      c.position.set(x - 0.1, 9.6, 0);
      g.add(c);
      if (north) this.addCollider("out", x - 0.8, x + 0.8, gz - 0.8, gz + 0.8);
      else this.addCollider("out", gx - 0.8, gx + 0.8, -x * side - 0.8, -x * side + 0.8);
    }
    g.add(box(18.6, 2.6, 0.7, 0x1f6f63, 0, 5.4, 0));
    const { mesh } = canvasPlane(
      17.6,
      2.3,
      (c, W, H) => {
        c.fillStyle = "#1f6f63";
        c.fillRect(0, 0, W, H);
        c.strokeStyle = "#e6b84a";
        c.lineWidth = 8;
        c.strokeRect(10, 10, W - 20, H - 20);
        c.fillStyle = "#fdf8ec";
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.font = `800 ${Math.round(H * 0.42)}px "Work Sans", system-ui, sans-serif`;
        c.fillText(`Welcome to ${D.parent ? D.name : regionOf(D)}`, W / 2, H * 0.42);
        if (D.parent || D.region) {
          c.fillStyle = "#e6b84a";
          c.font = `600 ${Math.round(H * 0.2)}px "Work Sans", system-ui, sans-serif`;
          c.fillText(`${regionOf(D)} · ${D.busStop ?? D.name} Bus Stop`, W / 2, H * 0.78);
          return;
        }
        c.fillStyle = "#e6b84a";
        c.font = `600 ${Math.round(H * 0.2)}px "Work Sans", system-ui, sans-serif`;
        c.fillText(`${D.state} State · IlmWorld`, W / 2, H * 0.78);
      },
      1400,
    );
    mesh.position.set(0, 6.7, 0.37);
    g.add(mesh);
    // the back of the gate shows where the road goes as you leave
    const to = D.parent ? fullName(districtById(D.parent)) : JUNCTION_NAME[cityOf(D)];
    const back = canvasPlane(
      17.6,
      2.3,
      (c, W, H) => {
        c.fillStyle = "#1f6f63";
        c.fillRect(0, 0, W, H);
        c.strokeStyle = "#e6b84a";
        c.lineWidth = 8;
        c.strokeRect(10, 10, W - 20, H - 20);
        c.fillStyle = "#fdf8ec";
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.font = `800 ${Math.round(H * 0.4)}px "Work Sans", system-ui, sans-serif`;
        c.fillText(`To ${to}  →`, W / 2, H * 0.42);
        c.fillStyle = "#e6b84a";
        c.font = `600 ${Math.round(H * 0.2)}px "Work Sans", system-ui, sans-serif`;
        c.fillText(`Ma'a as-salamah · thank you for visiting ${D.name}`, W / 2, H * 0.78);
      },
      1400,
    );
    back.mesh.position.set(0, 6.7, -0.37);
    back.mesh.rotation.y = Math.PI;
    g.add(back.mesh);
    this.dg.add(g);
  }
  districtId() {
    return this.district.id;
  }
  /** Areas sit far apart now, so "here" means the car is within this area. */
  private carArea() {
    return this.areaAt(this.car.position.x, this.car.position.z)?.id ?? null;
  }
  /** Walk to this area's bus park and open the travel menu on arrival. Returns false if not possible. */
  /** Walk to the nearest place whose id starts with `prefix` (used by the guided start). */
  goToZone(prefix: string) {
    if (this.driving || this.riding || this.kekeTrip) return false;
    this.showPlotPhase(prefix);
    const p = this.player.position;
    const z = this.zones
      .filter((zz) => zz.scene === this.where && !zz.off && zz.id.startsWith(prefix))
      .sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z))[0];
    if (!z) return false;
    this.tapZone = z.id;
    this.tapTarget = new THREE.Vector3(z.x, 0, z.z);
    this.marker.position.set(z.x, 0.05, z.z);
    this.marker.visible = true;
    return true;
  }
  /** Begin in this area: you stand on the main street, your car parked beside you. */
  startIn(id: string) {
    const D = districtById(id);
    this.car.visible = !D.holy && !this.impounded;
    this.where = "out";
    this.district = D;
    this.standAt(D.origin.x - 9, D.origin.z + 17);
    this.player.rotation.y = Math.PI;
    if (!D.holy) {
      this.car.position.set(D.origin.x - 16, 0, D.origin.z + 9.8);
      this.carHeading = Math.PI;
      this.car.rotation.y = Math.PI;
    }
    this.camYaw = 0;
    this.snapCamera();
  }
  /** Dress your character: brother or sister, skin tone and clothes. */
  setPlayerLook(o: {
    female: boolean;
    skin: number;
    robe: number;
    accent: number;
    style?: "agbada" | "lace";
    /** two white sheets for Umrah (brothers) */
    ihram?: boolean;
  }) {
    const fresh =
      o.ihram && !o.female
        ? person(0xf8f8f4, { cap: null, skin: o.skin, seed: 1, outfit: "ihram", beard: true })
        : o.female
          ? person(o.robe, {
              hijab: o.accent,
              skin: o.skin,
              seed: 2,
              outfit: o.style === "lace" ? "lace" : "abaya",
            })
          : person(o.robe, {
              cap: o.accent,
              skin: o.skin,
              seed: 1,
              outfit: o.style === "agbada" ? "agbada" : "thobe",
              beard: true,
            });
    for (const c of [...this.player.children]) {
      this.player.remove(c);
      forgetHuman(c);
    }
    for (const c of [...fresh.children]) this.player.add(c);
    this.player.userData = { ...fresh.userData };
    this.bikeLift = 0;
    if (this.bikeKind) {
      // the old bicycle went with the old clothes: put the rider back on it
      const k = this.bikeKind;
      this.bikeKind = null;
      this.bikeObj = null;
      this.setBike(k, this.bikeColor);
    }
    if (this.carrying) {
      const { mesh, how } = this.carrying;
      mesh.removeFromParent();
      this.carrying = null;
      if (rigCarry(this.player, mesh, how)) this.carrying = { mesh, how };
    }
  }
  /** Is someone (you, a neighbour, another player) just in front of this walker? */
  private personAhead(x: number, z: number, ux: number, uz: number, self: THREE.Object3D) {
    const check = (px: number, pz: number) => {
      const dx = px - x,
        dz = pz - z;
      const fwd = dx * ux + dz * uz,
        lat = Math.abs(-dx * uz + dz * ux);
      return fwd > 0 && fwd < 1.6 && lat < 0.8;
    };
    if (
      this.where === "out" &&
      this.player.visible &&
      check(this.player.position.x, this.player.position.z)
    )
      return true;
    for (const o of this.walkers) {
      if (o.g === self || !o.g.parent?.visible) continue;
      if (check(o.g.position.x + o.g.parent.position.x, o.g.position.z + o.g.parent.position.z))
        return true;
    }
    for (const r of this.remotes.values()) if (check(r.g.position.x, r.g.position.z)) return true;
    return false;
  }
  /** True if a person stands where you are about to step. */
  private bumpsPerson(x: number, z: number) {
    const ox = this.player.position.x,
      oz = this.player.position.z;
    // blocked only when stepping closer to someone already very near
    const hits = (px: number, pz: number) => {
      const dn = (px - x) ** 2 + (pz - z) ** 2;
      return dn < 0.55 && dn < (px - ox) ** 2 + (pz - oz) ** 2;
    };
    for (const o of this.walkers) {
      if (!o.g.parent?.visible) continue;
      if (hits(o.g.position.x + o.g.parent.position.x, o.g.position.z + o.g.parent.position.z))
        return true;
    }
    for (const r of this.remotes.values()) if (hits(r.g.position.x, r.g.position.z)) return true;
    // cars, danfos, keke and lorries are solid: you walk (or ride) round them, never through
    if (this.where === "out") {
      const pad = this.bikeKind ? 0.75 : 0.4;
      // how far outside the vehicle's box a point is (below zero: inside it)
      const outside = (v: Vehicle, px: number, pz: number) => {
        const h = v.mesh.rotation.y,
          c = Math.cos(h),
          s = Math.sin(h);
        const dx = px - v.mesh.position.x,
          dz = pz - v.mesh.position.z;
        const lx = dx * c - dz * s,
          lz = dx * s + dz * c;
        return Math.max(
          Math.abs(lx) - (v.half + pad),
          Math.abs(lz) - (VEHICLE_INFO[v.kind].width / 2 + pad),
        );
      };
      for (const v of this.traffic.vehicles) {
        const dx = v.mesh.position.x - x,
          dz = v.mesh.position.z - z;
        if (dx * dx + dz * dz > (v.half + 3) ** 2) continue;
        const now = outside(v, x, z);
        // blocked when stepping into it, or deeper into it (so you can always step out)
        if (now < 0 && now < outside(v, ox, oz)) return true;
      }
    }
    return false;
  }

  /* ---------------- keke rides ---------------- */
  private kekeTrip: {
    mesh: THREE.Mesh;
    pts: THREE.Vector3[];
    k: number;
    hailed: Vehicle | null;
    dest: { x: number; z: number; id: string };
  } | null = null;
  /** The keke stopped beside you, if any. */
  private kekeBeside() {
    if (this.where !== "out" || this.driving || this.riding || this.cine || this.kekeTrip)
      return null;
    const p = this.player.position;
    for (const v of this.traffic.vehicles)
      if (v.kind === "keke" && Math.hypot(v.mesh.position.x - p.x, v.mesh.position.z - p.z) < 4.5)
        return v;
    return null;
  }
  isOnKeke() {
    return !!this.kekeTrip;
  }
  /** Ride a keke along the streets to a place in this area, then walk to its door. */
  kekeTo(prefix: string) {
    const hailed = this.kekeBeside();
    const D = this.areaAt(this.player.position.x, this.player.position.z);
    if (!D) return false;
    const p = this.player.position;
    const z = this.zones
      .filter((zz) => zz.scene === "out" && zz.id.startsWith(prefix))
      .sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z))[0];
    if (!z) return false;
    const XR = halfOf(D).x - 16;
    const ox = D.origin.x,
      oz = D.origin.z;
    const near = (lz: number) =>
      D.streets.reduce((a, b) => (Math.abs(b.z - lz) < Math.abs(a.z - lz) ? b : a)).z;
    const clampX = (x: number) => Math.max(-XR, Math.min(XR, x));
    const sP = near(p.z - oz),
      sT = near(z.z - oz);
    const L = (x: number, lz: number) => new THREE.Vector3(ox + x, 0, oz + lz);
    const px = clampX(p.x - ox),
      tx = clampX(z.x - ox);
    const pts = [L(px, sP + 2)];
    if (sP !== sT) pts.push(L(-2, sP + 2), L(-2, sT + 2));
    pts.push(L(tx, sT + 2));
    const mesh = vehicleMesh("keke", 0xf2c230, this.district.holy);
    mesh.position.copy(hailed ? hailed.mesh.position : pts[0]);
    this.scene.add(mesh);
    if (hailed) {
      hailed.mesh.visible = false;
      hailed.dwell = 999;
    }
    this.player.visible = false;
    this.tapTarget = null;
    this.marker.visible = false;
    this.kekeTrip = { mesh, pts, k: 0, hailed, dest: { x: z.x, z: z.z, id: z.id } };
    return true;
  }
  private stepKeke(dt: number) {
    const t = this.kekeTrip!;
    const target = t.pts[t.k];
    const m = t.mesh.position;
    const dx = target.x - m.x,
      dz = target.z - m.z,
      d = Math.hypot(dx, dz);
    const step = 11 * dt;
    if (d <= step) {
      m.set(target.x, 0, target.z);
      t.k++;
      if (t.k >= t.pts.length) {
        // drop off: put the keke back into traffic and walk you to the door
        t.mesh.removeFromParent();
        if (t.hailed) {
          t.hailed.mesh.visible = true;
          t.hailed.dwell = 2;
        }
        this.player.position.set(m.x, 0, m.z + 2.2);
        this.player.visible = true;
        this.kekeTrip = null;
        this.tapZone = t.dest.id;
        this.tapTarget = new THREE.Vector3(t.dest.x, 0, t.dest.z);
        this.marker.position.set(t.dest.x, 0.05, t.dest.z);
        this.marker.visible = true;
        this.ev.onAction("keke-done");
        return;
      }
    } else {
      m.x += (dx / d) * step;
      m.z += (dz / d) * step;
      const want = Math.atan2(-dz, dx);
      t.mesh.rotation.y = lerpAngle(t.mesh.rotation.y, want, Math.min(1, dt * 8));
    }
    this.player.position.set(m.x, 0, m.z);
  }

  /* ---------------- finding a way round walls ---------------- */
  private tapPath: THREE.Vector3[] = [];
  private lineFree(a: THREE.Vector3, b: THREE.Vector3) {
    const d = Math.hypot(b.x - a.x, b.z - a.z);
    const n = Math.ceil(d / 0.4);
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      if (!this.free(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t, 0.45)) return false;
    }
    return true;
  }
  /** A* on a 1-metre grid round the walls between you and where you tapped. */
  private planTap() {
    this.tapPath = [];
    const t = this.tapTarget;
    if (!t) return;
    const a = this.player.position.clone();
    if (this.lineFree(a, t)) {
      this.tapPath = [t.clone()];
      return;
    }
    const pad = 24,
      C = 1;
    const x0 = Math.floor(Math.min(a.x, t.x) - pad),
      z0 = Math.floor(Math.min(a.z, t.z) - pad);
    const W = Math.min(220, Math.ceil(Math.abs(a.x - t.x) + pad * 2)),
      H = Math.min(220, Math.ceil(Math.abs(a.z - t.z) + pad * 2));
    const boxes = this.colliders[this.where].filter(
      (b) => b.x1 > x0 - 1 && b.x0 < x0 + W + 1 && b.z1 > z0 - 1 && b.z0 < z0 + H + 1,
    );
    const r = 0.5;
    const blocked = new Uint8Array(W * H);
    for (let j = 0; j < H; j++)
      for (let i = 0; i < W; i++) {
        const x = x0 + i * C + 0.5,
          z = z0 + j * C + 0.5;
        for (const b of boxes)
          if (x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r) {
            blocked[j * W + i] = 1;
            break;
          }
      }
    const cell = (x: number, z: number) => [Math.floor(x - x0), Math.floor(z - z0)] as const;
    const [si, sj] = cell(a.x, a.z);
    let [ti, tj] = cell(t.x, t.z);
    const inside = (i: number, j: number) => i >= 0 && j >= 0 && i < W && j < H;
    if (!inside(si, sj) || !inside(ti, tj)) return;
    // if the target is inside something, use the nearest open spot
    if (blocked[tj * W + ti]) {
      let best = -1,
        bd = 1e9;
      for (let j = Math.max(0, tj - 5); j <= Math.min(H - 1, tj + 5); j++)
        for (let i = Math.max(0, ti - 5); i <= Math.min(W - 1, ti + 5); i++)
          if (!blocked[j * W + i]) {
            const d = (i - ti) ** 2 + (j - tj) ** 2;
            if (d < bd) {
              bd = d;
              best = j * W + i;
            }
          }
      if (best < 0) return;
      ti = best % W;
      tj = Math.floor(best / W);
    }
    blocked[sj * W + si] = 0;
    const g = new Float32Array(W * H).fill(Infinity);
    const from = new Int32Array(W * H).fill(-1);
    const open: number[] = [];
    const f = new Float32Array(W * H).fill(Infinity);
    const h = (i: number, j: number) => {
      const dx = Math.abs(i - ti),
        dz = Math.abs(j - tj);
      return Math.max(dx, dz) + 0.414 * Math.min(dx, dz);
    };
    const start = sj * W + si,
      goal = tj * W + ti;
    g[start] = 0;
    f[start] = h(si, sj);
    open.push(start);
    const closed = new Uint8Array(W * H);
    let found = false;
    let iter = 0;
    while (open.length && iter++ < 40000) {
      let bi = 0;
      for (let k = 1; k < open.length; k++) if (f[open[k]] < f[open[bi]]) bi = k;
      const c = open[bi];
      open[bi] = open[open.length - 1];
      open.pop();
      if (c === goal) {
        found = true;
        break;
      }
      if (closed[c]) continue;
      closed[c] = 1;
      const ci = c % W,
        cj = (c - ci) / W;
      for (let dj = -1; dj <= 1; dj++)
        for (let di = -1; di <= 1; di++) {
          if (!di && !dj) continue;
          const ni = ci + di,
            nj = cj + dj;
          if (!inside(ni, nj)) continue;
          const n = nj * W + ni;
          if (blocked[n] || closed[n]) continue;
          if (di && dj && (blocked[cj * W + ni] || blocked[nj * W + ci])) continue;
          const ng = g[c] + (di && dj ? 1.414 : 1);
          if (ng < g[n]) {
            g[n] = ng;
            f[n] = ng + h(ni, nj);
            from[n] = c;
            open.push(n);
          }
        }
    }
    if (!found) return;
    const pts: THREE.Vector3[] = [];
    for (let c = goal; c !== -1 && c !== start; c = from[c]) {
      const i = c % W,
        j = (c - i) / W;
      pts.unshift(new THREE.Vector3(x0 + i + 0.5, 0, z0 + j + 0.5));
    }
    pts[pts.length - 1] = blocked[Math.floor(t.z - z0) * W + Math.floor(t.x - x0)]
      ? pts[pts.length - 1]
      : t.clone();
    // keep only the corners you need
    const out: THREE.Vector3[] = [];
    let cur = a;
    let k = 0;
    while (k < pts.length) {
      let far = k;
      for (let m = pts.length - 1; m > k; m--)
        if (this.lineFree(cur, pts[m])) {
          far = m;
          break;
        }
      out.push(pts[far]);
      cur = pts[far];
      k = far + 1;
    }
    this.tapPath = out;
  }

  /* ---------------- other real players ---------------- */
  private remotes = new Map<
    string,
    {
      g: THREE.Group;
      name: string;
      look: string;
      tx: number;
      tz: number;
      th: number;
      moving: boolean;
    }
  >();
  /** Show the real players near you; they glide to where they last were seen. */
  setRemotePlayers(
    list: {
      uid: string;
      name: string;
      look: {
        female: boolean;
        skin: number;
        robe: number;
        accent: number;
        style?: "agbada" | "lace";
      };
      x: number;
      z: number;
      h: number;
      moving: boolean;
      badge?: string;
    }[],
  ) {
    const seen = new Set<string>();
    for (const p of list) {
      seen.add(p.uid);
      const key = JSON.stringify(p.look) + (p.badge ?? "");
      let r = this.remotes.get(p.uid);
      if (r && r.look !== key) {
        r.g.removeFromParent();
        r.g.traverse((c) => forgetHuman(c));
        this.remotes.delete(p.uid);
        r = undefined;
      }
      if (!r) {
        const g = p.look.female
          ? person(p.look.robe, {
              hijab: p.look.accent,
              skin: p.look.skin,
              seed: 2,
              outfit: p.look.style === "lace" ? "lace" : "abaya",
            })
          : person(p.look.robe, {
              cap: p.look.accent,
              skin: p.look.skin,
              seed: 1,
              outfit: p.look.style === "agbada" ? "agbada" : "thobe",
              beard: true,
            });
        // a gold tag for the blessed, a green heart for generous givers
        const blessed = p.badge?.includes("✨"),
          generous = p.badge?.includes("💚");
        const tag = label(
          `${generous ? "💚 " : "● "}${p.name}${blessed ? " ✨" : ""}${p.badge?.includes("🕋") ? " 🕋" : ""}${["👑", "💎", "💰"].find((i) => p.badge?.includes(i)) ? " " + ["👑", "💎", "💰"].find((i) => p.badge?.includes(i)) : ""}`,
          {
            size: 0.75,
            bg: blessed
              ? "rgba(201,162,39,0.98)"
              : generous
                ? "rgba(29,107,58,0.95)"
                : "rgba(230,184,74,0.95)",
            fg: generous && !blessed ? "#ffffff" : undefined,
          },
        );
        tag.position.y = 2.65;
        g.add(tag);
        g.position.set(p.x, 0, p.z);
        this.scene.add(g);
        r = { g, name: p.name, look: key, tx: p.x, tz: p.z, th: p.h, moving: p.moving };
        this.remotes.set(p.uid, r);
      }
      r.tx = p.x;
      r.tz = p.z;
      r.th = p.h;
      r.moving = p.moving;
      r.name = p.name;
    }
    for (const [uid, r] of this.remotes)
      if (!seen.has(uid)) {
        r.g.removeFromParent();
        r.g.traverse((c) => forgetHuman(c));
        this.remotes.delete(uid);
      }
  }
  private stepRemotes(dt: number) {
    for (const [uid, r] of this.remotes) {
      const dx = r.tx - r.g.position.x,
        dz = r.tz - r.g.position.z,
        d = Math.hypot(dx, dz);
      if (d > 40) r.g.position.set(r.tx, 0, r.tz);
      else if (d > 0.05) {
        const step = Math.min(d, Math.max(2.5, d * 2) * dt);
        r.g.position.x += (dx / d) * step;
        r.g.position.z += (dz / d) * step;
      }
      r.g.rotation.y = lerpAngle(r.g.rotation.y, r.th, Math.min(1, dt * 8));
      animatePerson(r.g, 0, d > 0.15 || r.moving ? 1 : 0, Math.max(2, d * 2));
      r.g.visible = this.where === "out" && !this.hiddenRemotes.has(uid);
    }
  }
  /** Where you are and which way you face, for other players. */
  presence() {
    const p = this.player.position;
    return {
      x: +p.x.toFixed(2),
      z: +p.z.toFixed(2),
      h: +this.player.rotation.y.toFixed(2),
      moving: this.walkT !== this.lastWalkT,
      out: this.where === "out" && !this.driving && !this.riding && !this.cine,
    };
  }
  /** Note the walking clock after reporting presence, so "moving" means moved since last time. */
  presenceSent() {
    this.lastWalkT = this.walkT;
  }
  remoteName(uid: string) {
    return this.remotes.get(uid)?.name ?? null;
  }
  private lastWalkT = 0;

  /** A close front view of your character while you dress them. */
  private preview = false;
  setPreview(on: boolean) {
    this.preview = on;
    if (on) {
      // turn along the pavement so nothing stands between you and the camera
      this.player.rotation.y = Math.PI / 2;
      this.camYaw = Math.PI / 2;
    }
    this.snapCamera();
  }
  goToBusPark() {
    if (this.where !== "out" || this.driving) return false;
    const p = this.player.position;
    const z = this.zones
      .filter((zz) => zz.id === "bus")
      .sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z))[0];
    if (!z) return false;
    if (Math.hypot(z.x - this.player.position.x, z.z - this.player.position.z) < z.r) {
      this.ev.onAction("bus");
      return true;
    }
    this.tapZone = "bus";
    this.tapTarget = new THREE.Vector3(z.x, 0, z.z);
    this.marker.position.set(z.x, 0.05, z.z);
    this.marker.visible = true;
    return true;
  }
  carHere() {
    return !this.impounded && this.carArea() === this.district.id;
  }
  carAreaId() {
    return this.carArea();
  }
  carPos() {
    return { x: this.car.position.x, z: this.car.position.z, heading: this.carHeading };
  }

  private windowRow(
    group: THREE.Group,
    w: number,
    y: number,
    z: number,
    n: number,
    skipCenter = 0,
  ) {
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + (i + 0.5) * (w / n);
      if (skipCenter && Math.abs(x) < skipCenter) continue;
      const m = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.1), this.winMat);
      m.position.set(x, y, z);
      group.add(m);
    }
  }

  private door(x: number, z: number, id: string, text: string, labelY: number) {
    this.zones.push({ id, label: text, x: x + this.ox, z: z + this.oz, r: 3.2, scene: "out" });
    const t = label(text.replace(/^Enter /, ""), { size: 0.85 });
    t.position.set(x, labelY, z - 0.5);
    this.dg.add(t);
  }

  private buildMasjid(cx: number, cz: number, l: Landmark) {
    const g = new THREE.Group();
    g.position.set(cx, 0, cz);
    const W = 34,
      D = 22,
      H = 7;
    g.add(box(W, 0.6, D + 2, 0xd9d1bd, 0, 0, 0));
    g.add(box(W, H, D, PALETTE.white, 0, 0.6, 0));
    g.add(box(W + 0.6, 0.6, D + 0.6, 0xd5cebd, 0, H + 0.6, 0));
    // arches along the front
    for (let i = 0; i < 7; i++) {
      const x = -W / 2 + 2.4 + i * ((W - 4.8) / 6);
      if (i === 3) continue;
      const arch = box(2.2, 3.6, 0.2, 0x2f8f83, x, 1.2, D / 2 + 0.05, false);
      g.add(arch);
      const top = new THREE.Mesh(
        new THREE.CircleGeometry(1.1, 14, 0, Math.PI),
        mat(0x2f8f83, { side: THREE.DoubleSide }),
      );
      top.position.set(x, 4.8, D / 2 + 0.16);
      g.add(top);
    }
    // grand door
    const dr = box(4, 5, 0.3, 0x2f8f83, 0, 0.6, D / 2 + 0.1);
    g.add(dr);
    const dtop = new THREE.Mesh(
      new THREE.CircleGeometry(2, 18, 0, Math.PI),
      mat(0x2f8f83, { side: THREE.DoubleSide }),
    );
    dtop.position.set(0, 5.6, D / 2 + 0.26);
    g.add(dtop);
    // dome on drum
    const drum = cyl(5, 5, 2, 0xece6d6, 16);
    drum.position.y = H + 2;
    g.add(drum);
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(5.2, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      mat(PALETTE.dome),
    );
    dome.position.y = H + 3;
    dome.castShadow = true;
    g.add(dome);
    const fin = crescent();
    fin.scale.setScalar(1.6);
    fin.position.set(-0.4, H + 9.4, 0);
    g.add(fin);
    const spike = cyl(0.08, 0.08, 1.2, PALETTE.gold);
    spike.position.y = H + 8.6;
    g.add(spike);
    // minarets
    [
      [-W / 2 - 1.5, D / 2 - 1],
      [W / 2 + 1.5, D / 2 - 1],
    ].forEach(([mx, mz]) => {
      const shaft = cyl(1, 1.2, 18, 0xe8e3d6, 8);
      shaft.position.set(mx, 9, mz);
      g.add(shaft);
      const bal = cyl(1.6, 1.6, 0.5, 0xd5cebd, 8);
      bal.position.set(mx, 14, mz);
      g.add(bal);
      const top = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.6, 8), mat(PALETTE.dome));
      top.position.set(mx, 19.3, mz);
      top.castShadow = true;
      g.add(top);
      const c = crescent();
      c.scale.setScalar(0.9);
      c.position.set(mx - 0.2, 21.6, mz);
      g.add(c);
      this.addCollider("out", cx + mx - 1.3, cx + mx + 1.3, cz + mz - 1.3, cz + mz + 1.3);
    });
    this.windowRow(g, W, 5.6, D / 2 + 0.06, 0);
    this.dg.add(g);
    this.addCollider("out", cx - W / 2, cx + W / 2, cz - D / 2 - 1, cz + D / 2);
    this.door(cx, cz + D / 2 + 2.5, `door:masjid:${l.id}`, `Enter ${l.name}`, 8.4);
    const plaza = new THREE.Mesh(new THREE.PlaneGeometry(W + 6, 7), mat(PALETTE.plaza));
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(cx, 0.03, cz + D / 2 + 3.6);
    plaza.receiveShadow = true;
    this.dg.add(plaza);
  }

  private buildSchool(cx: number, cz: number, l: Landmark) {
    const g = new THREE.Group();
    g.position.set(cx, 0, cz);
    const W = 22,
      D = 16,
      H = 6;
    g.add(box(W, H, D, 0xe7d6ab, 0, 0, 0));
    g.add(box(W + 1, 1, D + 1, 0x3c6e91, 0, H, 0));
    g.add(box(3, 3.4, 0.3, 0x5a3b22, 0, 0, D / 2 + 0.1));
    for (const y of [1.6, 4]) this.windowRow(g, W, y, D / 2 + 0.06, 6, 2.5);
    // open book on the roof
    const b1 = box(2.4, 0.12, 3, 0xf4ead2, -1.2, H + 1.2, 0);
    b1.rotation.z = 0.25;
    g.add(b1);
    const b2 = box(2.4, 0.12, 3, 0xf4ead2, 1.2, H + 1.2, 0);
    b2.rotation.z = -0.25;
    g.add(b2);
    this.dg.add(g);
    this.addCollider("out", cx - W / 2, cx + W / 2, cz - D / 2, cz + D / 2);
    this.door(cx, cz + D / 2 + 2.5, `door:madrasah:${l.id}`, `Enter ${l.name}`, 8.8);
  }

  private buildSouq(cx: number, cz: number, l: Landmark) {
    const g = new THREE.Group();
    g.position.set(cx, 0, cz);
    const W = 28,
      D = 14;
    g.add(box(W, 0.4, D, 0xc9a46f, 0, 0, 0));
    g.add(box(W, 5, 0.6, 0xa8834f, 0, 0, -D / 2));
    const colors = [
      [0xe0705f, 0xf4e3c1],
      [0x45b8a8, 0xf4e3c1],
      [0xf2b84b, 0x7a5230],
      [0x5a6fb0, 0xf4e3c1],
      [0x3f8f6a, 0xf4e3c1],
    ];
    const goods = [0xd8432f, 0xe86a34, 0x4d9a3c, 0xe0c25a, 0x8a4b2b, 0xf0d9a4];
    for (let i = 0; i < 5; i++) {
      const x = -W / 2 + 3 + i * ((W - 6) / 4);
      for (let s = 0; s < 4; s++) g.add(box(1, 0.25, 4, colors[i][s % 2], x - 1.5 + s, 3.4, 0.5));
      g.add(box(0.2, 3.4, 0.2, 0x6d4a2b, x - 2, 0, 2.4));
      g.add(box(0.2, 3.4, 0.2, 0x6d4a2b, x + 2, 0, 2.4));
      g.add(box(3.6, 1, 1.4, 0x8c6440, x, 0, 1.6));
      for (let k = 0; k < 5; k++) {
        const f = new THREE.Mesh(
          new THREE.SphereGeometry(0.22, 6, 4),
          mat(goods[(i + k) % goods.length]),
        );
        f.position.set(x - 1.4 + k * 0.7, 1.2, 1.6);
        g.add(f);
      }
    }
    this.dg.add(g);
    this.addCollider("out", cx - W / 2, cx + W / 2, cz - D / 2, cz + 2.4);
    const t = label(l.name, { size: 1.05 });
    t.position.set(cx, 6.2, cz);
    this.dg.add(t);
    this.zones.push({
      id: "souq",
      label: `Shop at ${l.name}`,
      x: cx + this.ox,
      z: cz + D / 2 + 1.5 + this.oz,
      r: 6,
      scene: "out",
    });
  }

  private buildHouse(cx: number, cz: number, wall: number, roof: number, doorNorth: boolean) {
    const g = new THREE.Group();
    g.position.set(cx, 0, cz);
    const W = 12,
      D = 10,
      H = 4.5;
    g.add(box(W, H, D, wall, 0, 0, 0));
    const r = new THREE.Mesh(new THREE.ConeGeometry(W * 0.78, 3, 4), mat(roof));
    r.rotation.y = Math.PI / 4;
    r.scale.z = D / W;
    r.position.y = H + 1.5;
    r.castShadow = true;
    g.add(r);
    const fz = doorNorth ? -D / 2 - 0.1 : D / 2 + 0.1;
    g.add(box(1.6, 2.6, 0.2, 0x5a3b22, 0, 0, fz));
    const wins = new THREE.Group();
    this.windowRow(wins, W, 2.6, 0, 3, 2);
    wins.position.z = fz;
    g.add(wins);
    this.dg.add(g);
    this.addCollider("out", cx - W / 2, cx + W / 2, cz - D / 2, cz + D / 2);
    return g;
  }

  private buildHome(cx: number, cz: number) {
    this.buildHouse(cx, cz, 0xe2b47c, 0x9c4a2e, false);
    this.door(cx, cz + 7.5, "door:home:home", "Enter Your Home", 7.4);
    const mat2 = new THREE.Mesh(new THREE.PlaneGeometry(3, 2), mat(0x1f6f63));
    mat2.rotation.x = -Math.PI / 2;
    mat2.position.set(cx, 0.03, cz + 6.2);
    this.dg.add(mat2);
  }

  private streetSign(x: number, z: number, streetId: string, rot: number) {
    const st = STREETS[streetId];
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rot;
    const pole = cyl(0.07, 0.07, 2.9, 0x5a5f66, 6);
    pole.position.y = 1.45;
    g.add(pole);
    const { mesh } = canvasPlane(
      3.6,
      0.9,
      (c, W, H) => {
        c.fillStyle = "#1f6f63";
        c.fillRect(0, 0, W, H);
        c.strokeStyle = "#f4efe4";
        c.lineWidth = 6;
        c.strokeRect(6, 6, W - 12, H - 12);
        c.fillStyle = "#f4efe4";
        c.textAlign = "center";
        c.textBaseline = "middle";
        let size = 52;
        c.font = `700 ${size}px "Work Sans", system-ui, sans-serif`;
        while (c.measureText(st.name).width > W - 40 && size > 20) {
          size -= 2;
          c.font = `700 ${size}px "Work Sans", system-ui, sans-serif`;
        }
        c.fillText(st.name, W / 2, H / 2 + 2);
      },
      768,
    );
    mesh.position.y = 3.3;
    mesh.userData.tap = "street:" + streetId;
    g.add(mesh);
    this.tappables.push(mesh);
    this.dg.add(g);
  }

  private emptyBoard = new Map<string, THREE.Material>();
  private boards = new Map<string, { b: Billboard; base?: Billboard["ad"]; paint: () => void }>();
  /** Show players' approved adverts on their billboards (the rest keep their usual design). */
  setAds(ads: Record<string, NonNullable<Billboard["ad"]>>) {
    for (const [id, x] of this.boards) {
      const want = ads[id] ?? x.base;
      if (want === x.b.ad) continue;
      x.b.ad = want;
      x.paint();
    }
  }
  private billboard(b: Billboard, bx: number, bz: number, rot = 0) {
    const g = new THREE.Group();
    g.position.set(bx, 0, bz);
    g.rotation.y = rot;
    // two faces in a V, each turned towards one direction of traffic
    const A = 0.36,
      PW = 8.4;
    const faces = [-1, 1].map((sgn) => {
      const f = new THREE.Group();
      f.position.set(sgn * Math.cos(A) * (PW / 2 + 0.1), 0, -1.6 + Math.sin(A) * (PW / 2 + 0.1));
      f.rotation.y = -sgn * A;
      f.add(box(0.3, 4, 0.3, 0x5a5f66, 0, 0, -0.3));
      f.add(box(PW + 0.5, 3.9, 0.35, 0x2e3338, 0, 3.8, -0.5));
      g.add(f);
      return f;
    });
    const draw = (c: CanvasRenderingContext2D, W: number, H: number) => {
      const ad = b.ad;
      if (!ad) {
        c.fillStyle = "#f2b84b";
        c.fillRect(0, 0, W, H);
        c.fillStyle = "#2a1c05";
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.font = `800 ${Math.round(H * 0.2)}px "Work Sans", system-ui, sans-serif`;
        const town = cityOf(districtById(b.district.replace(/^road:/, "")));
        c.fillText(town === "ilorin" ? "ADVERTISE IN ILORIN" : "YOUR ADVERT HERE", W / 2, H * 0.36);
        c.font = `500 ${Math.round(H * 0.085)}px "Work Sans", system-ui, sans-serif`;
        c.fillText("To post your advert, contact", W / 2, H * 0.62);
        c.font = `700 ${Math.round(H * 0.11)}px "Work Sans", system-ui, sans-serif`;
        c.fillText(AD_EMAIL, W / 2, H * 0.78);
        return;
      }
      c.fillStyle = ad.bg;
      c.fillRect(0, 0, W, H);
      c.fillStyle = ad.fg;
      c.textAlign = "left";
      c.textBaseline = "middle";
      c.font = `600 ${Math.round(H * 0.09)}px "Work Sans", system-ui, sans-serif`;
      c.globalAlpha = 0.8;
      c.fillText(ad.brand.toUpperCase(), W * 0.06, H * 0.2);
      c.globalAlpha = 1;
      let size = Math.round(H * 0.19);
      c.font = `800 ${size}px "Work Sans", system-ui, sans-serif`;
      while (c.measureText(ad.headline).width > W * 0.88 && size > 20) {
        size -= 2;
        c.font = `800 ${size}px "Work Sans", system-ui, sans-serif`;
      }
      c.fillText(ad.headline, W * 0.06, H * 0.48);
      c.font = `500 ${Math.round(H * 0.085)}px "Work Sans", system-ui, sans-serif`;
      c.fillText(ad.line, W * 0.06, H * 0.76);
    };
    // boards without an advert all share one picture per town (a picture each would
    // fill a phone's graphics memory); a board with an advert gets its own
    const town = cityOf(districtById(b.district.replace(/^road:/, "")));
    const key = town === "ilorin" ? "ilorin" : "other";
    let shared = this.emptyBoard.get(key);
    if (!shared) {
      const keep = b.ad;
      b.ad = undefined;
      shared = canvasPlane(PW, PW * 0.4, draw, 640).mesh.material as THREE.Material;
      b.ad = keep;
      this.emptyBoard.set(key, shared);
    }
    const emptyMat = shared;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(PW, PW * 0.4), emptyMat);
    mesh.position.set(0, 3.8 + 1.95, -0.3);
    mesh.userData.tap = "billboard:" + b.id;
    faces[0].add(mesh);
    const twin = new THREE.Mesh(mesh.geometry, mesh.material);
    twin.position.copy(mesh.position);
    twin.userData.tap = mesh.userData.tap;
    faces[1].add(twin);
    this.tappables.push(twin);
    // the same advert on the back of both panels, so it shows from either side of the road
    const backs = faces.map((f) => {
      const m = new THREE.Mesh(mesh.geometry, mesh.material);
      m.position.set(mesh.position.x, mesh.position.y, -0.7);
      m.rotation.y = Math.PI;
      m.userData.tap = mesh.userData.tap;
      f.add(m);
      this.tappables.push(m);
      return m;
    });
    const all = [mesh, twin, ...backs];
    const setMat = (m: THREE.Material) => all.forEach((x) => (x.material = m));
    let own: THREE.MeshBasicMaterial | null = null;
    const paint = () => {
      if (!b.ad) {
        own?.map?.dispose();
        own?.dispose();
        own = null;
        setMat(emptyMat);
        return;
      }
      if (!own) {
        own = canvasPlane(PW, PW * 0.4, draw, 640).mesh.material as THREE.MeshBasicMaterial;
        setMat(own);
      }
      const tex = own.map as THREE.CanvasTexture;
      const canvas = tex.image as HTMLCanvasElement;
      const c = canvas.getContext("2d")!;
      draw(c, canvas.width, canvas.height);
      tex.needsUpdate = true;
      if (b.ad.imageUrl) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          c.drawImage(img, 0, 0, canvas.width, canvas.height);
          tex.needsUpdate = true;
        };
        img.src = b.ad.imageUrl;
      }
    };
    if (b.ad) paint();
    this.boards.set(b.id, { b, base: b.ad, paint });
    this.tappables.push(mesh);
    this.dg.add(g);
    // the V's footprint, turned with the board
    const cx = bx - Math.sin(rot) * 0.1,
      cz = bz - Math.cos(rot) * 0.1;
    const ex = Math.abs(Math.cos(rot)) * 7.9 + Math.abs(Math.sin(rot)) * 1.7,
      ez = Math.abs(Math.sin(rot)) * 7.9 + Math.abs(Math.cos(rot)) * 1.7;
    this.addCollider("out", cx - ex, cx + ex, cz - ez, cz + ez);
  }

  private carBody = new THREE.Group();
  private carMax = 34;
  /** Your car: a model and colour from the dealership. */
  setCar(kind: VehicleKind, color: number) {
    this.carBody.clear();
    const m = vehicleMesh(kind, color);
    m.castShadow = true;
    this.carBody.add(m);
    this.carMax = VEHICLE_INFO[kind].top + 4;
  }
  private buildCar() {
    this.car.add(this.carBody);
    const g = this.carBody;
    g.add(box(4.2, 1, 2, 0x1f6f63, 0, 0.45, 0));
    g.add(box(2.4, 0.9, 1.8, 0x1f6f63, -0.2, 1.45, 0));
    g.add(box(2.2, 0.7, 1.84, 0x9fd0e0, -0.2, 1.55, 0, false));
    const wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.4, 12);
    [
      [-1.3, 1],
      [1.3, 1],
      [-1.3, -1],
      [1.3, -1],
    ].forEach(([x, z]) => {
      const w = new THREE.Mesh(wheelGeo, mat(0x1d1f22));
      w.rotation.x = Math.PI / 2;
      w.position.set(x, 0.45, z);
      w.castShadow = true;
      g.add(w);
    });
    g.add(box(0.1, 0.3, 0.5, 0xfff3c4, 2.12, 0.8, 0.6, false));
    g.add(box(0.1, 0.3, 0.5, 0xfff3c4, 2.12, 0.8, -0.6, false));
    g.add(box(0.1, 0.25, 0.5, 0xd23b3b, -2.12, 0.8, 0.6, false));
    g.add(box(0.1, 0.25, 0.5, 0xd23b3b, -2.12, 0.8, -0.6, false));
    const tag = label("Your car", { size: 0.7, bg: "rgba(31,111,99,0.9)" });
    tag.position.y = 2.8;
    this.car.add(tag);
    this.car.position.set(-16, 0, 9.8);
    this.car.rotation.y = this.carHeading;
    this.scene.add(this.car);
  }

  /* ---------------- interiors ---------------- */
  private room(kind: InteriorKind, W: number, D: number, wall: number, floor: number, door = true) {
    const o = this.interiorOrigin[kind],
      g = new THREE.Group();
    g.position.copy(o);
    const f = new THREE.Mesh(new THREE.PlaneGeometry(W, D), mat(floor));
    f.rotation.x = -Math.PI / 2;
    f.receiveShadow = true;
    g.add(f);
    const dark = new THREE.Mesh(new THREE.PlaneGeometry(W + 80, D + 80), mat(0x1a1612));
    dark.rotation.x = -Math.PI / 2;
    dark.position.y = -0.02;
    g.add(dark);
    g.add(box(W, 5, 0.4, wall, 0, 0, -D / 2));
    g.add(box(0.4, 5, D, wall, -W / 2, 0, 0));
    g.add(box(0.4, 5, D, wall, W / 2, 0, 0));
    if (door) {
      g.add(box(W / 2 - 1.5, 0.8, 0.4, wall, -W / 4 - 0.75, 0, D / 2));
      g.add(box(W / 2 - 1.5, 0.8, 0.4, wall, W / 4 + 0.75, 0, D / 2));
    } else g.add(box(W, 0.8, 0.4, wall, 0, 0, D / 2));
    const light = new THREE.PointLight(0xffe2b0, 40, 30, 1.6);
    light.position.set(0, 4.5, 0);
    g.add(light);
    g.userData.indoors = true;
    this.scene.add(g);
    this.addCollider(kind, o.x - W / 2 - 5, o.x - W / 2 + 0.6, o.z - D / 2 - 5, o.z + D / 2 + 5);
    this.addCollider(kind, o.x + W / 2 - 0.6, o.x + W / 2 + 5, o.z - D / 2 - 5, o.z + D / 2 + 5);
    this.addCollider(kind, o.x - W / 2 - 5, o.x + W / 2 + 5, o.z - D / 2 - 5, o.z - D / 2 + 0.6);
    if (door) {
      this.addCollider(kind, o.x - W / 2 - 5, o.x - 1.4, o.z + D / 2 - 0.4, o.z + D / 2 + 5);
      this.addCollider(kind, o.x + 1.4, o.x + W / 2 + 5, o.z + D / 2 - 0.4, o.z + D / 2 + 5);
      this.addCollider(kind, o.x - 2, o.x + 2, o.z + D / 2 + 0.8, o.z + D / 2 + 5);
      this.zones.push({
        id: "exit",
        label: "Go outside",
        x: o.x,
        z: o.z + D / 2 - 0.6,
        r: 1.8,
        scene: kind,
      });
    } else
      this.addCollider(kind, o.x - W / 2 - 5, o.x + W / 2 + 5, o.z + D / 2 - 0.4, o.z + D / 2 + 5);
    return { g, o };
  }
  private homeItems = new Map<string, { obj: THREE.Object3D; boxes: Box[]; zone?: Zone }>();
  private homeWall: THREE.MeshStandardMaterial | null = null;
  private homeFloor: THREE.MeshStandardMaterial | null = null;
  private stairs: THREE.Object3D | null = null;
  private stairsZone: Zone | null = null;
  /** Paint your home: wall and floor colours. */
  setHomePaint(wall: number, floor: number) {
    this.homeWall?.color.setHex(wall);
    this.homeFloor?.color.setHex(floor);
  }
  private homeBackWall: THREE.Object3D | null = null;
  private glassView: THREE.Group | null = null;
  /** A flat high up in a glass tower: the back wall is floor-to-ceiling glass over the city. */
  setGlassFlat(on: boolean) {
    if (this.homeBackWall) this.homeBackWall.visible = !on;
    if (this.glassView) this.glassView.visible = on;
  }
  /** The glass wall of a tower flat: panes, slim frames, a balcony rail, and the city and the
      lagoon far below, at dusk lights. */
  private buildGlassView(W: number, D: number) {
    const g = new THREE.Group();
    g.visible = false;
    const z = -D / 2;
    // the view through the glass: the city and the lagoon at dusk, lights coming on
    const cv = document.createElement("canvas");
    cv.width = 1024;
    cv.height = 256;
    const c = cv.getContext("2d")!;
    const sky = c.createLinearGradient(0, 0, 0, 256);
    sky.addColorStop(0, "#4f7fb8");
    sky.addColorStop(0.5, "#e9a982");
    sky.addColorStop(0.68, "#f7d9a8");
    c.fillStyle = sky;
    c.fillRect(0, 0, 1024, 256);
    c.fillStyle = "rgba(255,240,200,0.9)";
    c.beginPath();
    c.arc(780, 150, 18, 0, Math.PI * 2);
    c.fill();
    let seed = 7;
    const rr = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let layer = 0; layer < 2; layer++)
      for (let x = -10; x < 1024;) {
        const w = 26 + rr() * 50,
          h = (layer ? 50 : 30) + rr() * (layer ? 110 : 60);
        const base = 196;
        c.fillStyle = layer ? "#2c3f55" : "#7a8ca4";
        c.fillRect(x, base - h, w, h);
        if (layer)
          for (let wy = base - h + 6; wy < base - 4; wy += 8)
            for (let wx = x + 4; wx < x + w - 4; wx += 7)
              if (rr() < 0.3) {
                c.fillStyle = "rgba(255,214,140,0.9)";
                c.fillRect(wx, wy, 3, 4);
              }
        x += w + (layer ? 8 : 3) + rr() * 18;
      }
    const sea = c.createLinearGradient(0, 196, 0, 256);
    sea.addColorStop(0, "#3d6f8f");
    sea.addColorStop(1, "#1f3f57");
    c.fillStyle = sea;
    c.fillRect(0, 196, 1024, 60);
    c.fillStyle = "rgba(255,220,170,0.4)";
    for (let k = 0; k < 40; k++) c.fillRect(rr() * 1024, 200 + rr() * 52, 16 + rr() * 40, 2);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    const view = new THREE.Mesh(
      new THREE.PlaneGeometry(W - 0.4, 4.6),
      new THREE.MeshBasicMaterial({ map: t, fog: false }),
    );
    view.position.set(0, 2.45, z - 0.05);
    g.add(view);
    // slim dark frames, a sill and a head
    for (let x = -W / 2; x <= W / 2 + 0.01; x += W / 5) g.add(box(0.14, 5, 0.2, 0x2b2f33, x, 0, z));
    g.add(box(W, 0.18, 0.3, 0x2b2f33, 0, 0, z), box(W, 0.3, 0.3, 0x2b2f33, 0, 4.7, z));
    // a glass rail across the lower part, as on a balcony
    const rail = new THREE.Mesh(
      new THREE.PlaneGeometry(W, 0.9),
      new THREE.MeshStandardMaterial({ color: 0xcfe8f2, transparent: true, opacity: 0.35 }),
    );
    rail.position.set(0, 0.6, z + 0.12);
    g.add(rail);
    g.add(box(W, 0.06, 0.08, 0xc9cfd4, 0, 1.05, z + 0.12));
    return g;
  }
  /** A duplex has stairs to the family rooms upstairs. */
  setDuplex(on: boolean) {
    if (this.stairs) this.stairs.visible = on;
    if (this.stairsZone) this.stairsZone.off = !on;
  }
  /** Climb the stairs (your way out of the house stays the same). */
  changeFloor(up: boolean) {
    const kind: InteriorKind = up ? "upstairs" : "home";
    const o = this.interiorOrigin[kind];
    this.where = kind;
    this.player.position.set(o.x + 7.2, 0, o.z + (up ? 4.6 : 4.4));
    this.player.rotation.y = up ? Math.PI : 0;
    this.tapTarget = null;
    this.marker.visible = false;
    this.applyLight();
    this.snapCamera();
  }
  private homeBase: Box[] | null = null;
  /** Show the furniture you own; everything else stays out of the flat. */
  setHomeItems(owned: string[]) {
    if (!this.homeBase) this.homeBase = [...this.colliders.home];
    const boxes = [...this.homeBase];
    for (const [id, it] of this.homeItems) {
      const has = owned.includes(id);
      it.obj.visible = has;
      if (it.zone) it.zone.off = !has;
      if (has) boxes.push(...it.boxes);
    }
    this.colliders.home = boxes;
  }
  private solid(kind: InteriorKind, g: THREE.Group, m: THREE.Object3D, w: number, d: number) {
    g.add(m);
    const o = this.interiorOrigin[kind];
    this.addCollider(
      kind,
      o.x + m.position.x - w / 2,
      o.x + m.position.x + w / 2,
      o.z + m.position.z - d / 2,
      o.z + m.position.z + d / 2,
    );
  }

  private buildInteriors() {
    // Upstairs in a duplex: the family's rooms
    {
      const { g, o } = this.room("upstairs", 20, 14, 0xefe4d0, 0x9a6b45, false);
      const B = (w: number, h: number, d: number, c: number, x: number, y: number, z: number) =>
        box(w, h, d, c, x, y, z);
      // master bed
      const bed = new THREE.Group();
      bed.add(B(3.8, 0.6, 4.4, 0x5a3a22, 0, 0, 0), B(3.6, 0.45, 4.2, 0xf4efe4, 0, 0.6, 0));
      bed.add(B(3.8, 1.6, 0.25, 0x5a3a22, 0, 0, -2.2), B(3.5, 0.15, 2.4, 0x7d2f3a, 0, 1.05, 0.7));
      bed.position.set(-6, 0, -3.8);
      this.solid("upstairs", g, bed, 4, 4.6);
      this.zones.push({
        id: "sleep",
        label: "Sleep / rest",
        x: o.x - 6,
        z: o.z - 0.8,
        r: 2,
        scene: "upstairs",
      });
      // children's room corner: two small beds
      for (const bx of [3.6, 6.6]) {
        const kb = new THREE.Group();
        kb.add(B(1.6, 0.5, 3, 0x2f6fa8, 0, 0, 0), B(1.5, 0.3, 2.9, 0xfdf8ec, 0, 0.5, 0));
        kb.position.set(bx, 0, -4.8);
        this.solid("upstairs", g, kb, 1.7, 3.1);
      }
      g.add(B(0.2, 3, 5, 0xe0d4c0, 1.8, 0, -4.4));
      this.addCollider("upstairs", o.x + 1.7, o.x + 1.9, o.z - 7, o.z - 1.9);
      // wardrobe and the family sitting area
      const wd = B(0.8, 3.2, 3, 0xb98d5e, -9.5, 0, 1.6);
      this.solid("upstairs", g, wd, 0.9, 3.1);
      const sofa = new THREE.Group();
      sofa.add(B(3.2, 0.55, 1.1, 0x2a4a6a, 0, 0, 0), B(3.2, 0.85, 0.3, 0x2a4a6a, 0, 0.55, 0.4));
      sofa.position.set(-2, 0, 3.6);
      this.solid("upstairs", g, sofa, 3.3, 1.2);
      const rug = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 3), mat(0xc9a35a));
      rug.rotation.x = -Math.PI / 2;
      rug.position.set(-2, 0.02, 1.4);
      g.add(rug);
      // the balcony: a glass door and a rail looking out
      g.add(B(3.4, 3, 0.1, 0x6d8fa8, 4.5, 0.2, 6.75));
      const sign = label("Balcony", { size: 0.5, bold: false });
      sign.position.set(4.5, 3.6, 6.4);
      g.add(sign);
      // stairs down
      for (let k = 0; k < 5; k++) g.add(B(2.2, 0.08, 0.45, 0x8a5a3a, 8.6, 0, 6.2 - k * 0.45));
      g.add(B(0.08, 1, 2.4, 0x3a2a1c, 7.5, 0.2, 5.3));
      this.zones.push({
        id: "stairs:down",
        label: "Go downstairs",
        x: o.x + 8.6,
        z: o.z + 5,
        r: 1.6,
        scene: "upstairs",
      });
      const tag = label("Upstairs · family rooms", { size: 0.6, bold: false });
      tag.position.set(0, 4.6, -6.6);
      g.add(tag);
    }
    // IlmWorld Mall: a wide hall; the shop units are added with the Ikeja area
    {
      const { g, o } = this.room("mall", 34, 28, 0xf6f1e8, 0xd9d4c8);
      this.mallGroup.position.copy(o);
      this.scene.add(this.mallGroup);
      const fountain = new THREE.Group();
      fountain.add(cyl(2.2, 2.4, 0.6, 0xcfd6dc, 20), cyl(0.4, 0.4, 1.6, 0xcfd6dc, 10));
      fountain.children[0].position.y = 0.3;
      fountain.children[1].position.y = 0.8;
      fountain.position.set(0, 0, -0.5);
      this.solid("mall", g, fountain, 4.6, 4.6);
      const sign = label("IlmWorld Mall · shops by real sellers", {
        size: 0.8,
        bg: "rgba(122,59,42,0.95)",
      });
      sign.position.set(0, 5.6, -13.6);
      g.add(sign);
      for (const [lx, lz] of [
        [-8, 8],
        [8, 8],
      ]) {
        const bench = box(3, 0.5, 0.8, 0x6d4a2b, lx, 0, lz);
        this.solid("mall", g, bench, 3, 0.8);
      }
    }
    // IlmWorld Fashion: bright walls, a pink floor, racks of clothes, mannequins and a mirror
    {
      const { g, o } = this.room("boutique", 20, 16, 0x4fc3d0, 0xf2a6b4);
      const Z = (id: string, label2: string, x: number, z: number) =>
        this.zones.push({ id, label: label2, x: o.x + x, z: o.z + z, r: 2, scene: "boutique" });
      const sign = label("IlmWorld Fashion · clothes for brothers and sisters", {
        size: 0.75,
        bg: "rgba(214,107,208,0.95)",
      });
      sign.position.set(0, 4.4, -7.6);
      g.add(sign);
      // a rack: a stand with a ring of hanging garments
      const rack = (
        x: number,
        z: number,
        colors: number[],
        long: boolean,
        title: string,
        id: string,
      ) => {
        const r = new THREE.Group();
        r.position.set(x, 0, z);
        r.add(cyl(1.3, 1.4, 0.25, 0x9aa8b8, 14));
        const pole = cyl(0.06, 0.06, 2.2, 0xf4f4f4, 8);
        pole.position.y = 1.2;
        r.add(pole);
        const bar = box(2.6, 0.06, 0.06, 0xf4f4f4, 0, 2.15, 0);
        r.add(bar);
        colors.forEach((c, i) => {
          const gx = -1.1 + (i * 2.2) / Math.max(1, colors.length - 1);
          const garment = box(0.5, long ? 1.6 : 0.8, 0.12, c, gx, long ? 0.5 : 1.25, 0);
          r.add(garment);
          if (!long) r.add(box(0.75, 0.25, 0.12, c, gx, 1.85, 0)); // shoulders
          const hook = cyl(0.015, 0.015, 0.12, 0xdddddd, 4);
          hook.position.set(gx, 2.12, 0);
          r.add(hook);
        });
        this.solid("boutique", g, r, 2.8, 1.2);
        const t = label(title, { size: 0.5, bg: "rgba(16,32,30,0.85)" });
        t.position.set(x, 2.9, z);
        g.add(t);
        Z(id, title + " · try and buy", x, z + 1.6);
      };
      rack(
        -6.5,
        -4,
        [0xf4efe4, 0xcdb38a, 0x2f6f8f, 0x3d5a4a, 0x5a3f6a],
        true,
        "Thobes",
        "rack:thobe",
      );
      rack(
        -6.5,
        1.5,
        [0x1d1d26, 0x5a3f6a, 0x7d2f3a, 0x2a4a6a, 0x3d5a4a],
        true,
        "Abayas",
        "rack:abaya",
      );
      rack(
        6.5,
        -4,
        [0xe9e2d0, 0x8a2f4f, 0x2a4a6a, 0xd8c8a8, 0xb36a8a],
        false,
        "Hijabs",
        "rack:hijab",
      );
      rack(6.5, 1.5, [0xffffff, 0x2f8f83, 0x1d1d26, 0x7d2f3a, 0xd9b45a], false, "Caps", "rack:cap");
      // mannequins in the premium clothes
      const m1 = person(0x0f2a5a, { cap: 0xc9a227, outfit: "agbada", seed: 3 });
      m1.position.set(-2.2, 0.35, -5.2);
      const m2 = person(0x3a1f4a, { hijab: 0xe6d3a0, outfit: "lace", seed: 4 });
      m2.position.set(2.2, 0.35, -5.2);
      for (const m of [m1, m2]) {
        const base = cyl(0.7, 0.8, 0.35, 0xf4f4f4, 16);
        base.position.set(m.position.x, 0, m.position.z);
        this.solid("boutique", g, base, 1.4, 1.4);
        g.add(m);
      }
      const prem = label("✨ Premium · agbada and lace", {
        size: 0.55,
        bg: "rgba(201,162,39,0.95)",
      });
      prem.position.set(0, 3.4, -5.2);
      g.add(prem);
      Z("rack:premium", "✨ Premium agbada and lace", 0, -3.6);
      // a tall mirror, a counter with a till, a sofa, plants and flowers
      const mirror = new THREE.Mesh(
        new THREE.PlaneGeometry(1.4, 2.6),
        new THREE.MeshStandardMaterial({ color: 0xdfe9ee, metalness: 0.9, roughness: 0.08 }),
      );
      mirror.position.set(9.75, 1.6, 5);
      mirror.rotation.y = -Math.PI / 2;
      g.add(mirror);
      g.add(box(0.12, 2.8, 1.6, 0xd9b45a, 9.85, 0.3, 5));
      Z("mirror", "🪞 Look in the mirror · change clothes", 8.4, 5);
      const counter = new THREE.Group();
      counter.add(box(3.4, 1.1, 1, 0xd66bd0, 0, 0, 0), box(3.6, 0.08, 1.2, 0xffffff, 0, 1.1, 0));
      counter.add(box(0.5, 0.4, 0.4, 0x2a2a30, 0.8, 1.15, 0));
      counter.position.set(-6.5, 0, 5.6);
      this.solid("boutique", g, counter, 3.6, 1.2);
      const seller = person(0xd66bd0, { hijab: 0xfdf8ec, seed: 9 });
      seller.position.set(-6.5, 0, 4.6);
      seller.rotation.y = Math.PI;
      g.add(seller);
      Z("rack:counter", "Pay at the counter", -6.5, 7);
      const sofa = box(3.2, 0.7, 1, 0xe8445a, 1.5, 0, 6.2);
      this.solid("boutique", g, sofa, 3.2, 1);
      for (const [px, pz] of [
        [-9, -7],
        [9, -7],
        [-3.5, 3],
      ]) {
        const pot = cyl(0.35, 0.28, 0.6, 0xf4f4f4, 12);
        pot.position.set(px, 0.3, pz);
        g.add(pot);
        const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 1), mat(0x4f8f45));
        leaf.position.set(px, 1.1, pz);
        g.add(leaf);
      }
      const vase = cyl(0.3, 0.2, 0.6, 0xc9b6e8, 8);
      vase.position.set(0, 0.3, 0.5);
      g.add(vase);
      for (let i = 0; i < 4; i++) {
        const f = new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.18, 0),
          mat([0xd66bd0, 0xe8445a, 0xf2c230, 0xffffff][i]),
        );
        f.position.set(Math.cos(i * 1.6) * 0.18, 0.95, 0.5 + Math.sin(i * 1.6) * 0.18);
        g.add(f);
      }
    }
    // Restaurant: a counter at the back, tables and people eating
    {
      const { g, o } = this.room("restaurant", 20, 14, 0xf3e6cf, 0x9a6b45);
      const counter = new THREE.Group();
      counter.add(box(8, 1.1, 1.2, 0x7a3b2a, 0, 0, 0), box(8.2, 0.1, 1.4, 0xf2c230, 0, 1.1, 0));
      counter.add(box(1.2, 0.5, 0.8, 0xd9dde0, -2.5, 1.2, -0.1)); // warmer
      counter.position.set(0, 0, -4.6);
      this.solid("restaurant", g, counter, 8.2, 1.4);
      const cook = person(0xffffff, { cap: 0xffffff, trousers: 0x1d1d26, seed: 7 });
      cook.position.set(1, 0, -5.8);
      g.add(cook);
      const menu = label("Menu · jollof · broast · amala · shawarma · kabsa · suya", {
        size: 0.5,
        bg: "rgba(31,111,99,0.95)",
      });
      menu.position.set(0, 3.6, -6.7);
      g.add(menu);
      const sign = label("Al-Ma'idah Restaurant", { size: 0.7, bg: "rgba(122,59,42,0.95)" });
      sign.position.set(0, 4.5, -6.7);
      g.add(sign);
      // hand-wash sink by the wall
      const sink = new THREE.Group();
      sink.add(box(1.2, 0.9, 0.6, 0xf7f7f4, 0, 0, 0), box(0.1, 0.4, 0.1, 0xb8bcc2, 0, 0.9, -0.15));
      sink.position.set(-9.3, 0, 1.5);
      sink.rotation.y = Math.PI / 2;
      this.solid("restaurant", g, sink, 0.7, 1.3);
      const tables: [number, number][] = [
        [-5.5, -0.8],
        [0, -0.8],
        [5.5, -0.8],
        [-5.5, 3],
        [5.5, 3],
      ];
      tables.forEach(([x, z], i) => {
        const t = new THREE.Group();
        t.add(box(2, 0.85, 1.2, 0x6d4a2b, 0, 0, 0));
        t.add(
          box(0.5, 0.06, 0.5, 0xffffff, -0.45, 0.85, 0),
          box(0.5, 0.06, 0.5, 0xffffff, 0.45, 0.85, 0),
        );
        for (const cz of [-0.95, 0.95]) t.add(box(0.7, 0.5, 0.6, 0x1f6f63, 0, 0, cz));
        t.position.set(x, 0, z);
        this.solid("restaurant", g, t, 2.1, 2.6);
        // the free chair at each table: sit here to eat
        this.zones.push({
          id: `seat:${i}`,
          label: "Sit and eat",
          x: o.x + x,
          z: o.z + z + 1.75,
          r: 1.3,
          scene: "restaurant",
        });
        if (i % 2 === 0) {
          const p = person([0xf4efe4, 0x8fb8e8, 0xcdb38a][i % 3], { cap: 0xffffff, seed: 20 + i });
          sitPerson(p);
          p.position.set(x, 0.1, z - 0.95);
          g.add(p);
        }
      });
      this.zones.push({
        id: "eatery:counter",
        label: "Order at the counter",
        x: o.x,
        z: o.z - 3.3,
        r: 2.2,
        scene: "restaurant",
      });
    }
    // Masjid
    {
      const { g, o } = this.room("masjid", 26, 16, 0xf2efe6, 0x2f6f5f);
      for (let i = 0; i < 6; i++) {
        const s = new THREE.Mesh(new THREE.PlaneGeometry(24, 0.12), mat(0xe6b84a));
        s.rotation.x = -Math.PI / 2;
        s.position.set(0, 0.02, -5 + i * 2);
        g.add(s);
      }
      const mihrab = box(3, 4, 0.5, 0xd9cfb4, 0, 0, -7.6);
      g.add(mihrab);
      const niche = box(1.8, 3, 0.2, 0x2f8f83, 0, 0, -7.3, false);
      g.add(niche);
      const minbar = new THREE.Group();
      for (let s = 0; s < 4; s++) minbar.add(box(1.4, 0.5 * (s + 1), 0.8, 0x8a5a3a, 0, 0, s * 0.8));
      minbar.position.set(3.4, 0, -7);
      this.solid("masjid", g, minbar, 1.6, 3.4);
      [-11, 11].forEach((x) => {
        const sh = box(0.6, 2.4, 5, 0x6d4a2b, x, 0, -3);
        this.solid("masjid", g, sh, 0.8, 5.2);
        for (let k = 0; k < 6; k++)
          g.add(
            box(
              0.5,
              0.5,
              0.25,
              [0x1f6f63, 0x7d2f3a, 0x2f4a7a][k % 3],
              x,
              0.3 + Math.floor(k / 3) * 1,
              -5 + (k % 3) * 1.8,
            ),
          );
      });
      const callig = label("بِسْمِ ٱللَّٰهِ", { bg: "rgba(0,0,0,0)", fg: "#e6b84a", size: 1.6 });
      callig.position.set(0, 5.4, -7.2);
      g.add(callig);
      this.zones.push({
        id: "pray",
        label: "Join the prayer rows",
        x: o.x,
        z: o.z - 2,
        r: 3,
        scene: "masjid",
      });
      this.zones.push({
        id: "masjid-rest",
        label: "Rest a little (free)",
        x: o.x + 7,
        z: o.z + 3,
        r: 2,
        scene: "masjid",
      });
      this.zones.push({
        id: "quran",
        label: "Read Quran",
        x: o.x - 9.5,
        z: o.z - 3,
        r: 2.2,
        scene: "masjid",
      });
      this.zones.push({
        id: "quran",
        label: "Read Quran",
        x: o.x + 9.5,
        z: o.z - 3,
        r: 2.2,
        scene: "masjid",
      });
      // worshippers sitting in rows
      [
        [-3, -4.8],
        [-1, -4.8],
        [1, -4.8],
        [3, -4.8],
        [-2, -2.8],
        [2, -2.8],
      ].forEach(([x, z], i) => {
        const p = person([0xf4efe4, 0xcdb38a, 0x8fb8e8][i % 3], { cap: 0xffffff, seed: i });
        sitPerson(p);
        p.position.set(x, 0, z);
        p.rotation.y = Math.PI;
        g.add(p);
      });
    }
    // Home: a flat with a bed and a bathroom. Everything else is bought.
    {
      const { g, o } = this.room("home", 20, 14, 0xe9dcc4, 0xb98d5e);
      // your own paint: the walls and floor get their own materials
      this.homeFloor = new THREE.MeshStandardMaterial({ color: 0xb98d5e, roughness: 0.85 });
      this.homeWall = new THREE.MeshStandardMaterial({ color: 0xe9dcc4, roughness: 0.95 });
      (g.children[0] as THREE.Mesh).material = this.homeFloor;
      for (const c of g.children.slice(2, 7))
        if ((c as THREE.Mesh).isMesh) (c as THREE.Mesh).material = this.homeWall;
      this.homeBackWall = g.children[2];
      this.glassView = this.buildGlassView(20, 14);
      g.add(this.glassView);
      const B = (w: number, h: number, d: number, c: number, x: number, y: number, z: number) =>
        box(w, h, d, c, x, y, z);
      // bed (always there)
      const bed = new THREE.Group();
      bed.add(B(3.2, 0.6, 4.2, 0x6d4a2b, 0, 0, 0));
      bed.add(B(3, 0.4, 4, 0xf4efe4, 0, 0.6, 0));
      bed.add(B(1, 0.3, 0.6, 0xe0d4c0, -0.8, 1, -1.6));
      bed.add(B(1, 0.3, 0.6, 0xe0d4c0, 0.8, 1, -1.6));
      bed.add(B(3.1, 0.15, 2.4, 0x1f6f63, 0, 1, 0.7));
      bed.position.set(-7, 0, -4);
      this.solid("home", g, bed, 3.4, 4.4);
      // bathroom corner (always there): partition walls, toilet, tap and bucket for wudu
      g.add(B(0.25, 3, 4.2, 0xdfe6e2, 5, 0, -4.9));
      g.add(B(2.2, 3, 0.25, 0xdfe6e2, 8.9, 0, -2.8));
      this.addCollider("home", o.x + 4.85, o.x + 5.15, o.z - 7, o.z - 2.8);
      this.addCollider("home", o.x + 7.8, o.x + 10, o.z - 2.95, o.z - 2.65);
      const tiles = new THREE.Mesh(new THREE.PlaneGeometry(5, 4.2), mat(0xcfe0e6));
      tiles.rotation.x = -Math.PI / 2;
      tiles.position.set(7.5, 0.02, -4.9);
      g.add(tiles);
      const wc = new THREE.Group();
      wc.add(B(0.7, 0.45, 0.9, 0xf7f7f4, 0, 0, 0), B(0.8, 0.9, 0.3, 0xf7f7f4, 0, 0.2, -0.5));
      wc.position.set(8.9, 0, -6.2);
      this.solid("home", g, wc, 0.9, 1.2);
      const tap = new THREE.Group();
      tap.add(B(1, 0.9, 0.5, 0xf7f7f4, 0, 0, 0), B(0.1, 0.4, 0.1, 0xb8bcc2, 0, 0.9, -0.1));
      const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 0.5, 12), mat(0x2f6fb0));
      bucket.position.set(0.9, 0.25, 0.2);
      tap.add(bucket);
      tap.position.set(6.3, 0, -6.4);
      this.solid("home", g, tap, 1.2, 0.6);
      this.zones.push({
        id: "sleep",
        label: "Sleep / rest",
        x: o.x - 7,
        z: o.z - 1.2,
        r: 2,
        scene: "home",
      });
      this.zones.push({
        id: "bath",
        label: "Bathroom · wudu",
        x: o.x + 7.2,
        z: o.z - 4.6,
        r: 1.8,
        scene: "home",
      });

      // things you can buy, hidden until bought
      const item = (
        id: string,
        m: THREE.Object3D,
        w = 0,
        d = 0,
        zone?: Omit<Zone, "scene" | "x" | "z"> & { dx?: number; dz?: number },
      ) => {
        m.visible = false;
        g.add(m);
        const boxes: Box[] = w
          ? [
              {
                x0: o.x + m.position.x - w / 2,
                x1: o.x + m.position.x + w / 2,
                z0: o.z + m.position.z - d / 2,
                z1: o.z + m.position.z + d / 2,
              },
            ]
          : [];
        let zz: Zone | undefined;
        if (zone) {
          zz = {
            id: zone.id,
            label: zone.label,
            r: zone.r,
            scene: "home",
            x: o.x + m.position.x + (zone.dx ?? 0),
            z: o.z + m.position.z + (zone.dz ?? 0),
            off: true,
          };
          this.zones.push(zz);
        }
        this.homeItems.set(id, { obj: m, boxes, zone: zz });
      };
      {
        const k = new THREE.Group();
        k.add(
          B(5, 1.8, 1.2, 0xf1ece0, 0, 0, 0),
          B(5, 0.12, 1.3, 0x3a3f46, 0, 1.8, 0),
          B(1.4, 0.15, 0.9, 0x1d1f22, 1.2, 1.92, 0),
        );
        k.position.set(0, 0, -6.2);
        item("kitchen", k, 5, 1.4, { id: "eat", label: "Eat at the table", r: 2, dz: 1.6 });
      }
      {
        const f = new THREE.Group();
        f.add(B(1.1, 3.2, 1, 0xd9dde0, 0, 0, 0), B(0.05, 0.6, 0.05, 0x9a9fa6, 0.4, 1.8, 0.52));
        f.position.set(3.4, 0, -6.3);
        item("fridge", f, 1.2, 1.1);
      }
      {
        const t = new THREE.Group();
        t.add(B(2.4, 0.9, 1.4, 0x8a5a3a, 0, 0, 0));
        for (const [cx, cz] of [
          [-0.8, 1.1],
          [0.8, 1.1],
          [-0.8, -1.1],
          [0.8, -1.1],
        ])
          t.add(B(0.6, 0.55, 0.6, 0x6d4a2b, cx, 0, cz));
        t.position.set(0, 0, -2.6);
        item("table", t, 2.6, 3.4);
      }
      {
        const s = new THREE.Group();
        s.add(
          B(3.6, 0.6, 1.2, 0x1f6f63, 0, 0, 0),
          B(3.6, 0.9, 0.3, 0x1f6f63, 0, 0.6, 0.45),
          B(0.3, 0.8, 1.2, 0x1f6f63, -1.8, 0.3, 0),
          B(0.3, 0.8, 1.2, 0x1f6f63, 1.8, 0.3, 0),
        );
        s.position.set(-2, 0, 4.4);
        item("sofa", s, 3.9, 1.3, { id: "sofa", label: "Sit and rest", r: 1.8, dz: -1.4 });
      }
      {
        const r = new THREE.Group();
        for (const [w, d, c, y] of [
          [6, 4, 0x7d2f3a, 0.02],
          [5.2, 3.2, 0xe6b84a, 0.03],
          [4.6, 2.6, 0x7d2f3a, 0.04],
        ] as const) {
          const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(c));
          m.rotation.x = -Math.PI / 2;
          m.position.y = y;
          r.add(m);
        }
        r.position.set(0, 0, 2.2);
        item("rug", r);
      }
      {
        const pm = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.2), mat(0x2f8f83));
        pm.rotation.x = -Math.PI / 2;
        pm.position.set(-7.6, 0.03, 3.6);
        item("prayermat", pm, 0, 0, { id: "prayermat", label: "Prayer mat", r: 1.6 });
      }
      {
        const sh = new THREE.Group();
        sh.add(B(0.5, 2.6, 2.2, 0x6d4a2b, 0, 0, 0));
        for (let i = 0; i < 4; i++)
          sh.add(
            B(
              0.35,
              0.4,
              0.25,
              [0x1f6f63, 0x7d2f3a, 0xe6b84a, 0x2a4a6a][i],
              0.1,
              1.8,
              -0.75 + i * 0.5,
            ),
          );
        sh.position.set(-9.6, 0, 0.4);
        item("bookshelf", sh, 0.6, 2.3, {
          id: "quranhome",
          label: "Read the Qur'an",
          r: 1.8,
          dx: 1.4,
        });
      }
      {
        const rd = new THREE.Group();
        rd.add(B(0.8, 0.7, 0.8, 0x8a5a3a, 0, 0, 0), B(0.6, 0.35, 0.25, 0x2a2c30, 0, 0.7, 0));
        rd.position.set(2.6, 0, 5.4);
        item("radio", rd, 0.9, 0.9, {
          id: "radio",
          label: "Listen to a lecture",
          r: 1.6,
          dz: -1.2,
        });
      }
      {
        const wd = new THREE.Group();
        wd.add(B(0.7, 3.2, 2.4, 0xb98d5e, 0, 0, 0), B(0.05, 2.8, 0.05, 0x6d4a2b, -0.36, 0.2, 0));
        wd.position.set(9.6, 0, 1.4);
        item("wardrobe", wd, 0.8, 2.5);
      }
      {
        const fn = new THREE.Group();
        fn.add(new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 0.1, 10), mat(0x2a2c30)));
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 6), mat(0x2a2c30));
        pole.position.y = 0.8;
        fn.add(pole);
        const head = new THREE.Mesh(
          new THREE.CylinderGeometry(0.45, 0.45, 0.15, 16),
          mat(0xe9ecee),
        );
        head.rotation.x = Math.PI / 2;
        head.position.y = 1.7;
        fn.add(head);
        fn.position.set(5.2, 0, 6.0);
        item("fan", fn, 0.6, 0.6);
      }
      {
        const cu = new THREE.Group();
        for (const x of [-4.6, -3.4, 3.4, 4.6]) cu.add(B(1, 2.6, 0.08, 0x2f8f83, x, 0.8, 0));
        cu.position.set(-2, 0, -6.8);
        item("curtains", cu);
      }
      {
        const cl = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.08, 20), mat(0xfdf8ec));
        cl.rotation.x = Math.PI / 2;
        cl.position.set(-2, 3.6, -6.85);
        item("clock", cl);
      }
      // ---- decorations ----
      const frame = (
        text: string,
        sub: string,
        w: number,
        h: number,
        bg: string,
        fg: string,
        arabic = true,
      ) =>
        canvasPlane(
          w,
          h,
          (c, CW, CH) => {
            c.fillStyle = "#6d4a2b";
            c.fillRect(0, 0, CW, CH);
            c.fillStyle = bg;
            c.fillRect(CW * 0.05, CH * 0.07, CW * 0.9, CH * 0.86);
            c.fillStyle = fg;
            c.textAlign = "center";
            c.textBaseline = "middle";
            c.font = arabic
              ? `700 ${Math.round(CH * 0.34)}px Amiri, serif`
              : `800 ${Math.round(CH * 0.3)}px "Work Sans", sans-serif`;
            c.fillText(text, CW / 2, CH * (sub ? 0.42 : 0.52));
            if (sub) {
              c.font = `500 ${Math.round(CH * 0.12)}px "Work Sans", sans-serif`;
              c.fillText(sub, CW / 2, CH * 0.78);
            }
          },
          512,
        ).mesh;
      {
        const m = frame(
          "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
          "",
          3.2,
          1.1,
          "#1f3d37",
          "#e6b84a",
        );
        m.position.set(-6.5, 3.3, -6.78);
        item("calligraphy", m);
      }
      {
        // the Kaaba, over the prayer mat
        const k = canvasPlane(
          1.4,
          1.6,
          (c, CW, CH) => {
            c.fillStyle = "#6d4a2b";
            c.fillRect(0, 0, CW, CH);
            c.fillStyle = "#cfe3ef";
            c.fillRect(CW * 0.06, CH * 0.05, CW * 0.88, CH * 0.9);
            c.fillStyle = "#d9cfb4";
            c.fillRect(CW * 0.06, CH * 0.62, CW * 0.88, CH * 0.33);
            c.fillStyle = "#111";
            c.fillRect(CW * 0.28, CH * 0.3, CW * 0.44, CH * 0.42);
            c.fillStyle = "#e6b84a";
            c.fillRect(CW * 0.28, CH * 0.38, CW * 0.44, CH * 0.05);
          },
          256,
        ).mesh;
        k.rotation.y = Math.PI / 2;
        k.position.set(-9.78, 2.8, 3.6);
        item("kaabaframe", k);
      }
      {
        const pl = new THREE.Group();
        for (const [px, pz, h] of [
          [-9.2, 6.3, 1.2],
          [4.3, 6.4, 0.9],
          [6.2, -2.1, 1.1],
        ] as [number, number, number][]) {
          const pot = cyl(0.3, 0.22, 0.5, 0xb8573a, 10);
          pot.position.set(px, 0.25, pz);
          const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45 * h, 0), mat(0x3f8a3a));
          leaves.position.set(px, 0.5 + 0.45 * h, pz);
          leaves.scale.y = 1.3;
          pl.add(pot, leaves);
        }
        item("plants", pl);
      }
      {
        const lp = new THREE.Group();
        lp.add(cyl(0.25, 0.3, 0.08, 0x2a2c30, 10));
        const pole = cyl(0.04, 0.04, 1.8, 0x2a2c30, 6);
        pole.position.y = 0.9;
        const shade = cyl(0.25, 0.4, 0.45, 0xf2e3c0, 12);
        shade.position.y = 1.95;
        const glow = new THREE.PointLight(0xffd9a0, 6, 6, 2);
        glow.position.y = 1.8;
        lp.add(pole, shade, glow);
        lp.position.set(-4.4, 0, 5.4);
        item("lamp", lp, 0.6, 0.6);
      }
      {
        const ch = new THREE.Group();
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.05, 6, 20), mat(0xe6b84a));
        ring.rotation.x = Math.PI / 2;
        ch.add(ring);
        for (let k = 0; k < 8; k++) {
          const bulb = new THREE.Mesh(
            new THREE.SphereGeometry(0.09, 8, 6),
            new THREE.MeshBasicMaterial({ color: 0xfff3c4 }),
          );
          bulb.position.set(
            Math.cos((k / 8) * Math.PI * 2) * 0.7,
            -0.05,
            Math.sin((k / 8) * Math.PI * 2) * 0.7,
          );
          ch.add(bulb);
        }
        const chain = cyl(0.02, 0.02, 0.8, 0xe6b84a, 4);
        chain.position.y = 0.4;
        ch.add(chain);
        ch.position.set(0, 4.1, -2.6);
        item("chandelier", ch);
      }
      {
        const st = new THREE.Group();
        st.add(B(0.7, 0.6, 0.7, 0x6d4a2b, 0, 0, 0));
        const vase = cyl(0.12, 0.18, 0.45, 0x2f6fa8, 10);
        vase.position.y = 0.82;
        const fl = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0), mat(0xd23b6a));
        fl.position.y = 1.15;
        st.add(vase, fl);
        st.position.set(0.6, 0, 5.6);
        item("sidetables", st, 0.7, 0.7);
      }
      {
        const aq = new THREE.Group();
        aq.add(B(0.8, 0.8, 1.9, 0x3a2a1c, 0, 0, 0));
        const glass = new THREE.Mesh(
          new THREE.BoxGeometry(0.7, 0.75, 1.8),
          new THREE.MeshStandardMaterial({ color: 0x5ab8d8, transparent: true, opacity: 0.55 }),
        );
        glass.position.y = 1.18;
        aq.add(glass);
        for (const [fx, fz, c] of [
          [0, -0.4, 0xf2a03a],
          [0.1, 0.3, 0xd23b6a],
        ] as [number, number, number][]) {
          const fish = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 5), mat(c));
          fish.rotation.z = Math.PI / 2;
          fish.position.set(fx, 1.2, fz);
          aq.add(fish);
        }
        aq.position.set(9.4, 0, -1.4);
        item("aquarium", aq, 0.8, 1.9);
      }
      {
        const ts = new THREE.Group();
        ts.add(B(1.3, 0.35, 0.8, 0x8a5a3a, 0, 0, 0));
        const tray = cyl(0.35, 0.35, 0.03, 0xe6b84a, 16);
        tray.position.y = 0.37;
        ts.add(tray);
        for (const [cx, cz] of [
          [-0.15, 0.1],
          [0.15, 0.1],
          [0, -0.12],
        ]) {
          const cup = cyl(0.05, 0.04, 0.1, 0xfdf8ec, 8);
          cup.position.set(cx, 0.43, cz);
          ts.add(cup);
        }
        const pot = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), mat(0xb8bcc2));
        pot.position.set(0.25, 0.48, -0.15);
        ts.add(pot);
        ts.position.set(0, 0, 2.2);
        item("teaset", ts, 1.3, 0.8);
      }
      {
        const cp = new THREE.Group();
        for (const [w, d, c, y] of [
          [8.4, 5.6, 0x2a4a6a, 0.012],
          [7.8, 5, 0xc9a35a, 0.016],
          [7.2, 4.4, 0x7d2f3a, 0.02],
        ] as const) {
          const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(c));
          m.rotation.x = -Math.PI / 2;
          m.position.y = y;
          cp.add(m);
        }
        cp.position.set(0, 0, 2.2);
        item("persian", cp);
      }
      {
        const sr = new THREE.Group();
        sr.add(B(1.4, 0.5, 0.4, 0x6d4a2b, 0, 0, 0));
        for (const [sx, c] of [
          [-0.4, 0x2a2c30],
          [0, 0x7d2f3a],
          [0.4, 0x2a4a6a],
        ] as [number, number][])
          sr.add(B(0.25, 0.1, 0.35, c, sx, 0.5, 0));
        sr.position.set(-3.4, 0, 6.5);
        item("shoerack", sr, 1.4, 0.4);
      }
      {
        const bk = new THREE.Group();
        bk.add(B(0.4, 0.9, 0.4, 0x3a2a1c, 0, 0, 0));
        const burner = cyl(0.12, 0.16, 0.25, 0xe6b84a, 8);
        burner.position.y = 1.02;
        bk.add(burner);
        const smoke = new THREE.Mesh(
          new THREE.SphereGeometry(0.15, 8, 6),
          new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 }),
        );
        smoke.position.y = 1.35;
        smoke.scale.y = 1.8;
        bk.add(smoke);
        bk.position.set(-8.9, 0, -1.5);
        item("bakhoor", bk, 0.4, 0.4);
      }
      {
        const pw = new THREE.Group();
        const cols = ["#7d2f3a", "#1f6f63", "#2a4a6a", "#c77d2a"];
        cols.forEach((col, k) => {
          const f = canvasPlane(
            0.7,
            0.55,
            (c, CW, CH) => {
              c.fillStyle = "#3a2a1c";
              c.fillRect(0, 0, CW, CH);
              c.fillStyle = col;
              c.fillRect(CW * 0.08, CH * 0.1, CW * 0.84, CH * 0.8);
              c.fillStyle = "rgba(255,255,255,0.75)";
              c.beginPath();
              c.arc(CW * 0.5, CH * 0.45, CH * 0.18, 0, Math.PI * 2);
              c.fill();
              c.fillRect(CW * 0.3, CH * 0.62, CW * 0.4, CH * 0.22);
            },
            128,
          ).mesh;
          f.rotation.y = -Math.PI / 2;
          f.position.set(9.78, 2.6 + (k % 2) * 0.75, 3.4 + Math.floor(k / 2) * 0.95);
          pw.add(f);
        });
        item("photowall", pw);
      }
      // stairs up (only in a duplex)
      {
        const stairs = new THREE.Group();
        for (let k = 0; k < 7; k++)
          stairs.add(B(2.2, 0.35 * (k + 1), 0.45, 0x8a5a3a, 0, 0, -k * 0.45));
        stairs.add(B(0.08, 1, 3.2, 0x3a2a1c, -1.1, 2.1, -1.35));
        stairs.position.set(8.6, 0, 6.4);
        stairs.visible = false;
        g.add(stairs);
        this.stairs = stairs;
        const z: Zone = {
          id: "stairs:up",
          label: "Go upstairs",
          x: o.x + 8.6,
          z: o.z + 5.2,
          r: 1.6,
          scene: "home",
          off: true,
        };
        this.zones.push(z);
        this.stairsZone = z;
      }
    }
    // Madrasah
    {
      const { g, o } = this.room("madrasah", 22, 15, 0xf1e8d2, 0xc9b28a);
      const { mesh } = canvasPlane(8, 2.6, (c, W, H) => {
        c.fillStyle = "#24443d";
        c.fillRect(0, 0, W, H);
        c.fillStyle = "#f4efe4";
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.font = `700 ${Math.round(H * 0.3)}px Amiri, serif`;
        c.fillText("طَلَبُ الْعِلْمِ فَرِيضَةٌ", W / 2, H * 0.38);
        c.font = `500 ${Math.round(H * 0.13)}px "Work Sans", sans-serif`;
        c.fillText("Seeking knowledge is an obligation", W / 2, H * 0.75);
      });
      mesh.position.set(0, 2.8, -7.25);
      g.add(mesh);
      const td = box(3, 1.1, 1.2, 0x6d4a2b, 0, 0, -4.8);
      this.solid("madrasah", g, td, 3, 1.2);
      const teacher = person(0xece6d6, { cap: 0x2f4c46 });
      teacher.position.set(0, 0, -6);
      g.add(teacher);
      const tt = label("Ustadh", { size: 0.7, bold: false });
      tt.position.set(0, 2.5, -6);
      g.add(tt);
      this.teacherTag = { g, tag: tt };
      for (let r = 0; r < 2; r++)
        for (let c = 0; c < 4; c++) {
          const d = box(2, 0.9, 1, 0xa8834f, -6 + c * 4, 0, -0.5 + r * 3.2);
          this.solid("madrasah", g, d, 2, 1);
        }
      this.zones.push({
        id: "quiz",
        label: "Answer Ustadh's questions",
        x: o.x,
        z: o.z - 3.2,
        r: 2.2,
        scene: "madrasah",
      });
    }
  }

  /* ---------------- loop ---------------- */
  private resize() {
    const w = this.host.clientWidth || 1,
      h = this.host.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    this.camera.aspect = w / h;
    this.camera.fov = w / h < 0.8 ? 62 : 52;
    this.camera.updateProjectionMatrix();
  }

  /** Close third-person camera: behind you outdoors, behind the car when driving,
      and a view from above indoors. Drag the screen to look around. */
  private camDist() {
    const portrait = this.camera.aspect < 0.8;
    if (this.cine) return { d: 14, h: 5.5 };
    if (this.preview) return { d: 5.2, h: 1.4 };
    if (this.match && !this.spectating) return { d: portrait ? 15 : 12, h: portrait ? 10 : 8 };
    if (this.tennis) return { d: portrait ? 5.6 : 4.8, h: portrait ? 3.4 : 3 };
    if (this.driving) return { d: portrait ? 12 : 10, h: 4.6 };
    if (this.riding) return { d: portrait ? 14 : 12, h: 5.2 };
    return { d: portrait ? 8.5 : 7.2, h: portrait ? 4.4 : 3.8 };
  }
  private camOffset() {
    const portrait = this.camera.aspect < 0.8;
    if (this.where !== "out" && !this.cine)
      return portrait ? new THREE.Vector3(0, 22, 19) : new THREE.Vector3(0, 13, 13);
    const { d, h } = this.camDist();
    return new THREE.Vector3(Math.sin(this.camYaw) * d, h, Math.cos(this.camYaw) * d);
  }
  private camTarget() {
    if (this.cine) return this.cine.vehicle.position;
    if (this.riding) return this.riding.mesh.position;
    if (this.kekeTrip) return this.kekeTrip.mesh.position;
    if (this.match && !this.spectating && this.jersey) return this.matchCam;
    if (this.tennis) return this.tennisCam;
    return this.driving ? this.car.position : this.player.position;
  }
  private snapCamera() {
    if (this.cine)
      this.camYaw = Math.atan2(
        -Math.cos(this.cine.vehicle.rotation.y),
        Math.sin(this.cine.vehicle.rotation.y),
      );
    const t = this.camTarget();
    this.camera.position.copy(t).add(this.camOffset());
    this.camera.lookAt(t.x, t.y + 1.5, t.z);
  }

  /** Blocks of the city between the areas (16 m cells), checked by a quick lookup. */
  private fillCells = new Set<string>();
  /** Free ground outside, wherever you are. */
  private freeOut(x: number, z: number, r: number) {
    for (const b of this.colliders.out)
      if (x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r) return false;
    // your parked car (and the car you are driving) is in the way too
    if (this.car.visible && Math.hypot(x - this.car.position.x, z - this.car.position.z) < 2.6 + r)
      return false;
    return true;
  }
  private free(x: number, z: number, r: number) {
    if (this.where === "out" && this.fillCells.size) {
      const C = 16;
      const cx = Math.round((x + 780) / C),
        cz = Math.round((z + 1600) / C);
      for (let i = cx - 1; i <= cx + 1; i++)
        for (let k = cz - 1; k <= cz + 1; k++) {
          if (!this.fillCells.has(`${i},${k}`)) continue;
          const bx = i * C - 780,
            bz = k * C - 1600;
          if (Math.abs(x - bx) < C / 2 - 1 + r && Math.abs(z - bz) < C / 2 - 1 + r) return false;
        }
    }
    for (const b of this.colliders[this.where])
      if (x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r) return false;
    return true;
  }

  private onKey = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) return;
    const k = e.key.toLowerCase();
    if (t && t.tagName === "BUTTON" && (k === "enter" || k === " ")) return;
    if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) {
      this.keys.add(k);
      e.preventDefault();
      this.tapTarget = null;
      this.marker.visible = false;
    }
    if ((k === "e" || k === "enter") && this.ctx) this.ev.onAction(this.ctx.id);
  };
  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.key.toLowerCase());
  };

  private drag: { id: number; x: number; y: number; moved: boolean } | null = null;
  private onPointerDown = (e: PointerEvent) => {
    this.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
    this.lastDrag = performance.now();
  };
  private onPointerMove = (e: PointerEvent) => {
    const d = this.drag;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.hypot(dx, e.clientY - d.y) > 8) d.moved = true;
    if (d.moved && this.where === "out") {
      this.camYaw -= dx * 0.008;
      this.lastDrag = performance.now();
    }
    d.x = e.clientX;
    d.y = e.clientY;
  };
  private onPointerUp = (e: PointerEvent) => {
    const d = this.drag;
    this.drag = null;
    if (!d || d.id !== e.pointerId || d.moved) return;
    this.onTap(e);
  };
  private lastDrag = 0;

  private onTap(e: PointerEvent) {
    if (this.cine) return;
    const r = this.renderer.domElement.getBoundingClientRect();
    const p = new THREE.Vector2(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      -((e.clientY - r.top) / r.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(p, this.camera);
    if (this.match && !this.spectating) {
      // in a match, tap (or click) where you want to run
      const pt = new THREE.Vector3();
      if (this.raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), pt)) {
        this.matchTap = pt;
        this.marker.position.set(pt.x, 0.05, pt.z);
        this.marker.visible = true;
      }
      return;
    }
    if (this.where === "out") {
      const hit = this.raycaster.intersectObjects(this.tappables, false)[0];
      if (hit && hit.distance < 90) {
        this.ev.onAction(hit.object.userData.tap as string);
        return;
      }
    }
    if (this.driving) return;
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
      pt = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(plane, pt)) {
      // tapping right on a door or object walks there and uses it
      const z = this.zones.find(
        (zz) =>
          zz.scene === this.where &&
          zz.id !== "car" &&
          Math.hypot(zz.x - pt.x, zz.z - pt.z) < zz.r + 1.5,
      );
      const carHit =
        this.where === "out" &&
        this.car.visible &&
        Math.hypot(this.car.position.x - pt.x, this.car.position.z - pt.z) < 3;
      this.tapZone = carHit ? "car" : z ? z.id : null;
      this.tapTarget = carHit
        ? new THREE.Vector3(this.car.position.x, 0, this.car.position.z + 2.2)
        : z
          ? new THREE.Vector3(z.x, 0, z.z)
          : pt.clone();
      this.marker.position.set(this.tapTarget.x, 0.05, this.tapTarget.z);
      this.marker.visible = true;
    }
  }

  /* ---------------- graphics: beautiful or smooth ---------------- */
  private low = false;
  private viewDist = 300;
  /** called when the game switches itself to smooth graphics on a slow phone */
  onSlowPhone: (() => void) | null = null;
  private fps = { t: 0, frames: 0, checked: false, auto: true };
  private lost = 0;
  /** After repeated graphics crashes: no shadows, plain pixels and a short view. */
  private lite() {
    this.renderer.shadowMap.enabled = false;
    this.sun.castShadow = false;
    this.renderer.setPixelRatio(1);
    this.viewDist = this.lost > 2 ? 140 : 180;
    this.camera.far = 320;
    this.camera.updateProjectionMatrix();
    const fog = this.scene.fog as THREE.Fog;
    fog.near = 50;
    fog.far = this.viewDist - 10;
  }
  /** Smooth: fewer pixels, no shadows, a shorter view. Beautiful: everything. */
  setQuality(q: "low" | "high", auto = false) {
    this.low = q === "low";
    this.fps.auto = auto;
    const dpr = window.devicePixelRatio || 1;
    // smooth keeps the look: full sharpness on normal screens, lighter shadows, a little less view
    this.renderer.setPixelRatio(this.low ? Math.min(1.25, dpr) : Math.min(2, dpr));
    const size = this.low ? 512 : 1024;
    if (this.sun.shadow.mapSize.x !== size) {
      this.sun.shadow.mapSize.set(size, size);
      this.sun.shadow.map?.dispose();
      this.sun.shadow.map = null;
    }
    this.viewDist = this.low ? 220 : 300;
    this.camera.far = this.low ? 400 : 600;
    this.camera.updateProjectionMatrix();
    const fog = this.scene.fog as THREE.Fog;
    fog.near = this.low ? 60 : 70;
    fog.far = this.low ? 215 : 260;
    this.applyLight();
  }
  isLow() {
    return this.low;
  }
  private loop = (now: number) => {
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    // a slow phone: after a few seconds outside, switch to smooth graphics once
    const f = this.fps;
    if (f.auto && !f.checked && !this.low && this.where === "out" && dt > 0) {
      f.t += dt;
      f.frames++;
      if (f.t > 8) {
        f.checked = true;
        if (f.frames / f.t < 20) {
          this.setQuality("low", true);
          this.onSlowPhone?.();
        }
      }
    }
    this.raf = requestAnimationFrame(this.loop);
    this.update(dt, now / 1000);
    // while the graphics card is resetting there is nothing to draw on
    if (this.renderer.getContext().isContextLost()) return;
    try {
      this.renderer.render(this.scene, this.camera);
    } catch (err) {
      console.warn("IlmCity: a frame could not be drawn", err);
    }
  };

  private moveVec() {
    const v = new THREE.Vector2(this.input.x, this.input.y);
    if (this.keys.has("a") || this.keys.has("arrowleft")) v.x -= 1;
    if (this.keys.has("d") || this.keys.has("arrowright")) v.x += 1;
    if (this.keys.has("w") || this.keys.has("arrowup")) v.y += 1;
    if (this.keys.has("s") || this.keys.has("arrowdown")) v.y -= 1;
    if (v.lengthSq() > 1) v.normalize();
    return v;
  }

  /* ---------------- houses for rent and land for sale ---------------- */
  private plotFx = new Map<string, { sign?: THREE.Object3D; build?: THREE.Group; zone: Zone }>();
  private signMat(kind: SignKind) {
    const key = "sign-" + kind;
    let m = this.signCache.get(key);
    if (m) return m;
    const cv = document.createElement("canvas");
    cv.width = 256;
    cv.height = 160;
    const c = cv.getContext("2d")!;
    const [bg, fg, big, small] = {
      tolet: ["#c62828", "#fff", "TO LET", "Tap to view"],
      land: ["#fdfbf5", "#c62828", "LAND FOR SALE", "Tap to buy"],
      ownland: ["#1f6f63", "#fff", "SOLD", "Your land"],
      building: ["#f2c230", "#2a1c05", "UNDER", "CONSTRUCTION"],
      mine: ["#1f6f63", "#fff", "YOURS", "Tap to manage"],
      taken: ["#5a5f66", "#fff", "OCCUPIED", "Not available"],
      sold: ["#7d2f3a", "#fff", "SOLD", "Not for sale"],
      forsale: ["#e6b84a", "#2a1c05", "FOR SALE", "Tap to buy"],
    }[kind];
    c.fillStyle = bg;
    c.fillRect(0, 0, 256, 160);
    c.strokeStyle = fg;
    c.lineWidth = 6;
    c.strokeRect(8, 8, 240, 144);
    c.fillStyle = fg;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.font = `800 ${big.length > 8 ? 34 : 54}px system-ui, sans-serif`;
    c.fillText(big, 128, 66);
    c.font = "600 24px system-ui, sans-serif";
    c.fillText(small, 128, 118);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    m = bothWays(new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 }));
    this.signCache.set(key, m);
    return m;
  }
  private signCache = new Map<string, THREE.Material>();

  /** A signboard on two posts, standing just inside the plot's front. */
  private signboard(kind: SignKind, x: number, z: number, turn: number, high = false) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = turn;
    const post = MAT.plain(0x6b5a44);
    for (const px of [-0.8, 0.8]) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.1, high ? 3.6 : 2.6, 0.1), post);
      p.position.set(px, high ? 1.8 : 1.3, 0);
      g.add(p);
    }
    const board = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 1.3), this.signMat(kind));
    board.position.set(0, high ? 3.0 : 2.0, 0.06);
    board.castShadow = true;
    g.add(board);
    return g;
  }

  /* ---------- phases: each area's houses come in copies ----------
     When an area fills up, a new phase opens: the same streets with a fresh set of houses.
     A house in phase 2 has the id "<plot>~2". You see one phase of an area at a time. */
  private viewPhase = new Map<string, number>();
  private plotStates = new Map<string, PlotState>();
  static plotBase(id: string) {
    return id.split("~")[0];
  }
  static plotPhase(id: string) {
    return Number(id.split("~")[1] ?? 1) || 1;
  }
  phasedId(base: string, n: number) {
    return n > 1 ? `${base}~${n}` : base;
  }
  /** The phase of an area you are looking at (1 = the original houses). */
  phaseOf(area: string) {
    return this.viewPhase.get(area) ?? 1;
  }
  /** Look at another phase of an area: every house shows how it is in that phase. */
  setPhase(area: string, n: number) {
    if (this.phaseOf(area) === n) return;
    this.viewPhase.set(area, n);
    for (const p of this.plots) {
      if (p.district !== area) continue;
      const fx = this.plotFx.get(p.id);
      if (!fx) continue;
      const pid = this.phasedId(p.id, n);
      fx.zone.id = "plot:" + pid;
      this.paintPlot(
        p.id,
        this.plotStates.get(pid) ?? { kind: p.kind === "land" ? "land" : "tolet" },
      );
    }
    this.place = "";
  }
  /** Going to a house in another phase: show that phase of its area first. */
  private showPlotPhase(prefix: string) {
    if (!prefix.startsWith("plot:") || prefix.endsWith("-")) return;
    const id = prefix.slice(5);
    const p = this.plots.find((q) => q.id === IlmCityEngine.plotBase(id));
    if (p) this.setPhase(p.district, IlmCityEngine.plotPhase(id));
  }
  /** Show a plot as it now is (any phase; only the phase on view is drawn). */
  setPlot(id: string, state: PlotState) {
    this.plotStates.set(id, state);
    const base = IlmCityEngine.plotBase(id);
    const p = this.plots.find((q) => q.id === base);
    if (!p || IlmCityEngine.plotPhase(id) !== this.phaseOf(p.district)) return;
    this.paintPlot(base, state);
  }
  /** Show a plot as it now is: for rent, rented by you, land, building, or built. */
  private paintPlot(
    id: string,
    state: {
      kind: "tolet" | "rented" | "land" | "owned" | "building" | "built" | "taken" | "forsale";
      floors?: number;
      by?: string;
      /** while building: 1 foundation, 2 walls, 3 roof, 4 finishing */
      stage?: number;
    },
  ) {
    const p = this.plots.find((q) => q.id === id);
    const fx = this.plotFx.get(id);
    if (!p || !fx) return;
    const D = districtById(p.district);
    const turn = p.z < (p.streetZ ?? 0) ? 0 : Math.PI;
    const front = p.z + (turn === 0 ? 10 : -10);
    if (fx.sign) {
      fx.sign.removeFromParent();
      fx.sign = undefined;
    }
    const putSign = (k: SignKind, onWall = false) => {
      fx.sign = this.signboard(
        k,
        p.x + (onWall ? -6 : 0),
        front + (turn === 0 ? (onWall ? 0.35 : -1.2) : onWall ? -0.35 : 1.2),
        turn,
        onWall,
      );
      this.areaGroup(D.id).add(fx.sign);
    };
    const labels: Record<string, string> = {
      tolet: `To Let · No. ${p.number}`,
      rented: `Your house · No. ${p.number}`,
      land: "Land for sale",
      owned: "Your land",
      building: "Your building site",
      built: `Your property · No. ${p.number}`,
      taken: `No. ${p.number} · ${state.by ?? "a player"}'s ${p.kind === "land" ? "land" : "house"}`,
      forsale: `For sale · No. ${p.number} · ${state.by ?? "a player"}`,
    };
    fx.zone.label = labels[state.kind];
    if (state.kind === "tolet") putSign("tolet", true);
    else if (state.kind === "rented") putSign("mine", true);
    else if (state.kind === "land") putSign("land");
    else if (state.kind === "owned") putSign("ownland");
    else if (state.kind === "taken")
      putSign(p.kind === "land" ? "sold" : "taken", p.kind !== "land");
    else if (state.kind === "forsale") putSign("forsale", p.kind !== "land");
    else if (state.kind === "building") putSign("building");
    else if (state.kind === "built") putSign("mine", true);
    // the house on a land plot
    if (p.kind === "land") {
      if (fx.build) {
        fx.build.removeFromParent();
        fx.build = undefined;
        this.colliders.out = this.colliders.out.filter(
          (b) => !(b as Box & { plot?: string }).plot || (b as Box & { plot?: string }).plot !== id,
        );
      }
      if (state.kind === "building" || state.kind === "built") {
        const g = new THREE.Group();
        const b = new Batch();
        const c = compound(b, {
          x: p.x,
          z: p.z,
          turn,
          number: p.number,
          rnd: mulberry(p.number * 31 + p.district.length),
          floors: state.floors ?? 1,
          width: p.pw,
          depth: p.pd,
          style: houseStyleOf(districtById(p.district)),
        });
        for (const m of b.build()) g.add(m);
        if (state.kind === "building") {
          // a site in progress: the foundation, then the walls, the roof and the finishing,
          // with bamboo scaffolding, a heap of sand and stacks of blocks
          const stage = state.stage ?? 2;
          const sy = [0.08, 0.55, 0.85, 1][Math.min(3, Math.max(0, stage - 1))];
          g.scale.y = sy;
          const back = turn === 0 ? -3 : 3;
          if (stage > 1) {
            const sc = new THREE.Mesh(
              new THREE.BoxGeometry(14, 7 * Math.min(1, sy + 0.1), 10),
              new THREE.MeshStandardMaterial({ color: 0xb08a4a, wireframe: true }),
            );
            sc.position.set(p.x, (3.5 * Math.min(1, sy + 0.1)) / sy, p.z + back);
            g.add(sc);
          }
          if (stage < 4) {
            const heap = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.2, 10), mat(0xd9b77a));
            heap.position.set(p.x + 5, 0.6 / sy, p.z - back * 1.6);
            heap.scale.y = 1 / sy;
            g.add(heap);
            for (let k = 0; k < 3; k++) {
              const blocks = box(1.2, 0.8, 0.8, 0xa8a49a, p.x - 5 + k * 1.4, 0, p.z - back * 1.6);
              blocks.scale.y = 1 / sy;
              blocks.position.y = 0.4 / sy;
              g.add(blocks);
            }
          }
        }
        for (const cb of c.colliders)
          this.colliders.out.push({
            ...cb,
            x0: cb.x0 + D.origin.x,
            x1: cb.x1 + D.origin.x,
            z0: cb.z0 + D.origin.z,
            z1: cb.z1 + D.origin.z,
            plot: id,
          } as Box);
        this.areaGroup(D.id).add(g);
        fx.build = g;
        fx.zone.x = D.origin.x + c.gate.x;
        fx.zone.z = D.origin.z + c.gate.z;
      }
    }
  }
  /** Put every rentable house and land plot in its saved state. */
  initPlots(
    states: Record<
      string,
      { kind: "rented" | "owned" | "building" | "built"; floors?: number; stage?: number }
    >,
  ) {
    for (const [id, st] of Object.entries(states)) this.plotStates.set(id, st);
    for (const id of this.plotFx.keys()) {
      const p = this.plots.find((q) => q.id === id)!;
      const pid = this.phasedId(id, this.phaseOf(p.district));
      this.setPlot(pid, states[pid] ?? { kind: p.kind === "land" ? "land" : "tolet" });
    }
  }
  /** A plot's details; for a house in a later phase, its id keeps the phase. */
  plotInfo(id: string) {
    const p = this.plots.find((q) => q.id === IlmCityEngine.plotBase(id));
    return p ? { ...p, id } : null;
  }
  private areaGroup(id: string) {
    const D = districtById(id);
    return this.areaGroups.find((a) => a.x === D.origin.x && a.z === D.origin.z)!.g;
  }

  /* ---------------- prayer ---------------- */
  /** Your character stands, bows, prostrates or sits during salah. */
  /** Sit on the chair by this seat, facing the table. */
  sitAt(id: string) {
    const z = this.zones.find((zz) => zz.id === id && zz.scene === this.where);
    if (!z) return false;
    this.tapTarget = null;
    this.marker.visible = false;
    this.player.position.set(z.x, 0, z.z - 0.8);
    this.player.rotation.y = Math.PI;
    poseHuman(this.player, "sit");
    return true;
  }
  standUp() {
    releasePose(this.player);
  }
  prayPose(p: Pose | null) {
    if (p) poseHuman(this.player, p);
    else releasePose(this.player);
  }

  /* ---------------- people ---------------- */
  /** Stop a passer-by for a chat. */
  talkTo(i: number) {
    const w = this.walkers[i];
    if (!w) return null;
    w.talking = true;
    gesture(w.g, "agree");
    // face them
    const wx = w.g.position.x + (w.g.parent?.position.x ?? 0),
      wz = w.g.position.z + (w.g.parent?.position.z ?? 0);
    this.player.rotation.y = Math.atan2(wx - this.player.position.x, wz - this.player.position.z);
    return {
      name: w.name ?? "Neighbour",
      female: !!w.female,
      hisbah: !!w.hisbah,
      district: w.district ?? this.district.id,
    };
  }
  /** The Hisbah officer or van near you, if any. */
  nearHisbah(radius = 30) {
    const p = this.driving ? this.car.position : this.player.position;
    if (this.where !== "out") return null;
    for (const w of this.walkers) {
      if (!w.hisbah || !w.g.parent) continue;
      const x = w.g.position.x + w.g.parent.position.x,
        z = w.g.position.z + w.g.parent.position.z;
      if (Math.hypot(x - p.x, z - p.z) < radius) return w.name ?? "Hisbah";
    }
    for (const v of this.traffic.vehicles)
      if (
        v.kind === "hisbah" &&
        Math.hypot(v.mesh.position.x - p.x, v.mesh.position.z - p.z) < radius
      )
        return "The Hisbah patrol";
    return null;
  }
  /** The Hisbah officer walking right next to you (index for talkTo), or null. */
  hisbahBeside(radius = 6) {
    if (this.where !== "out" || this.driving || this.riding || this.cine) return null;
    const p = this.player.position;
    for (let i = 0; i < this.walkers.length; i++) {
      const w = this.walkers[i];
      if (!w.hisbah || !w.g.parent || w.talking) continue;
      const x = w.g.position.x + w.g.parent.position.x,
        z = w.g.position.z + w.g.parent.position.z;
      if (Math.hypot(x - p.x, z - p.z) < radius) return i;
    }
    return null;
  }
  /** If the Hisbah van is near you, it pulls over and waits while the officer speaks. */
  stopHisbahVan(radius = 16) {
    if (this.where !== "out" || this.riding || this.cine) return false;
    const p = this.driving ? this.car.position : this.player.position;
    for (const v of this.traffic.vehicles)
      if (
        v.kind === "hisbah" &&
        Math.hypot(v.mesh.position.x - p.x, v.mesh.position.z - p.z) < radius
      ) {
        v.dwell = 14;
        v.v = 0;
        if (this.driving) this.carSpeed = 0;
        return true;
      }
    return false;
  }
  /** Are you inside an area (not on an expressway)? */
  inArea() {
    const p = this.driving ? this.car.position : this.player.position;
    return !!this.areaAt(p.x, p.z);
  }
  /** The passer-by nods or shakes their head while talking. */
  talkGesture(i: number, kind: "agree" | "headShake") {
    const w = this.walkers[i];
    if (w) gesture(w.g, kind);
  }
  endTalk(i: number) {
    const w = this.walkers[i];
    if (!w) return;
    w.talking = false;
    w.wait = 1.5;
  }

  /* ---------------- buses ---------------- */
  private traffic!: Traffic;
  private waitStop: string | null = null;
  private riding: Vehicle | null = null;

  private buildTraffic() {
    this.traffic = new Traffic(this.scene, mulberry(11));
    const b = new Batch();
    const signTex = (() => {
      const cv = document.createElement("canvas");
      cv.width = 256;
      cv.height = 96;
      const c = cv.getContext("2d")!;
      c.fillStyle = "#1f4f9a";
      c.fillRect(0, 0, 256, 96);
      c.fillStyle = "#fff";
      c.font = "800 44px system-ui, sans-serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText("BUS STOP", 128, 50);
      const t = new THREE.CanvasTexture(cv);
      t.colorSpace = THREE.SRGBColorSpace;
      return new THREE.MeshStandardMaterial({ map: t, roughness: 0.5 });
    })();
    for (const st of this.traffic.stops) {
      const g = new THREE.Group();
      g.position.set(st.x, 0, st.z);
      // the shelter's back faces away from the road
      g.rotation.y = st.rot;
      const frame = MAT.plain(0x5a5f66, 0.5);
      for (const x of [-2, 2]) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.6, 0.12), frame);
        p.position.set(x, 1.3, 0.6);
        g.add(p);
      }
      const roof = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.12, 1.8), MAT.plain(0x1f4f9a, 0.5));
      roof.position.set(0, 2.65, 0.1);
      g.add(roof);
      const back = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.8, 0.06), MAT.plain(0xcfe3ea, 0.2));
      back.position.set(0, 1.4, 0.95);
      g.add(back);
      const bench = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 0.5), MAT.plain(0x8a5a3a));
      bench.position.set(0, 0.55, 0.6);
      g.add(bench);
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.52), signTex);
      sign.position.set(2.2, 2.3, -0.3);
      g.add(sign);
      const pole = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.6, 0.08), frame);
      pole.position.set(2.2, 1.3, -0.32);
      g.add(pole);
      b.addObject(g);
      this.zones.push({
        id: "busstop:" + st.id,
        label: st.x < -3000 ? "Wait for the bus" : "Wait for a danfo",
        x: st.x,
        z: st.z,
        r: 3.6,
        scene: "out",
      });
    }
    for (const m of b.build()) this.scene.add(m);
    for (const v of this.traffic.vehicles)
      if (v.kind === "hisbah") {
        const t = label("HISBAH", { size: 0.8, bg: "rgba(29,122,58,0.92)" });
        t.position.y = 3.6;
        v.mesh.add(t);
      }
    this.traffic.onStop = (bus, stop) => {
      if (bus === this.riding && bus.stopNext) {
        bus.stopNext = false;
        this.riding = null;
        this.traffic.riding = null;
        this.traffic.fast = false;
        this.player.visible = true;
        this.standAt(stop.x, stop.z, stop);
        this.player.rotation.y = stop.heading + Math.PI / 2;
        this.ev.onRide?.(null);
        this.ev.onAction("arrived:" + stop.district);
      }
    };
  }

  /** Stand at a bus stop: a danfo comes in a few seconds. */
  waitForBus(stopId: string) {
    this.waitStop = stopId;
    this.traffic.waitingAt = stopId;
    this.traffic.summon(stopId);
  }
  boardBus() {
    if (!this.waitStop) return false;
    const bus = this.traffic.busAt(this.waitStop);
    if (!bus) return false;
    this.riding = bus;
    this.traffic.riding = bus;
    this.traffic.waitingAt = null;
    this.waitStop = null;
    bus.dwell = 1.2;
    this.player.visible = false;
    this.camYaw = Math.atan2(-Math.cos(bus.mesh.rotation.y), Math.sin(bus.mesh.rotation.y));
    this.ev.onRide?.(this.rideInfo());
    return true;
  }
  rideInfo() {
    if (!this.riding) return null;
    const n = this.traffic.nextStop(this.riding);
    return {
      next: n ? n.name : "",
      stopping: !!this.riding.stopNext,
      fast: this.traffic.fast,
      kmh: Math.round(this.riding.v * 3.6),
    };
  }
  getOffNext() {
    if (this.riding) this.riding.stopNext = true;
  }
  setRideFast(on: boolean) {
    this.traffic.fast = on;
  }
  /** What you are travelling in right now, for the radio. */
  rideKind(): "danfo" | "keke" | "car" | null {
    if (this.kekeTrip) return "keke";
    if (this.riding) return "danfo";
    if (this.driving) return "car";
    return null;
  }
  isRiding() {
    return !!this.riding;
  }
  private stepTraffic(dt: number) {
    const obs: { x: number; z: number; r: number }[] = [];
    if (this.where === "out" && !this.riding && !this.driving)
      obs.push({ x: this.player.position.x, z: this.player.position.z, r: 0.7 });
    if (this.car.visible && !this.cine)
      obs.push({ x: this.car.position.x, z: this.car.position.z, r: 1.6 });
    this.traffic.hail =
      this.where === "out" && !this.driving && !this.riding && !this.kekeTrip && !this.cine
        ? { x: this.player.position.x, z: this.player.position.z }
        : null;
    this.traffic.update(dt, obs, this.camera.position);
    if (this.riding) {
      this.player.position.copy(this.riding.mesh.position);
    } else if (this.waitStop) {
      const st = this.traffic.stops.find((s) => s.id === this.waitStop);
      if (!st || Math.hypot(st.x - this.player.position.x, st.z - this.player.position.z) > 12) {
        this.waitStop = null;
        this.traffic.waitingAt = null;
      }
    }
  }
  /** True when a traffic vehicle is in the way of your car. */
  private hitsTraffic(x: number, z: number) {
    for (const v of this.traffic.vehicles) {
      const dx = v.mesh.position.x - x,
        dz = v.mesh.position.z - z;
      if (dx * dx + dz * dz < (v.half + 1.6) ** 2 * 0.55) return true;
    }
    return false;
  }

  private update(dt: number, t: number) {
    const v = this.moveVec();
    if (this.match && !this.spectating) {
      this.stepMatch(v, dt);
    } else if (this.tennis) {
      this.stepTennis(v, dt);
    } else if (this.rope) {
      // in the rope game you stay in your place
    } else if (this.cine) this.stepCinematic(dt);
    else if (this.driving) this.drive(v, dt);
    else if (this.kekeTrip) this.stepKeke(dt);
    else if (this.pathWalk) this.stepPath(dt);
    else if (!this.riding) this.walk(v, dt, t);

    if (this.match && this.spectating) this.match.step(dt, null);
    for (const rig of this.ropes.values()) {
      const c = rig.centre();
      if (
        rig === this.rope ||
        Math.hypot(this.camera.position.x - c.x, this.camera.position.z - c.z) < 80
      )
        rig.update(dt);
    }
    this.stepRider(dt);
    this.stepParking(dt);
    this.stepGuide(performance.now() / 1000);
    this.stepJob(dt, performance.now() / 1000);
    this.stepTraffic(dt);
    this.stepTawaf(dt);
    this.stepRemotes(dt);
    tickHumans(dt, this.camera);
    // only draw areas near the camera
    if (this.where === "out")
      for (const a of this.areaGroups) {
        const d = Math.hypot(this.camera.position.x - a.x, this.camera.position.z - a.z);
        a.g.visible = d < this.viewDist;
        if (a.g.visible) a.onGpu = true;
        else if (a.onGpu && d > this.viewDist + 400) this.freeArea(a);
      }

    // neighbours
    for (const w of this.walkers) {
      if (w.seated) continue;
      if (w.talking) {
        const px = this.player.position.x - (w.g.parent?.position.x ?? 0),
          pz = this.player.position.z - (w.g.parent?.position.z ?? 0);
        w.g.rotation.y = lerpAngle(
          w.g.rotation.y,
          Math.atan2(px - w.g.position.x, pz - w.g.position.z),
          Math.min(1, dt * 6),
        );
        animatePerson(w.g, 0, 0);
        continue;
      }
      if (w.wait > 0) {
        w.wait -= dt;
        animatePerson(w.g, 0, 0);
        continue;
      }
      const [tx, tz] = w.route[w.k],
        dx = tx - w.g.position.x,
        dz = tz - w.g.position.z,
        d = Math.hypot(dx, dz);
      if (d < 0.3) {
        w.k = (w.k + 1) % w.route.length;
        w.wait = 1 + Math.random() * 3;
        continue;
      }
      let s = Math.min(d, 2.2 * dt);
      // step aside for anyone in the way instead of walking through them
      const ox = w.g.parent?.position.x ?? 0,
        oz = w.g.parent?.position.z ?? 0;
      const wx = w.g.position.x + ox,
        wz = w.g.position.z + oz;
      const ux = dx / d,
        uz = dz / d;
      // the line of the route this walker is on, to come back to after stepping aside
      const [fx, fz] = w.route[(w.k + w.route.length - 1) % w.route.length];
      const off = (wx - ox - fx) * -uz + (wz - oz - fz) * ux;
      let sx = 0,
        sz = 0;
      if (this.personAhead(wx, wz, ux, uz, w.g)) {
        s *= 0.25;
        // step aside, but never more than a couple of metres off the pavement
        if (off < 1.8) {
          sx = -uz * 1.6 * dt;
          sz = ux * 1.6 * dt;
        }
      } else if (Math.abs(off) > 0.05) {
        // drift back onto the pavement
        const back = Math.min(Math.abs(off), 1.2 * dt) * Math.sign(off);
        sx = uz * back;
        sz = -ux * back;
      }
      const nx = wx + sx + ux * s,
        nz = wz + sz + uz * s;
      // never walk through a wall, a house or a car
      if (!this.freeOut(nx, nz, 0.3) && this.freeOut(wx, wz, 0.3)) {
        // blocked: turn back the way they came
        w.k = (w.k + w.route.length - 1) % w.route.length;
        w.wait = 0.6;
        animatePerson(w.g, 0, 0);
        continue;
      }
      w.g.position.x += sx + ux * s;
      w.g.position.z += sz + uz * s;
      w.g.rotation.y = Math.atan2(dx, dz);
      w.t += dt;
      animatePerson(w.g, w.t * 7, 1);
    }

    // camera
    if (this.cine) {
      const r = this.cine.vehicle.rotation.y;
      this.camYaw = lerpAngle(
        this.camYaw,
        Math.atan2(-Math.cos(r), Math.sin(r)),
        1 - Math.exp(-dt * 3),
      );
    } else if (this.riding && this.riding.v > 1 && performance.now() - this.lastDrag > 1500) {
      const r = this.riding.mesh.rotation.y;
      this.camYaw = lerpAngle(
        this.camYaw,
        Math.atan2(-Math.cos(r), Math.sin(r)),
        1 - Math.exp(-dt * 2.5),
      );
    } else if (
      this.driving &&
      Math.abs(this.carSpeed) > 1 &&
      performance.now() - this.lastDrag > 1500
    ) {
      const h = this.carHeading + (this.carSpeed < 0 ? Math.PI : 0);
      this.camYaw = lerpAngle(
        this.camYaw,
        Math.atan2(-Math.cos(h), Math.sin(h)),
        1 - Math.exp(-dt * 2.5),
      );
    } else if (this.match && !this.spectating && performance.now() - this.lastDrag > 2500) {
      this.camYaw = lerpAngle(this.camYaw, this.match.camYawFor(), 1 - Math.exp(-dt * 2));
    } else if (
      !this.driving &&
      this.followYaw !== null &&
      performance.now() - this.lastDrag > 1500
    ) {
      this.camYaw = lerpAngle(this.camYaw, this.followYaw, 1 - Math.exp(-dt * 1.6));
    }
    const target = this.camTarget();
    const want = target.clone().add(this.camOffset());
    this.camera.position.lerp(want, 1 - Math.exp(-dt * (this.where === "out" ? 8 : 5)));
    this.camera.lookAt(target.x, this.preview ? 0.2 : this.where === "out" ? 1.6 : 1, target.z);
    this.sun.target.position.set(target.x, 0, target.z);
    this.sky?.position.set(this.camera.position.x, 0, this.camera.position.z);
    const sunDir =
      (this.sun.userData.dir as THREE.Vector3 | undefined) ?? new THREE.Vector3(0.4, 1, 0.3);
    this.sun.position.copy(this.sun.target.position).addScaledVector(sunDir, 80);
    if (this.marker.visible) {
      const s = 1 + Math.sin(t * 6) * 0.12;
      this.marker.scale.set(s, s, s);
    }

    // nearest interaction
    const pos = this.driving ? this.car.position : this.player.position;
    let best: Zone | null = null,
      bd = Infinity;
    if (
      this.cine ||
      this.riding ||
      this.kekeTrip ||
      this.rope ||
      this.tennis ||
      (this.match && !this.spectating)
    )
      best = null;
    else if (this.waitStop && this.traffic.busAt(this.waitStop))
      best = {
        id: "board",
        label: this.district.holy ? "Board the bus" : "Board the danfo",
        x: 0,
        z: 0,
        r: 0,
        scene: "out",
      };
    else if (this.driving)
      best = { id: "car-exit", label: "Get out of the car", x: 0, z: 0, r: 0, scene: "out" };
    else
      for (const z of this.zones) {
        if (z.scene !== this.where || z.off) continue;
        const dd =
          z.id === "car"
            ? Math.hypot(this.car.position.x - pos.x, this.car.position.z - pos.z)
            : Math.hypot(z.x - pos.x, z.z - pos.z);
        if (dd < z.r && dd < bd) {
          best = z;
          bd = dd;
        }
      }
    if (
      !this.cine &&
      !this.driving &&
      !this.riding &&
      !(this.match && !this.spectating) &&
      !this.rope &&
      !this.tennis &&
      this.where === "out"
    )
      this.walkers.forEach((w, i) => {
        if (!w.name || !w.g.parent?.visible) return;
        const dw = Math.hypot(
          w.g.position.x + w.g.parent.position.x - pos.x,
          w.g.position.z + w.g.parent.position.z - pos.z,
        );
        if (dw < 2.8 && dw < bd) {
          best = { id: "talk:" + i, label: "Talk · " + w.name, x: 0, z: 0, r: 0, scene: "out" };
          bd = dw;
        }
      });
    if (!this.cine && !this.driving && !this.riding && !this.match && this.where === "out")
      for (const [uid, r] of this.remotes) {
        const dr = Math.hypot(r.g.position.x - pos.x, r.g.position.z - pos.z);
        if (dr < 3 && dr < bd) {
          best = { id: "player:" + uid, label: "Chat · " + r.name, x: 0, z: 0, r: 0, scene: "out" };
          bd = dr;
        }
      }
    if (!best || bd > 2) {
      const kk = this.kekeBeside();
      if (kk)
        best = {
          id: "keke",
          label: this.district.holy ? "Take a taxi" : "Take a keke",
          x: 0,
          z: 0,
          r: 0,
          scene: "out",
        };
    }
    if (!this.cine && !this.driving && this.where === "out" && this.car.visible) {
      const dc = Math.hypot(this.car.position.x - pos.x, this.car.position.z - pos.z);
      if (dc < 3.4 && dc < bd)
        best = { id: "car", label: "Get in your car", x: 0, z: 0, r: 0, scene: "out" };
    }
    const ctx: Context = best ? { id: best.id, label: best.label } : null;
    if (ctx?.id !== this.ctx?.id || ctx?.label !== this.ctx?.label) {
      this.ctx = ctx;
      this.ev.onContext(ctx);
    }
    // walking up to a door or object you tapped uses it straight away
    if (this.pendingUse) {
      this.pendingUse = false;
      if (ctx && ctx.id === this.tapZone) this.ev.onAction(ctx.id);
      this.tapZone = null;
    }

    // place name
    let place = "Lagos";
    const area = this.areaAt(pos.x, pos.z);
    if (area && area.id !== this.district.id) this.district = area;
    if (this.where !== "out") place = this.interiorName || place;
    else if (area) {
      place = `${area.name}${this.phaseOf(area.id) > 1 ? ` (Phase ${this.phaseOf(area.id)})` : ""}, ${area.state}`;
    } else place = this.roadAt(pos.x, pos.z) ?? "Lagos";
    if (place !== this.place) {
      this.place = place;
      this.ev.onPlace(place);
    }
  }
  private pendingUse = false;
  private tapZone: string | null = null;

  private followYaw: number | null = null;

  private walk(v: THREE.Vector2, dt: number, t: number) {
    this.syncBike();
    // the stick moves you relative to where the camera looks
    const fx = -Math.sin(this.camYaw),
      fz = -Math.cos(this.camYaw);
    const rx = Math.cos(this.camYaw),
      rz = -Math.sin(this.camYaw);
    let dir = new THREE.Vector3(rx * v.x + fx * v.y, 0, rz * v.x + fz * v.y);
    if (this.where !== "out") dir = new THREE.Vector3(v.x, 0, -v.y);
    this.followYaw = null;
    if (dir.lengthSq() === 0 && this.tapTarget) {
      if (this.tapPlanned !== this.tapTarget) {
        this.tapPlanned = this.tapTarget;
        this.planTap();
      }
      const next = this.tapPath[0] ?? this.tapTarget;
      const d = next.clone().sub(this.player.position);
      d.y = 0;
      if (d.length() < 0.35) {
        if (this.tapPath.length > 1) this.tapPath.shift();
        else {
          this.tapTarget = null;
          this.tapPath = [];
          this.marker.visible = false;
          this.pendingUse = true;
        }
      } else dir = d.normalize();
    }
    const moving = dir.lengthSq() > 0.001;
    if (moving) {
      const onBike = !!this.bikeKind && this.where === "out";
      const speed =
        7.5 * (onBike ? this.bikeMult : 1) * (this.tired ? 0.55 : 1) * Math.min(1, dir.length());
      const n = dir.clone().normalize();
      const nx = this.player.position.x + n.x * speed * dt,
        nz = this.player.position.z + n.z * speed * dt;
      // if you somehow end up inside a wall, you can always walk out of it
      const stuck = !this.free(this.player.position.x, this.player.position.z, 0.5);
      if (
        (stuck || this.free(nx, this.player.position.z, 0.5)) &&
        !this.bumpsPerson(nx, this.player.position.z)
      )
        this.player.position.x = nx;
      if (
        (stuck || this.free(this.player.position.x, nz, 0.5)) &&
        !this.bumpsPerson(this.player.position.x, nz)
      )
        this.player.position.z = nz;
      const targetRot = Math.atan2(n.x, n.z);
      this.player.rotation.y = lerpAngle(this.player.rotation.y, targetRot, Math.min(1, dt * 12));
      // the camera swings round behind you when you walk forward
      if (this.where === "out" && (v.y > 0.4 || (v.lengthSq() === 0 && this.tapTarget)))
        this.followYaw = targetRot + Math.PI;
      this.walkT += dt;
      // on a bicycle the legs go round slower and the wheels spin
      if (onBike) {
        animatePerson(this.player, this.walkT * 6, 0.6, 7.5);
        for (const w of this.bikeWheels) w.rotation.x += (speed * dt) / 0.34;
      } else animatePerson(this.player, this.walkT * 9, 1, speed);
    } else {
      animatePerson(this.player, 0, 0);
      void t;
    }
  }

  /** Stick up = accelerate, down = brake and reverse, left and right = steer. */
  private drive(v: THREE.Vector2, dt: number) {
    const max = this.carMax;
    if (v.y > 0.1) this.carSpeed = Math.min(max * v.y, this.carSpeed + 16 * dt);
    else if (v.y < -0.1)
      this.carSpeed =
        this.carSpeed > 0.5 ? this.carSpeed - 30 * dt : Math.max(-8, this.carSpeed - 10 * dt);
    else this.carSpeed *= Math.pow(0.35, dt);
    const grip = Math.min(1, Math.abs(this.carSpeed) / 6);
    this.carHeading -= v.x * 1.9 * grip * Math.sign(this.carSpeed || 1) * dt;
    const nx = this.car.position.x + Math.cos(this.carHeading) * this.carSpeed * dt;
    const nz = this.car.position.z - Math.sin(this.carHeading) * this.carSpeed * dt;
    const crash = this.hitsTraffic(nx, nz);
    if (this.free(nx, nz, 1.8) && !crash) {
      this.car.position.x = nx;
      this.car.position.z = nz;
    } else {
      // smashing into another vehicle at speed is an accident
      if (crash && Math.abs(this.carSpeed) > 9) this.incident("crash");
      this.carSpeed *= -0.3;
    }
    this.car.rotation.y = this.carHeading;
    this.player.position.set(this.car.position.x, 0, this.car.position.z);
    // knocking down someone on foot
    if (Math.abs(this.carSpeed) > 6) {
      const cx = this.car.position.x,
        cz = this.car.position.z;
      for (const w of this.walkers) {
        if (w.seated || !w.g.parent?.visible) continue;
        const wx = w.g.position.x + w.g.parent.position.x,
          wz = w.g.position.z + w.g.parent.position.z;
        if (Math.hypot(wx - cx, wz - cz) < 1.9) {
          // they fall back out of the way
          w.g.position.x += (wx - cx) * 0.8;
          w.g.position.z += (wz - cz) * 0.8;
          this.incident("hit", w.name ?? "someone");
          break;
        }
      }
      for (const [, r] of this.remotes)
        if (r.g.visible && Math.hypot(r.g.position.x - cx, r.g.position.z - cz) < 1.9) {
          this.incident("hit", r.name);
          break;
        }
    }
  }

  /* ---------------- road offences: accidents and blocking the road ---------------- */
  /** the game is told when your driving gets you in trouble */
  onIncident: ((kind: "hit" | "crash" | "blocking", who?: string) => void) | null = null;
  private lastIncident = 0;
  private incident(kind: "hit" | "crash" | "blocking", who?: string) {
    const now = performance.now();
    if (now - this.lastIncident < 4000) return;
    this.lastIncident = now;
    this.carSpeed = 0;
    this.onIncident?.(kind, who);
  }
  /** Is this point on a lane where traffic drives? */
  private onLane(x: number, z: number) {
    const seen = new Set<unknown>();
    for (const v of this.traffic.vehicles) {
      if (seen.has(v.path)) continue;
      seen.add(v.path);
      if (v.path.nearest(x, z).d < 2.6) return true;
    }
    return false;
  }
  private blockT = 0;
  private stepParking(dt: number) {
    if (this.driving || this.impounded || this.where !== "out") {
      this.blockT = 0;
      return;
    }
    const c = this.car.position,
      p = this.player.position;
    // you left your car in the road and walked away
    if (Math.hypot(c.x - p.x, c.z - p.z) > 25 && this.onLane(c.x, c.z)) {
      this.blockT += dt;
      if (this.blockT > 60) {
        this.blockT = 0;
        this.incident("blocking");
      }
    } else this.blockT = 0;
  }
  private impounded = false;
  /** The police tow your car to the station yard. */
  impoundCar() {
    if (this.driving) this.exitCar();
    const area = this.carArea() ?? this.district.id;
    const st =
      this.zones.find((z) => z.id === "police:" + area) ??
      this.zones
        .filter((z) => z.id.startsWith("police:"))
        .sort(
          (a, b) =>
            Math.hypot(a.x - this.car.position.x, a.z - this.car.position.z) -
            Math.hypot(b.x - this.car.position.x, b.z - this.car.position.z),
        )[0];
    if (st) {
      // park it in the yard beside the station
      for (const [ox, oz] of [
        [6, 2],
        [-6, 2],
        [6, -3],
        [-6, -3],
        [9, 0],
      ])
        if (this.free(st.x + ox, st.z + oz, 1.8)) {
          this.car.position.set(st.x + ox, 0, st.z + oz);
          break;
        }
      this.carHeading = 0;
      this.car.rotation.y = 0;
    }
    this.impounded = true;
    this.car.visible = false;
    return st ? st.id.slice(7) : area;
  }
  /** Fine paid: your car is back, in the police yard. */
  releaseCar() {
    this.impounded = false;
    this.car.visible = true;
  }
  setImpounded(on: boolean) {
    this.impounded = on;
    this.car.visible = !on;
  }
  carSpeedKmh() {
    return Math.round(Math.abs(this.carSpeed) * 3.6);
  }

  /* ---------------- light ---------------- */
  /** A sky dome that fades from the horizon colour to a deeper blue, with clouds. */
  private sky: THREE.Group | null = null;
  private skyDome: THREE.Mesh | null = null;
  private buildSky() {
    const g = new THREE.Group();
    const geo = new THREE.SphereGeometry(560, 32, 16);
    geo.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 3), 3),
    );
    const dome = new THREE.Mesh(
      geo,
      new THREE.MeshBasicMaterial({
        vertexColors: true,
        side: THREE.BackSide,
        fog: false,
        depthWrite: false,
      }),
    );
    dome.renderOrder = -1;
    g.add(dome);
    const cloudMat = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      emissive: 0x8a96a8,
      fog: false,
      transparent: true,
      opacity: 0.92,
    });
    const rnd = mulberry(5);
    const parts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 26; i++) {
      const a = rnd() * Math.PI * 2,
        r = 180 + rnd() * 300;
      const cx = Math.cos(a) * r,
        cz = Math.sin(a) * r,
        cy = 110 + rnd() * 70;
      const n = 3 + Math.floor(rnd() * 4);
      for (let k = 0; k < n; k++) {
        const b = new THREE.IcosahedronGeometry(10 + rnd() * 10, 1);
        b.scale(1.6, 0.55, 1);
        b.translate(cx + (k - n / 2) * 12 + rnd() * 6, cy + rnd() * 5, cz + rnd() * 10);
        parts.push(b);
      }
    }
    const clouds = new THREE.Mesh(mergeGeometries(parts, false)!, cloudMat);
    g.add(clouds);
    this.scene.add(g);
    this.sky = g;
    this.skyDome = dome;
  }
  private paintSky(horizon: THREE.Color, zenith: THREE.Color) {
    const dome = this.skyDome;
    if (!dome) return;
    const p = dome.geometry.attributes.position as THREE.BufferAttribute;
    const col = dome.geometry.attributes.color as THREE.BufferAttribute;
    const c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const y = Math.max(0, p.getY(i) / 560);
      c.copy(horizon).lerp(zenith, Math.pow(y, 0.55));
      col.setXYZ(i, c.r, c.g, c.b);
    }
    col.needsUpdate = true;
  }

  /** Indoors, the city outside is hidden: no flicker where the floor meets the ground,
      and much less to draw. Whatever was hidden for another reason stays hidden. */
  private hiddenOutside = new Map<THREE.Object3D, boolean>();
  private showOutside(out: boolean) {
    if (out) {
      for (const [o, v] of this.hiddenOutside) o.visible = v;
      this.hiddenOutside.clear();
      return;
    }
    if (this.hiddenOutside.size) return;
    const keep = new Set<THREE.Object3D>([
      this.player,
      this.marker,
      this.hemi,
      this.sun,
      this.sun.target,
      this.mallGroup,
    ]);
    if (this.guide) {
      keep.add(this.guide.arrow);
      keep.add(this.guide.arrow.userData.pin as THREE.Object3D);
    }
    for (const o of this.scene.children) {
      if (keep.has(o) || o.userData.indoors || (o as THREE.Light).isLight) continue;
      this.hiddenOutside.set(o, o.visible);
      o.visible = false;
    }
  }
  private applyLight() {
    this.showOutside(this.where === "out");
    const c = this.clock;
    if (!c) return;
    if (this.sky) this.sky.visible = this.where === "out";
    if (this.where !== "out") {
      this.sun.castShadow = false;
      this.sun.intensity = 0.5;
      this.sun.color.set(0xffe2b8);
      this.hemi.intensity = 1.25;
      this.hemi.color.set(0xffe6c8);
      this.scene.background = new THREE.Color(0x1a1612);
      (this.scene.fog as THREE.Fog).color.set(0x1a1612);
      return;
    }
    this.sun.castShadow = true;
    const dk = darkness(c);
    const t = c.times,
      m = c.min;
    const frac = Math.min(1, Math.max(0, (m - t.sunrise) / (t.maghrib - t.sunrise)));
    const a = frac * Math.PI;
    this.sun.userData.dir = new THREE.Vector3(
      Math.cos(a),
      Math.max(0.15, Math.sin(a)),
      0.35,
    ).normalize();
    const golden =
      Math.max(0, 1 - Math.abs(m - (t.maghrib - 25)) / 50) +
      Math.max(0, 1 - Math.abs(m - (t.sunrise + 20)) / 45) * 0.6;
    const day = new THREE.Color(0x9fd3e8),
      dusk = new THREE.Color(0xf0a868),
      night = new THREE.Color(0x0e1a33);
    const sky = day.clone().lerp(dusk, Math.min(1, golden)).lerp(night, dk);
    this.scene.background = sky;
    if (!this.sky) this.buildSky();
    const zenith = new THREE.Color(0x3f86c8)
      .lerp(new THREE.Color(0x5a5f9a), Math.min(1, golden) * 0.6)
      .lerp(new THREE.Color(0x050b1c), dk);
    this.paintSky(sky, zenith);
    const cm = (this.sky!.children[1] as THREE.Mesh).material as THREE.MeshLambertMaterial;
    cm.emissive
      .set(0x8a96a8)
      .lerp(new THREE.Color(0xd08a5a), Math.min(1, golden) * 0.7)
      .multiplyScalar(1 - dk * 0.85);
    cm.opacity = 0.92 - dk * 0.5;
    // a soft warm haze on the horizon in the day, like a sunny afternoon
    (this.scene.fog as THREE.Fog).color.copy(sky).lerp(new THREE.Color(0xf1dcc0), 0.35 * (1 - dk));
    this.sun.intensity = 2.4 * (1 - dk) + 0.45 * dk;
    this.sun.color
      .set(0xffe2b8)
      .lerp(new THREE.Color(0xffb070), Math.min(1, golden))
      .lerp(new THREE.Color(0x9fb4e8), dk);
    this.hemi.intensity = 1.15 - dk * 0.55;
    this.hemi.color.set(0xdde9f2).lerp(new THREE.Color(0x6a7fb8), dk);
    this.winMat.emissiveIntensity = dk * 1.6;
    this.lampMat.emissiveIntensity = dk * 2.2;
  }
}

function lerpAngle(a: number, b: number, t: number) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
