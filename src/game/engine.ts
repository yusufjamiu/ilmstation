import * as THREE from "three";
import {
  BILLBOARDS,
  STREETS,
  AD_EMAIL,
  DISTRICTS,
  districtById,
  type Billboard,
  type District,
  type Landmark,
} from "./content";
import { darkness, type Clock } from "./time";
import { Batch, MAT, compound, groundGeo, powerLine, type Compound } from "./buildings";
import { humansReady, makeHuman, setGait, sitHuman, tickHumans, type Outfit } from "./humans";

/* IlmCity 3D engine: one Lekki district, three interiors, a car and walking neighbours.
   Everything is built from simple low-poly shapes so the first load stays small. */

export type InteriorKind = "masjid" | "home" | "madrasah";
export type Context = { id: string; label: string } | null;
export type EngineEvents = {
  onContext: (c: Context) => void;
  onAction: (id: string) => void;
  onPlace: (name: string) => void;
  /** The arrival drive into a new area started (true) or finished (false). */
  onCinematic?: (on: boolean) => void;
};

type Box = { x0: number; x1: number; z0: number; z1: number };
type Zone = {
  id: string;
  label: string;
  x: number;
  z: number;
  r: number;
  scene: "out" | InteriorKind;
};
type Walker = { g: THREE.Group; route: [number, number][]; k: number; wait: number; t: number };

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
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, toneMapped: false }),
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
  private colliders: Record<string, Box[]> = { out: [], masjid: [], home: [], madrasah: [] };
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
  };
  private input = new THREE.Vector2();
  private keys = new Set<string>();
  private tapTarget: THREE.Vector3 | null = null;
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
    const rnd = mulberry(D.id.length * 97 + D.name.charCodeAt(0));

    // Lekki's beach and the ocean
    const southEdge = D.lagoon ? 76 : 99;
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
      road(0, st.z, st.z === 0 ? 214 : 200, 12);
      for (let x = -96; x < 96; x += 6) {
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
    road(0, (-96 + crossEnd) / 2, 12, crossEnd + 96);
    for (let z = -96; z < crossEnd; z += 6) {
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

    // bus park
    this.buildBusPark(-72, 15);

    // billboards beside the main street
    const spots: [number, number][] = [
      [14, -14],
      [70, -14],
      [-72, -14],
      [44, -14],
      [-14, 15],
    ];
    let si = 0;
    BILLBOARDS.filter((b) => b.district === D.id).forEach((b) => {
      while (si < spots.length) {
        const [x, z] = spots[si++];
        if (this.boxFree(x - 6, x + 6, z - 1.5, z + 1.5)) {
          this.billboard(b, x, z);
          break;
        }
      }
    });

    // Lagos compounds line both sides of every street
    zs.forEach((sz, si) => {
      let num = 1 + si * 40;
      for (const north of [true, false]) {
        const cz = north ? sz - 21.5 : sz + 21.5;
        if (!north && cz + 10 > southEdge - 3) continue;
        for (let x = -86; x <= 86; x += 24) {
          if (Math.abs(x) < 16) continue;
          if (!this.boxFree(x - 11, x + 11, cz - 10, cz + 10)) continue;
          if (zs.some((z2) => z2 !== sz && Math.abs(cz - z2) < 18)) continue;
          const c = compound(batch, {
            x,
            z: cz,
            turn: north ? 0 : Math.PI,
            number: num,
            rnd,
          });
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
            district: D.id,
            street: STREETS[D.streets[si].id].name,
            x,
            z: cz,
          });
        }
      }
    });
    const wires = new THREE.Group();
    zs.forEach((sz) => powerLine(batch, -95, 95, sz - 9.8, wires));
    S.add(wires);

    // street lamps
    const lampPole = new THREE.CylinderGeometry(0.08, 0.1, 5, 6),
      lampHead = new THREE.SphereGeometry(0.32, 8, 6);
    const lamps: [number, number][] = [];
    zs.forEach((sz) => {
      for (let x = -90; x <= 90; x += 20) {
        if (Math.abs(x) <= 8) continue;
        if (this.boxFree(x - 0.5, x + 0.5, sz + 7.5, sz + 8.5)) lamps.push([x, sz + 8]);
        if (this.boxFree(x + 9.5, x + 10.5, sz - 8.5, sz - 7.5)) lamps.push([x + 10, sz - 8]);
      }
    });
    const poleMesh = new THREE.InstancedMesh(lampPole, mat(0x5a5f66), lamps.length);
    const headMesh = new THREE.InstancedMesh(lampHead, this.lampMat, lamps.length);
    const m4 = new THREE.Matrix4();
    lamps.forEach(([x, z], i) => {
      m4.makeTranslation(x, 2.5, z);
      poleMesh.setMatrixAt(i, m4);
      m4.makeTranslation(x, 5.1, z);
      headMesh.setMatrixAt(i, m4);
    });
    S.add(poleMesh, headMesh);

    // greenery
    const clear = (x: number, z: number) =>
      this.free(x + this.ox, z + this.oz, 3) &&
      Math.abs(x) > 10 &&
      Math.abs(z) > 12 &&
      zs.every((sz) => Math.abs(z - sz) > 11) &&
      z < southEdge - 8;
    let n = 0;
    for (let i = 0; i < 700 && n < 60; i++) {
      const x = -96 + rnd() * 192,
        z = -96 + rnd() * (southEdge + 80);
      if (!clear(x, z)) continue;
      batch.addObject(rnd() < 0.55 ? palm(x, z, 0.8 + rnd() * 0.3) : tree(x, z, 0.9 + rnd() * 0.4));
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
        [-90, sz + 9],
        [90, sz + 9],
      ]);
      routes.push([
        [90, sz - 9],
        [-90, sz - 9],
      ]);
    });
    routes.push([
      [9, -95],
      [9, crossEnd],
    ]);
    routes.push([
      [-9, crossEnd],
      [-9, -95],
    ]);
    routes.forEach((route, i) => {
      const k = (start + i) % names.length;
      const female = names[k].startsWith("Sister") || names[k].startsWith("Alhaja");
      const g = person(
        robes[k],
        female
          ? { hijab: [0xe9e2d0, 0xf1ece0, 0xe8d9b0][i % 3], seed: i }
          : { cap: 0xffffff, seed: i },
      );
      const tag = label(names[k], { size: 0.7, bold: false });
      tag.position.y = 2.25;
      g.add(tag);
      g.position.set(route[0][0], 0, route[0][1]);
      S.add(g);
      this.walkers.push({ g, route, k: 1, wait: i * 0.8, t: 0 });
    });

    for (const m of batch.build()) S.add(m);
    this.ox = 0;
    this.oz = 0;
  }

  /** The whole city: every area, the expressways, the City Junction, ocean and lagoon. */
  private buildWorld() {
    const S = this.scene;
    const ground = new THREE.Mesh(groundGeo(1800, 1700, 10), MAT.grass());
    ground.position.set(50, -0.01, 0);
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
    this.colliders.out.push({ x0: -1100, x1: -800, z0: -900, z1: 900 });
    this.colliders.out.push({ x0: 860, x1: 1200, z0: -900, z1: 900 });
    this.colliders.out.push({ x0: -1100, x1: 1200, z0: -900, z1: -680 });

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

    // expressways from the junction to the end of each main street
    DISTRICTS.forEach((d) => {
      const [ax, az] = this.roadEnd(d);
      const len0 = Math.hypot(ax, az);
      this.expressway((ax / len0) * 24, (az / len0) * 24, ax, az, d.highway);
    });
    for (const m of this.worldBatch.build()) this.scene.add(m);
  }

  /** Where an area's main street meets its expressway. */
  private roadEnd(d: District): [number, number] {
    const side = d.origin.x > 0 ? -1 : 1;
    return [d.origin.x + side * 106, d.origin.z];
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
      DISTRICTS.find((d) => Math.abs(x - d.origin.x) < 112 && Math.abs(z - d.origin.z) < 100) ??
      null
    );
  }
  /** Which expressway the player is on, if any. */
  private roadAt(x: number, z: number) {
    for (const d of DISTRICTS) {
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
  plots: (Compound & { district: string; street: string; x: number; z: number })[] = [];
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
    else this.buildSouq(l.x, sz - 19, l);
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
    if (byCar) {
      vehicle = this.car;
      path = [W(side * 150, -3), W(side * 40, -3), W(-4, 9.8), W(-16, 9.8)];
    } else {
      vehicle = makeBus();
      this.scene.add(vehicle);
      path = [W(side * 150, 3), W(side * 40, 3), W(-6, 9.6), W(-52, 9.6)];
    }
    vehicle.position.copy(path[0]);
    vehicle.rotation.y = side > 0 ? Math.PI : 0;
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
    const gx = side * 94;
    const g = new THREE.Group();
    g.position.set(gx, 0, 0);
    g.rotation.y = (side * Math.PI) / 2;
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
      this.addCollider("out", gx - 0.8, gx + 0.8, -x * side - 0.8, -x * side + 0.8);
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
        c.fillText(`Welcome to ${D.name}`, W / 2, H * 0.42);
        c.fillStyle = "#e6b84a";
        c.font = `600 ${Math.round(H * 0.2)}px "Work Sans", system-ui, sans-serif`;
        c.fillText(`${D.state} State · IlmCity`, W / 2, H * 0.78);
      },
      1400,
    );
    mesh.position.set(0, 6.7, 0.37);
    g.add(mesh);
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
    return this.carArea() === this.district.id;
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
    const pole = cyl(0.07, 0.07, 3.4, 0x5a5f66, 6);
    pole.position.y = 1.7;
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

  private billboard(b: Billboard, bx: number, bz: number) {
    const g = new THREE.Group();
    g.position.set(bx, 0, bz);
    [-2.6, 2.6].forEach((px) => {
      const p = box(0.35, 4, 0.35, 0x5a5f66, px, 0, -0.3);
      g.add(p);
    });
    g.add(box(10.6, 4.6, 0.4, 0x2e3338, 0, 3.8, -0.5));
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
    const { mesh, tex, canvas } = canvasPlane(10, 4, draw, 1000);
    mesh.position.set(0, 3.8 + 2.3, -0.28);
    mesh.userData.tap = "billboard:" + b.id;
    g.add(mesh);
    if (b.ad?.imageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const c = canvas.getContext("2d")!;
        c.drawImage(img, 0, 0, canvas.width, canvas.height);
        tex.needsUpdate = true;
      };
      img.src = b.ad.imageUrl;
    }
    this.tappables.push(mesh);
    this.dg.add(g);
    this.addCollider("out", bx - 5.5, bx + 5.5, bz - 1, bz + 1);
  }

  private buildCar() {
    const g = this.car;
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
    g.add(tag);
    g.position.set(-16, 0, 9.8);
    g.rotation.y = this.carHeading;
    this.scene.add(g);
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
    // Home
    {
      const { g, o } = this.room("home", 20, 14, 0xe9dcc4, 0xb98d5e);
      const bed = new THREE.Group();
      bed.add(box(3.2, 0.6, 4.2, 0x6d4a2b));
      bed.add(box(3, 0.4, 4, 0xf4efe4, 0, 0.6));
      bed.add(box(1, 0.3, 0.6, 0xe0d4c0, -0.8, 1, -1.6));
      bed.add(box(1, 0.3, 0.6, 0xe0d4c0, 0.8, 1, -1.6));
      bed.add(box(3.1, 0.15, 2.4, 0x1f6f63, 0, 1, 0.7));
      bed.position.set(-7, 0, -4);
      this.solid("home", g, bed, 3.4, 4.4);
      const k = new THREE.Group();
      k.add(box(6, 1.8, 1.2, 0xf1ece0));
      k.add(box(6, 0.12, 1.3, 0x3a3f46, 0, 1.8));
      k.add(box(1.6, 0.6, 0.9, 0x9a9fa6, 1.6, 1.92));
      k.add(box(1, 3.6, 1.2, 0xd9dde0, 3.6, 0));
      k.position.set(5.5, 0, -6);
      this.solid("home", g, k, 8.6, 1.4);
      const rug = new THREE.Mesh(new THREE.PlaneGeometry(6, 4), mat(0x7d2f3a));
      rug.rotation.x = -Math.PI / 2;
      rug.position.set(1, 0.02, 1);
      g.add(rug);
      const rugB = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 3.2), mat(0xe6b84a));
      rugB.rotation.x = -Math.PI / 2;
      rugB.position.set(1, 0.03, 1);
      g.add(rugB);
      const rugC = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 2.6), mat(0x7d2f3a));
      rugC.rotation.x = -Math.PI / 2;
      rugC.position.set(1, 0.04, 1);
      g.add(rugC);
      [
        [-2.4, 1],
        [4.4, 1],
      ].forEach(([x, z]) => {
        const c = box(0.9, 0.5, 3.4, 0x1f6f63, x, 0, z);
        this.solid("home", g, c, 1, 3.6);
      });
      const pmat = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.2), mat(0x2f8f83));
      pmat.rotation.x = -Math.PI / 2;
      pmat.position.set(-7.5, 0.03, 3.5);
      g.add(pmat);
      const tbl = box(1.6, 0.5, 1, 0x8a5a3a, 1, 0, 1);
      this.solid("home", g, tbl, 1.6, 1);
      this.zones.push({
        id: "sleep",
        label: "Rest in bed",
        x: o.x - 7,
        z: o.z - 1.2,
        r: 2,
        scene: "home",
      });
      this.zones.push({
        id: "eat",
        label: "Cook and eat",
        x: o.x + 5.5,
        z: o.z - 4.6,
        r: 2.2,
        scene: "home",
      });
      this.zones.push({
        id: "prayermat",
        label: "Prayer corner",
        x: o.x - 7.5,
        z: o.z + 3.5,
        r: 1.8,
        scene: "home",
      });
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
    if (this.driving) return { d: portrait ? 12 : 10, h: 4.6 };
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

  private free(x: number, z: number, r: number) {
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

  private loop = (now: number) => {
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
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

  private update(dt: number, t: number) {
    const v = this.moveVec();
    if (this.cine) this.stepCinematic(dt);
    else if (this.driving) this.drive(v, dt);
    else this.walk(v, dt, t);

    tickHumans(dt, this.camera);
    // only draw areas near the camera
    if (this.where === "out")
      for (const a of this.areaGroups)
        a.g.visible = Math.hypot(this.camera.position.x - a.x, this.camera.position.z - a.z) < 300;

    // neighbours
    for (const w of this.walkers) {
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
      const s = Math.min(d, 2.2 * dt);
      w.g.position.x += (dx / d) * s;
      w.g.position.z += (dz / d) * s;
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
    this.camera.lookAt(target.x, this.where === "out" ? 1.6 : 1, target.z);
    this.sun.target.position.set(target.x, 0, target.z);
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
    if (this.cine) best = null;
    else if (this.driving)
      best = { id: "car-exit", label: "Get out of the car", x: 0, z: 0, r: 0, scene: "out" };
    else
      for (const z of this.zones) {
        if (z.scene !== this.where) continue;
        const dd =
          z.id === "car"
            ? Math.hypot(this.car.position.x - pos.x, this.car.position.z - pos.z)
            : Math.hypot(z.x - pos.x, z.z - pos.z);
        if (dd < z.r && dd < bd) {
          best = z;
          bd = dd;
        }
      }
    if (!this.cine && !this.driving && this.where === "out" && this.car.visible) {
      const dc = Math.hypot(this.car.position.x - pos.x, this.car.position.z - pos.z);
      if (dc < 3.4 && dc < bd)
        best = { id: "car", label: "Get in your car", x: 0, z: 0, r: 0, scene: "out" };
    }
    const ctx: Context = best ? { id: best.id, label: best.label } : null;
    if (ctx?.id !== this.ctx?.id) {
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
      place = `${area.name} · ${area.state}`;
      const lz = pos.z - area.origin.z;
      const st = area.streets.find((s2) => Math.abs(lz - s2.z) < 7);
      if (st) place = `${STREETS[st.id]?.name ?? ""}, ${area.name}`;
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
      const d = this.tapTarget.clone().sub(this.player.position);
      d.y = 0;
      if (d.length() < 0.35) {
        this.tapTarget = null;
        this.marker.visible = false;
        this.pendingUse = true;
      } else dir = d.normalize();
    }
    const moving = dir.lengthSq() > 0.001;
    if (moving) {
      const speed = 7.5 * Math.min(1, dir.length());
      const n = dir.clone().normalize();
      const nx = this.player.position.x + n.x * speed * dt,
        nz = this.player.position.z + n.z * speed * dt;
      if (this.free(nx, this.player.position.z, 0.5)) this.player.position.x = nx;
      if (this.free(this.player.position.x, nz, 0.5)) this.player.position.z = nz;
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
    const max = 34;
    if (v.y > 0.1) this.carSpeed = Math.min(max * v.y, this.carSpeed + 16 * dt);
    else if (v.y < -0.1)
      this.carSpeed =
        this.carSpeed > 0.5 ? this.carSpeed - 30 * dt : Math.max(-8, this.carSpeed - 10 * dt);
    else this.carSpeed *= Math.pow(0.35, dt);
    const grip = Math.min(1, Math.abs(this.carSpeed) / 6);
    this.carHeading -= v.x * 1.9 * grip * Math.sign(this.carSpeed || 1) * dt;
    const nx = this.car.position.x + Math.cos(this.carHeading) * this.carSpeed * dt;
    const nz = this.car.position.z - Math.sin(this.carHeading) * this.carSpeed * dt;
    if (this.free(nx, nz, 1.8)) {
      this.car.position.x = nx;
      this.car.position.z = nz;
    } else this.carSpeed *= -0.3;
    this.car.rotation.y = this.carHeading;
    this.player.position.set(this.car.position.x, 0, this.car.position.z);
  }
  carSpeedKmh() {
    return Math.round(Math.abs(this.carSpeed) * 3.6);
  }

  /* ---------------- light ---------------- */
  private applyLight() {
    const c = this.clock;
    if (!c) return;
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
