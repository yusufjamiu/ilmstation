import * as THREE from "three";
import { BILLBOARDS, STREETS, AD_EMAIL, type Billboard } from "./content";
import { darkness, type Clock } from "./time";

/* IlmCity 3D engine: one Lekki district, three interiors, a car and walking neighbours.
   Everything is built from simple low-poly shapes so the first load stays small. */

export type InteriorKind = "masjid" | "home" | "madrasah";
export type Context = { id: string; label: string } | null;
export type EngineEvents = {
  onContext: (c: Context) => void;
  onAction: (id: string) => void;
  onPlace: (name: string) => void;
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
  opts: { cap?: number; hijab?: number; skin?: number; trousers?: number; seed?: number } = {},
) {
  const g = new THREE.Group();
  const seed = opts.seed ?? Math.floor(robe % 7);
  const skin = opts.skin ?? SKINS[seed % SKINS.length];
  const female = opts.hijab !== undefined;
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
function animatePerson(g: THREE.Object3D, phase: number, amount: number) {
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
  private player = person(0xf4efe4, { cap: 0x2f8f83 });
  private car = new THREE.Group();
  private carHeading = 0;
  private carSpeed = 0;
  private driving = false;
  private where: "out" | InteriorKind = "out";
  private outPos = new THREE.Vector3(-26, 0, -17);
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
    startPos?: { x: number; z: number },
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
    this.scene.fog = new THREE.Fog(0x9fd3e8, 90, 230);
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

    this.buildOutdoor();
    this.buildInteriors();
    this.buildCar();

    this.scene.add(this.player);
    if (startPos) this.player.position.set(startPos.x, 0, startPos.z);
    else this.player.position.copy(this.outPos);
    this.marker.rotation.x = -Math.PI / 2;
    this.marker.position.y = 0.05;
    this.marker.visible = false;
    this.scene.add(this.marker);

    this.resizeObs = new ResizeObserver(() => this.resize());
    this.resizeObs.observe(host);
    this.resize();
    this.renderer.domElement.addEventListener("pointerdown", this.onPointer);
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

  enterInterior(kind: InteriorKind) {
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
    this.renderer.domElement.removeEventListener("pointerdown", this.onPointer);
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
    this.colliders[scene].push({ x0, x1, z0, z1 });
  }

  private buildOutdoor() {
    const S = this.scene;
    // ground, beach, lagoon
    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(260, 220), mat(PALETTE.grass));
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.set(0, 0, -10);
    this.ground.receiveShadow = true;
    S.add(this.ground);
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
    this.addCollider("out", -200, 200, 76, 300);
    this.addCollider("out", -200, -99, -200, 200);
    this.addCollider("out", 99, 200, -200, 200);
    this.addCollider("out", -200, 200, -200, -99);

    // roads
    const road = (x: number, z: number, w: number, d: number) => {
      const k = new THREE.Mesh(new THREE.PlaneGeometry(w + 2.4, d + 2.4), mat(PALETTE.kerb));
      k.rotation.x = -Math.PI / 2;
      k.position.set(x, 0.02, z);
      k.receiveShadow = true;
      S.add(k);
      const r = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(PALETTE.road));
      r.rotation.x = -Math.PI / 2;
      r.position.set(x, 0.04, z);
      r.receiveShadow = true;
      S.add(r);
    };
    road(0, 0, 200, 12);
    road(0, -14, 12, 172);
    road(0, -50, 200, 10);
    const dashMat = new THREE.MeshBasicMaterial({ color: PALETTE.line });
    for (let x = -96; x < 96; x += 6) {
      if (Math.abs(x) < 8) continue;
      const d = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.25), dashMat);
      d.rotation.x = -Math.PI / 2;
      d.position.set(x, 0.06, 0);
      S.add(d);
      const d2 = d.clone();
      d2.position.z = -50;
      S.add(d2);
    }
    for (let z = -96; z < 70; z += 6) {
      if (Math.abs(z) < 8 || Math.abs(z + 50) < 7) continue;
      const d = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 3), dashMat);
      d.rotation.x = -Math.PI / 2;
      d.position.set(0, 0.06, z);
      S.add(d);
    }
    // zebra crossings at the junction
    for (let i = -4; i <= 4; i++) {
      for (const [x, z, rx] of [
        [i * 1.2, 8.2, 0],
        [i * 1.2, -8.2, 0],
        [8.2, i * 1.2, 1],
        [-8.2, i * 1.2, 1],
      ] as [number, number, number][]) {
        const zc = new THREE.Mesh(
          new THREE.PlaneGeometry(rx ? 3 : 0.6, rx ? 0.6 : 3),
          mat(0xf4f1ea),
        );
        zc.rotation.x = -Math.PI / 2;
        zc.position.set(x, 0.06, z);
        this.scene.add(zc);
      }
    }

    // buildings
    this.buildMasjid(-32, -76);
    this.buildSchool(25, -73);
    this.buildSouq(33, -26);
    this.buildHome(-26, -27);
    const houses: [number, number, number, number, boolean][] = [
      [-53, 22, 0xd9c49a, 0x6d7f4a, true],
      [29, 24, 0xe6c2a0, 0x8a4f63, true],
      [51, 24, 0xcfd6c4, 0x4f6f8f, true],
      [-53, -29, 0xe0b88e, 0x7a5a3a, false],
      [-29, 24, 0xd6d0b8, 0x5a6f8a, true],
      [67, -29, 0xe8c9a2, 0x8a3f2a, false],
      [-80, 22, 0xcdd9cf, 0x3f6a5a, true],
      [78, 24, 0xd9c49a, 0x8a4f63, true],
      [-80, -29, 0xe6c2a0, 0x4f6f8f, false],
    ].map(([x, z, w, r, n]) => [x as number, z as number, w as number, r as number, n as boolean]);
    houses.forEach(([x, z, wall, roof, north]) => this.buildHouse(x, z, wall, roof, north));

    // plaza in front of masjid and school
    const plaza = new THREE.Mesh(new THREE.PlaneGeometry(40, 8), mat(PALETTE.plaza));
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(-32, 0.03, -59.5);
    plaza.receiveShadow = true;
    S.add(plaza);
    const plaza2 = plaza.clone();
    plaza2.scale.x = 0.6;
    plaza2.position.set(25, 0.03, -59.5);
    S.add(plaza2);

    // street signs
    this.streetSign(-8.5, 8.5, "alilory", Math.PI / 4);
    this.streetSign(8.5, -8.5, "adewuyi", -Math.PI * 0.75);
    this.streetSign(-8.5, -42, "masjidroad", Math.PI / 4);
    this.streetSign(40, 8.5, "alilory", 0);
    this.streetSign(8.5, 40, "adewuyi", Math.PI / 2);

    // billboards
    BILLBOARDS.forEach((b) => this.billboard(b));

    // street lamps along roads
    const lampPole = new THREE.CylinderGeometry(0.08, 0.1, 5, 6),
      lampHead = new THREE.SphereGeometry(0.32, 8, 6);
    const lamps: [number, number][] = [];
    for (let x = -90; x <= 90; x += 20) {
      if (Math.abs(x) > 8) {
        lamps.push([x, 8]);
        lamps.push([x + 10, -8]);
        lamps.push([x, -57]);
      }
    }
    for (let z = -90; z <= 60; z += 20) {
      if (Math.abs(z) > 10 && Math.abs(z + 50) > 9) lamps.push([8, z]);
    }
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
    const rnd = mulberry(7);
    for (let x = -94; x < 94; x += 9) S.add(palm(x + rnd() * 3, 68 + rnd() * 4, 0.9 + rnd() * 0.3));
    const clear = (x: number, z: number) =>
      this.free(x, z, 3) &&
      Math.abs(z) > 10 &&
      Math.abs(x) > 10 &&
      Math.abs(z + 50) > 9 &&
      !(z < -54 && z > -66 && Math.abs(x + 4) < 50);
    let n = 0;
    for (let i = 0; i < 600 && n < 70; i++) {
      const x = -96 + rnd() * 192,
        z = -96 + rnd() * 160;
      if (!clear(x, z) || BILLBOARDS.some((b) => Math.hypot(b.x - x, b.z - z) < 6)) continue;
      S.add(rnd() < 0.55 ? palm(x, z, 0.8 + rnd() * 0.3) : tree(x, z, 0.9 + rnd() * 0.4));
      n++;
    }
    // area label floating over the lagoon edge
    const area = label("Lekki · Lagos", { bg: "rgba(31,111,99,0.9)", size: 2.2 });
    area.position.set(0, 7, 66);
    S.add(area);

    // neighbours
    const people: [number, string, number, number | undefined, [number, number][]][] = [
      [
        0x4f7fc4,
        "Brother Bilal",
        0xffffff,
        undefined,
        [
          [-90, 9],
          [90, 9],
        ],
      ],
      [
        0x5a3f6a,
        "Sister Khadijah",
        0,
        0xe9e2d0,
        [
          [9, -95],
          [9, 60],
        ],
      ],
      [
        0x3d8a5a,
        "Uncle Abdullahi",
        0xffffff,
        undefined,
        [
          [90, -9],
          [-90, -9],
        ],
      ],
      [
        0x2f4a7a,
        "Sister Maryam",
        0,
        0xe8d9b0,
        [
          [-60, -58],
          [40, -58],
        ],
      ],
      [
        0xb36a3a,
        "Brother Zayd",
        0x2f4c46,
        undefined,
        [
          [-9, 60],
          [-9, -95],
        ],
      ],
      [
        0x8a5fb0,
        "Brother Hamzah",
        0xffffff,
        undefined,
        [
          [-45, -60],
          [-20, -60],
          [-20, -62],
          [-45, -62],
        ],
      ],
      [
        0x3f8f6a,
        "Sister Aminah",
        0,
        0xf1ece0,
        [
          [20, -12],
          [48, -12],
        ],
      ],
    ];
    people.forEach(([robe, name, cap, hijab, route], i) => {
      const g = person(robe, hijab !== undefined ? { hijab, seed: i } : { cap, seed: i });
      const tag = label(name, { size: 0.7, bold: false });
      tag.position.y = 2.25;
      g.add(tag);
      g.position.set(route[0][0], 0, route[0][1]);
      S.add(g);
      this.walkers.push({ g, route, k: 1, wait: i * 0.8, t: 0 });
    });
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
    this.zones.push({ id, label: text, x, z, r: 3.2, scene: "out" });
    const t = label(text.replace(/^Enter /, ""), { size: 0.85 });
    t.position.set(x, labelY, z - 0.5);
    this.scene.add(t);
  }

  private buildMasjid(cx: number, cz: number) {
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
    this.scene.add(g);
    this.addCollider("out", cx - W / 2, cx + W / 2, cz - D / 2 - 1, cz + D / 2);
    this.door(cx, cz + D / 2 + 2.5, "door:masjid", "Enter Masjid al-Huda", 8.4);
  }

  private buildSchool(cx: number, cz: number) {
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
    this.scene.add(g);
    this.addCollider("out", cx - W / 2, cx + W / 2, cz - D / 2, cz + D / 2);
    this.door(cx, cz + D / 2 + 2.5, "door:madrasah", "Enter Madrasah Dar al-Arqam", 8.8);
  }

  private buildSouq(cx: number, cz: number) {
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
    this.scene.add(g);
    this.addCollider("out", cx - W / 2, cx + W / 2, cz - D / 2, cz + 2.4);
    const t = label("Souq al-Barakah", { size: 1.05 });
    t.position.set(cx, 6.2, cz);
    this.scene.add(t);
    this.zones.push({
      id: "souq",
      label: "Shop at Souq al-Barakah",
      x: cx,
      z: cz + D / 2 + 1.5,
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
    this.scene.add(g);
    this.addCollider("out", cx - W / 2, cx + W / 2, cz - D / 2, cz + D / 2);
    return g;
  }

  private buildHome(cx: number, cz: number) {
    this.buildHouse(cx, cz, 0xe2b47c, 0x9c4a2e, false);
    this.door(cx, cz + 7.5, "door:home", "Enter Your Home", 7.4);
    const mat2 = new THREE.Mesh(new THREE.PlaneGeometry(3, 2), mat(0x1f6f63));
    mat2.rotation.x = -Math.PI / 2;
    mat2.position.set(cx, 0.03, cz + 6.2);
    this.scene.add(mat2);
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
    this.scene.add(g);
  }

  private billboard(b: Billboard) {
    const g = new THREE.Group();
    g.position.set(b.x, 0, b.z);
    g.rotation.y = b.rot;
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
    this.scene.add(g);
    const cos = Math.cos(b.rot),
      sin = Math.sin(b.rot);
    const w = Math.abs(cos) * 5.5 + Math.abs(sin) * 1,
      d = Math.abs(sin) * 5.5 + Math.abs(cos) * 1;
    this.addCollider("out", b.x - w, b.x + w, b.z - d, b.z + d);
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
    g.position.set(-14, 0, -9.8);
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
    this.zones.push({ id: "car", label: "Get in your car", x: -14, z: -9.8, r: 3.4, scene: "out" });
  }

  /* ---------------- loop ---------------- */
  private resize() {
    const w = this.host.clientWidth || 1,
      h = this.host.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    this.camera.aspect = w / h;
    this.camera.fov = w / h < 0.8 ? 50 : 42;
    this.camera.updateProjectionMatrix();
  }

  private camOffset() {
    const portrait = this.camera.aspect < 0.8;
    if (this.where !== "out")
      return portrait ? new THREE.Vector3(0, 22, 19) : new THREE.Vector3(0, 13, 13);
    if (this.driving) return portrait ? new THREE.Vector3(0, 44, 36) : new THREE.Vector3(0, 30, 26);
    return portrait ? new THREE.Vector3(0, 32, 27) : new THREE.Vector3(0, 22, 19);
  }
  private snapCamera() {
    const t = this.driving ? this.car.position : this.player.position;
    this.camera.position.copy(t).add(this.camOffset());
    this.camera.lookAt(t.x, t.y + 1, t.z);
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

  private onPointer = (e: PointerEvent) => {
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
  };

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
    if (this.driving) this.drive(v, dt);
    else this.walk(v, dt, t);

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
    const target = this.driving ? this.car.position : this.player.position;
    const want = target.clone().add(this.camOffset());
    this.camera.position.lerp(want, 1 - Math.exp(-dt * 5));
    this.camera.lookAt(target.x, 1, target.z);
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
    if (this.driving)
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
    let place = "Lekki · Lagos";
    if (this.where === "masjid") place = "Masjid al-Huda";
    else if (this.where === "home") place = "Your Home";
    else if (this.where === "madrasah") place = "Madrasah Dar al-Arqam";
    else if (Math.abs(pos.z) < 7) place = STREETS.alilory.name;
    else if (Math.abs(pos.x) < 7) place = STREETS.adewuyi.name;
    else if (Math.abs(pos.z + 50) < 6) place = STREETS.masjidroad.name;
    if (place !== this.place) {
      this.place = place;
      this.ev.onPlace(place);
    }
  }
  private pendingUse = false;
  private tapZone: string | null = null;

  private walk(v: THREE.Vector2, dt: number, t: number) {
    let dir = new THREE.Vector3(v.x, 0, -v.y);
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
      const speed = 7 * Math.min(1, dir.length());
      const n = dir.clone().normalize();
      const nx = this.player.position.x + n.x * speed * dt,
        nz = this.player.position.z + n.z * speed * dt;
      if (this.free(nx, this.player.position.z, 0.5)) this.player.position.x = nx;
      if (this.free(this.player.position.x, nz, 0.5)) this.player.position.z = nz;
      const targetRot = Math.atan2(n.x, n.z);
      let dr = targetRot - this.player.rotation.y;
      while (dr > Math.PI) dr -= Math.PI * 2;
      while (dr < -Math.PI) dr += Math.PI * 2;
      this.player.rotation.y += dr * Math.min(1, dt * 12);
      this.walkT += dt;
      animatePerson(this.player, this.walkT * 9, 1);
    } else {
      animatePerson(this.player, 0, 0);
      void t;
    }
  }

  private drive(v: THREE.Vector2, dt: number) {
    const mag = Math.min(1, v.length());
    if (mag > 0.15) {
      const desired = Math.atan2(v.y, v.x); // 0 = east, PI/2 = north
      let dh = desired - this.carHeading;
      while (dh > Math.PI) dh -= Math.PI * 2;
      while (dh < -Math.PI) dh += Math.PI * 2;
      const reverse = Math.abs(dh) > Math.PI * 0.75 && this.carSpeed < 2;
      if (reverse) this.carSpeed = Math.max(-6, this.carSpeed - 14 * dt);
      else {
        this.carHeading +=
          Math.sign(dh) *
          Math.min(Math.abs(dh), dt * 2.4 * Math.min(1, Math.abs(this.carSpeed) / 4 + 0.25));
        this.carSpeed = Math.min(22 * mag, this.carSpeed + 14 * dt);
      }
    } else this.carSpeed *= Math.pow(0.25, dt);
    const nx = this.car.position.x + Math.cos(this.carHeading) * this.carSpeed * dt;
    const nz = this.car.position.z - Math.sin(this.carHeading) * this.carSpeed * dt;
    if (this.free(nx, nz, 1.8)) {
      this.car.position.x = nx;
      this.car.position.z = nz;
    } else this.carSpeed *= -0.3;
    this.car.rotation.y = this.carHeading;
    this.player.position.set(this.car.position.x, 0, this.car.position.z);
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

function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
