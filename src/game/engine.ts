import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  BILLBOARDS,
  STREETS,
  AD_EMAIL,
  DISTRICTS,
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
  MAT,
  MAT2,
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
} from "./humans";

/* IlmCity 3D engine: one Lekki district, three interiors, a car and walking neighbours.
   Everything is built from simple low-poly shapes so the first load stays small. */

export type InteriorKind = "masjid" | "home" | "madrasah" | "restaurant" | "mall";
export type Context = { id: string; label: string } | null;
export type EngineEvents = {
  onContext: (c: Context) => void;
  onAction: (id: string) => void;
  onPlace: (name: string) => void;
  /** The arrival drive into a new area started (true) or finished (false). */
  onCinematic?: (on: boolean) => void;
  onRide?: (info: { next: string; stopping: boolean; fast: boolean; kmh: number } | null) => void;
};

type Box = { x0: number; x1: number; z0: number; z1: number };
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
  const c = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4 * s, 0), mat(0x4f8a3f));
  c.position.y = 2.4 * s;
  c.castShadow = true;
  g.add(c);
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
function makeBus() {
  const bus = new THREE.Group();
  bus.add(box(8, 2.6, 2.6, 0xf2c230, 0, 0.5, 0));
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
  private sun = new THREE.DirectionalLight(0xfff1d6, 2.2);
  private hemi = new THREE.HemisphereLight(0xcfe6ff, 0x8a7a5a, 1.1);
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
    this.renderer.domElement.style.display = "block";
    this.renderer.domElement.style.touchAction = "none";
    host.appendChild(this.renderer.domElement);

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
    else this.player.position.copy(this.outPos);
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
  scenePlace() {
    return this.where;
  }
  playerPos() {
    return { x: this.player.position.x, z: this.player.position.z, where: this.where };
  }

  enterInterior(kind: InteriorKind, name = "") {
    this.interiorName = name;
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
    this.player.position.set(p.x, 0, p.z);
    this.player.visible = true;
  }
  dispose() {
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
  private buildDistrict(id: string) {
    const D = districtById(id);
    this.ox = D.origin.x;
    this.oz = D.origin.z;
    this.dg = new THREE.Group();
    this.dg.position.set(D.origin.x, 0, D.origin.z);
    this.scene.add(this.dg);
    this.areaGroups.push({ g: this.dg, x: D.origin.x, z: D.origin.z });
    const side = D.origin.x > 0 ? -1 : 1; // the end of the main street facing the City Junction
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
    road(0, (north + crossEnd) / 2, 12, crossEnd - north);
    for (let z = north; z < crossEnd; z += 6) {
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
    if (!D.landmarks.some((l) => l.kind === "market")) this.buildLocalMarket(D, XR);
    if (!D.landmarks.some((l) => l.kind === "home")) this.buildEstate(D, XR, rnd);

    // bus park
    this.buildBusPark(-72, 15);

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
    BILLBOARDS.filter((b) => b.district === D.id).forEach((b) => {
      while (si < spots.length) {
        const [x, z, r] = spots[si++];
        if (this.boxFree(x - 8, x + 8, z - 1.8, z + 1.8)) {
          this.billboard(b, x, z, r);
          break;
        }
      }
    });

    // a football pitch and the sisters' corner take three plots in a row
    const play = this.choosePlayPlots(D, zs, H, southEdge);
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
          const toLet = !land && !shops && rnd() < (st.toLet ?? D.toLet ?? 0.3);
          if (
            play &&
            ((play.sz === sz && play.north === north && play.xs.includes(x)) ||
              (play.police?.sz === sz && play.police.north === north && play.police.x === x))
          ) {
            // this plot is the pitch or the sisters' corner; draw the house it replaces into a
            // throwaway batch so every later plot keeps the same number and look as before
            const turn0 = north ? 0 : Math.PI;
            const ghost = shops
              ? shopRow(new Batch(), { x, z: cz, turn: turn0, rnd }).colliders
              : !land
                ? compound(new Batch(), { x, z: cz, turn: turn0, number: num, rnd }).colliders
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
          } else c = compound(batch, { x, z: cz, turn, number: num, rnd });
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
    this.buildEatery(D);
    this.buildRestaurant(D);
    if (D.id === "ikeja" || D.id === "lekki") this.buildDealer(D);
    if (D.id === "ikeja") this.buildMall(D);
    if (["lekki", "ikeja", "badore", "akoka", "ojo", "firstgate"].includes(D.id))
      this.buildCourt(D);
    if (play) this.buildPlay(D, play);
    const wires = new THREE.Group();
    zs.forEach((sz) => powerLine(batch, -XR, XR, sz - 9.8, wires));
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
            if (k % 2 === 0) batch.addObject(palm(x, z, 0.85));
            else {
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
      batch.addObject(rnd() < 0.55 ? palm(x, z, 0.8 + rnd() * 0.3) : tree(x, z, 0.9 + rnd() * 0.4));
      this.addCollider("out", x - 0.45, x + 0.45, z - 0.45, z + 0.45);
      n++;
    }

    // welcome gate where the expressway meets the main street
    this.welcomeGate(D, side);

    // neighbours walking the pavements
    const names = [
      "Brother Bilal",
      "Sister Khadijah",
      "Uncle Abdullahi",
      "Sister Maryam",
      "Brother Zayd",
      "Brother Hamzah",
      "Sister Aminah",
      "Alhaja Sekinat",
      "Brother Tajudeen",
      "Sister Rukayat",
    ];
    const robes = [
      0x4f7fc4, 0x5a3f6a, 0x3d8a5a, 0x2f4a7a, 0xb36a3a, 0x8a5fb0, 0x3f8f6a, 0x7d2f3a, 0xcdb38a,
      0x1f6f63,
    ];
    const start = Math.floor(rnd() * names.length);
    const routes: [number, number][][] = [];
    zs.forEach((sz) => {
      routes.push([
        [-(XR - 6), sz + 9],
        [XR - 6, sz + 9],
      ]);
      routes.push([
        [XR - 6, sz - 9],
        [-(XR - 6), sz - 9],
      ]);
    });
    routes.push([
      [9, north + 1],
      [9, crossEnd],
    ]);
    routes.push([
      [-9, crossEnd],
      [-9, north + 1],
    ]);
    routes.forEach((route, i) => {
      const k = (start + i) % names.length;
      const female = names[k].startsWith("Sister") || names[k].startsWith("Alhaja");
      const g = person(
        robes[k],
        female
          ? { hijab: [0xe9e2d0, 0x8a2f4f, 0x2a4a6a, 0xd8c8a8, 0x3d5a4a, 0x1d1d26][i % 6], seed: i }
          : { cap: 0xffffff, seed: i },
      );
      const tag = label(names[k], { size: 0.7, bold: false });
      tag.position.y = 2.65;
      g.add(tag);
      g.position.set(route[0][0], 0, route[0][1]);
      S.add(g);
      this.walkers.push({
        g,
        route,
        k: 1,
        wait: i * 0.8,
        t: 0,
        name: names[k],
        female,
        district: D.id,
      });
    });

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

    for (const m of batch.build()) S.add(m);
    this.ox = 0;
    this.oz = 0;
  }

  /** The whole city: every area, the expressways, the City Junction, ocean and lagoon. */
  private buildWorld() {
    const S = this.scene;
    const ground = new THREE.Mesh(groundGeo(2300, 2700, 10), MAT.grass());
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
    water(150, 105, 540, 20, true);
    this.colliders.out.push({ x0: 420, x1: 660, z0: -55, z1: 95 });
    // world edges
    this.colliders.out.push({ x0: -1100, x1: -800, z0: -1900, z1: 900 });
    this.colliders.out.push({ x0: 1060, x1: 1400, z0: -1900, z1: 900 });
    // the north edge: Ikorodu reaches further north than the rest of the city
    this.colliders.out.push({ x0: -1100, x1: 420, z0: -1900, z1: -680 });
    this.colliders.out.push({ x0: 420, x1: 1200, z0: -1900, z1: -1612 });

    DISTRICTS.forEach((d) => this.buildDistrict(d.id));

    // City Junction roundabout
    const ring = new THREE.Mesh(new THREE.RingGeometry(16, 30, 48), mat(PALETTE.road));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.04;
    ring.receiveShadow = true;
    S.add(ring);
    const island = new THREE.Mesh(new THREE.CircleGeometry(16, 40), mat(0x7f9e52));
    island.rotation.x = -Math.PI / 2;
    island.position.y = 0.05;
    S.add(island);
    const monument = new THREE.Group();
    monument.add(box(3, 1, 3, 0xd9d1bd));
    const pillar = cyl(0.8, 1.1, 9, 0xece6d6, 8);
    pillar.position.y = 5.5;
    monument.add(pillar);
    const top = crescent();
    top.scale.setScalar(2);
    top.position.set(-0.4, 11.4, 0);
    monument.add(top);
    S.add(monument);
    this.colliders.out.push({ x0: -3, x1: 3, z0: -3, z1: 3 });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      S.add(palm(Math.cos(a) * 11, Math.sin(a) * 11, 0.9));
    }
    const jl = label("City Junction", { bg: "rgba(31,111,99,0.9)", size: 1.6 });
    jl.position.set(0, 14, 0);
    S.add(jl);

    // roads joining linked areas (Ikorodu Road, Isheri–Igando Road, Ajah–Badore Road)
    for (const d of DISTRICTS) {
      if (!d.parent) continue;
      const p = districtById(d.parent);
      const east = d.link === "east";
      // a = along the road, from the parent to this area
      const a0 = east ? p.origin.x + halfOf(p).x - 6 : p.origin.z - (halfOf(p).z - 4);
      const a1 = east ? d.origin.x - halfOf(d).x + 6 : d.origin.z + halfOf(d).z - 7;
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
      const [ax, az] = this.roadEnd(d);
      const len0 = Math.hypot(ax, az);
      this.expressway((ax / len0) * 24, (az / len0) * 24, ax, az, d.highway);
    });
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
      } else {
        const [ax, az] = this.roadEnd(d);
        const L = Math.hypot(ax, az);
        [x0, z0, x1, z1] = [(ax / L) * 40, (az / L) * 40, ax - (ax / L) * 30, az - (az / L) * 30];
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

  /* ---------------- the megacity ---------------- */
  /** Every road between areas, as straight segments (for keeping buildings off them). */
  private roadSegments() {
    const segs: [number, number, number, number][] = [];
    for (const d of DISTRICTS) {
      if (d.parent) {
        const p = districtById(d.parent);
        if (d.link === "east")
          segs.push([p.origin.x + halfOf(p).x, d.origin.z, d.origin.x - halfOf(d).x, d.origin.z]);
        else
          segs.push([d.origin.x, p.origin.z - halfOf(p).z, d.origin.x, d.origin.z + halfOf(d).z]);
      } else {
        const [ax, az] = this.roadEnd(d);
        segs.push([0, 0, ax, az]);
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
      if (Math.hypot(x - 540, z - 20) < 85) return true; // the small lagoon
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
            b.box(13, 0.15, 12, MAT2.lawn(), lx, 0.02, lz);
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
    const side = d.origin.x > 0 ? -1 : 1;
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
        } else if (Math.abs(x - d.origin.x) < 12 && z > d.origin.z && z < p.origin.z)
          return d.highway;
        continue;
      }
      const [ax, az] = this.roadEnd(d);
      const t = Math.max(0, Math.min(1, (x * ax + z * az) / (ax * ax + az * az)));
      if (Math.hypot(x - ax * t, z - az * t) < 11) return d.highway;
    }
    return Math.hypot(x, z) < 34 ? "City Junction" : null;
  }

  private reserved: Box[] = [];
  private worldBatch = new Batch();
  private areaGroups: { g: THREE.Group; x: number; z: number }[] = [];
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
    if (l.kind === "masjid") this.buildMasjid(l.x, sz - 23, l);
    else if (l.kind === "school") this.buildSchool(l.x, sz - 20, l);
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
    this.tennis.dispose();
    this.tennis = null;
    this.snapCamera();
  }
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
    const sd = kind === "shop" ? 3.95 : 2.15;
    sign.position.set(center.x + ux * sd, kind === "shop" ? 4.25 : 2.75, center.z + uz * sd);
    sign.rotation.y = ry;
    parent.add(sign);
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
        this.reserved.push({ x0: x - W / 2, x1: x + W / 2, z0: z - Dp / 2, z1: z + Dp / 2 });
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
    const sz = m?.sz ?? 0;
    const x0 = m?.x ?? 0;
    const xs: number[] = [];
    for (let k = 3; k < 34; k++) xs.push(k * 6, -k * 6);
    for (const north of [m?.north ?? true, !(m?.north ?? true)])
      for (const off of [Dp / 2 + 6.4, Dp / 2 + 7.4, Dp / 2 + 9])
        for (const dx of xs) {
          const x = x0 + dx,
            z = sz + (north ? -off : off);
          if (Math.abs(x) < 14 || Math.abs(x) > halfOf(D).x - W / 2 - 6) continue;
          if (!this.boxFree(x - W / 2 - 0.4, x + W / 2 + 0.4, z - Dp / 2 - 0.4, z + Dp / 2 + 0.4))
            continue;
          this.reserved.push({ x0: x - W / 2, x1: x + W / 2, z0: z - Dp / 2, z1: z + Dp / 2 });
          this.addCollider("out", x - W / 2, x + W / 2, z - Dp / 2, z + Dp / 2);
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

  /** A fenced tennis court beside the market street. */
  private courts = new Map<string, Court>();
  private buildCourt(D: District) {
    const W = 15,
      Dp = 30;
    // the court runs along the street (x), so its long side faces the road
    const lot = this.findLot(D, Dp, W);
    if (!lot) return;
    const { x, z, north, fz } = lot;
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(Dp, W), mat(0x3f7f5c));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0.03;
    ground.receiveShadow = true;
    g.add(ground);
    const len = 23.8,
      wid = 8.2;
    const { mesh: surf } = canvasPlane(
      len + 2,
      wid + 2,
      (c, CW, CH) => {
        c.fillStyle = "#2f6fa8";
        c.fillRect(0, 0, CW, CH);
        const sx = CW / (len + 2),
          sy = CH / (wid + 2);
        c.strokeStyle = "#ffffff";
        c.lineWidth = Math.max(3, sx * 0.08);
        c.strokeRect(sx, sy, len * sx, wid * sy);
        const s1 = sx * (1 + len / 2 - 6.4),
          s2 = sx * (1 + len / 2 + 6.4);
        c.beginPath();
        c.moveTo(s1, sy);
        c.lineTo(s1, sy * (1 + wid));
        c.moveTo(s2, sy);
        c.lineTo(s2, sy * (1 + wid));
        c.moveTo(s1, CH / 2);
        c.lineTo(s2, CH / 2);
        c.stroke();
      },
      1024,
    );
    surf.rotation.x = -Math.PI / 2;
    surf.position.y = 0.05;
    surf.receiveShadow = true;
    g.add(surf);
    for (const pz of [-wid / 2 - 0.6, wid / 2 + 0.6])
      g.add(box(0.1, 1.07, 0.1, 0x3a3f46, 0, 0, pz));
    const net = new THREE.Mesh(
      new THREE.PlaneGeometry(wid + 1.2, 0.9),
      new THREE.MeshBasicMaterial({
        color: 0x1d1d26,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
      }),
    );
    net.rotation.y = Math.PI / 2;
    net.position.set(0, 0.5, 0);
    g.add(net, box(0.05, 0.06, wid + 1.2, 0xffffff, 0, 0.93, 0));
    const fence = new THREE.MeshBasicMaterial({
      color: 0x2a3a2a,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });
    for (const [fx, fzz, fw, rot] of [
      [0, -W / 2, Dp, 0],
      [-Dp / 2, 0, W, Math.PI / 2],
      [Dp / 2, 0, W, Math.PI / 2],
    ] as [number, number, number, number][]) {
      const f = new THREE.Mesh(new THREE.PlaneGeometry(fw, 3), fence);
      f.position.set(fx, 1.5, north ? fzz : -fzz);
      f.rotation.y = rot;
      g.add(f);
    }
    const sign = this.signBoard("Tennis Court · all welcome", 7, 0.9, "#2f6fa8", "#ffffff");
    sign.position.set(0, 3.4, north ? W / 2 - 0.2 : -W / 2 + 0.2);
    if (!north) sign.rotation.y = Math.PI;
    g.add(sign);
    this.dg.add(g);
    const id = "tennis:" + D.id;
    this.courts.set(id, { x: x + this.ox, z: z + this.oz, turn: 0, len, wid });
    this.zones.push({
      id,
      label: "Play tennis",
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
          const c = compound(this.curBatch, {
            x: cx,
            z: cz,
            turn: north ? 0 : Math.PI,
            number: 1,
            rnd,
            floors: 3,
            width: 24,
            wall: 0xe8dcb5,
          });
          for (const b of c.colliders) this.addCollider("out", b.x0, b.x1, b.z0, b.z1);
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
          const t = label(`${D.name} Estate · flats`, { size: 1, bg: "rgba(31,111,99,0.92)" });
          t.position.set(c.gate.x, 5, c.gate.z);
          this.dg.add(t);
          return;
        }
      }
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
    const z = this.zones.find((zz) => zz.id === "plot:" + id);
    const p = this.plots.find((q) => q.id === id);
    if (z) this.player.position.set(z.x, 0, z.z);
    if (p) this.district = districtById(p.district);
    this.enterInterior("home", name);
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

  private buildBusPark(x: number, z: number) {
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
    bus.add(box(8, 2.6, 2.6, 0xf2c230, 0, 0.5, 0));
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
  travel(id: string, byCar: boolean) {
    const D = districtById(id);
    this.where = "out";
    this.district = D;
    this.driving = false;
    this.player.visible = false;
    this.tapTarget = null;
    this.marker.visible = false;
    const side = D.origin.x > 0 ? -1 : 1;
    const W = (x: number, z: number) => new THREE.Vector3(D.origin.x + x, 0, D.origin.z + z);
    let vehicle: THREE.Group;
    let path: THREE.Vector3[];
    const Hz = halfOf(D).z,
      Hx = halfOf(D).x;
    const dside = D.link === "east" ? -1 : side;
    if (byCar) {
      vehicle = this.car;
      path =
        D.parent && D.link !== "east"
          ? [W(3, Hz + 40), W(3, 20), W(-4, 9.8), W(-16, 9.8)]
          : [W(dside * (Hx + 38), -3), W(dside * 40, -3), W(-4, 9.8), W(-16, 9.8)];
    } else {
      vehicle = makeBus();
      this.scene.add(vehicle);
      path =
        D.parent && D.link !== "east"
          ? [W(3, Hz + 40), W(3, 20), W(-6, 9.6), W(-52, 9.6)]
          : [W(dside * (Hx + 38), 3), W(dside * 40, 3), W(-6, 9.6), W(-52, 9.6)];
    }
    vehicle.position.copy(path[0]);
    vehicle.rotation.y = D.parent && D.link !== "east" ? Math.PI / 2 : dside > 0 ? Math.PI : 0;
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
      this.player.position.set(o.x - 16, 0, o.z + 13);
    } else {
      c.vehicle.removeFromParent();
      this.player.position.set(o.x - 54, 0, o.z + 13.5);
    }
    this.player.rotation.y = Math.PI;
    this.camYaw = 0;
    this.player.visible = true;
    this.ev.onCinematic?.(false);
  }

  private welcomeGate(D: District, side: number) {
    const H = halfOf(D);
    const north = !!D.parent && D.link !== "east";
    const gx = north ? 0 : side * (H.x - 18);
    const gz = north ? H.z - 14 : 0;
    const g = new THREE.Group();
    g.position.set(gx, 0, gz);
    g.rotation.y = north ? 0 : (side * Math.PI) / 2;
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
    const to = D.parent ? fullName(districtById(D.parent)) : "City Junction";
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
    this.where = "out";
    this.district = D;
    this.player.position.set(D.origin.x - 9, 0, D.origin.z + 17);
    this.player.rotation.y = Math.PI;
    this.car.position.set(D.origin.x - 16, 0, D.origin.z + 9.8);
    this.carHeading = Math.PI;
    this.car.rotation.y = Math.PI;
    this.camYaw = 0;
    this.snapCamera();
  }
  /** Dress your character: brother or sister, skin tone and clothes. */
  setPlayerLook(o: { female: boolean; skin: number; robe: number; accent: number }) {
    const fresh = o.female
      ? person(o.robe, { hijab: o.accent, skin: o.skin, seed: 2 })
      : person(o.robe, { cap: o.accent, skin: o.skin, seed: 1, outfit: "thobe", beard: true });
    for (const c of [...this.player.children]) {
      this.player.remove(c);
      forgetHuman(c);
    }
    for (const c of [...fresh.children]) this.player.add(c);
    this.player.userData = { ...fresh.userData };
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
    const mesh = vehicleMesh("keke", 0xf2c230);
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
      look: { female: boolean; skin: number; robe: number; accent: number };
      x: number;
      z: number;
      h: number;
      moving: boolean;
    }[],
  ) {
    const seen = new Set<string>();
    for (const p of list) {
      seen.add(p.uid);
      const key = JSON.stringify(p.look);
      let r = this.remotes.get(p.uid);
      if (r && r.look !== key) {
        r.g.removeFromParent();
        r.g.traverse((c) => forgetHuman(c));
        this.remotes.delete(p.uid);
        r = undefined;
      }
      if (!r) {
        const g = p.look.female
          ? person(p.look.robe, { hijab: p.look.accent, skin: p.look.skin, seed: 2 })
          : person(p.look.robe, {
              cap: p.look.accent,
              skin: p.look.skin,
              seed: 1,
              outfit: "thobe",
              beard: true,
            });
        const tag = label("● " + p.name, { size: 0.75, bg: "rgba(230,184,74,0.95)" });
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
        c.fillText("YOUR ADVERT HERE", W / 2, H * 0.36);
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
    const { mesh, tex, canvas } = canvasPlane(PW, PW * 0.4, draw, 1000);
    mesh.position.set(0, 3.8 + 1.95, -0.3);
    mesh.userData.tap = "billboard:" + b.id;
    faces[0].add(mesh);
    const twin = new THREE.Mesh(mesh.geometry, mesh.material);
    twin.position.copy(mesh.position);
    twin.userData.tap = mesh.userData.tap;
    faces[1].add(twin);
    this.tappables.push(twin);
    const paint = () => {
      const c = canvas.getContext("2d")!;
      draw(c, canvas.width, canvas.height);
      tex.needsUpdate = true;
      if (b.ad?.imageUrl) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          c.drawImage(img, 0, 0, canvas.width, canvas.height);
          tex.needsUpdate = true;
        };
        img.src = b.ad.imageUrl;
      }
    };
    if (b.ad?.imageUrl) paint();
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
  private room(kind: InteriorKind, W: number, D: number, wall: number, floor: number) {
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
    g.add(box(W / 2 - 1.5, 0.8, 0.4, wall, -W / 4 - 0.75, 0, D / 2));
    g.add(box(W / 2 - 1.5, 0.8, 0.4, wall, W / 4 + 0.75, 0, D / 2));
    const light = new THREE.PointLight(0xffe2b0, 40, 30, 1.6);
    light.position.set(0, 4.5, 0);
    g.add(light);
    this.scene.add(g);
    this.addCollider(kind, o.x - W / 2 - 5, o.x - W / 2 + 0.6, o.z - D / 2 - 5, o.z + D / 2 + 5);
    this.addCollider(kind, o.x + W / 2 - 0.6, o.x + W / 2 + 5, o.z - D / 2 - 5, o.z + D / 2 + 5);
    this.addCollider(kind, o.x - W / 2 - 5, o.x + W / 2 + 5, o.z - D / 2 - 5, o.z - D / 2 + 0.6);
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
    return { g, o };
  }
  private homeItems = new Map<string, { obj: THREE.Object3D; boxes: Box[]; zone?: Zone }>();
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
        fn.position.set(7.4, 0, 4.6);
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
      const tt = label("Ustadh Ibrahim", { size: 0.7, bold: false });
      tt.position.set(0, 2.5, -6);
      g.add(tt);
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
    this.update(dt, now / 1000);
    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this.loop);
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
  private signMat(kind: "tolet" | "land" | "sold" | "building" | "mine") {
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
      sold: ["#1f6f63", "#fff", "SOLD", "Your land"],
      building: ["#f2c230", "#2a1c05", "UNDER", "CONSTRUCTION"],
      mine: ["#1f6f63", "#fff", "YOURS", "Tap to manage"],
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
  private signboard(
    kind: "tolet" | "land" | "sold" | "building" | "mine",
    x: number,
    z: number,
    turn: number,
    high = false,
  ) {
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

  /** Show a plot as it now is: for rent, rented by you, land, building, or built. */
  setPlot(
    id: string,
    state: { kind: "tolet" | "rented" | "land" | "owned" | "building" | "built"; floors?: number },
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
    const putSign = (k: "tolet" | "land" | "sold" | "building" | "mine", onWall = false) => {
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
    };
    fx.zone.label = labels[state.kind];
    if (state.kind === "tolet") putSign("tolet", true);
    else if (state.kind === "rented") putSign("mine", true);
    else if (state.kind === "land") putSign("land");
    else if (state.kind === "owned") putSign("sold");
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
        });
        for (const m of b.build()) g.add(m);
        if (state.kind === "building") {
          // a site in progress: the walls stand, wrapped in bamboo scaffolding
          g.scale.y = 0.55;
          const sc = new THREE.Mesh(
            new THREE.BoxGeometry(16, 7, 12),
            new THREE.MeshStandardMaterial({ color: 0xb08a4a, wireframe: true }),
          );
          sc.position.set(p.x, 3.5 / 0.55, p.z + (turn === 0 ? -3 : 3));
          g.add(sc);
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
    states: Record<string, { kind: "rented" | "owned" | "building" | "built"; floors?: number }>,
  ) {
    for (const id of this.plotFx.keys()) {
      const p = this.plots.find((q) => q.id === id)!;
      this.setPlot(id, states[id] ?? { kind: p.kind === "land" ? "land" : "tolet" });
    }
  }
  plotInfo(id: string) {
    return this.plots.find((q) => q.id === id) ?? null;
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
        label: "Wait for a danfo",
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
        this.player.position.set(stop.x, 0, stop.z);
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
    this.stepTraffic(dt);
    this.stepRemotes(dt);
    tickHumans(dt, this.camera);
    // only draw areas near the camera
    if (this.where === "out")
      for (const a of this.areaGroups)
        a.g.visible =
          Math.hypot(this.camera.position.x - a.x, this.camera.position.z - a.z) < this.viewDist;

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
      if (this.personAhead(wx, wz, ux, uz, w.g)) {
        s *= 0.25;
        w.g.position.x += -uz * 1.6 * dt;
        w.g.position.z += ux * 1.6 * dt;
      }
      w.g.position.x += ux * s;
      w.g.position.z += uz * s;
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
      best = { id: "board", label: "Board the danfo", x: 0, z: 0, r: 0, scene: "out" };
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
      if (kk) best = { id: "keke", label: "Take a keke", x: 0, z: 0, r: 0, scene: "out" };
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
      place = `${fullName(area)} · ${area.state}`;
      const lz = pos.z - area.origin.z;
      const st = area.streets.find((s2) => Math.abs(lz - s2.z) < 7);
      if (st) place = `${STREETS[st.id]?.name ?? ""}, ${fullName(area)}`;
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
      const speed = 7.5 * Math.min(1, dir.length());
      const n = dir.clone().normalize();
      const nx = this.player.position.x + n.x * speed * dt,
        nz = this.player.position.z + n.z * speed * dt;
      if (
        this.free(nx, this.player.position.z, 0.5) &&
        !this.bumpsPerson(nx, this.player.position.z)
      )
        this.player.position.x = nx;
      if (
        this.free(this.player.position.x, nz, 0.5) &&
        !this.bumpsPerson(this.player.position.x, nz)
      )
        this.player.position.z = nz;
      const targetRot = Math.atan2(n.x, n.z);
      this.player.rotation.y = lerpAngle(this.player.rotation.y, targetRot, Math.min(1, dt * 12));
      // the camera swings round behind you when you walk forward
      if (this.where === "out" && (v.y > 0.4 || (v.lengthSq() === 0 && this.tapTarget)))
        this.followYaw = targetRot + Math.PI;
      this.walkT += dt;
      animatePerson(this.player, this.walkT * 9, 1, speed);
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

  private applyLight() {
    const c = this.clock;
    if (!c) return;
    if (this.sky) this.sky.visible = this.where === "out";
    if (this.where !== "out") {
      this.sun.castShadow = false;
      this.sun.intensity = 0.5;
      this.sun.color.set(0xfff1d6);
      this.hemi.intensity = 1.2;
      this.hemi.color.set(0xfff0dc);
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
    (this.scene.fog as THREE.Fog).color.copy(sky);
    this.sun.intensity = 2.4 * (1 - dk) + 0.45 * dk;
    this.sun.color
      .set(0xfff1d6)
      .lerp(new THREE.Color(0xffb070), Math.min(1, golden))
      .lerp(new THREE.Color(0x9fb4e8), dk);
    this.hemi.intensity = 1.15 - dk * 0.55;
    this.hemi.color.set(0xcfe6ff).lerp(new THREE.Color(0x6a7fb8), dk);
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
