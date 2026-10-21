import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/* Lagos houses: walled compounds with a block fence, a painted metal gate, the house
   number on the pillar, interlocking paving inside, and a one- to three-storey
   building with framed windows, burglar-proof bars, balconies, a long-span roof or a
   flat roof with a water tank. Everything static is merged per area so phones stay fast. */

/* ---------------- textures (drawn once, tiled by world size) ---------------- */

const texCache = new Map<string, THREE.CanvasTexture>();
function tex(
  key: string,
  w: number,
  h: number,
  draw: (c: CanvasRenderingContext2D, w: number, h: number) => void,
  repeat = true,
) {
  let t = texCache.get(key);
  if (t) return t;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  draw(cv.getContext("2d")!, w, h);
  t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  texCache.set(key, t);
  return t;
}
function noise(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  n: number,
  lo: number,
  hi: number,
  a = 1,
) {
  c.globalAlpha = a;
  for (let i = 0; i < n; i++) {
    const g = lo + Math.floor(Math.random() * (hi - lo));
    c.fillStyle = `rgb(${g},${g},${g})`;
    const s = 1 + Math.random() * 2.5;
    c.fillRect(Math.random() * w, Math.random() * h, s, s);
  }
  c.globalAlpha = 1;
}
const css = (c: number) => "#" + c.toString(16).padStart(6, "0");

/** Painted plaster, 4 m per tile, with rain stains near the bottom. */
export const plasterTex = () =>
  tex("plaster", 256, 256, (c, w, h) => {
    c.fillStyle = "#fff";
    c.fillRect(0, 0, w, h);
    noise(c, w, h, 5000, 228, 255);
    c.globalAlpha = 0.06;
    for (let i = 0; i < 40; i++) {
      c.fillStyle = "#6b5a40";
      c.fillRect(Math.random() * w, h * 0.55 + Math.random() * h * 0.45, 2 + Math.random() * 4, 30);
    }
    c.globalAlpha = 1;
  });
/** Sandcrete blocks, 0.45 × 0.225 m, painted. 2 m per tile. */
export const blockTex = () =>
  tex("blocks", 256, 256, (c, w, h) => {
    c.fillStyle = "#fff";
    c.fillRect(0, 0, w, h);
    noise(c, w, h, 3000, 220, 255);
    c.strokeStyle = "rgba(90,80,70,0.35)";
    c.lineWidth = 3;
    const bh = h / 9,
      bw = w / 4.4;
    for (let r = 0; r <= 9; r++) {
      c.beginPath();
      c.moveTo(0, r * bh);
      c.lineTo(w, r * bh);
      c.stroke();
      for (let x = (r % 2) * bw * 0.5; x < w; x += bw) {
        c.beginPath();
        c.moveTo(x, r * bh);
        c.lineTo(x, (r + 1) * bh);
        c.stroke();
      }
    }
  });
/** Interlocking paving stones, 2 m per tile. */
export const pavingTex = () =>
  tex("paving", 256, 256, (c, w, h) => {
    c.fillStyle = "#b5694a";
    c.fillRect(0, 0, w, h);
    noise(c, w, h, 4000, 120, 200, 0.25);
    c.strokeStyle = "rgba(60,30,20,0.5)";
    c.lineWidth = 2;
    const s = w / 8;
    for (let y = 0; y < 8; y++)
      for (let x = 0; x < 8; x++) {
        const ox = x * s + (y % 2 ? s / 2 : 0);
        c.beginPath();
        c.moveTo(ox, y * s);
        c.lineTo(ox + s * 0.6, y * s);
        c.lineTo(ox + s, y * s + s / 2);
        c.lineTo(ox + s * 0.6, y * s + s);
        c.lineTo(ox, y * s + s);
        c.lineTo(ox + s * 0.35, y * s + s / 2);
        c.closePath();
        c.stroke();
      }
  });
/** Corrugated long-span roofing sheets, 2 m per tile. */
export const zincTex = () =>
  tex("zinc", 128, 128, (c, w, h) => {
    for (let x = 0; x < w; x++) {
      const v = 200 + Math.round(Math.sin((x / w) * Math.PI * 16) * 40);
      c.fillStyle = `rgb(${v},${v},${v})`;
      c.fillRect(x, 0, 1, h);
    }
    noise(c, w, h, 600, 150, 230, 0.3);
  });
/** Asphalt, 4 m per tile. */
export const asphaltTex = () =>
  tex("asphalt", 256, 256, (c, w, h) => {
    c.fillStyle = "#5a5e63";
    c.fillRect(0, 0, w, h);
    noise(c, w, h, 9000, 60, 140, 0.55);
    c.globalAlpha = 0.08;
    for (let i = 0; i < 8; i++) {
      c.fillStyle = "#222";
      c.beginPath();
      c.ellipse(
        Math.random() * w,
        Math.random() * h,
        10 + Math.random() * 30,
        6 + Math.random() * 12,
        Math.random() * 3,
        0,
        Math.PI * 2,
      );
      c.fill();
    }
    c.globalAlpha = 1;
  });
/** Concrete pavement slabs, 2 m per tile. */
export const pavementTex = () =>
  tex("pavement", 256, 256, (c, w, h) => {
    c.fillStyle = "#cfc7b6";
    c.fillRect(0, 0, w, h);
    noise(c, w, h, 5000, 150, 235, 0.35);
    c.strokeStyle = "rgba(80,70,60,0.35)";
    c.lineWidth = 3;
    for (let i = 0; i <= 2; i++) {
      c.beginPath();
      c.moveTo((i * w) / 2, 0);
      c.lineTo((i * w) / 2, h);
      c.moveTo(0, (i * h) / 2);
      c.lineTo(w, (i * h) / 2);
      c.stroke();
    }
  });
/** Grass with patches of earth, 8 m per tile. */
export const grassTex = () =>
  tex("grass", 512, 512, (c, w, h) => {
    c.fillStyle = "#8fae5d";
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 26000; i++) {
      const g = Math.random();
      c.fillStyle = g < 0.5 ? "#7d9c4f" : g < 0.85 ? "#9ebd6a" : "#6f8c45";
      c.fillRect(Math.random() * w, Math.random() * h, 1.5, 3);
    }
    c.globalAlpha = 0.18;
    for (let i = 0; i < 14; i++) {
      c.fillStyle = "#a08a5a";
      c.beginPath();
      c.ellipse(
        Math.random() * w,
        Math.random() * h,
        20 + Math.random() * 40,
        12 + Math.random() * 25,
        Math.random() * 3,
        0,
        Math.PI * 2,
      );
      c.fill();
    }
    c.globalAlpha = 1;
  });

/** A window: coloured frame, glass, and white burglar-proof bars. */
function windowTex(frame: number) {
  return tex(
    "win" + frame,
    128,
    160,
    (c, w, h) => {
      c.fillStyle = css(frame);
      c.fillRect(0, 0, w, h);
      const g = c.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "#5f7c8c");
      g.addColorStop(0.45, "#2d3d48");
      g.addColorStop(0.55, "#43606e");
      g.addColorStop(1, "#1e2a32");
      c.fillStyle = g;
      c.fillRect(12, 12, w - 24, h - 24);
      // louvre blades
      c.strokeStyle = "rgba(255,255,255,0.18)";
      c.lineWidth = 2;
      for (let y = 22; y < h - 12; y += 10) {
        c.beginPath();
        c.moveTo(14, y);
        c.lineTo(w - 14, y);
        c.stroke();
      }
      c.fillStyle = css(frame);
      c.fillRect(w / 2 - 4, 12, 8, h - 24);
      // burglar-proof
      c.strokeStyle = "rgba(245,245,240,0.9)";
      c.lineWidth = 4;
      for (let x = 30; x < w - 12; x += 22) {
        c.beginPath();
        c.moveTo(x, 12);
        c.lineTo(x, h - 12);
        c.stroke();
      }
      for (const y of [h * 0.33, h * 0.66]) {
        c.beginPath();
        c.moveTo(12, y);
        c.lineTo(w - 12, y);
        c.stroke();
      }
    },
    false,
  );
}
function doorTex(color: number) {
  return tex(
    "door" + color,
    96,
    192,
    (c, w, h) => {
      c.fillStyle = css(color);
      c.fillRect(0, 0, w, h);
      c.strokeStyle = "rgba(0,0,0,0.35)";
      c.lineWidth = 4;
      c.strokeRect(14, 16, w - 28, h * 0.38);
      c.strokeRect(14, h * 0.5, w - 28, h * 0.42);
      c.fillStyle = "#d9b45a";
      c.beginPath();
      c.arc(w - 18, h * 0.52, 5, 0, Math.PI * 2);
      c.fill();
    },
    false,
  );
}
function gateTex(color: number) {
  return tex(
    "gate" + color,
    256,
    128,
    (c, w, h) => {
      c.fillStyle = css(color);
      c.fillRect(0, 0, w, h);
      c.fillStyle = "rgba(255,255,255,0.08)";
      for (let x = 0; x < w; x += 10) c.fillRect(x, 0, 4, h);
      c.strokeStyle = "rgba(0,0,0,0.4)";
      c.lineWidth = 5;
      c.strokeRect(3, 3, w - 6, h - 6);
      c.beginPath();
      c.moveTo(w / 2, 0);
      c.lineTo(w / 2, h);
      c.stroke();
      c.strokeRect(10, 10, w / 2 - 20, h * 0.3);
      c.strokeRect(w / 2 + 10, 10, w / 2 - 20, h * 0.3);
    },
    false,
  );
}
function railTex() {
  return tex(
    "rail",
    256,
    64,
    (c, w, h) => {
      c.clearRect(0, 0, w, h);
      c.fillStyle = "#f2efe8";
      c.fillRect(0, 0, w, 8);
      c.fillRect(0, h - 6, w, 6);
      for (let x = 6; x < w; x += 16) {
        c.beginPath();
        c.ellipse(x, h / 2, 4, h / 2 - 8, 0, 0, Math.PI * 2);
        c.fill();
      }
    },
    false,
  );
}
function plaqueTex(text: string) {
  return tex(
    "plq" + text,
    128,
    64,
    (c, w, h) => {
      c.fillStyle = "#1f4f9a";
      c.fillRect(0, 0, w, h);
      c.strokeStyle = "#fff";
      c.lineWidth = 3;
      c.strokeRect(4, 4, w - 8, h - 8);
      c.fillStyle = "#fff";
      c.font = "700 30px system-ui, sans-serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(text, w / 2, h / 2 + 2);
    },
    false,
  );
}
function grilleTex() {
  return tex(
    "grille",
    64,
    32,
    (c, w, h) => {
      c.fillStyle = "#e9e9e4";
      c.fillRect(0, 0, w, h);
      c.fillStyle = "#9a9a96";
      for (let y = 4; y < h - 2; y += 4) c.fillRect(4, y, w - 8, 2);
    },
    false,
  );
}

/* ---------------- materials ---------------- */

const mats = new Map<string, THREE.Material>();
function M(key: string, make: () => THREE.Material) {
  let m = mats.get(key);
  if (!m) mats.set(key, (m = make()));
  return m;
}
const std = (p: THREE.MeshStandardMaterialParameters) =>
  new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0, ...p });
export const MAT = {
  plaster: (c: number) => M("pl" + c, () => std({ color: c, map: plasterTex() })),
  block: (c: number) => M("bl" + c, () => std({ color: c, map: blockTex() })),
  paving: () => M("pav", () => std({ map: pavingTex() })),
  zinc: (c: number) =>
    M("zn" + c, () => std({ color: c, map: zincTex(), metalness: 0.3, roughness: 0.55 })),
  plain: (c: number, r = 0.85) => M("pn" + c + r, () => std({ color: c, roughness: r })),
  window: (c: number) =>
    M("wn" + c, () => std({ map: windowTex(c), roughness: 0.35, metalness: 0.1 })),
  door: (c: number) => M("dr" + c, () => std({ map: doorTex(c), roughness: 0.6 })),
  gate: (c: number) =>
    M("gt" + c, () =>
      std({ map: gateTex(c), roughness: 0.5, metalness: 0.35, side: THREE.DoubleSide }),
    ),
  rail: () =>
    M("rail", () =>
      std({ map: railTex(), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide }),
    ),
  grille: () => M("grille", () => std({ map: grilleTex() })),
  asphalt: () => M("asphalt", () => std({ map: asphaltTex(), roughness: 0.95 })),
  pavement: () => M("pavement", () => std({ map: pavementTex() })),
  grass: () => M("grass", () => std({ map: grassTex() })),
  plaque: (t: string) => M("plq" + t, () => std({ map: plaqueTex(t), roughness: 0.4 })),
  /** painted wooden boards */
  siding: (c: number) => M("sd" + c, () => std({ color: c, map: sidingTex(), roughness: 0.8 })),
  /** rows of clay roof tiles */
  tiles: (c: number) => M("tl" + c, () => std({ color: c, map: tilesTex(), roughness: 0.7 })),
  /** a striped market canopy */
  awning: (c: number) =>
    M("aw" + c, () => std({ map: awningTex(c), roughness: 0.75, side: THREE.DoubleSide })),
  /** a glowing light bulb */
  bulb: () => M("bulb", () => std({ color: 0xfff1c0, emissive: 0xffd27a, emissiveIntensity: 1.2 })),
  /** the glass of a sunroom */
  sunroom: () =>
    M("sun", () =>
      std({
        color: 0xcfe8f0,
        transparent: true,
        opacity: 0.35,
        roughness: 0.1,
        metalness: 0.2,
        depthWrite: false,
      }),
    ),
};
/** Stripes of colour and white, one canopy wide. */
function awningTex(c: number) {
  return tex("awning" + c, 128, 32, (g, w, h) => {
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? "#fbf7ee" : css(c);
      g.fillRect((i * w) / 8, 0, w / 8 + 1, h);
    }
  });
}
/** Horizontal painted boards, 2 m per tile. */
function sidingTex() {
  return tex("siding", 128, 128, (c, w, h) => {
    c.fillStyle = "#fff";
    c.fillRect(0, 0, w, h);
    noise(c, w, h, 1200, 236, 255);
    for (let y = 0; y < h; y += 16) {
      c.fillStyle = "rgba(0,0,0,0.16)";
      c.fillRect(0, y + 13, w, 3);
      c.fillStyle = "rgba(255,255,255,0.5)";
      c.fillRect(0, y, w, 2);
    }
  });
}
/** Overlapping rounded clay tiles, 2 m per tile. */
function tilesTex() {
  return tex("tiles", 128, 128, (c, w, h) => {
    c.fillStyle = "#fff";
    c.fillRect(0, 0, w, h);
    for (let row = 0; row < 8; row++) {
      const y = row * 16;
      const off = row % 2 ? 8 : 0;
      for (let x = -16; x < w + 16; x += 16) {
        const g = c.createLinearGradient(0, y, 0, y + 16);
        g.addColorStop(0, "rgba(0,0,0,0.0)");
        g.addColorStop(1, "rgba(0,0,0,0.28)");
        c.fillStyle = g;
        c.beginPath();
        c.ellipse(x + off + 8, y + 8, 8, 9, 0, 0, Math.PI);
        c.fill();
      }
      c.fillStyle = "rgba(0,0,0,0.22)";
      c.fillRect(0, y + 15, w, 1);
    }
  });
}

/* ---------------- geometry with world-sized texture coordinates ---------------- */

/** A box whose texture repeats every `tile` metres on every face. */
export function boxGeo(w: number, h: number, d: number, tile = 4) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  // faces: +x, -x, +y, -y, +z, -z (4 vertices each)
  const dims: [number, number][] = [
    [d, h],
    [d, h],
    [w, d],
    [w, d],
    [w, h],
    [w, h],
  ];
  for (let f = 0; f < 6; f++)
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      uv.setXY(i, (uv.getX(i) * dims[f][0]) / tile, (uv.getY(i) * dims[f][1]) / tile);
    }
  return g;
}
/** A flat ground plane (already lying down) with tiled texture coordinates. */
export function groundGeo(w: number, d: number, tile = 4) {
  const g = new THREE.PlaneGeometry(w, d);
  g.rotateX(-Math.PI / 2);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w) / tile, (uv.getY(i) * d) / tile);
  return g;
}

/* ---------------- a builder that merges everything at the end ---------------- */

export class Batch {
  /** A dry batch throws everything away: for working out a layout (and rolling the same
      dice) without the cost of building any geometry. */
  constructor(readonly dry = false) {}
  private parts = new Map<THREE.Material, THREE.BufferGeometry[]>();
  private noShadow = new Set<THREE.Material>();
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  /** The transform applied to everything added (a compound's position and turn). */
  base = new THREE.Matrix4();

  add(geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0, ry = 0, shadow = true) {
    if (this.dry) return;
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    if (!g.attributes.uv) {
      g.setAttribute(
        "uv",
        new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2),
      );
    }
    this.q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry);
    this.m.compose(new THREE.Vector3(x, y, z), this.q, new THREE.Vector3(1, 1, 1));
    g.applyMatrix4(this.m.premultiply(this.base));
    const list = this.parts.get(mat) ?? [];
    list.push(g);
    this.parts.set(mat, list);
    if (!shadow) this.noShadow.add(mat);
    geo.dispose();
  }
  /** Merge a ready-made object (its meshes keep their materials). */
  addObject(obj: THREE.Object3D) {
    if (this.dry) return;
    obj.updateMatrixWorld(true);
    obj.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || (m as unknown as THREE.InstancedMesh).isInstancedMesh) return;
      const mat = Array.isArray(m.material) ? m.material[0] : m.material;
      const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
      for (const k of Object.keys(g.attributes))
        if (!["position", "normal", "uv"].includes(k)) g.deleteAttribute(k);
      if (!g.attributes.normal) g.computeVertexNormals();
      if (!g.attributes.uv)
        g.setAttribute(
          "uv",
          new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2),
        );
      g.applyMatrix4(this.m.multiplyMatrices(this.base, m.matrixWorld));
      const list = this.parts.get(mat) ?? [];
      list.push(g);
      this.parts.set(mat, list);
      if (!m.castShadow) this.noShadow.add(mat);
    });
  }
  /** A box standing on y (its bottom at y). */
  box(
    w: number,
    h: number,
    d: number,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    ry = 0,
    tile = 4,
  ) {
    if (this.dry) return;
    this.add(boxGeo(w, h, d, tile), mat, x, y + h / 2, z, ry);
  }
  /** An upright plane facing +z (before `ry`). */
  plane(w: number, h: number, mat: THREE.Material, x: number, y: number, z: number, ry = 0) {
    if (this.dry) return;
    this.add(new THREE.PlaneGeometry(w, h), mat, x, y, z, ry, false);
  }
  build(): THREE.Mesh[] {
    const out: THREE.Mesh[] = [];
    for (const [mat, list] of this.parts) {
      const geo = mergeGeometries(list, false);
      list.forEach((g) => g.dispose());
      if (!geo) continue;
      geo.computeBoundingSphere();
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = !this.noShadow.has(mat);
      mesh.receiveShadow = true;
      out.push(mesh);
    }
    this.parts.clear();
    return out;
  }
}

/* ---------------- the compound ---------------- */

export type Box = { x0: number; x1: number; z0: number; z1: number };
export type Compound = {
  colliders: Box[];
  /** The building's front door, in the area's coordinates. */
  door: { x: number; z: number };
  /** The middle of the gate opening. */
  gate: { x: number; z: number };
  floors: number;
  number: number;
  /** where the gate sits along the front (the compound's own x) */
  gx?: number;
  /** a glass tower of flats, or a face-me-I-face-you rooming house */
  type?: HomeType;
};

const WALLS = [
  0xe8dcb5, 0xd9e3cf, 0xf0d9c2, 0xd8e0e6, 0xeedfa8, 0xe6cfd6, 0xf2ece0, 0xcfe0d8, 0xe9c9a8,
];
const FRAMES = [0xb8322a, 0x2a56a8, 0xe0b52c, 0x1f6f63, 0x6a2f8a, 0xf4efe4];
const GATES = [0x1d4d2e, 0x1d2f5a, 0x1a1a1a, 0x6a1f24, 0x2a5f7a];
const ROOFS = [0x3f6fa8, 0x9a3a2a, 0x3d7a4a, 0x6a6f74, 0x8a5a2a];
const FENCES = [0xf4f1ea, 0xe9e4d6, 0xdcd6c8];
/** Warm painted boards for cottages, clay tile roofs, doors, flowers and leaves. */
const COTTAGE_WALLS = [
  0xd9895a, 0xf2e6cf, 0xb7cfae, 0xbcd3e3, 0xf0d78c, 0xe8a596, 0xf4f1ea, 0xc9a27a, 0xd9c2e0,
];
const TILE_ROOFS = [0xa8442f, 0x9a3a2a, 0x7a4a3a, 0x4f6f86, 0x3d6a52, 0xb0603a];
const DOORS = [0x6b4226, 0x1f6f63, 0x2a4a7a, 0x8a2f3a, 0x4a3a2a];
const FLOWERS = [0xe8445a, 0xf2c230, 0xffffff, 0xd66bd0, 0xff8a3d, 0x6b8be8, 0xff6f91];
const LEAVES = [0x4f8f45, 0x5f9e3a, 0x3f7d3a, 0x6aa84f];

/** A pitched roof: two tiled slopes from the eaves up to a ridge along x, with
    triangular gable ends in the wall material. Its base sits at y. */
function gable(
  b: Batch,
  w: number,
  d: number,
  h: number,
  over: number,
  roof: THREE.Material,
  ends: THREE.Material,
  x: number,
  y: number,
  z: number,
) {
  const run = d / 2 + over;
  const L = Math.hypot(run, h);
  const a = Math.atan2(h, run);
  for (const s of [1, -1]) {
    const g = boxGeo(w + over * 2, 0.16, L, 2);
    g.rotateX(s * a);
    b.add(g, roof, x, y + h / 2 - (over * h) / run / 2, z + (s * run) / 2);
  }
  const shape = new THREE.Shape();
  shape.moveTo(-d / 2, 0);
  shape.lineTo(d / 2, 0);
  shape.lineTo(0, h * (d / 2 / run));
  shape.closePath();
  for (const s of [1, -1]) {
    const g = new THREE.ShapeGeometry(shape);
    g.rotateY((s * Math.PI) / 2);
    b.add(g, ends, x + (s * w) / 2 - s * 0.02, y, z, 0, false);
  }
}

/**
 * A walled compound with its front fence on z = +depth/2 (facing the street).
 * `turn` = 0 when the street is south of the plot, Math.PI when it is north.
 */
export function compound(
  b: Batch,
  o: {
    x: number;
    z: number;
    turn: number;
    width?: number;
    depth?: number;
    floors?: number;
    number: number;
    rnd: () => number;
    wall?: number;
    /** the look of the area's houses (default: the painted cottage) */
    style?: HouseStyle;
  },
): Compound {
  if (o.style && o.style !== "cottage") {
    // roll the same dice as the cottage would, so every plot keeps its number and kind,
    // then build the area's own kind of house on the same plot with the same gate
    const ref = compound(new Batch(true), { ...o, style: undefined });
    return styledHouse(b, o, ref, o.style);
  }
  const r = o.rnd;
  const PW = o.width ?? 22,
    PD = o.depth ?? 20;
  const floors = o.floors ?? (r() < 0.35 ? 1 : r() < 0.7 ? 2 : 3);
  const wall = o.wall ?? WALLS[Math.floor(r() * WALLS.length)];
  const frame = FRAMES[Math.floor(r() * FRAMES.length)];
  const gateC = GATES[Math.floor(r() * GATES.length)];
  const fence = FENCES[Math.floor(r() * FENCES.length)];
  const roofC = ROOFS[Math.floor(r() * ROOFS.length)];
  const flat = floors >= 2 && r() < 0.5;

  b.base.makeRotationY(o.turn).setPosition(o.x, 0, o.z);
  const cos = Math.cos(o.turn),
    sin = Math.sin(o.turn);
  const toArea = (lx: number, lz: number) => ({
    x: o.x + lx * cos + lz * sin,
    z: o.z - lx * sin + lz * cos,
  });
  const colliders: Box[] = [];
  const solid = (lx0: number, lx1: number, lz0: number, lz1: number) => {
    const a = toArea(lx0, lz0),
      c = toArea(lx1, lz1);
    colliders.push({
      x0: Math.min(a.x, c.x),
      x1: Math.max(a.x, c.x),
      z0: Math.min(a.z, c.z),
      z1: Math.max(a.z, c.z),
    });
  };

  // a second dice for the new looks, so the old one keeps every plot the same
  let seed = (o.number * 7919 + Math.round(o.x * 13 + o.z * 7)) >>> 0;
  const r2 = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pick = <T>(a: T[]) => a[Math.floor(r2() * a.length)];

  // the yard: paved, with a stone path from the gate to the porch
  b.add(groundGeo(PW - 0.4, PD - 0.4, 2), MAT.paving(), 0, 0.035, 0, 0, false);

  // a low white wall with rails on top, and a gate between two pillars
  const FH = 1.3,
    T = 0.24;
  const fenceM = MAT.plaster(fence);
  const white = MAT.plain(0xf7f5ef);
  const gw = 4.4;
  const gx = (r() < 0.5 ? -1 : 1) * (PW / 2 - 4.5);
  void gateC;
  const railTop = (x0: number, x1: number, z: number) => {
    b.box(x1 - x0, 0.1, 0.1, white, (x0 + x1) / 2, FH + 0.75, z);
    for (let x = x0 + 0.4; x < x1 - 0.2; x += 1.2) b.box(0.08, 0.75, 0.08, white, x, FH, z);
  };
  const seg = (x0: number, x1: number, z: number) => {
    if (x1 - x0 < 0.05) return;
    b.box(x1 - x0, FH, T, fenceM, (x0 + x1) / 2, 0, z, 0, 2);
    b.box(x1 - x0 + 0.1, 0.12, T + 0.14, white, (x0 + x1) / 2, FH, z);
    railTop(x0, x1, z);
    solid(x0, x1, z - T / 2, z + T / 2);
  };
  const front = PD / 2;
  seg(-PW / 2, gx - gw / 2 - 0.3, front);
  seg(gx + gw / 2 + 0.3, PW / 2, front);
  seg(-PW / 2, PW / 2, -PD / 2);
  for (const sx of [-PW / 2, PW / 2]) {
    b.add(boxGeo(T, FH, PD, 2), fenceM, sx, FH / 2, 0, 0);
    b.box(T + 0.14, 0.12, PD, white, sx, FH, 0);
    solid(sx - T / 2, sx + T / 2, -PD / 2, PD / 2);
  }
  for (const px of [gx - gw / 2 - 0.3, gx + gw / 2 + 0.3]) {
    b.box(0.6, 2.3, 0.6, fenceM, px, 0, front, 0, 2);
    b.box(0.75, 0.14, 0.75, white, px, 2.3, front);
    b.add(new THREE.SphereGeometry(0.22, 10, 8), white, px, 2.6, front);
    solid(px - 0.3, px + 0.3, front - 0.3, front + 0.3);
  }
  // a painted gate, partly open
  b.add(boxGeo(gw * 0.5, 1.6, 0.07), MAT.gate(0xf4efe4), gx - gw * 0.25, 0.85, front - 0.05);
  b.add(boxGeo(gw * 0.25, 1.6, 0.07), MAT.gate(0xf4efe4), gx + gw * 0.38, 0.85, front - 0.05);
  solid(gx - gw / 2, gx, front - 0.2, front + 0.2);
  b.plane(0.5, 0.25, MAT.plaque("No. " + o.number), gx + gw / 2 + 0.3, 1.85, front + 0.31);

  // the house, at the back of the yard, raised on a plinth with a porch
  const BW = Math.min(PW - 4, 11 + Math.floor(r() * 4)),
    BD = Math.min(PD - 9, 8 + Math.floor(r() * 3));
  const bz = -PD / 2 + 1.5 + BD / 2;
  const FHt = 3.2;
  const P0 = 0.6;
  const cottage = !flat;
  const wallC = cottage ? pick(COTTAGE_WALLS) : wall;
  const wallM = cottage ? MAT.siding(wallC) : MAT.plaster(wall);
  const trim = white;
  const winM = MAT.window(cottage ? 0xf4efe4 : frame);
  b.box(BW + 0.4, P0, BD + 0.4, MAT.plain(0x8a7a66), 0, 0, bz); // plinth
  const flowerBox = (x: number, y: number, z: number, w: number) => {
    b.box(w, 0.32, 0.38, MAT.plain(0x7a5234), x, y, z);
    for (let k = 0; k < 6; k++)
      b.add(
        new THREE.IcosahedronGeometry(0.16, 0),
        MAT.plain(pick(FLOWERS)),
        x - w / 2 + 0.2 + (k * (w - 0.4)) / 5,
        y + 0.42 + r2() * 0.08,
        z + (r2() - 0.5) * 0.15,
      );
    b.add(new THREE.BoxGeometry(w - 0.1, 0.12, 0.3), MAT.plain(0x3f7d3a), x, y + 0.36, z);
  };
  for (let f = 0; f < floors; f++) {
    const y = P0 + f * FHt;
    b.box(BW, FHt - 0.25, BD, wallM, 0, y, bz);
    b.box(BW + 0.25, 0.25, BD + 0.25, trim, 0, y + FHt - 0.25, bz); // floor edge
    // corner boards
    for (const cx of [-BW / 2, BW / 2])
      for (const cz of [-BD / 2, BD / 2]) b.box(0.22, FHt - 0.25, 0.22, trim, cx, y, bz + cz);
    // big framed windows on the front and back
    const n = Math.max(2, Math.floor(BW / 3.2));
    for (let i = 0; i < n; i++) {
      const wx = -BW / 2 + (BW / n) * (i + 0.5);
      if (f === 0 && Math.abs(wx) < 1.6) continue; // the front door
      b.plane(1.6, 1.8, winM, wx, y + 1.5, bz + BD / 2 + 0.02);
      b.box(1.85, 0.1, 0.16, trim, wx, y + 0.56, bz + BD / 2 + 0.06);
      b.box(1.85, 0.1, 0.16, trim, wx, y + 2.42, bz + BD / 2 + 0.06);
      if (cottage && f === 0) flowerBox(wx, y + 0.18, bz + BD / 2 + 0.3, 1.7);
      b.plane(1.6, 1.8, winM, wx, y + 1.5, bz - BD / 2 - 0.02, Math.PI);
    }
    for (const s of [1, -1]) {
      b.plane(1.4, 1.6, winM, s * (BW / 2 + 0.02), y + 1.5, bz, (s * Math.PI) / 2);
      if ((f + (s > 0 ? 1 : 0)) % 2 === 0 && r() < 0.6)
        b.add(
          boxGeo(0.35, 0.55, 0.8),
          MAT.grille(),
          s * (BW / 2 + 0.2),
          y + 1.0,
          bz - BD / 4,
          Math.PI / 2,
        );
    }
    // a balcony with white rails on the upper floors
    if (f > 0) {
      b.box(BW * 0.55, 0.18, 1.3, trim, 0, y - 0.1, bz + BD / 2 + 0.65);
      b.plane(BW * 0.55, 1.0, MAT.rail(), 0, y + 0.55, bz + BD / 2 + 1.3);
      for (const s of [1, -1])
        b.plane(1.3, 1.0, MAT.rail(), s * BW * 0.275, y + 0.55, bz + BD / 2 + 0.65, Math.PI / 2);
      if (cottage) flowerBox(0, y + 0.08, bz + BD / 2 + 1.42, BW * 0.5);
    }
  }
  const top = P0 + floors * FHt;
  // the front door, a porch on posts with its own little roof, and wide steps
  const dz = bz + BD / 2;
  b.plane(1.2, 2.3, MAT.door(pick(DOORS)), 0, P0 + 1.15, dz + 0.02);
  const deck = MAT.plain(0xc89a6a, 0.7);
  b.box(4.4, P0, 2.4, deck, 0, 0, dz + 1.2);
  b.box(2.6, P0 * 0.66, 0.6, deck, 0, 0, dz + 2.7);
  b.box(2.6, P0 * 0.33, 0.6, deck, 0, 0, dz + 3.3);
  for (const s of [-1, 1]) {
    // posts and rails at the sides of the porch
    b.box(0.18, 2.5, 0.18, trim, s * 2.05, P0, dz + 2.25);
    b.box(0.08, 0.08, 2.3, trim, s * 2.05, P0 + 0.95, dz + 1.15);
    for (let k = 0; k < 4; k++) b.box(0.06, 0.95, 0.06, trim, s * 2.05, P0, dz + 0.3 + k * 0.6);
  }
  if (cottage) {
    gable(b, 4.8, 2.9, 0.9, 0.25, MAT.tiles(pick(TILE_ROOFS)), trim, 0, P0 + 2.5, dz + 1.3);
  } else b.box(4.8, 0.18, 2.9, trim, 0, P0 + 2.5, dz + 1.3);
  solid(-BW / 2, BW / 2, bz - BD / 2, bz + BD / 2);
  solid(-2.2, -1.3, dz, dz + 2.4);
  solid(1.3, 2.2, dz, dz + 2.4);

  // a glass sunroom on one side, full of plants
  if (cottage && PW - BW >= 7 && r2() < 0.5) {
    const s = r2() < 0.5 ? -1 : 1;
    const sw = Math.min(3.4, (PW - BW) / 2 - 0.6),
      sd = BD * 0.7,
      sx = s * (BW / 2 + sw / 2),
      sz = bz + BD / 2 - sd / 2;
    b.box(sw, 0.5, sd, MAT.plain(0x8a7a66), sx, 0, sz);
    b.add(boxGeo(sw - 0.1, 2.6, sd - 0.1), MAT.sunroom(), sx, 0.5 + 1.3, sz);
    for (const [ex, ez] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ])
      b.box(0.12, 2.6, 0.12, trim, sx + (ex * sw) / 2, 0.5, sz + (ez * sd) / 2);
    b.box(sw + 0.2, 0.12, sd + 0.2, trim, sx, 3.1, sz);
    for (let k = 0; k < 3; k++)
      b.add(
        new THREE.IcosahedronGeometry(0.45, 0),
        MAT.plain(0x4f8f45),
        sx + (r2() - 0.5) * (sw - 1),
        1.0,
        sz + (r2() - 0.5) * (sd - 1),
      );
    solid(sx - sw / 2, sx + sw / 2, sz - sd / 2, sz + sd / 2);
  }

  // roof
  if (flat) {
    const PH = 0.9;
    for (const [w, d, x, z] of [
      [BW, 0.2, 0, BD / 2],
      [BW, 0.2, 0, -BD / 2],
      [0.2, BD, BW / 2, 0],
      [0.2, BD, -BW / 2, 0],
    ] as [number, number, number, number][])
      b.box(w, PH, d, wallM, x, top, bz + z);
    // water tank on a steel stand
    const tx = BW / 2 - 2,
      tz = bz - BD / 2 + 2;
    for (const [sx, sz] of [
      [-0.6, -0.6],
      [0.6, -0.6],
      [-0.6, 0.6],
      [0.6, 0.6],
    ])
      b.box(0.08, 1.2, 0.08, MAT.plain(0x555a5f), tx + sx, top, tz + sz);
    b.box(1.5, 0.1, 1.5, MAT.plain(0x555a5f), tx, top + 1.2, tz);
    b.add(
      new THREE.CylinderGeometry(0.75, 0.75, 1.5, 16),
      MAT.plain(r() < 0.5 ? 0x1a1a1a : 0x2a5fa8, 0.5),
      tx,
      top + 2.05,
      tz,
    );
    // a roof garden in planters
    for (let k = 0; k < 3; k++) {
      const px = -BW / 2 + 1.5 + k * 1.6;
      b.box(1.2, 0.5, 0.6, MAT.plain(0x7a5234), px, top, bz + BD / 2 - 0.8);
      b.add(
        new THREE.IcosahedronGeometry(0.45, 0),
        MAT.plain(0x4f8f45),
        px,
        top + 0.8,
        bz + BD / 2 - 0.8,
      );
    }
    b.add(
      new THREE.SphereGeometry(0.45, 12, 6, 0, Math.PI * 2, 0, 0.9),
      MAT.plain(0xe9e9e4, 0.4),
      -BW / 2 + 1.5,
      top + 1.0,
      bz,
      0,
    );
  } else {
    // a pitched roof of clay tiles, with gable ends
    const roofC = pick(TILE_ROOFS);
    gable(b, BW + 1.0, BD + 1.2, 2.6, 0.3, MAT.tiles(roofC), wallM, 0, top, bz);
    b.box(BW + 0.5, 0.2, BD + 0.5, trim, 0, top - 0.1, bz); // fascia board
    void roofC;
  }

  // the garden: a generator by the wall, flower beds along the fence, a shady tree
  if (r() < 0.5)
    b.box(
      1.1,
      0.8,
      0.7,
      MAT.plain(r() < 0.5 ? 0xd9a520 : 0x2f6fb0, 0.6),
      -BW / 2 + 1,
      0,
      bz - BD / 2 - 1.2 > -PD / 2 + 0.5 ? bz - BD / 2 - 1.2 : bz + BD / 2 + 2.5,
    );
  for (let i = 0; i < 3; i++) {
    const px = -PW / 2 + 1.2 + r() * (PW - 2.4);
    const c = r() < 0.5 ? 0x3f7d3a : 0x4f8f45;
    if (Math.abs(px - gx) < gw / 2 + 0.6) continue;
    b.add(new THREE.IcosahedronGeometry(0.55, 0), MAT.plain(c), px, 0.45, front - 0.9);
  }
  // flower beds along the inside of the front wall
  for (let x = -PW / 2 + 0.8; x < PW / 2 - 0.6; x += 0.55) {
    if (Math.abs(x - gx) < gw / 2 + 0.5) continue;
    b.add(
      new THREE.IcosahedronGeometry(0.2 + r2() * 0.08, 0),
      MAT.plain(r2() < 0.35 ? 0x3f7d3a : pick(FLOWERS)),
      x,
      0.25 + r2() * 0.15,
      front - 0.45 - r2() * 0.3,
    );
  }
  // stepping stones from the gate to the porch
  const pathEnd = dz + 3.6;
  for (let k = 0; k < 6; k++) {
    const t = k / 5;
    const px = gx * (1 - t),
      pz = front - 1 + (pathEnd - (front - 1)) * t;
    b.add(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 8), MAT.plain(0xcfc6b4), px, 0.06, pz);
  }
  // a round shady tree in a back corner, when there is room
  {
    const tx = (gx > 0 ? -1 : 1) * (PW / 2 - 1.6),
      tz = bz + BD / 2 + 1.6;
    if (Math.abs(tx) - BW / 2 > 1.6) {
      b.add(new THREE.CylinderGeometry(0.18, 0.26, 2.6, 8), MAT.plain(0x7a5a3a), tx, 1.3, tz);
      b.add(new THREE.IcosahedronGeometry(1.7, 1), MAT.plain(pick(LEAVES)), tx, 3.4, tz);
      b.add(
        new THREE.IcosahedronGeometry(1.2, 1),
        MAT.plain(pick(LEAVES)),
        tx + 0.7,
        4.2,
        tz - 0.3,
      );
      solid(tx - 0.3, tx + 0.3, tz - 0.3, tz + 0.3);
    }
  }

  b.base.identity();
  return {
    colliders,
    door: toArea(0, bz + BD / 2 + 1.2),
    gate: toArea(gx, front + 1),
    floors,
    number: o.number,
    gx,
  };
}

/** Electricity poles with sagging wires along a street (a very Lagos sight). */
export function powerLine(b: Batch, x0: number, x1: number, z: number, wires: THREE.Group) {
  const pole = MAT.plain(0x6f5a44);
  const pts: THREE.Vector3[] = [];
  for (let x = x0; x <= x1; x += 30) {
    b.add(new THREE.CylinderGeometry(0.11, 0.15, 8.5, 6), pole, x, 4.25, z);
    b.box(2.4, 0.12, 0.12, pole, x, 7.6, z);
    pts.push(new THREE.Vector3(x, 7.7, z));
  }
  const lineMat = new THREE.LineBasicMaterial({ color: 0x1a1a1a });
  for (const dz of [-1, 0, 1]) {
    const v: number[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      for (let k = 0; k <= 10; k++) {
        const t = k / 10;
        const x = pts[i].x + (pts[i + 1].x - pts[i].x) * t;
        v.push(x, pts[i].y - Math.sin(t * Math.PI) * 0.7, z + dz * 1.0);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
    wires.add(new THREE.Line(g, lineMat));
  }
}

/* ---------------- signs with text ---------------- */
export function textMat(
  text: string,
  o: { bg: string; fg: string; w?: number; h?: number; sub?: string; border?: string } = {
    bg: "#1f6f63",
    fg: "#fff",
  },
) {
  const key = `txt|${text}|${o.sub ?? ""}|${o.bg}|${o.fg}|${o.border ?? ""}`;
  return M(key, () => {
    const W = o.w ?? 1024,
      Hh = o.h ?? 160;
    const t = tex(
      key,
      W,
      Hh,
      (c, w, h) => {
        c.fillStyle = o.bg;
        c.fillRect(0, 0, w, h);
        if (o.border) {
          c.strokeStyle = o.border;
          c.lineWidth = 8;
          c.strokeRect(8, 8, w - 16, h - 16);
        }
        c.fillStyle = o.fg;
        c.textAlign = "center";
        c.textBaseline = "middle";
        let size = Math.round(h * (o.sub ? 0.42 : 0.58));
        c.font = `800 ${size}px "Work Sans", system-ui, sans-serif`;
        while (c.measureText(text).width > w - 40 && size > 12) {
          size -= 2;
          c.font = `800 ${size}px "Work Sans", system-ui, sans-serif`;
        }
        c.fillText(text, w / 2, o.sub ? h * 0.4 : h / 2 + 2);
        if (o.sub) {
          c.font = `600 ${Math.round(h * 0.2)}px "Work Sans", system-ui, sans-serif`;
          c.fillText(o.sub, w / 2, h * 0.78);
        }
      },
      false,
    );
    return std({ map: t, roughness: 0.5 });
  });
}

/** Glass curtain wall: 4 m per tile. */
const glassTex = () =>
  tex("glass", 128, 128, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#6f9fb8");
    g.addColorStop(0.5, "#2f5468");
    g.addColorStop(1, "#7fb0c8");
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#d8e2e6";
    c.fillRect(0, 0, w, 6);
    c.fillRect(0, 0, 5, h);
    c.fillRect(w / 2 - 2, 0, 4, h);
  });
/** A glass curtain wall: one floor per tile, sky reflections, slim mullions and a few lit flats. */
const curtainTex = (tint: string) =>
  tex("curtain" + tint, 128, 128, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, w * 0.4, h);
    g.addColorStop(0, "#cfe6f2");
    g.addColorStop(0.45, tint);
    g.addColorStop(1, "#1d3a4e");
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    // a soft sky streak across the panes
    c.fillStyle = "rgba(255,255,255,0.18)";
    c.beginPath();
    c.moveTo(0, h * 0.7);
    c.lineTo(w * 0.6, 0);
    c.lineTo(w * 0.85, 0);
    c.lineTo(0, h * 0.95);
    c.fill();
    // the floor slab band and the mullions
    c.fillStyle = "#e9eef2";
    c.fillRect(0, h - 10, w, 10);
    for (let x = 0; x <= w; x += w / 4) c.fillRect(x - 1.5, 0, 3, h);
    // a lit flat now and then
    c.fillStyle = "rgba(255,214,140,0.55)";
    c.fillRect(w / 4 + 3, 8, w / 4 - 6, h - 22);
  });
const shutterTex = () =>
  tex("shutter", 64, 64, (c, w, h) => {
    for (let y = 0; y < h; y++) {
      const v = 165 + Math.round(Math.sin((y / h) * Math.PI * 12) * 35);
      c.fillStyle = `rgb(${v},${v + 4},${v + 8})`;
      c.fillRect(0, y, w, 1);
    }
  });
/** Tarred ground between the buildings: like the road, a little lighter. */
export const TARRED = () =>
  M("tarred", () => std({ map: asphaltTex(), color: 0xb4b6b8, roughness: 0.95 }));
export const MAT2 = {
  glass: () => M("glass", () => std({ map: glassTex(), roughness: 0.15, metalness: 0.6 })),
  curtain: (tint: string) =>
    M("curtain" + tint, () =>
      std({ map: curtainTex(tint), roughness: 0.25, metalness: 0.05, emissive: 0x0b1820 }),
    ),
  glow: (c: number) =>
    M("glow" + c, () => std({ color: c, emissive: c, emissiveIntensity: 0.9, roughness: 0.4 })),
  shutter: () => M("shutter", () => std({ map: shutterTex(), metalness: 0.5, roughness: 0.4 })),
  water: () => M("pool", () => std({ color: 0x4fb3d0, roughness: 0.1, metalness: 0.2 })),
  lawn: () => M("lawn", () => std({ color: 0x6f9e48 })),
};

/* ---------------- shared helpers ---------------- */
type Placed = { x: number; z: number };
type Built = {
  colliders: Box[];
  /** doors and interaction spots, in area coordinates */
  spots: { key: string; x: number; z: number; label: string; labelY?: number }[];
};
/** Sets up a turned frame (front faces +z before turning) and a collider helper. */
function frame(b: Batch, x: number, z: number, turn: number) {
  b.base.makeRotationY(turn).setPosition(x, 0, z);
  const cos = Math.cos(turn),
    sin = Math.sin(turn);
  const to = (lx: number, lz: number): Placed => ({
    x: x + lx * cos + lz * sin,
    z: z - lx * sin + lz * cos,
  });
  const colliders: Box[] = [];
  const solid = (lx0: number, lx1: number, lz0: number, lz1: number) => {
    const a = to(lx0, lz0),
      c = to(lx1, lz1);
    colliders.push({
      x0: Math.min(a.x, c.x),
      x1: Math.max(a.x, c.x),
      z0: Math.min(a.z, c.z),
      z1: Math.max(a.z, c.z),
    });
  };
  return { to, colliders, solid };
}
function palmInto(b: Batch, x: number, z: number, s = 1) {
  b.add(
    new THREE.CylinderGeometry(0.14 * s, 0.24 * s, 5 * s, 6),
    MAT.plain(0x8a6a3e),
    x,
    2.5 * s,
    z,
  );
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.BoxGeometry(0.5 * s, 0.06, 2.6 * s);
    leaf.translate(0, 0, 1.2 * s);
    leaf.rotateX(0.45);
    leaf.rotateY((i / 7) * Math.PI * 2);
    b.add(leaf, MAT.plain(i % 2 ? 0x3f7d3a : 0x4f8f45), x, 5 * s, z);
  }
}
function fountain(b: Batch, x: number, z: number, r = 2.4) {
  b.add(new THREE.CylinderGeometry(r, r + 0.2, 0.6, 24), MAT.plain(0xe8e2d4), x, 0.3, z);
  b.add(new THREE.CylinderGeometry(r - 0.25, r - 0.25, 0.1, 24), MAT2.water(), x, 0.58, z);
  b.add(new THREE.CylinderGeometry(0.25, 0.35, 1.6, 10), MAT.plain(0xe8e2d4), x, 1.2, z);
  b.add(new THREE.CylinderGeometry(0.9, 0.4, 0.3, 16), MAT.plain(0xe8e2d4), x, 2.0, z);
  b.add(new THREE.SphereGeometry(0.35, 10, 8), MAT2.water(), x, 2.3, z);
}

/**
 * A school built round a courtyard (four wings, the "four-corner" shape), entered
 * through a gate in the front wing. Classes, the admin block and the Sheikh's office
 * open onto the courtyard.
 */
export function campus(
  b: Batch,
  o: {
    x: number;
    z: number;
    turn: number;
    width: number;
    depth: number;
    floors: number;
    name: string;
    classes: string[];
  },
): Built {
  const { to, colliders, solid } = frame(b, o.x, o.z, o.turn);
  const W = o.width,
    D = o.depth,
    T = 8; // wing depth
  const H = 0.4 + o.floors * 3.3;
  const wallM = MAT.plaster(0xf2ead6),
    trim = MAT.plain(0x1f6f63),
    cream = MAT.plain(0xf7f5ef);
  const front = D / 2;
  b.add(groundGeo(W, D, 2), MAT.pavement(), 0, 0.03, 0, 0, false);
  b.add(groundGeo(W - 2 * T - 4, D - 2 * T - 4, 4), MAT.paving(), 0, 0.05, 0, 0, false);
  const gate = 7;
  const wing = (cx: number, cz: number, w: number, d: number) => {
    b.box(w, H, d, wallM, cx, 0, cz);
    for (let f = 1; f <= o.floors; f++)
      b.box(w + 0.3, 0.3, d + 0.3, trim, cx, 0.4 + f * 3.3 - 0.3, cz);
    b.box(w + 0.5, 0.5, d + 0.5, cream, cx, H, cz); // parapet top
    solid(cx - w / 2, cx + w / 2, cz - d / 2, cz + d / 2);
  };
  // front wing in two halves with the gate between
  const half = (W - gate) / 2;
  wing(-W / 2 + half / 2, front - T / 2, half, T);
  wing(W / 2 - half / 2, front - T / 2, half, T);
  wing(0, -front + T / 2, W, T); // back
  wing(-W / 2 + T / 2, 0, T, D - 2 * T); // left
  wing(W / 2 - T / 2, 0, T, D - 2 * T); // right
  // gate arch with the school's name and a little dome
  b.box(gate + 2, 1.6, T, wallM, 0, H - 1.6, front - T / 2);
  b.plane(
    gate + 6,
    1.8,
    textMat(o.name, { bg: "#1f6f63", fg: "#fdf8ec", border: "#e6b84a" }),
    0,
    H + 1.4,
    front + 0.05,
  );
  b.add(
    new THREE.SphereGeometry(2.2, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    MAT.plain(0x2f8f83, 0.5),
    0,
    H + 0.5,
    front - T / 2,
  );
  // windows round the outside, and a covered walkway round the courtyard
  for (let f = 0; f < o.floors; f++) {
    const y = 0.4 + f * 3.3 + 1.6;
    for (let x = -W / 2 + 3; x < W / 2 - 2; x += 4) {
      if (Math.abs(x) < gate / 2 + 1.5) continue;
      b.plane(1.4, 1.5, MAT.window(0x1f6f63), x, y, front + 0.02);
      b.plane(1.4, 1.5, MAT.window(0x1f6f63), x, y, -front - 0.02, Math.PI);
    }
    for (let z = -D / 2 + 3; z < D / 2 - 2; z += 4) {
      b.plane(1.4, 1.5, MAT.window(0x1f6f63), -W / 2 - 0.02, y, z, -Math.PI / 2);
      b.plane(1.4, 1.5, MAT.window(0x1f6f63), W / 2 + 0.02, y, z, Math.PI / 2);
    }
  }
  const ix = W / 2 - T,
    iz = D / 2 - T; // inner courtyard edge
  for (let x = -ix + 2; x <= ix - 2; x += 4) {
    b.box(0.35, 3, 0.35, cream, x, 0, -iz + 1.6);
    if (Math.abs(x) > gate / 2 + 0.5) b.box(0.35, 3, 0.35, cream, x, 0, iz - 1.6);
  }
  for (let z = -iz + 2; z <= iz - 2; z += 4) {
    b.box(0.35, 3, 0.35, cream, -ix + 1.6, 0, z);
    b.box(0.35, 3, 0.35, cream, ix - 1.6, 0, z);
  }
  b.box(ix * 2, 0.25, 2, trim, 0, 3, -iz + 1);
  b.box(2, 0.25, iz * 2, trim, -ix + 1, 3, 0);
  b.box(2, 0.25, iz * 2, trim, ix - 1, 3, 0);
  // flagpole and trees in the courtyard
  b.add(new THREE.CylinderGeometry(0.06, 0.08, 9, 6), MAT.plain(0xd8dce0, 0.3), 0, 4.5, 0);
  b.plane(1.8, 1.1, textMat(" ", { bg: "#1f8a3a", fg: "#fff" }), 0.9, 8.3, 0);
  for (const [px, pz] of [
    [-ix / 2, -iz / 2],
    [ix / 2, -iz / 2],
    [-ix / 2, iz / 2],
    [ix / 2, iz / 2],
  ])
    palmInto(b, px, pz, 0.8);

  // doors opening onto the courtyard
  const spots: Built["spots"] = [];
  const doorAt = (lx: number, lz: number, ry: number, key: string, label: string) => {
    b.plane(1.4, 2.4, MAT.door(0x6b4226), lx, 1.2, lz, ry);
    const p = to(lx + Math.sin(ry) * 1.6, lz + Math.cos(ry) * 1.6);
    spots.push({ key, x: p.x, z: p.z, label, labelY: 3.6 });
  };
  doorAt(-gate / 2 - 3, iz - 0.02 - 0.0 + 0.04 - 0.04, Math.PI, "admin", "Admin block");
  doorAt(gate / 2 + 3, iz - 0.02, Math.PI, "office", "Sheikh's office");
  // classes along the back, then the left and right wings
  const places: [number, number, number][] = [];
  for (let x = -ix + 4; x <= ix - 4; x += 6) places.push([x, -iz + 0.02, 0]);
  for (let z = -iz + 4; z <= iz - 4; z += 6) places.push([-ix + 0.02, z, Math.PI / 2]);
  for (let z = -iz + 4; z <= iz - 4; z += 6) places.push([ix - 0.02, z, -Math.PI / 2]);
  o.classes.forEach((c, i) => {
    const pl = places[i];
    if (pl) doorAt(pl[0], pl[1], pl[2], "class:" + i, c);
  });
  spots.push({ key: "gate", ...to(0, front + 2), label: o.name, labelY: H + 4 });
  b.base.identity();
  return { colliders, spots };
}

/** A big walled house for a Sheikh: gatehouse, fountain, palms and a white house with columns. */
export function mansion(
  b: Batch,
  o: {
    x: number;
    z: number;
    turn: number;
    width: number;
    depth: number;
    floors: number;
    name: string;
  },
): Built {
  const { to, colliders, solid } = frame(b, o.x, o.z, o.turn);
  const W = o.width,
    D = o.depth;
  const front = D / 2;
  b.add(groundGeo(W, D, 2), MAT.paving(), 0, 0.035, 0, 0, false);
  const FH = 2.8,
    T = 0.4;
  const fenceM = MAT.plaster(0xf2ead6),
    gold = MAT.plain(0xd9b45a, 0.4),
    white = MAT.plaster(0xfbf8f0),
    green = MAT.plain(0x1f6f63);
  const gw = 6;
  const seg = (x0: number, x1: number, z: number) => {
    b.box(x1 - x0, FH, T, fenceM, (x0 + x1) / 2, 0, z, 0, 4);
    b.box(x1 - x0 + 0.2, 0.2, T + 0.2, gold, (x0 + x1) / 2, FH, z);
    solid(x0, x1, z - T / 2, z + T / 2);
  };
  seg(-W / 2, -gw / 2 - 0.5, front);
  seg(gw / 2 + 0.5, W / 2, front);
  seg(-W / 2, W / 2, -front);
  for (const sx of [-W / 2, W / 2]) {
    b.add(boxGeo(T, FH, D, 4), fenceM, sx, FH / 2, 0);
    solid(sx - T / 2, sx + T / 2, -front, front);
  }
  for (const px of [-gw / 2 - 0.5, gw / 2 + 0.5]) {
    b.box(1, 3.6, 1, fenceM, px, 0, front);
    b.add(new THREE.SphereGeometry(0.45, 12, 8), gold, px, 3.9, front);
    solid(px - 0.5, px + 0.5, front - 0.5, front + 0.5);
  }
  b.add(boxGeo(gw * 0.5, 2.6, 0.08), MAT.gate(0x1a1a1a), -gw * 0.25, 1.3, front - 0.05);
  b.add(boxGeo(gw * 0.2, 2.6, 0.08), MAT.gate(0x1a1a1a), gw * 0.4, 1.3, front - 0.05);
  solid(-gw / 2, 0, front - 0.2, front + 0.2);
  b.plane(
    gw + 4,
    1.0,
    textMat(o.name, { bg: "#1f6f63", fg: "#fdf8ec", border: "#d9b45a" }),
    0,
    4.6,
    front + 0.3,
  );
  b.add(boxGeo(gw + 4.2, 1.1, 0.2), green, 0, 4.6, front + 0.15);
  // gatehouse
  b.box(3, 2.8, 3, white, W / 2 - 3, 0, front - 2.5);
  b.box(3.4, 0.25, 3.4, green, W / 2 - 3, 2.8, front - 2.5);
  solid(W / 2 - 4.5, W / 2 - 1.5, front - 4, front - 1);
  // the house
  const BW = W - 14,
    BD = D - 16,
    bz = -front + 2 + BD / 2;
  const FHt = 3.6;
  for (let f = 0; f < o.floors; f++) {
    const y = 0.6 + f * FHt;
    const w = BW - f * 2;
    b.box(w, FHt - 0.3, BD - f, white, 0, y, bz - f / 2);
    b.box(w + 0.4, 0.3, BD - f + 0.4, gold, 0, y + FHt - 0.3, bz - f / 2);
    for (let x = -w / 2 + 2; x < w / 2 - 1; x += 3.2) {
      if (f === 0 && Math.abs(x) < 3) continue;
      b.plane(1.6, 2.0, MAT.window(0xd9b45a), x, y + 1.7, bz - f / 2 + (BD - f) / 2 + 0.02);
    }
  }
  b.box(BW + 1, 0.6, BD + 1, MAT.plain(0xd8d2c2), 0, 0, bz);
  const top = 0.6 + o.floors * FHt;
  // portico with columns and a dome
  for (const cx of [-3, -1, 1, 3])
    b.add(new THREE.CylinderGeometry(0.3, 0.35, 6.6, 12), white, cx, 0.6 + 3.3, bz + BD / 2 + 1.6);
  b.box(8.4, 0.5, 3.6, gold, 0, 7.2, bz + BD / 2 + 1.4);
  b.plane(1.8, 2.8, MAT.door(0x5a3418), 0, 0.6 + 1.4, bz + BD / 2 + 0.02);
  b.add(
    new THREE.SphereGeometry(2.6, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    MAT.plain(0xd9b45a, 0.35),
    0,
    top,
    bz - o.floors / 2,
  );
  b.add(new THREE.CylinderGeometry(0.06, 0.06, 1.4, 6), gold, 0, top + 3.2, bz - o.floors / 2);
  solid(-BW / 2, BW / 2, bz - BD / 2, bz + BD / 2 + 0.3);
  // fountain and palms in the front yard
  fountain(b, 0, front - 4.5, 2.2);
  solid(-2.4, 2.4, front - 6.9, front - 2.1);
  for (const px of [-W / 2 + 3, W / 2 - 6, -W / 2 + 3, W / 2 - 3])
    palmInto(b, px, px > 0 ? -front + 3 : front - 4, 1);
  b.base.identity();
  return { colliders, spots: [{ key: "gate", ...to(0, front + 1.4), label: o.name, labelY: 6 }] };
}

/** A modern office: glass tower, the company name on top, a plaza with a fountain and flags. */
export function office(
  b: Batch,
  o: {
    x: number;
    z: number;
    turn: number;
    width: number;
    depth: number;
    floors: number;
    name: string;
    color: number;
    accent: number;
  },
): Built {
  const { to, colliders, solid } = frame(b, o.x, o.z, o.turn);
  const W = o.width,
    D = o.depth,
    front = D / 2;
  b.add(groundGeo(W, D, 2), MAT.pavement(), 0, 0.035, 0, 0, false);
  const BW = W - 6,
    BD = D - 12,
    bz = -front + 1 + BD / 2;
  const FHt = 3.6,
    H = 0.6 + o.floors * FHt;
  const brand = MAT.plain(o.color, 0.4);
  b.box(BW + 0.6, 0.6, BD + 0.6, MAT.plain(0x9a958a), 0, 0, bz);
  b.add(boxGeo(BW, H - 0.6, BD, 4), MAT2.glass(), 0, 0.6 + (H - 0.6) / 2, bz);
  for (let f = 1; f <= o.floors; f++)
    b.box(BW + 0.3, 0.25, BD + 0.3, MAT.plain(0xe9ecee, 0.3), 0, 0.6 + f * FHt - 0.25, bz);
  // coloured vertical fins in the brand colour
  for (const x of [-BW / 2, BW / 2]) b.box(0.8, H + 0.6, 0.8, brand, x, 0, bz + BD / 2);
  b.box(BW + 1.2, 1.2, BD + 1.2, brand, 0, H, bz);
  const hex = (c: number) => "#" + c.toString(16).padStart(6, "0");
  b.plane(
    BW * 0.9,
    2.2,
    textMat(o.name, { bg: hex(o.color), fg: hex(o.accent) }),
    0,
    H + 2.4,
    bz + BD / 2 + 0.1,
  );
  b.box(BW * 0.92, 2.4, 0.2, brand, 0, H + 1.2, bz + BD / 2);
  // entrance canopy
  b.box(7, 0.3, 3, brand, 0, 3.4, bz + BD / 2 + 1.5);
  b.plane(3, 2.6, MAT2.glass(), 0, 1.9, bz + BD / 2 + 0.03);
  solid(-BW / 2 - 0.4, BW / 2 + 0.4, bz - BD / 2, bz + BD / 2 + 0.4);
  // plaza: fountain, flags, benches, planters
  fountain(b, -W / 4, front - 4, 1.8);
  solid(-W / 4 - 2, -W / 4 + 2, front - 6, front - 2);
  for (const [i, fx] of [W / 4 - 1.5, W / 4, W / 4 + 1.5].entries()) {
    b.add(
      new THREE.CylinderGeometry(0.05, 0.06, 7, 6),
      MAT.plain(0xd8dce0, 0.3),
      fx,
      3.5,
      front - 3,
    );
    b.plane(
      1.3,
      0.8,
      i === 1 ? brand : MAT.plain(i ? 0x1f8a3a : 0xfdfdfd),
      fx + 0.65,
      6.5,
      front - 3,
    );
  }
  for (const bx of [-W / 2 + 2, W / 2 - 2]) {
    b.box(1.6, 0.45, 0.5, MAT.plain(0x8a5a3a), bx, 0, front - 1.5);
    b.add(new THREE.CylinderGeometry(0.6, 0.5, 0.8, 12), MAT.plain(0xcfc8b8), bx, 0.4, front - 7);
    b.add(new THREE.IcosahedronGeometry(0.8, 0), MAT.plain(0x3f7d3a), bx, 1.3, front - 7);
  }
  b.base.identity();
  return {
    colliders,
    spots: [{ key: "door", ...to(0, bz + BD / 2 + 3), label: o.name, labelY: 4.6 }],
  };
}

/** A row of lock-up shops on a plot. Returns where each shop's front and sign are. */
export function shopRow(
  b: Batch,
  o: { x: number; z: number; turn: number; n?: number; rnd: () => number },
) {
  const { to, colliders, solid } = frame(b, o.x, o.z, o.turn);
  const n = o.n ?? 4,
    UW = 5.2,
    W = n * UW,
    D = 7,
    H = 3.8;
  const front = 10 - 1.2; // just inside the plot front
  const back = front - D;
  const wallC = [0xf2e6c8, 0xdfe8dc, 0xf0dcc8][Math.floor(o.rnd() * 3)];
  const wallM = MAT.plaster(wallC);
  b.add(groundGeo(W + 2, 3, 2), MAT.pavement(), 0, 0.04, front + 1.3, 0, false);
  b.box(W, H, 0.3, wallM, 0, 0, back); // back wall
  for (let i = 0; i <= n; i++) b.box(0.3, H, D, wallM, -W / 2 + i * UW, 0, (front + back) / 2);
  b.box(W + 0.4, 0.3, D + 0.6, MAT.plain(0xf7f5ef), 0, H, (front + back) / 2 + 0.2); // roof slab
  b.box(W + 0.4, 0.9, 0.25, MAT.plain(0x1f6f63), 0, H + 0.3, front + 0.4); // parapet band
  b.add(groundGeo(W, D, 2), MAT.plain(0xb8b2a4), 0, 0.05, (front + back) / 2, 0, false);
  solid(-W / 2, W / 2, back - 0.15, back + 0.15);
  for (let i = 0; i <= n; i++) solid(-W / 2 + i * UW - 0.15, -W / 2 + i * UW + 0.15, back, front);
  const units: { center: Placed; front: Placed; turn: number }[] = [];
  for (let i = 0; i < n; i++) {
    const lx = -W / 2 + UW * (i + 0.5);
    units.push({ center: to(lx, (front + back) / 2), front: to(lx, front + 1.6), turn: o.turn });
    // a counter at the back of each shop
    b.box(UW - 1.2, 1, 0.8, MAT.plain(0x8a5a3a), lx, 0, back + 0.8);
  }
  b.base.identity();
  return { colliders, units, front, unitWidth: UW };
}

/** Open market stalls under tin roofs, in a row facing +z. */
const AWNINGS = [0x3fa79a, 0xf2c230, 0x6aa84f, 0xe8584a, 0xff8a3d, 0x6b8be8, 0xd66bd0];
const PRODUCE = [0xe8443a, 0xf2a03a, 0xf2d33a, 0x6aa84f, 0x8a3a8a, 0xf28aa0];
/** A row of market stalls: striped canopies with scalloped edges, wooden counters, crates of
    fruit and vegetables, potted plants, and string lights between the stalls. */
export function stallRow(b: Batch, o: { x0: number; x1: number; z: number; turn: number }) {
  const { to, colliders, solid } = frame(b, 0, o.z, o.turn);
  const SW = 5,
    SD = 4;
  const units: { center: Placed; front: Placed; lx: number }[] = [];
  const wood = MAT.plain(0x8a6a3e);
  let k = Math.abs(Math.round(o.x0 * 3 + o.z * 7));
  const bulb = MAT.bulb();
  for (let x = o.x0; x + SW <= o.x1; x += SW + 0.6) {
    const cx = x + SW / 2;
    const col = AWNINGS[k++ % AWNINGS.length];
    for (const [px, pz] of [
      [-SW / 2, -SD / 2],
      [SW / 2, -SD / 2],
      [-SW / 2, SD / 2],
      [SW / 2, SD / 2],
    ])
      b.box(0.12, 2.8, 0.12, wood, cx + px, 0, pz);
    // the striped canopy, sloping to the front
    const roof = boxGeo(SW + 0.6, 0.08, SD + 0.8, SW + 0.6);
    roof.rotateX(0.12);
    b.add(roof, MAT.awning(col), cx, 2.95, 0);
    // a scalloped valance along the front edge
    for (let sx = -SW / 2 - 0.2; sx < SW / 2 + 0.3; sx += 0.5) {
      const sc = new THREE.CircleGeometry(0.26, 10, Math.PI, Math.PI);
      b.add(sc, MAT.plain(col), cx + sx + 0.25, 2.72, SD / 2 + 0.42, 0, false);
    }
    // the counter, with produce in crates and baskets
    b.box(SW - 0.4, 0.9, 0.9, wood, cx, 0, SD / 2 - 0.6);
    b.box(SW - 0.4, 0.06, 1.1, MAT.plain(0xe9dcc0), cx, 0.9, SD / 2 - 0.6);
    for (let c = 0; c < 3; c++) {
      const bx = cx - SW / 2 + 0.9 + c * 1.6;
      b.box(1.2, 0.28, 0.75, MAT.plain(0xb0844a), bx, 0.96, SD / 2 - 0.6);
      const fruit = MAT.plain(PRODUCE[(k + c) % PRODUCE.length], 0.6);
      for (let f = 0; f < 6; f++)
        b.add(
          new THREE.IcosahedronGeometry(0.12, 0),
          fruit,
          bx - 0.4 + (f % 3) * 0.4,
          1.32 + Math.floor(f / 3) * 0.08,
          SD / 2 - 0.75 + Math.floor(f / 3) * 0.28,
        );
    }
    // a potted plant by the post
    b.add(
      new THREE.CylinderGeometry(0.28, 0.2, 0.45, 10),
      MAT.plain(0xb0603a),
      cx + SW / 2 - 0.2,
      0.22,
      SD / 2 + 0.5,
    );
    b.add(
      new THREE.IcosahedronGeometry(0.42, 1),
      MAT.plain(0x4f8f45),
      cx + SW / 2 - 0.2,
      0.75,
      SD / 2 + 0.5,
    );
    b.add(groundGeo(SW, SD, 2), MAT.plain(0xa89c88), cx, 0.04, 0, 0, false);
    // string lights from this stall to the next
    for (let t = 0; t <= 3; t++) {
      const lx = cx + SW / 2 - 0.2 + (t / 3) * 0.9 + 0.05;
      const sag = Math.sin((t / 3) * Math.PI) * 0.25;
      b.add(
        new THREE.SphereGeometry(0.07, 6, 4),
        bulb,
        lx - 0.2,
        2.75 - sag,
        SD / 2 + 0.3,
        0,
        false,
      );
    }
    for (let t = 0; t < 5; t++)
      b.add(
        new THREE.SphereGeometry(0.07, 6, 4),
        bulb,
        cx - SW / 2 + 0.3 + (t * (SW - 0.6)) / 4,
        2.62,
        SD / 2 + 0.55,
        0,
        false,
      );
    solid(cx - SW / 2, cx + SW / 2, -SD / 2, SD / 2 - 0.1);
    units.push({ center: to(cx, 0), front: to(cx, SD / 2 + 1.6), lx: cx });
  }
  b.base.identity();
  return { colliders, units };
}

/** A university lecture building: brick and cream, a columned porch and a name band. */
/** How each university's buildings look. */
export type CampusStyle = "modern" | "brick" | "classic" | "islamic";
export function campusStyleOf(name: string): CampusStyle {
  if (/UNILAG|LASUSTECH/.test(name)) return "modern";
  if (/LASU\b/.test(name)) return "brick";
  if (/Hikmah|Manaar/.test(name)) return "islamic";
  return "classic";
}
/** A grand faculty building: a wide stair to a raised plaza, a tall main block, and a
    centrepiece that differs by university — a glass tower (UNILAG, LASUSTECH), red brick
    with white columns (LASU), a temple front with a pediment (Unilorin), or pointed arches
    and a dome (Al-Hikmah). */
export function faculty(
  b: Batch,
  o: {
    x: number;
    z: number;
    turn: number;
    width: number;
    depth: number;
    floors: number;
    name: string;
  },
): Built {
  const { to, colliders, solid } = frame(b, o.x, o.z, o.turn);
  const style = campusStyleOf(o.name);
  const W = o.width,
    D = o.depth,
    front = D / 2;
  b.add(groundGeo(W, D, 2), MAT.paving(), 0, 0.035, 0, 0, false);
  const floors = Math.max(4, o.floors + 1);
  const FH = 3.6,
    P = 0.9, // the raised plinth
    H = P + floors * FH;
  const BW = W - 3,
    BD = D - 11,
    bz = -front + 1 + BD / 2,
    fz = bz + BD / 2; // the front face
  const pal = {
    modern: { wall: 0xeef1f4, trim: 0x2a4a7a, accent: 0x3a7bd5, sign: "#14325a" },
    brick: { wall: 0xa8503a, trim: 0xf4efe4, accent: 0x7a2e22, sign: "#7a2e22" },
    classic: { wall: 0xe8dcc0, trim: 0xf8f3e6, accent: 0x6a2a2a, sign: "#5a1f2a" },
    islamic: { wall: 0xf6f2e8, trim: 0x1f6f63, accent: 0xc9a227, sign: "#1f6f63" },
  }[style];
  const wall = style === "brick" ? MAT.block(pal.wall) : MAT.plaster(pal.wall),
    trim = MAT.plaster(pal.trim),
    stone = MAT.plain(0xcfc8b6);
  // plinth and the wide steps across the front
  b.box(BW + 1.2, P, BD + 1.2, stone, 0, 0, bz);
  for (let i = 0; i < 3; i++)
    b.box(BW * 0.7 - i * 1.2, (P / 3) * (i + 1), 1.1, stone, 0, 0, fz + 2.7 - i * 1.0);
  // two side wings and the taller middle block
  const wingW = BW * 0.3,
    midW = BW - wingW * 2;
  for (const s of [-1, 1]) {
    const cx = s * (midW / 2 + wingW / 2);
    b.box(wingW, (floors - 1) * FH, BD, wall, cx, P, bz);
    b.box(wingW + 0.4, 0.5, BD + 0.4, trim, cx, P + (floors - 1) * FH, bz);
    for (let f = 0; f < floors - 1; f++) {
      const y = P + f * FH + 1.8;
      for (let x = -wingW / 2 + 1.6; x < wingW / 2 - 1; x += 2.4) {
        const win = style === "islamic" ? MAT3.archWin(pal.wall, pal.trim) : MAT.window(0x2a4a6a);
        b.plane(1.5, 2.1, win, cx + x, y, fz + 0.02);
        b.plane(1.5, 2.1, win, cx + x, y, bz - BD / 2 - 0.02, Math.PI);
      }
      // a band between floors
      b.box(wingW + 0.15, 0.18, BD + 0.15, trim, cx, P + (f + 1) * FH - 0.2, bz);
    }
  }
  b.box(midW, floors * FH, BD + 1.2, wall, 0, P, bz + 0.6);
  const mz = fz + 1.2;
  if (style === "modern") {
    // a full-height glass curtain wall, a floating roof blade and a glass crown
    b.plane(midW - 1.4, floors * FH - 1, MAT2.glass(), 0, P + (floors * FH) / 2, mz + 0.03);
    for (let f = 1; f < floors; f++) b.box(midW - 1.2, 0.2, 0.25, trim, 0, P + f * FH, mz + 0.1);
    for (let x = -midW / 2 + 0.7; x <= midW / 2 - 0.6; x += (midW - 1.4) / 4)
      b.box(0.2, floors * FH - 1, 0.3, trim, x, P + 0.5, mz + 0.1);
    b.box(midW + 6, 0.5, BD + 5, MAT.plain(0xf4f6f8, 0.4), 0, H + 0.4, bz + 1.5);
    b.box(midW * 0.6, 4.5, BD * 0.6, MAT2.glass(), 0, H + 0.9, bz);
    b.box(midW * 0.6 + 0.4, 0.4, BD * 0.6 + 0.4, trim, 0, H + 5.4, bz);
    // a slim canopy over the entrance on two steel legs
    b.box(midW + 2, 0.25, 4, MAT.plain(0x9aa3ad, 0.4), 0, 4.4, mz + 2);
    for (const x of [-midW / 2 - 0.6, midW / 2 + 0.6]) {
      b.box(0.25, 3.6, 0.25, MAT.plain(0x9aa3ad, 0.4), x, P, mz + 3.6);
      solid(x - 0.3, x + 0.3, mz + 3.3, mz + 3.9);
    }
  } else if (style === "islamic") {
    // tall pointed arches on slender columns, a green dome and two slim towers
    for (let f = 0; f < floors - 1; f++)
      for (let x = -midW / 2 + 1.7; x < midW / 2 - 1; x += 2.6)
        b.plane(1.8, 2.4, MAT3.archWin(pal.wall, pal.trim), x, P + f * FH + 1.9, mz + 0.03);
    const n = 6;
    for (let i = 0; i < n; i++) {
      const x = -midW / 2 + 1 + (i * (midW - 2)) / (n - 1);
      b.add(new THREE.CylinderGeometry(0.28, 0.3, 6, 10), trim, x, P + 3, mz + 2.6);
      solid(x - 0.35, x + 0.35, mz + 2.25, mz + 2.95);
    }
    b.box(midW, 1.2, 3.2, MAT.plaster(pal.wall), 0, P + 6, mz + 1.6);
    b.plane(midW - 1, 1.1, MAT3.lattice(), 0, P + 6.6, mz + 3.22);
    const dome = new THREE.SphereGeometry(midW * 0.32, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    b.box(midW * 0.62, 1.6, midW * 0.62, trim, 0, H, bz);
    b.add(dome, MAT.plain(0x1f6f63, 0.5), 0, H + 1.6, bz);
    b.add(
      new THREE.SphereGeometry(0.45, 10, 8),
      MAT.plain(pal.accent, 0.3),
      0,
      H + 1.6 + midW * 0.32 + 0.3,
      bz,
    );
    for (const s of [-1, 1]) {
      const tx = s * (BW / 2 - 0.9);
      b.add(new THREE.CylinderGeometry(0.75, 0.85, H + 7, 10), trim, tx, (H + 7) / 2, fz - 0.5);
      b.add(new THREE.ConeGeometry(0.9, 2.6, 10), MAT.plain(0x1f6f63, 0.5), tx, H + 8.3, fz - 0.5);
    }
  } else {
    // a temple front: tall columns up two floors under a pediment (classic), or white
    // columns against red brick with a square clock turret (brick)
    const n = style === "classic" ? 6 : 4;
    const colH = FH * 2 + 0.6;
    for (let i = 0; i < n; i++) {
      const x = -midW / 2 + 1 + (i * (midW - 2)) / (n - 1);
      b.add(new THREE.CylinderGeometry(0.42, 0.48, colH, 14), trim, x, P + colH / 2, mz + 2.6);
      b.box(1.1, 0.4, 1.1, trim, x, P, mz + 2.6);
      solid(x - 0.55, x + 0.55, mz + 2.05, mz + 3.15);
    }
    b.box(midW + 0.6, 0.9, 3.6, trim, 0, P + colH, mz + 1.6);
    if (style === "classic") {
      const ped = new THREE.CylinderGeometry(midW / 2 + 0.4, midW / 2 + 0.4, 3.6, 3, 1);
      ped.rotateX(Math.PI / 2);
      ped.rotateZ(Math.PI / 2);
      ped.scale(1, 0.32, 1);
      b.add(ped, trim, 0, P + colH + 0.9 + 1.0, mz + 1.6);
    }
    for (let f = 2; f < floors; f++)
      for (let x = -midW / 2 + 1.6; x < midW / 2 - 1; x += 2.4)
        b.plane(1.5, 2.1, MAT.window(0x2a4a6a), x, P + f * FH + 1.8, mz + 0.03);
    b.box(midW + 0.6, 0.6, BD + 1.8, trim, 0, H, bz + 0.6);
    if (style === "brick") {
      // a clock turret over the middle
      b.box(4.4, 6, 4.4, wall, 0, H + 0.6, bz);
      b.box(4.8, 0.5, 4.8, trim, 0, H + 6.6, bz);
      b.add(
        new THREE.ConeGeometry(3.4, 3.4, 4),
        MAT.plain(0x3a3f44, 0.6),
        0,
        H + 8.8,
        bz,
        Math.PI / 4,
      );
      b.add(new THREE.CircleGeometry(1.3, 24), MAT.plain(0xfaf6ea, 0.5), 0, H + 4, bz + 2.22);
      b.box(0.12, 1.0, 0.05, MAT.plain(0x1a1a1a), 0, H + 3.9, bz + 2.26);
      b.box(0.8, 0.12, 0.05, MAT.plain(0x1a1a1a), 0.35, H + 4, bz + 2.26);
    }
  }
  // the faculty's name in big letters over the entrance
  b.plane(
    Math.min(midW + 2, 20),
    1.5,
    textMat(o.name, { bg: pal.sign, fg: "#fdf8ec", border: "#e6b84a" }),
    0,
    style === "modern" ? 5.6 : P + FH * 2 + 1.0 + (style === "islamic" ? 0.6 : 0.2),
    mz + (style === "modern" ? 0.12 : style === "islamic" ? 3.24 : 3.45),
  );
  b.plane(3.2, 3.3, MAT.door(0x3a2a1a), 0, P + 1.65, mz + 0.05);
  solid(-BW / 2 - 0.6, BW / 2 + 0.6, bz - BD / 2 - 0.6, fz + 1.4);
  // the forecourt: flower beds, lamps and two flag poles
  for (const s of [-1, 1]) {
    const bx = s * (W / 2 - 3.2);
    b.box(4, 0.45, 2.2, MAT.plain(0x8a7a5a), bx, 0, front - 2.2);
    b.box(3.6, 0.2, 1.8, MAT2.lawn(), bx, 0.45, front - 2.2);
    solid(bx - 2, bx + 2, front - 3.3, front - 1.1);
    const fx = s * (BW * 0.36);
    b.add(new THREE.CylinderGeometry(0.08, 0.1, 9, 6), MAT.plain(0xd0d0d0, 0.3), fx, 4.5, fz + 4.4);
    b.box(1.6, 1, 0.05, MAT.plain(s < 0 ? 0x008751 : pal.accent), fx + 0.85, 7.7, fz + 4.4);
    solid(fx - 0.2, fx + 0.2, fz + 4.2, fz + 4.6);
  }
  const door = to(0, Math.min(front - 0.6, fz + 4.2));
  b.base.identity();
  return {
    colliders,
    spots: [{ key: "door", x: door.x, z: door.z, label: o.name, labelY: H + 3 }],
  };
}

/** A football field with lines, goals and a small covered stand. */
export type Pitch = {
  /** centre of the playing area, in area coordinates */
  x: number;
  z: number;
  /** length (goal to goal) and width of the playing area */
  len: number;
  wid: number;
  /** the pitch's turn: its length runs along (cos turn, -sin turn) */
  turn: number;
  /** where spectators wait, in area coordinates */
  stand: { x: number; z: number };
};
export function field(
  b: Batch,
  o: {
    x: number;
    z: number;
    turn: number;
    width: number;
    depth: number;
    name: string;
    /** a small neighbourhood pitch: benches instead of a covered stand */
    small?: boolean;
  },
): Built & { pitch: Pitch } {
  const { to, colliders, solid } = frame(b, o.x, o.z, o.turn);
  const W = o.width,
    D = o.depth;
  b.add(groundGeo(W, D, 2), MAT2.lawn(), 0, 0.04, 0, 0, false);
  const line = MAT.plain(0xf7f5ef);
  const stripe = (w: number, d: number, x: number, z: number) =>
    b.add(new THREE.BoxGeometry(w, 0.02, d), line, x, 0.06, z, 0, false);
  const PW = o.small ? W - 4 : W - 6,
    PD = o.small ? D - 5 : D - 10,
    pz = o.small ? 0.8 : -2;
  stripe(PW, 0.2, 0, pz - PD / 2);
  stripe(PW, 0.2, 0, pz + PD / 2);
  stripe(0.2, PD, -PW / 2, pz);
  stripe(0.2, PD, PW / 2, pz);
  stripe(0.2, PD, 0, pz);
  const ring = new THREE.RingGeometry(Math.min(3.6, PD / 4), Math.min(3.8, PD / 4 + 0.2), 32);
  ring.rotateX(-Math.PI / 2);
  b.add(ring, line, 0, 0.07, pz, 0, false);
  const boxW = Math.min(12, PD - 2),
    boxL = o.small ? 4 : 5;
  // goals with nets at both ends
  const white = MAT.plain(0xffffff, 0.4);
  const net = M_NET();
  for (const s of [-1, 1]) {
    const gx = s * (PW / 2);
    b.box(0.15, 2.2, 0.15, white, gx, 0, pz - 3);
    b.box(0.15, 2.2, 0.15, white, gx, 0, pz + 3);
    b.box(0.15, 0.15, 6.15, white, gx, 2.2, pz);
    // the net: back, top and sides
    b.add(new THREE.PlaneGeometry(6, 2.2), net, gx + s * 1.2, 1.1, pz, Math.PI / 2, false);
    const top = new THREE.PlaneGeometry(1.2, 6);
    top.rotateX(-Math.PI / 2);
    b.add(top, net, gx + s * 0.6, 2.2, pz, 0, false);
    for (const side of [-3, 3])
      b.add(new THREE.PlaneGeometry(1.2, 2.2), net, gx + s * 0.6, 1.1, pz + side, 0, false);
    solid(gx - 0.2, gx + 0.2, pz - 3.2, pz - 2.8);
    solid(gx - 0.2, gx + 0.2, pz + 2.8, pz + 3.2);
    stripe(0.2, boxW, gx - s * boxL, pz);
    stripe(boxL, 0.2, gx - s * (boxL / 2), pz - boxW / 2);
    stripe(boxL, 0.2, gx - s * (boxL / 2), pz + boxW / 2);
  }
  let stand: { x: number; z: number };
  if (o.small) {
    // benches along the back for players waiting their turn
    const bz = -D / 2 + 1;
    for (const x of [-PW * 0.3, 0, PW * 0.3]) {
      b.box(3, 0.45, 0.6, MAT.plain(0x8a5a3a), x, 0, bz);
      solid(x - 1.5, x + 1.5, bz - 0.3, bz + 0.3);
    }
    b.plane(10, 1, textMat(o.name, { bg: "#1f6f63", fg: "#fdf8ec" }), 0, 2.4, -D / 2 + 0.3);
    for (const x of [-5.2, 5.2]) b.box(0.12, 2.9, 0.12, MAT.plain(0x5a5f66), x, 0, -D / 2 + 0.3);
    stand = to(PW * 0.3 + 2, bz + 0.6);
  } else {
    // a covered stand along the back
    const sz = -D / 2 + 2;
    for (let r = 0; r < 3; r++)
      b.box(PW * 0.5, 0.45 + r * 0.45, 1, MAT.plain(0xd8d2c2), 0, 0, sz + 2 - r);
    b.box(PW * 0.55, 0.15, 4, MAT.plain(0x1f6f63, 0.5), 0, 4.2, sz + 1);
    for (const x of [-PW * 0.26, PW * 0.26])
      b.box(0.2, 4.2, 0.2, MAT.plain(0x5a5f66), x, 0, sz + 1);
    solid(-PW * 0.25, PW * 0.25, sz - 0.5, sz + 2.6);
    b.plane(14, 1.4, textMat(o.name, { bg: "#1f6f63", fg: "#fdf8ec" }), 0, 4.9, sz + 3.05);
    stand = to(PW * 0.25 + 2, sz + 3.6);
  }
  const spot = to(0, D / 2 - 1.5);
  const c = to(0, pz);
  b.base.identity();
  return {
    colliders,
    spots: [{ key: "field", x: spot.x, z: spot.z, label: o.name, labelY: 3.4 }],
    pitch: { x: c.x, z: c.z, len: PW, wid: PD, turn: o.turn, stand },
  };
}
let netMat: THREE.Material | null = null;
function M_NET() {
  if (netMat) return netMat;
  const cv = document.createElement("canvas");
  cv.width = cv.height = 64;
  const c = cv.getContext("2d")!;
  c.strokeStyle = "rgba(255,255,255,0.85)";
  c.lineWidth = 2;
  for (let i = 0; i <= 64; i += 8) {
    c.beginPath();
    c.moveTo(i, 0);
    c.lineTo(i, 64);
    c.moveTo(0, i);
    c.lineTo(64, i);
    c.stroke();
  }
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(6, 3);
  netMat = new THREE.MeshBasicMaterial({
    map: t,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  return netMat;
}

/** A shaded meeting point: a green canopy over mats, potted palms and a notice board. */
export function hangout(
  b: Batch,
  o: { x: number; z: number; turn: number; width: number; depth: number; name: string },
): Built & { seats: { x: number; z: number; face: number }[] } {
  const { to, colliders, solid } = frame(b, o.x, o.z, o.turn);
  const W = o.width,
    D = o.depth;
  b.add(groundGeo(W, D, 2), MAT.paving(), 0, 0.035, 0, 0, false);
  const CW = W - 6,
    CD = D - 6;
  // mats under the canopy
  b.add(new THREE.BoxGeometry(CW - 0.6, 0.05, CD - 0.6), MAT.plain(0x2f8f83), 0, 0.06, 0, 0, false);
  b.add(new THREE.BoxGeometry(CW - 3, 0.06, CD - 3), MAT.plain(0xc9a24a), 0, 0.07, 0, 0, false);
  for (const [x, z] of [
    [-CW / 2, -CD / 2],
    [CW / 2, -CD / 2],
    [-CW / 2, CD / 2],
    [CW / 2, CD / 2],
  ]) {
    b.box(0.3, 3.6, 0.3, MAT.plain(0xf2ead6), x, 0, z);
    solid(x - 0.25, x + 0.25, z - 0.25, z + 0.25);
  }
  b.box(CW + 1.4, 0.3, CD + 1.4, MAT.plain(0x1f6f63, 0.5), 0, 3.6, 0);
  b.add(
    new THREE.ConeGeometry(Math.max(CW, CD) * 0.6, 1.6, 4),
    MAT.plain(0x1f6f63, 0.5),
    0,
    4.7,
    0,
    Math.PI / 4,
  );
  b.plane(
    CW * 0.9,
    1.2,
    textMat(o.name, { bg: "#fdf8ec", fg: "#1f6f63", border: "#1f6f63" }),
    0,
    3.15,
    CD / 2 + 0.72,
  );
  // potted palms at the corners of the plaza
  for (const [x, z] of [
    [-W / 2 + 1.5, D / 2 - 1.5],
    [W / 2 - 1.5, D / 2 - 1.5],
  ]) {
    b.add(new THREE.CylinderGeometry(0.6, 0.5, 0.8, 12), MAT.plain(0xcfc8b8), x, 0.4, z);
    palmInto(b, x, z, 0.6);
    solid(x - 0.6, x + 0.6, z - 0.6, z + 0.6);
  }
  // seats round the circle, facing the middle
  const R = CD / 2 - 1.6;
  const seats: { x: number; z: number; face: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    if (Math.abs(Math.sin(a) - 1) < 0.15) continue; // leave the front open
    const lx = Math.cos(a) * R * 1.5,
      lz = Math.sin(a) * R;
    const p = to(lx, lz);
    seats.push({ x: p.x, z: p.z, face: Math.atan2(-lx, -lz) + o.turn });
  }
  const spot = to(0, D / 2 - 1);
  b.base.identity();
  return {
    colliders,
    seats,
    spots: [{ key: "meet", x: spot.x, z: spot.z, label: o.name, labelY: 5.6 }],
  };
}

/** The sisters' corner: a hedged garden with a skipping rope, benches and a sign. */
export function sistersCorner(
  b: Batch,
  o: { x: number; z: number; turn: number; width: number; depth: number; name: string },
): Built & { spots2: { x: number; z: number; face: number }[] } {
  const { to, colliders, solid } = frame(b, o.x, o.z, o.turn);
  const W = o.width,
    D = o.depth;
  b.add(groundGeo(W, D, 2), MAT.paving(), 0, 0.035, 0, 0, false);
  b.add(new THREE.BoxGeometry(W - 6, 0.04, D - 7), MAT.plain(0xd9a7b8), 0, 0.06, -0.5, 0, false);
  const hedge = MAT.plain(0x4f8a3a);
  // hedges on three sides, open to the street
  b.box(W, 1.2, 0.8, hedge, 0, 0, -D / 2 + 0.4);
  b.box(0.8, 1.2, D, hedge, -W / 2 + 0.4, 0, 0);
  b.box(0.8, 1.2, D, hedge, W / 2 - 0.4, 0, 0);
  solid(-W / 2, W / 2, -D / 2, -D / 2 + 0.8);
  solid(-W / 2, -W / 2 + 0.8, -D / 2, D / 2);
  solid(W / 2 - 0.8, W / 2, -D / 2, D / 2);
  // the rope itself is drawn and turned by the game (rope.ts)
  for (const bx of [-W / 2 + 2.5, W / 2 - 2.5]) {
    b.box(2, 0.45, 0.6, MAT.plain(0x8a5a3a), bx, 0, -D / 2 + 2);
    solid(bx - 1, bx + 1, -D / 2 + 1.7, -D / 2 + 2.3);
  }
  b.plane(W * 0.7, 1.2, textMat(o.name, { bg: "#8a2f4f", fg: "#fdf8ec" }), 0, 2.6, -D / 2 + 0.85);
  b.box(0.15, 2.6, 0.15, MAT.plain(0x5a5f66), -W * 0.36, 0, -D / 2 + 0.8);
  b.box(0.15, 2.6, 0.15, MAT.plain(0x5a5f66), W * 0.36, 0, -D / 2 + 0.8);
  const spots2 = [
    { lx: -2.3, lz: -1, f: Math.PI / 2 },
    { lx: 2.3, lz: -1, f: -Math.PI / 2 },
    { lx: 0, lz: -1, f: 0 },
    { lx: -W / 2 + 2.5, lz: -D / 2 + 2.6, f: 0 },
  ].map((p) => {
    const q = to(p.lx, p.lz);
    return { x: q.x, z: q.z, face: p.f + o.turn };
  });
  const spot = to(0, D / 2 - 1.5);
  b.base.identity();
  return {
    colliders,
    spots2,
    spots: [{ key: "sisters", x: spot.x, z: spot.z, label: o.name, labelY: 3.4 }],
  };
}

/** A filling station by the expressway: a white canopy with the green Barakah Oil band, two
    pump islands, a little shop, the tall price sign by the road and air for tyres. Its
    front (+z) faces the road. */
export function fillingStation(b: Batch, o: { x: number; z: number; turn: number }): Built {
  const { to, colliders, solid } = frame(b, o.x, o.z, o.turn);
  const W = 28,
    D = 22;
  const white = MAT.plain(0xf4f4f0, 0.5);
  const green = MAT.plain(0x1d7a3a, 0.5);
  const gold = MAT.plain(0xe6b84a, 0.5);
  const steel = MAT.plain(0x9aa0a6, 0.4);
  // the forecourt: concrete with a kerb, open to the road
  b.add(groundGeo(W, D, 3), MAT.plain(0xc9c6bd), 0, 0.03, 0, 0, false);
  b.box(W, 0.2, 0.4, white, 0, 0, -D / 2 + 0.2);
  // the canopy over the pumps on four pillars
  const cz = 1.5;
  for (const [px, pz] of [
    [-6.5, cz - 3],
    [6.5, cz - 3],
    [-6.5, cz + 3],
    [6.5, cz + 3],
  ]) {
    b.box(0.45, 5.2, 0.45, white, px, 0, pz);
    solid(px - 0.25, px + 0.25, pz - 0.25, pz + 0.25);
  }
  b.box(17, 0.9, 10, white, 0, 5.2, cz);
  for (const s of [1, -1]) {
    b.box(17.1, 0.45, 0.06, green, 0, 5.4, cz + s * 5.01);
    b.box(0.06, 0.45, 10.1, green, s * 8.52, 5.4, cz);
  }
  b.box(17.1, 0.1, 0.07, gold, 0, 5.92, cz + 5.02);
  b.plane(6, 0.8, textMat("BARAKAH OIL", { bg: "#1d7a3a", fg: "#fdf8ec" }), 0, 5.65, cz + 5.06);
  // two pump islands, two pumps each
  for (const ix of [-3.2, 3.2]) {
    b.box(1.4, 0.25, 6, MAT.plain(0xe0ddd4), ix, 0, cz);
    for (const pz of [cz - 1.6, cz + 1.6]) {
      b.box(0.8, 1.7, 0.6, white, ix, 0.25, pz);
      b.box(0.82, 0.5, 0.62, green, ix, 1.3, pz);
      b.box(0.5, 0.3, 0.05, MAT.plain(0x1a1b1d, 0.3), ix, 1.4, pz + 0.32);
      b.box(0.1, 0.6, 0.1, MAT.plain(0x1a1b1d), ix + 0.45, 0.6, pz);
    }
    solid(ix - 0.7, ix + 0.7, cz - 3, cz + 3);
  }
  // the shop at the back: glass front, a flat roof and its own sign
  const sz = -D / 2 + 3.2;
  b.box(11, 3.4, 5.2, MAT.plaster(0xf2ead6), -5, 0, sz);
  b.plane(8, 2.2, MAT2.glass(), -5, 1.4, sz + 2.62);
  b.box(11.4, 0.4, 5.6, green, -5, 3.4, sz);
  b.plane(4.5, 0.6, textMat("SHOP · FOOD", { bg: "#e6b84a", fg: "#2a1c05" }), -5, 3.2, sz + 2.85);
  solid(-10.5, 0.5, sz - 2.6, sz + 2.6);
  // the air and water point, and the vents of the tanks under the ground
  b.box(0.5, 1.2, 0.5, MAT.plain(0x2a5fa8), 7, 0, sz);
  for (const vx of [10, 10.6, 11.2]) b.box(0.12, 4.5, 0.12, steel, vx, 0, -D / 2 + 1);
  // the price sign on a tall pole by the road
  const px = W / 2 - 2,
    pz = D / 2 - 1.2;
  b.box(0.35, 7, 0.35, steel, px, 0, pz);
  b.box(2.8, 3.2, 0.3, green, px, 6.5, pz);
  b.plane(2.4, 0.8, textMat("BARAKAH", { bg: "#1d7a3a", fg: "#fdf8ec" }), px, 9.0, pz + 0.17);
  b.plane(2.4, 0.7, textMat("PETROL ₦7/L", { bg: "#fdf8ec", fg: "#1a1a1a" }), px, 7.9, pz + 0.17);
  b.plane(2.4, 0.7, textMat("DIESEL ₦8/L", { bg: "#fdf8ec", fg: "#1a1a1a" }), px, 7.1, pz + 0.17);
  solid(px - 0.25, px + 0.25, pz - 0.25, pz + 0.25);
  const spot = to(0, cz + 4.2);
  b.base.identity();
  return {
    colliders,
    spots: [{ key: "fuel", x: spot.x, z: spot.z, label: "⛽ Fill up", labelY: 3 }],
  };
}

/** A police station: white and navy, a blue lamp, barred cell windows and a flag. */
export function policeStation(
  b: Batch,
  o: { x: number; z: number; turn: number; width: number; depth: number; name: string },
): Built {
  const { to, colliders, solid } = frame(b, o.x, o.z, o.turn);
  const W = o.width,
    D = o.depth;
  b.add(groundGeo(W, D, 2), MAT.pavement(), 0, 0.035, 0, 0, false);
  const BW = W - 5,
    BD = D - 8,
    bz = -D / 2 + 1 + BD / 2,
    H = 6.8;
  const white = MAT.plaster(0xf4f3ee),
    navy = MAT.plain(0x1d3a6b, 0.5);
  b.box(BW, H, BD, white, 0, 0, bz);
  b.box(BW + 0.4, 0.9, BD + 0.4, navy, 0, H - 0.9, bz);
  b.box(BW + 0.2, 0.5, BD + 0.2, navy, 0, 0, bz);
  const front = bz + BD / 2;
  b.plane(
    BW * 0.75,
    1.4,
    textMat(o.name, { bg: "#1d3a6b", fg: "#ffffff" }),
    0,
    H - 0.45,
    front + 0.25,
  );
  b.plane(2.4, 2.8, MAT.door(0x1d3a6b), 0, 1.5, front + 0.03);
  for (const x of [-BW / 2 + 2.4, BW / 2 - 2.4]) {
    b.plane(1.8, 1.4, MAT.window(0x1d3a6b), x, 2.2, front + 0.02);
    b.plane(1.6, 1.0, MAT.rail(), x, 4.6, front + 0.03);
  }
  // blue lamp over the door
  b.add(new THREE.BoxGeometry(0.7, 0.7, 0.7), MAT.plain(0x3a7bd5, 0.2), 0, 3.6, front + 0.4);
  // flagpole
  b.add(
    new THREE.CylinderGeometry(0.05, 0.06, 8, 6),
    MAT.plain(0xd8dce0, 0.3),
    W / 2 - 1.2,
    4,
    D / 2 - 1.5,
  );
  for (const [i, c] of [0x1f8a3a, 0xfdfdfd, 0x1f8a3a].entries())
    b.plane(0.5, 0.9, MAT.plain(c), W / 2 - 1.2 + 0.25 + i * 0.5, 7.4, D / 2 - 1.5);
  solid(-BW / 2, BW / 2, bz - BD / 2, front);
  solid(W / 2 - 1.4, W / 2 - 1, D / 2 - 1.7, D / 2 - 1.3);
  const spot = to(0, front + 2.2);
  b.base.identity();
  return {
    colliders,
    spots: [{ key: "police", x: spot.x, z: spot.z, label: o.name, labelY: H + 1.6 }],
  };
}

/* ---------------- houses with the look of their place ---------------- */

/** How an area's houses look:
    - cottage: painted wooden cottages with gardens (the default)
    - modern: Lekki-style villas, white and charcoal blocks, big glass, slatted gates
    - local: the Lagos bungalow or storey building, painted block walls, zinc roof,
      burglar-proof bars, a water tank on a stand and washing on the line
    - ilorin: earth-toned walls, arched windows and doors, crenellated parapets
    - saudi: cream stone, high walls, mashrabiya window boxes, flat roofs with teeth
    - tower: Saudi hotel and apartment towers by the Haram
    - tents: the white tents of Mina (and Arafat, with neem trees) */
export type HouseStyle =
  | "cottage"
  | "modern"
  | "local"
  | "ilorin"
  | "saudi"
  | "tower"
  | "tents"
  /** Lekki and Ikeja: glass towers, storey buildings and duplexes (no bungalows) */
  | "prime"
  /** Egbeda: Lagos bungalows, duplexes and taller storey buildings */
  | "storey"
  /** Ajegunle: Lagos houses and face-me-I-face-you rooming houses */
  | "ajegunle";
/** What kind of home a plot holds, when it isn't an ordinary house. */
export type HomeType = "tower" | "faceme";

function barsTex() {
  return tex(
    "bars",
    64,
    64,
    (c, w, h) => {
      c.clearRect(0, 0, w, h);
      c.strokeStyle = "#2a2a2a";
      c.lineWidth = 3;
      for (let x = 8; x < w; x += 16) {
        c.beginPath();
        c.moveTo(x, 0);
        c.lineTo(x, h);
        c.stroke();
      }
      c.beginPath();
      c.moveTo(0, h / 2);
      c.lineTo(w, h / 2);
      c.stroke();
      // the little curls of a Lagos burglar-proof
      c.lineWidth = 2;
      for (let x = 16; x < w; x += 16) {
        c.beginPath();
        c.arc(x, h / 2 - 8, 6, 0, Math.PI);
        c.stroke();
        c.beginPath();
        c.arc(x, h / 2 + 8, 6, Math.PI, Math.PI * 2);
        c.stroke();
      }
    },
    false,
  );
}
function latticeTex() {
  return tex(
    "lattice",
    64,
    64,
    (c, w, h) => {
      c.fillStyle = "#6b4426";
      c.fillRect(0, 0, w, h);
      c.fillStyle = "#3a2414";
      for (let y = 4; y < h; y += 8)
        for (let x = 4 + ((y / 8) % 2) * 4; x < w; x += 8) c.fillRect(x - 2, y - 2, 4, 4);
      c.strokeStyle = "#8a5a32";
      c.lineWidth = 2;
      c.strokeRect(1, 1, w - 2, h - 2);
    },
    true,
  );
}
function slatsTex() {
  return tex(
    "slats",
    64,
    64,
    (c, w, h) => {
      c.fillStyle = "#2b2622";
      c.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 8) {
        c.fillStyle = y % 16 ? "#7a5536" : "#8a6240";
        c.fillRect(0, y, w, 6);
      }
    },
    true,
  );
}
/** A window with a round arch on top, drawn on the wall's own colour. */
function archWinTex(wall: number, frame: number) {
  return tex(
    `arch${wall}-${frame}`,
    96,
    160,
    (c, w, h) => {
      c.fillStyle = css(wall);
      c.fillRect(0, 0, w, h);
      const r = w / 2 - 6;
      const path = () => {
        c.beginPath();
        c.moveTo(6, h - 6);
        c.lineTo(6, r + 6);
        c.arc(w / 2, r + 6, r, Math.PI, 0);
        c.lineTo(w - 6, h - 6);
        c.closePath();
      };
      path();
      c.fillStyle = css(frame);
      c.fill();
      c.save();
      c.translate(w / 2, h / 2);
      c.scale(0.82, 0.88);
      c.translate(-w / 2, -h / 2);
      path();
      const g = c.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "#5f7c8c");
      g.addColorStop(0.5, "#2d3d48");
      g.addColorStop(1, "#1e2a32");
      c.fillStyle = g;
      c.fill();
      c.restore();
      c.fillStyle = css(frame);
      c.fillRect(w / 2 - 3, r, 6, h - r - 8);
    },
    false,
  );
}
/** One floor of a hotel tower: a wide window between stone piers. */
function facadeTex() {
  return tex(
    "facade",
    128,
    128,
    (c, w, h) => {
      c.fillStyle = "#ffffff";
      c.fillRect(0, 0, w, h);
      c.fillStyle = "rgba(0,0,0,0.08)";
      c.fillRect(0, h - 10, w, 10);
      const g = c.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#6c8796");
      g.addColorStop(1, "#2f3f4a");
      c.fillStyle = g;
      c.fillRect(18, 22, w - 36, h - 44);
      c.fillStyle = "rgba(255,255,255,0.5)";
      c.fillRect(w / 2 - 2, 22, 4, h - 44);
    },
    true,
  );
}
/** Words painted straight onto a wall. */
function wallTextTex(text: string, wall: number, ink: string) {
  return tex(
    `wt${text}${wall}`,
    512,
    64,
    (c, w, h) => {
      c.fillStyle = css(wall);
      c.fillRect(0, 0, w, h);
      c.fillStyle = ink;
      c.font = "800 34px system-ui, sans-serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(text, w / 2, h / 2 + 2);
    },
    false,
  );
}
export const MAT3 = {
  bars: () =>
    M("bars", () =>
      std({ map: barsTex(), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide }),
    ),
  lattice: () => M("lattice", () => std({ map: latticeTex(), roughness: 0.8 })),
  slats: () => M("slats", () => std({ map: slatsTex(), roughness: 0.7 })),
  archWin: (wall: number, frame: number) =>
    M(`aw${wall}-${frame}`, () => std({ map: archWinTex(wall, frame), roughness: 0.5 })),
  facade: (c: number) => M("fc" + c, () => std({ color: c, map: facadeTex(), roughness: 0.6 })),
  wallText: (t: string, wall: number, ink: string) =>
    M(`wt${t}${wall}`, () => std({ map: wallTextTex(t, wall, ink), roughness: 0.9 })),
  fabric: () =>
    M("fabric", () => std({ color: 0xf6f4ee, roughness: 0.95, side: THREE.DoubleSide })),
};

const LOCAL_WALLS = [
  0xf2e3c6, 0xe8c9a0, 0xd7e3d0, 0xf0d0c0, 0xdcd3f0, 0xf6efd8, 0xbfd7e6, 0xf3d9a4,
];
const LOCAL_SKIRT = [0x7a4a3a, 0x3d4a5a, 0x5a3a2a, 0x2f5a4a, 0x8a2f3a];
const ZINC = [0x9aa3a8, 0x8a5a3a, 0xa0302a, 0x2f5f8a, 0x3d6a3a, 0x7a3a2a];
const ILORIN_WALLS = [0xe0a868, 0xe8b878, 0xd99a62, 0xf0c890, 0xdcaa78, 0xe6c49a];
const ILORIN_TRIM = [0x1f6f63, 0xf4efe4, 0x2a4a7a, 0x6b2f2a];
const SAUDI_WALLS = [0xeee3cc, 0xe6d6b8, 0xf3ece0, 0xdccaa8, 0xe9dcc2, 0xf6f1e6];
const MODERN_WALLS = [0xf4f4f0, 0xe9e9e6, 0xefeae2];
const MODERN_ACCENT = [0x3a3d42, 0x2b2f33, 0x5a5f66];

/** A square pyramid roof (the common Nigerian "hip" roof), base at y. */
function hipRoof(
  b: Batch,
  w: number,
  d: number,
  h: number,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
) {
  const g = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4, 1, true);
  g.rotateY(Math.PI / 4);
  g.scale(w, h, d);
  b.add(g, mat, x, y + h / 2, z);
}
/** A date palm: a tall ringed trunk, drooping fronds and orange dates. */
export function datePalmInto(b: Batch, x: number, z: number, s = 1) {
  const H = 7 * s;
  b.add(new THREE.CylinderGeometry(0.22 * s, 0.32 * s, H, 7), MAT.plain(0x8a6a44), x, H / 2, z);
  for (let y = 1; y < H; y += 1.2 * s)
    b.add(
      new THREE.CylinderGeometry(0.34 * s, 0.34 * s, 0.12, 7),
      MAT.plain(0x7a5a36),
      x,
      y,
      z,
      0,
      false,
    );
  for (let i = 0; i < 12; i++) {
    const leaf = new THREE.BoxGeometry(0.42 * s, 0.05, 3 * s);
    leaf.translate(0, 0, 1.4 * s);
    leaf.rotateX(i % 2 ? 0.75 : 0.35);
    leaf.rotateY((i / 12) * Math.PI * 2);
    b.add(leaf, MAT.plain(i % 3 ? 0x5a7d3a : 0x6b8f45), x, H, z);
  }
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    b.add(
      new THREE.IcosahedronGeometry(0.28 * s, 0),
      MAT.plain(0xd9822a),
      x + Math.cos(a) * 0.45 * s,
      H - 0.5 * s,
      z + Math.sin(a) * 0.45 * s,
    );
  }
}
/** A short fan palm, for villa gardens. */
function fanPalm(b: Batch, x: number, z: number, s = 1) {
  b.add(
    new THREE.CylinderGeometry(0.16 * s, 0.24 * s, 3.4 * s, 7),
    MAT.plain(0x9a8a6a),
    x,
    1.7 * s,
    z,
  );
  for (let i = 0; i < 9; i++) {
    const leaf = new THREE.BoxGeometry(0.7 * s, 0.05, 1.8 * s);
    leaf.translate(0, 0, 0.9 * s);
    leaf.rotateX(0.2 + (i % 3) * 0.2);
    leaf.rotateY((i / 9) * Math.PI * 2);
    b.add(leaf, MAT.plain(i % 2 ? 0x3f7d3a : 0x4f9a45), x, 3.4 * s, z);
  }
}
/** A neem tree: short trunk, wide dense crown (all over Ilorin and the plain of Arafat). */
function neemTree(b: Batch, x: number, z: number, s = 1) {
  b.add(
    new THREE.CylinderGeometry(0.22 * s, 0.32 * s, 2.4 * s, 7),
    MAT.plain(0x6a5038),
    x,
    1.2 * s,
    z,
  );
  for (const [dx, dy, dz, r] of [
    [0, 3.2, 0, 1.9],
    [1.1, 2.8, 0.4, 1.3],
    [-1.0, 2.9, -0.5, 1.4],
    [0.2, 3.0, 1.1, 1.2],
  ])
    b.add(
      new THREE.IcosahedronGeometry(r * s, 1),
      MAT.plain(0x3a6a2e),
      x + dx * s,
      dy * s,
      z + dz * s,
    );
}

function styledHouse(
  b: Batch,
  o: { x: number; z: number; turn: number; width?: number; depth?: number; number: number },
  ref: Compound,
  style: HouseStyle,
): Compound {
  const PW = o.width ?? 22,
    PD = o.depth ?? 20;
  b.base.makeRotationY(o.turn).setPosition(o.x, 0, o.z);
  const cos = Math.cos(o.turn),
    sin = Math.sin(o.turn);
  const toArea = (lx: number, lz: number) => ({
    x: o.x + lx * cos + lz * sin,
    z: o.z - lx * sin + lz * cos,
  });
  const colliders: Box[] = [];
  const solid = (lx0: number, lx1: number, lz0: number, lz1: number) => {
    const a = toArea(lx0, lz0),
      c = toArea(lx1, lz1);
    colliders.push({
      x0: Math.min(a.x, c.x),
      x1: Math.max(a.x, c.x),
      z0: Math.min(a.z, c.z),
      z1: Math.max(a.z, c.z),
    });
  };
  let seed = (o.number * 104729 + Math.round(o.x * 31 + o.z * 17) + style.length * 7) >>> 0;
  const r = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pick = <T>(a: T[]) => a[Math.floor(r() * a.length)];
  const front = PD / 2;
  const gx = ref.gx ?? PW / 2 - 4.5;
  const gw = 4.4;
  let floorsIn = Math.max(1, ref.floors);
  let type: HomeType | undefined;
  /** the most floors a Lagos house here can have */
  let localMax = 2;
  /** Lekki and Ikeja: a modern block of 3 or 4 floors */
  let block = false;
  if (style === "prime") {
    // no bungalows: glass towers, storey buildings and duplexes
    const k = r();
    // a tower needs a full plot (the narrow closes get storey buildings instead)
    if (k < 0.3 && (o.width ?? 22) >= 18 && (o.depth ?? 20) >= 16) {
      b.base.identity();
      return glassTower(b, o, ref, r);
    }
    style = "modern";
    if (k < 0.5) {
      block = true;
      floorsIn = r() < 0.5 ? 3 : 4;
    } else floorsIn = Math.max(2, Math.min(3, floorsIn));
  } else if (style === "storey") {
    // like Ikorodu, and taller: up to four floors
    style = "local";
    localMax = 4;
    floorsIn = Math.min(4, floorsIn + (r() < 0.6 ? 1 : 0));
  } else if (style === "ajegunle") {
    style = "local";
    if (r() < 0.4) {
      type = "faceme";
      floorsIn = 1;
    }
  }

  /* the yard and the wall round it */
  const yardM =
    style === "modern"
      ? MAT.paving()
      : style === "saudi" || style === "tower"
        ? MAT.plain(0xe2d6bf)
        : style === "ilorin"
          ? MAT.plain(0xd2b48c)
          : style === "tents"
            ? MAT.plain(0xd9cdb4)
            : r() < 0.5
              ? MAT.paving()
              : MAT.plain(0xb9b2a4); // a cemented yard
  b.add(groundGeo(PW - 0.4, PD - 0.4, 2), yardM, 0, 0.035, 0, 0, false);
  const wallC =
    style === "modern"
      ? 0xe6e6e2
      : style === "local"
        ? pick([0xe9dcc0, 0xd8c3a5, 0xe6d2b5, 0xcfd8c8, 0xf0e6d0])
        : style === "ilorin"
          ? pick(ILORIN_WALLS)
          : pick(SAUDI_WALLS);
  const FH =
    style === "tents"
      ? 1.1
      : style === "saudi" || style === "tower"
        ? 2.8
        : style === "modern"
          ? 2.4
          : style === "ilorin"
            ? 2.0
            : 2.1;
  const T = 0.25;
  const fenceM = style === "tents" ? MAT.plain(0xf4f4ef) : MAT.plaster(wallC);
  const cap = MAT.plain(style === "modern" ? 0x3a3d42 : style === "local" ? 0x9a8a72 : 0xcbb894);
  const seg = (x0: number, x1: number, z: number) => {
    if (x1 - x0 < 0.05) return;
    if (style === "tents") {
      // a low white railing round the camp
      b.box(x1 - x0, 0.08, 0.08, fenceM, (x0 + x1) / 2, FH, z);
      for (let x = x0; x <= x1; x += 2) b.box(0.08, FH, 0.08, fenceM, x, 0, z);
      solid(x0, x1, z - 0.1, z + 0.1);
      return;
    }
    b.box(x1 - x0, FH, T, fenceM, (x0 + x1) / 2, 0, z, 0, 2);
    b.box(x1 - x0 + 0.06, 0.14, T + 0.12, cap, (x0 + x1) / 2, FH, z);
    if (style === "modern" && x1 - x0 > 3)
      b.box(x1 - x0 - 1.2, 0.9, 0.06, MAT3.slats(), (x0 + x1) / 2, FH - 1.3, z + T / 2 + 0.02);
    if (style === "ilorin" || style === "saudi" || style === "tower")
      for (let x = x0 + 0.4; x < x1 - 0.2; x += 1.0) b.box(0.4, 0.35, T, fenceM, x, FH + 0.14, z);
    solid(x0, x1, z - T / 2, z + T / 2);
  };
  seg(-PW / 2, gx - gw / 2 - 0.3, front);
  seg(gx + gw / 2 + 0.3, PW / 2, front);
  seg(-PW / 2, PW / 2, -PD / 2);
  for (const sx of [-PW / 2, PW / 2]) {
    if (style === "tents") {
      b.box(0.08, 0.08, PD, fenceM, sx, FH, 0);
      solid(sx - 0.1, sx + 0.1, -PD / 2, PD / 2);
      continue;
    }
    b.add(boxGeo(T, FH, PD, 2), fenceM, sx, FH / 2, 0, 0);
    b.box(T + 0.12, 0.14, PD, cap, sx, FH, 0);
    solid(sx - T / 2, sx + T / 2, -PD / 2, PD / 2);
  }
  // gate pillars and the gate (one leaf shut, one open)
  const PH = FH + 0.4;
  for (const px of [gx - gw / 2 - 0.3, gx + gw / 2 + 0.3]) {
    if (style === "tents") {
      b.box(0.3, 2.6, 0.3, MAT.plain(0x1f6f63), px, 0, front);
      continue;
    }
    b.box(0.7, PH, 0.7, fenceM, px, 0, front, 0, 2);
    if (style === "local") hipRoof(b, 0.9, 0.9, 0.45, cap, px, PH, front);
    else b.box(0.85, 0.16, 0.85, cap, px, PH, front);
    solid(px - 0.35, px + 0.35, front - 0.35, front + 0.35);
  }
  if (style === "tents") {
    b.box(gw + 1, 0.6, 0.12, MAT.plain(0x1f6f63), gx, 2.2, front);
    b.plane(gw * 0.7, 0.45, MAT.plaque("Camp " + o.number), gx, 2.5, front + 0.08);
  } else {
    const gateM =
      style === "modern"
        ? MAT3.slats()
        : style === "saudi" || style === "tower"
          ? MAT.gate(0x5a3a22)
          : style === "ilorin"
            ? MAT.gate(pick([0x1f6f63, 0x2a4a7a, 0x1d1d1d]))
            : MAT.gate(pick(GATES));
    const GH = FH - 0.1;
    b.add(boxGeo(gw * 0.5, GH, 0.08), gateM, gx - gw * 0.25, GH / 2 + 0.05, front - 0.05);
    b.add(boxGeo(gw * 0.25, GH, 0.08), gateM, gx + gw * 0.38, GH / 2 + 0.05, front - 0.05);
    solid(gx - gw / 2, gx, front - 0.2, front + 0.2);
    if (style === "ilorin" || style === "saudi" || style === "tower") {
      // an arch over the gateway
      b.box(gw + 1.3, 0.6, 0.5, fenceM, gx, PH + 0.1, front);
      // a rounded crown over the gateway
      const crown = new THREE.CylinderGeometry(
        gw / 2 + 0.2,
        gw / 2 + 0.2,
        0.45,
        20,
        1,
        false,
        -Math.PI / 2,
        Math.PI,
      );
      crown.rotateX(-Math.PI / 2);
      crown.scale(1, 0.45, 1);
      b.add(crown, fenceM, gx, PH + 0.7, front);
    }
    b.plane(0.5, 0.25, MAT.plaque("No. " + o.number), gx + gw / 2 + 0.3, PH - 0.5, front + 0.36);
  }

  let door = toArea(0, front - 4);
  const top = { y: 0 };

  if (style === "tents") {
    // rows of white tents with pointed roofs, and a path down the middle
    const cols = 3,
      rows = 2;
    const tw = (PW - 3) / cols,
      td = (PD - 5) / rows;
    for (let i = 0; i < cols; i++)
      for (let k = 0; k < rows; k++) {
        const tx = -PW / 2 + 1.5 + tw * (i + 0.5),
          tz = -PD / 2 + 1 + td * (k + 0.5);
        if (Math.abs(tx - gx) < 1.6 && k === rows - 1) continue;
        b.box(tw - 0.6, 2.2, td - 0.8, MAT3.fabric(), tx, 0, tz);
        hipRoof(b, tw - 0.3, td - 0.5, 1.4, MAT3.fabric(), tx, 2.2, tz);
        b.box(0.04, 0.04, td - 0.8, MAT.plain(0x2f8f5a), tx - (tw - 0.6) / 2, 2.15, tz);
        b.plane(1.0, 1.8, MAT.plain(0xd9d2c0), tx, 0.9, tz + (td - 0.8) / 2 + 0.01);
        solid(tx - (tw - 0.6) / 2, tx + (tw - 0.6) / 2, tz - (td - 0.8) / 2, tz + (td - 0.8) / 2);
      }
    // on Arafat, neem trees shade the camps
    if (r() < 0.6) {
      const tx = gx > 0 ? -PW / 2 + 1.8 : PW / 2 - 1.8;
      neemTree(b, tx, front - 1.6, 0.8);
      solid(tx - 0.3, tx + 0.3, front - 1.9, front - 1.3);
    }
    door = toArea(gx, front - 2);
  } else if (style === "local" && type === "faceme") {
    /* face-me-I-face-you: a long rooming house, rooms facing each other across a corridor */
    const BW = PW - 6,
      BD = PD - 6;
    const bz = -PD / 2 + 1 + BD / 2;
    const FHt = 3.1;
    const paint = pick([0xd9c7a2, 0xe4d2b0, 0xc9d3c0, 0xe8c9a6, 0xd6d0e2]);
    const wallM = MAT.plaster(paint);
    const skirt = MAT.plain(pick(LOCAL_SKIRT));
    const winM = MAT.window(pick([0x6b4226, 0x2a2a2a, 0x1f6f63]));
    b.box(BW + 0.3, 0.45, BD + 0.3, MAT.plain(0x8f8a80), 0, 0, bz);
    b.box(BW, FHt, BD, wallM, 0, 0.45, bz);
    b.box(BW + 0.06, 0.8, BD + 0.06, skirt, 0, 0.45, bz);
    const dz = bz + BD / 2;
    // the corridor door in the middle of the front, two windows each side
    b.plane(1.3, 2.3, MAT.door(pick([0x6b4226, 0x3a2a1a, 0x2a4a7a])), 0, 0.45 + 1.15, dz + 0.02);
    for (const wx of [-BW / 2 + 2, -BW / 4 - 0.5, BW / 4 + 0.5, BW / 2 - 2]) {
      b.plane(1.2, 1.3, winM, wx, 0.45 + 1.7, dz + 0.02);
      b.plane(1.3, 1.4, MAT3.bars(), wx, 0.45 + 1.7, dz + 0.08);
    }
    // the rooms down both sides: a window each, with louvres and burglar-proof
    const rooms = 4;
    for (const s of [1, -1])
      for (let k = 0; k < rooms; k++) {
        const wz = bz - BD / 2 + (BD / rooms) * (k + 0.5);
        b.plane(1.1, 1.2, winM, s * (BW / 2 + 0.02), 0.45 + 1.7, wz, (s * Math.PI) / 2);
        b.plane(1.2, 1.3, MAT3.bars(), s * (BW / 2 + 0.08), 0.45 + 1.7, wz, (s * Math.PI) / 2);
      }
    // a veranda on two pillars, a bench, and the long zinc roof
    b.box(4.6, 0.2, 2.2, MAT.plain(0xcfc8b8), 0, 0.25, dz + 1.1);
    for (const px of [-2.1, 2.1]) {
      b.box(0.3, 2.9, 0.3, wallM, px, 0.45, dz + 2);
      solid(px - 0.2, px + 0.2, dz + 1.8, dz + 2.2);
    }
    b.box(4.8, 0.2, 2.6, MAT.plain(0xe0d8c4), 0, 3.35, dz + 1.2);
    b.box(2.2, 0.45, 0.5, MAT.plain(0x7a5234), -BW / 2 + 2.6, 0, dz + 0.9);
    const tp = 0.45 + FHt;
    top.y = tp;
    hipRoof(b, BW + 1.4, BD + 1.4, 2.0, MAT.zinc(pick(ZINC)), 0, tp, bz);
    solid(-BW / 2, BW / 2, bz - BD / 2, bz + BD / 2);
    // water drums by the wall, washing on a long line, a shared tap
    const sx = gx > 0 ? -1 : 1;
    for (let k = 0; k < 3; k++)
      b.add(
        new THREE.CylinderGeometry(0.4, 0.4, 1.0, 12),
        MAT.plain(pick([0x2a5fa8, 0x1f6f63, 0x2a5fa8]), 0.5),
        sx * (PW / 2 - 1.1),
        0.5,
        front - 1.4 - k * 1.0,
      );
    solid(sx * (PW / 2 - 1.1) - 0.45, sx * (PW / 2 - 1.1) + 0.45, front - 3.9, front - 0.9);
    const lz = front - 1.6;
    const lx0 = -sx * (PW / 2 - 1.2),
      lx1 = lx0 + sx * 5;
    for (const x of [lx0, lx1]) b.box(0.06, 1.9, 0.06, MAT.plain(0x555a5f), x, 0, lz);
    b.box(Math.abs(lx1 - lx0), 0.02, 0.02, MAT.plain(0x333333), (lx0 + lx1) / 2, 1.85, lz);
    for (let k = 0; k < 5; k++)
      b.plane(
        0.6,
        0.75,
        MAT.plain(pick([0xe8445a, 0xf2c230, 0x2a5fa8, 0xffffff, 0x3d8a5a, 0xd66bd0]), 0.9),
        Math.min(lx0, lx1) + 0.6 + k * 0.85,
        1.42,
        lz,
        0,
      );
    door = toArea(0, dz + 2.8);
  } else if (style === "local") {
    /* the Lagos bungalow (or storey building) */
    const floors = Math.min(localMax, floorsIn);
    const BW = Math.min(PW - 4, 12 + Math.floor(r() * 3)),
      BD = Math.min(PD - 9, 8 + Math.floor(r() * 2));
    const bz = -PD / 2 + 1.5 + BD / 2;
    const FHt = 3.2;
    const paint = pick(LOCAL_WALLS);
    const wallM = MAT.plaster(paint);
    const skirt = MAT.plain(pick(LOCAL_SKIRT));
    const frame = pick([0x2a2a2a, 0x6b4226, 0xf4efe4, 0x1f6f63]);
    const winM = MAT.window(frame);
    b.box(BW + 0.3, 0.5, BD + 0.3, MAT.plain(0x9a958a), 0, 0, bz);
    for (let f = 0; f < floors; f++) {
      const y = 0.5 + f * FHt;
      b.box(BW, FHt, BD, wallM, 0, y, bz);
      if (f === 0) b.box(BW + 0.06, 0.7, BD + 0.06, skirt, 0, 0.5, bz);
      b.box(BW + 0.3, 0.2, BD + 0.3, MAT.plain(0xe9e4d6), 0, y + FHt - 0.2, bz);
      const n = Math.max(2, Math.floor(BW / 3.4));
      for (let i = 0; i < n; i++) {
        const wx = -BW / 2 + (BW / n) * (i + 0.5);
        if (f === 0 && Math.abs(wx) < 1.4) continue;
        for (const [zz, ry] of [
          [bz + BD / 2 + 0.02, 0],
          [bz - BD / 2 - 0.02, Math.PI],
        ] as [number, number][]) {
          b.plane(1.4, 1.5, winM, wx, y + 1.55, zz, ry);
          b.plane(1.5, 1.6, MAT3.bars(), wx, y + 1.55, zz + (ry ? -0.06 : 0.06), ry);
        }
      }
      for (const s of [1, -1]) {
        b.plane(1.2, 1.4, winM, s * (BW / 2 + 0.02), y + 1.55, bz, (s * Math.PI) / 2);
        b.plane(1.3, 1.5, MAT3.bars(), s * (BW / 2 + 0.07), y + 1.55, bz, (s * Math.PI) / 2);
        // a split AC unit under some windows
        if (r() < 0.4)
          b.box(
            0.3,
            0.55,
            0.8,
            MAT.plain(0xe9e9e4, 0.4),
            s * (BW / 2 + 0.18),
            y + 0.5,
            bz - BD / 4,
          );
      }
      if (f >= 1) {
        // the upstairs veranda behind a burglar-proof
        b.box(BW * 0.6, 0.2, 1.6, MAT.plain(0xe9e4d6), 0, y - 0.1, bz + BD / 2 + 0.8);
        b.plane(BW * 0.6, 1.1, MAT3.bars(), 0, y + 0.65, bz + BD / 2 + 1.6);
      }
    }
    const dz = bz + BD / 2;
    // the front veranda: a slab on square pillars over terrazzo
    b.box(BW * 0.7, 0.25, 2.4, MAT.plain(0xd8d0c0), 0, 0.25, dz + 1.2);
    for (const px of [-BW * 0.35 + 0.2, BW * 0.35 - 0.2]) {
      b.box(0.35, 2.9, 0.35, wallM, px, 0.5, dz + 2.2);
      solid(px - 0.2, px + 0.2, dz + 2, dz + 2.4);
    }
    if (floors === 1) b.box(BW * 0.7 + 0.3, 0.25, 2.7, MAT.plain(0xe9e4d6), 0, 3.4, dz + 1.3);
    b.plane(1.1, 2.2, MAT.door(pick([0x6b4226, 0x3a2a1a, 0x8a5a3a])), 0, 0.5 + 1.1, dz + 0.02);
    const tp = 0.5 + floors * FHt;
    top.y = tp;
    // the zinc roof
    const zinc = MAT.zinc(pick(ZINC));
    hipRoof(b, BW + 1.6, BD + 1.6, 2.4, zinc, 0, tp, bz);
    solid(-BW / 2, BW / 2, bz - BD / 2, bz + BD / 2);
    // a satellite dish on the roof edge
    if (r() < 0.5)
      b.add(
        new THREE.SphereGeometry(0.45, 12, 6, 0, Math.PI * 2, 0, 0.9),
        MAT.plain(0xe9e9e4, 0.4),
        -BW / 2 + 1,
        tp + 0.6,
        bz + BD / 2 - 0.5,
      );
    // a water tank on a tall steel stand in the yard
    const tx = (gx > 0 ? -1 : 1) * (PW / 2 - 1.8),
      tzk = front - 2.4;
    for (const [sx, sz] of [
      [-0.7, -0.7],
      [0.7, -0.7],
      [-0.7, 0.7],
      [0.7, 0.7],
    ])
      b.box(0.1, 3.4, 0.1, MAT.plain(0x555a5f), tx + sx, 0, tzk + sz);
    b.box(1.7, 0.12, 1.7, MAT.plain(0x555a5f), tx, 3.4, tzk);
    b.add(
      new THREE.CylinderGeometry(0.8, 0.8, 1.6, 16),
      MAT.plain(pick([0x1a1a1a, 0x2a5fa8, 0x1a1a1a]), 0.5),
      tx,
      4.3,
      tzk,
    );
    solid(tx - 0.8, tx + 0.8, tzk - 0.8, tzk + 0.8);
    // washing on the line
    if (r() < 0.6) {
      const lx0 = -PW / 2 + 1.2,
        lx1 = lx0 + 4.5,
        lz = -PD / 2 + 1.0;
      if (bz - BD / 2 - lz > 0.8 || PW - BW > 9) {
        const lzz = PW - BW > 9 ? front - 4.5 : lz;
        for (const x of [lx0, lx1]) b.box(0.06, 1.9, 0.06, MAT.plain(0x555a5f), x, 0, lzz);
        b.box(lx1 - lx0, 0.02, 0.02, MAT.plain(0x333333), (lx0 + lx1) / 2, 1.85, lzz);
        for (let k = 0; k < 5; k++)
          b.plane(
            0.6,
            0.75,
            MAT.plain(pick([0xe8445a, 0xf2c230, 0x2a5fa8, 0xffffff, 0x3d8a5a, 0xd66bd0]), 0.9),
            lx0 + 0.6 + k * 0.85,
            1.42,
            lzz,
            0,
          );
      }
    }
    // a generator by the wall
    if (r() < 0.6)
      b.box(1.1, 0.8, 0.7, MAT.plain(r() < 0.5 ? 0xd9a520 : 0x2f6fb0, 0.6), tx, 0, tzk - 2);
    // a plantain by the fence
    {
      const px = (gx > 0 ? -1 : 1) * (PW / 2 - 1.2),
        pz = -PD / 2 + 1.4;
      b.add(new THREE.CylinderGeometry(0.14, 0.2, 2.4, 6), MAT.plain(0x6a8a3a), px, 1.2, pz);
      for (let k = 0; k < 6; k++) {
        const leaf = new THREE.BoxGeometry(0.5, 0.04, 2.0);
        leaf.translate(0, 0, 0.9);
        leaf.rotateX(-0.3);
        leaf.rotateY((k / 6) * Math.PI * 2);
        b.add(leaf, MAT.plain(0x4f8f3a), px, 2.4, pz);
      }
    }
    // the old Lagos warning painted on the fence
    if (r() < 0.3)
      b.plane(
        Math.min(8, PW / 2 - 1),
        0.6,
        MAT3.wallText("THIS HOUSE IS NOT FOR SALE", wallC, "#b8222a"),
        gx > 0 ? -PW / 4 : PW / 4,
        1.3,
        front + T / 2 + 0.02,
      );
    door = toArea(0, dz + 2.8);
  } else if (style === "modern" && block) {
    /* a modern block of flats: white floors with glass bands, balconies with glass rails */
    const floors = floorsIn;
    const BW = PW - 5,
      BD = PD - 9;
    const bz = -PD / 2 + 1.4 + BD / 2;
    const FHt = 3.3;
    const white = MAT.plaster(pick(MODERN_WALLS));
    const accent = MAT.plain(pick(MODERN_ACCENT), 0.6);
    const glass = MAT2.curtain(pick(["#5f93ad", "#4f8aa0", "#6a8fb0"]));
    b.box(BW + 0.4, 0.3, BD + 0.4, MAT.plain(0xcfcfca), 0, 0, bz);
    for (let f = 0; f < floors; f++) {
      const y = 0.3 + f * FHt;
      b.box(BW, FHt, BD, f % 2 ? white : white, 0, y, bz);
      // a glass band on the front and back, and a charcoal frame round it
      b.add(boxGeo(BW - 1.6, FHt - 0.9, 0.1, FHt), glass, 0, y + FHt / 2, bz + BD / 2 + 0.05);
      b.add(boxGeo(BW - 1.6, FHt - 0.9, 0.1, FHt), glass, 0, y + FHt / 2, bz - BD / 2 - 0.05);
      b.box(BW + 0.3, 0.22, BD + 0.3, accent, 0, y + FHt - 0.22, bz);
      if (f > 0) {
        b.box(BW * 0.7, 0.18, 1.4, MAT.plain(0xf4f4f0), 0, y - 0.05, bz + BD / 2 + 0.7);
        b.plane(BW * 0.7, 1.0, MAT.sunroom(), 0, y + 0.6, bz + BD / 2 + 1.4);
      }
    }
    const tp = 0.3 + floors * FHt;
    top.y = tp;
    b.box(BW + 0.5, 0.5, BD + 0.5, accent, 0, tp, bz);
    b.box(BW * 0.35, 2.4, BD * 0.5, white, -BW * 0.2, tp + 0.5, bz);
    const dz = bz + BD / 2;
    b.box(4.4, 0.18, 2.6, accent, 0, 3.0, dz + 1.3);
    b.plane(1.6, 2.5, MAT.door(0x2b2f33), 0, 0.3 + 1.25, dz + 0.12);
    solid(-BW / 2, BW / 2, bz - BD / 2, bz + BD / 2);
    for (const px of [-PW / 2 + 1.4, PW / 2 - 1.4]) {
      if (Math.abs(px - gx) < 3) continue;
      fanPalm(b, px, front - 1.5, 0.9);
      solid(px - 0.3, px + 0.3, front - 1.8, front - 1.2);
    }
    door = toArea(0, dz + 1.6);
  } else if (style === "modern") {
    /* a Lekki villa: white and charcoal blocks, big glass, flat roofs */
    const BW = Math.min(PW - 4, 13 + Math.floor(r() * 3)),
      BD = Math.min(PD - 9, 8.5 + Math.floor(r() * 2));
    const bz = -PD / 2 + 1.4 + BD / 2;
    const FHt = 3.4;
    const white = MAT.plaster(pick(MODERN_WALLS));
    const dark = MAT.plain(pick(MODERN_ACCENT), 0.6);
    const wood = MAT.siding(0x9a6a3e);
    const glass = MAT2.glass();
    // the ground floor
    b.box(BW, FHt, BD, white, 0, 0.3, bz);
    b.box(BW + 0.4, 0.3, BD + 0.4, MAT.plain(0xcfcfca), 0, 0, bz);
    b.plane(BW * 0.55, FHt - 0.6, glass, BW * 0.12, 0.3 + FHt / 2, bz + BD / 2 + 0.02);
    b.plane(1.2, 2.5, MAT.door(0x3a2a1a), -BW / 2 + 1.6, 0.3 + 1.25, bz + BD / 2 + 0.02);
    b.box(2.2, FHt, 0.3, wood, -BW / 2 + 1.6 + 2, 0.3, bz + BD / 2);
    // the upper floor sticks out over the front, in charcoal or white with a wood panel
    const ux = (r() < 0.5 ? -1 : 1) * 1.2;
    const UW = BW - 2.5,
      UD = BD - 0.5;
    const upM = r() < 0.5 ? dark : white;
    const y1 = 0.3 + FHt;
    b.box(UW, FHt, UD, upM, ux, y1, bz + 1.0);
    b.plane(UW * 0.7, FHt - 0.8, glass, ux, y1 + FHt / 2, bz + 1.0 + UD / 2 + 0.02);
    b.box(UW + 0.3, 0.25, UD + 0.3, MAT.plain(0xf4f4f0), ux, y1 + FHt, bz + 1.0);
    // glass balustrade on the roof terrace over the ground floor
    b.plane(BW, 1.0, MAT.sunroom(), 0, y1 + 0.5, bz + BD / 2 + 0.05);
    for (let s = -1; s <= 1; s += 2)
      b.plane(
        UD,
        FHt - 0.8,
        glass,
        ux + s * (UW / 2 + 0.02),
        y1 + FHt / 2,
        bz + 1.0,
        (s * Math.PI) / 2,
      );
    top.y = y1 + FHt;
    if (floorsIn >= 3) {
      b.box(UW * 0.5, 2.8, UD * 0.6, white, ux - UW * 0.2, y1 + FHt + 0.25, bz);
      top.y += 3;
    }
    solid(-BW / 2, BW / 2, bz - BD / 2, bz + BD / 2 + 1.0);
    // a carport on thin posts
    const cx = gx,
      cz = front - 4.6;
    if (Math.abs(cx) > 3 && cz - 2.2 > bz + BD / 2 + 0.6) {
      b.box(4.2, 0.15, 4.0, dark, cx, 2.6, cz);
      for (const [px, pz] of [
        [-2, -1.9],
        [2, -1.9],
        [-2, 1.9],
        [2, 1.9],
      ])
        b.box(0.1, 2.6, 0.1, dark, cx + px, 0, cz + pz);
    }
    // a paved strip, fan palms and sometimes a small pool
    b.add(groundGeo(PW - 1, 2.2, 2), MAT.paving(), 0, 0.05, front - 1.4, 0, false);
    for (const px of [-PW / 2 + 1.4, PW / 2 - 1.4]) {
      if (Math.abs(px - gx) < 3) continue;
      fanPalm(b, px, front - 1.5, 0.9);
      solid(px - 0.3, px + 0.3, front - 1.8, front - 1.2);
    }
    if (PW - BW >= 7 && r() < 0.5) {
      const s = gx > 0 ? -1 : 1;
      const px = s * (BW / 2 + (PW - BW) / 4);
      b.add(groundGeo((PW - BW) / 2 - 1, BD * 0.7, 2), MAT2.water(), px, 0.06, bz, 0, false);
    }
    door = toArea(-BW / 2 + 1.6, bz + BD / 2 + 1.2);
  } else if (style === "ilorin") {
    /* an Ilorin house: earth-toned walls, arches, a crenellated roof line */
    const floors = Math.min(2, floorsIn);
    const BW = Math.min(PW - 4, 12 + Math.floor(r() * 3)),
      BD = Math.min(PD - 9, 8 + Math.floor(r() * 2));
    const bz = -PD / 2 + 1.5 + BD / 2;
    const FHt = 3.3;
    const wallCc = pick(ILORIN_WALLS);
    const trim = pick(ILORIN_TRIM);
    const wallM = MAT.plaster(wallCc);
    const trimM = MAT.plain(trim);
    b.box(BW + 0.3, 0.5, BD + 0.3, MAT.plain(0x9a7a5a), 0, 0, bz);
    for (let f = 0; f < floors; f++) {
      const y = 0.5 + f * FHt;
      b.box(BW, FHt, BD, wallM, 0, y, bz);
      b.box(BW + 0.2, 0.18, BD + 0.2, trimM, 0, y + FHt - 0.18, bz);
      const n = Math.max(2, Math.floor(BW / 3));
      for (let i = 0; i < n; i++) {
        const wx = -BW / 2 + (BW / n) * (i + 0.5);
        if (f === 0 && Math.abs(wx) < 1.4) continue;
        b.plane(1.3, 2.1, MAT3.archWin(wallCc, trim), wx, y + 1.5, bz + BD / 2 + 0.02);
        b.plane(1.3, 2.1, MAT3.archWin(wallCc, trim), wx, y + 1.5, bz - BD / 2 - 0.02, Math.PI);
      }
      for (const s of [1, -1])
        b.plane(
          1.2,
          2.0,
          MAT3.archWin(wallCc, trim),
          s * (BW / 2 + 0.02),
          y + 1.5,
          bz,
          (s * Math.PI) / 2,
        );
    }
    const dz = bz + BD / 2;
    // an arched entrance porch
    b.box(3.4, 3.2, 1.6, wallM, 0, 0.5, dz + 0.8);
    b.plane(1.6, 2.6, MAT3.archWin(wallCc, 0x3a2a1a), 0, 0.5 + 1.3, dz + 1.62);
    const tp = 0.5 + floors * FHt;
    top.y = tp;
    // a parapet with little teeth along the top
    for (const [w, d, x, z] of [
      [BW, 0.25, 0, BD / 2],
      [BW, 0.25, 0, -BD / 2],
      [0.25, BD, BW / 2, 0],
      [0.25, BD, -BW / 2, 0],
    ] as [number, number, number, number][]) {
      b.box(w, 0.6, d, wallM, x, tp, bz + z);
      const along = w > d;
      const L = along ? w : d;
      for (let t = -L / 2 + 0.4; t < L / 2; t += 1.1)
        b.box(
          along ? 0.45 : w,
          0.45,
          along ? d : 0.45,
          wallM,
          along ? x + t : x,
          tp + 0.6,
          along ? bz + z : bz + t,
        );
    }
    // a small green dome on the roof of some houses
    if (r() < 0.35) {
      b.add(new THREE.CylinderGeometry(1.1, 1.1, 0.8, 16), wallM, BW / 2 - 2, tp + 0.4, bz);
      b.add(
        new THREE.SphereGeometry(1.1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        MAT.plain(0x2e8b57, 0.5),
        BW / 2 - 2,
        tp + 0.8,
        bz,
      );
    }
    solid(-BW / 2, BW / 2, bz - BD / 2, bz + BD / 2 + 1.6);
    // a neem tree and clay water pots
    const tx = (gx > 0 ? -1 : 1) * (PW / 2 - 2.2);
    neemTree(b, tx, front - 2.4, 0.9);
    solid(tx - 0.35, tx + 0.35, front - 2.75, front - 2.05);
    for (let k = 0; k < 3; k++)
      b.add(
        new THREE.SphereGeometry(0.32, 10, 8),
        MAT.plain(0xa0522d),
        -tx * 0.5 + k * 0.7,
        0.3,
        dz + 2.4,
      );
    door = toArea(0, dz + 2.6);
  } else {
    /* Saudi: cream stone, mashrabiya, flat roof with teeth (and towers by the Haram) */
    const tower = style === "tower";
    const floors = tower ? 5 + Math.floor(r() * 5) : Math.min(4, floorsIn + 1);
    const BW = Math.min(PW - (tower ? 2.5 : 4), tower ? 18 : 12 + Math.floor(r() * 3)),
      BD = Math.min(PD - (tower ? 6 : 8), tower ? 13 : 8 + Math.floor(r() * 2));
    const bz = -PD / 2 + (tower ? 1.2 : 1.4) + BD / 2;
    const FHt = 3.3;
    const stone = pick(SAUDI_WALLS);
    const wallM = tower ? MAT3.facade(stone) : MAT.plaster(stone);
    const plainM = MAT.plaster(stone);
    const band = MAT.plain(0xcbb894);
    b.box(BW + 0.3, 0.4, BD + 0.3, MAT.plain(0xb8a888), 0, 0, bz);
    const y0 = 0.4;
    const H = floors * FHt;
    if (tower) {
      // the tower: stone floors with a window on every bay, a glass lobby at the bottom
      const g = boxGeo(BW, H - FHt, BD, FHt);
      b.add(g, wallM, 0, y0 + FHt + (H - FHt) / 2, bz);
      b.box(BW, FHt, BD, plainM, 0, y0, bz);
      b.plane(BW * 0.6, FHt - 0.6, MAT2.glass(), 0, y0 + FHt / 2, bz + BD / 2 + 0.02);
      for (let f = 2; f < floors; f += 3)
        b.box(BW + 0.25, 0.25, BD + 0.25, band, 0, y0 + f * FHt, bz);
      b.box(BW + 0.4, 0.8, BD + 0.4, band, 0, y0 + H, bz);
      // its name in lights
      b.plane(
        BW * 0.7,
        1.4,
        MAT.plaque(
          pick(["Hotel", "Al-Safwa", "Dar Al-Eiman", "Al-Marwa", "Zamzam Suites", "Al-Kiswah"]),
        ),
        0,
        y0 + H - 1.2,
        bz + BD / 2 + 0.06,
      );
    } else {
      for (let f = 0; f < floors; f++) {
        const y = y0 + f * FHt;
        b.box(BW, FHt, BD, wallM, 0, y, bz);
        if (f > 0) b.box(BW + 0.15, 0.2, BD + 0.15, band, 0, y - 0.1, bz);
        const n = Math.max(2, Math.floor(BW / 3.2));
        for (let i = 0; i < n; i++) {
          const wx = -BW / 2 + (BW / n) * (i + 0.5);
          if (f === 0 && Math.abs(wx) < 1.4) continue;
          // a carved wooden mashrabiya box over the middle windows upstairs
          if (f > 0 && i > 0 && i < n - 1) {
            b.box(1.6, 2.3, 0.7, MAT3.lattice(), wx, y + 0.45, bz + BD / 2 + 0.35);
            b.box(1.8, 0.18, 0.85, MAT.plain(0x5a3a22), wx, y + 2.75, bz + BD / 2 + 0.4);
          } else {
            b.plane(1.1, 1.5, MAT.window(0x6b4426), wx, y + 1.6, bz + BD / 2 + 0.02);
            if (r() < 0.5)
              b.box(0.8, 0.45, 0.35, MAT.plain(0xe9e9e4, 0.4), wx, y + 0.45, bz + BD / 2 + 0.18);
          }
          b.plane(1.1, 1.5, MAT.window(0x6b4426), wx, y + 1.6, bz - BD / 2 - 0.02, Math.PI);
        }
        for (const s of [1, -1])
          b.plane(
            1.0,
            1.4,
            MAT.window(0x6b4426),
            s * (BW / 2 + 0.02),
            y + 1.6,
            bz,
            (s * Math.PI) / 2,
          );
      }
      // the parapet with stepped teeth
      const tp = y0 + H;
      for (const [w, d, x, z] of [
        [BW, 0.25, 0, BD / 2],
        [BW, 0.25, 0, -BD / 2],
        [0.25, BD, BW / 2, 0],
        [0.25, BD, -BW / 2, 0],
      ] as [number, number, number, number][]) {
        b.box(w, 0.7, d, plainM, x, tp, bz + z);
        const along = w > d;
        const L = along ? w : d;
        for (let t = -L / 2 + 0.35; t < L / 2; t += 0.9) {
          const tooth = new THREE.ConeGeometry(0.32, 0.6, 4);
          tooth.rotateY(Math.PI / 4);
          b.add(tooth, plainM, along ? x + t : x, tp + 1.0, along ? bz + z : bz + t);
        }
      }
      // white water tanks on the roof
      b.add(
        new THREE.CylinderGeometry(0.6, 0.6, 1.2, 12),
        MAT.plain(0xf4f4ef, 0.5),
        BW / 2 - 1.4,
        tp + 0.6,
        bz - BD / 2 + 1.4,
      );
    }
    const dz = bz + BD / 2;
    b.plane(1.6, 2.6, MAT.door(0x5a3a22), tower ? BW * 0.35 : 0, y0 + 1.3, dz + 0.03);
    top.y = y0 + H;
    solid(-BW / 2, BW / 2, bz - BD / 2, bz + BD / 2);
    // a date palm in the courtyard
    const tx = (gx > 0 ? -1 : 1) * (PW / 2 - 1.6);
    if (Math.abs(tx) - BW / 2 > 1.2 || front - dz > 4) {
      const tz = Math.abs(tx) - BW / 2 > 1.2 ? bz + 1 : front - 1.8;
      datePalmInto(b, tx, tz, 0.8);
      solid(tx - 0.3, tx + 0.3, tz - 0.3, tz + 0.3);
    }
    door = toArea(tower ? BW * 0.35 : 0, dz + 1.2);
  }

  b.base.identity();
  return {
    colliders,
    door,
    gate: toArea(gx, front + 1),
    floors: floorsIn,
    number: o.number,
    gx,
    type,
  };
}

const TOWER_NAMES = [
  "Lagoon Heights",
  "Eko Pearl",
  "Azure Towers",
  "Atlantic Crest",
  "Marina View",
  "Crescent Towers",
  "Palm Residence",
  "Coral Point",
  "Bluewater",
  "The Meridian",
];
/** A glass tower of flats for Lekki and Ikeja: a lit podium, a blue-green curtain wall with
    white floor bands and fins, a stepped crown with a glowing ring, palms and a fountain. */
function glassTower(
  b: Batch,
  o: { x: number; z: number; turn: number; width?: number; depth?: number; number: number },
  ref: Compound,
  r: () => number,
): Compound {
  const PW = o.width ?? 22,
    PD = o.depth ?? 20;
  b.base.makeRotationY(o.turn).setPosition(o.x, 0, o.z);
  const cos = Math.cos(o.turn),
    sin = Math.sin(o.turn);
  const toArea = (lx: number, lz: number) => ({
    x: o.x + lx * cos + lz * sin,
    z: o.z - lx * sin + lz * cos,
  });
  const colliders: Box[] = [];
  const solid = (lx0: number, lx1: number, lz0: number, lz1: number) => {
    const a = toArea(lx0, lz0),
      c = toArea(lx1, lz1);
    colliders.push({
      x0: Math.min(a.x, c.x),
      x1: Math.max(a.x, c.x),
      z0: Math.min(a.z, c.z),
      z1: Math.max(a.z, c.z),
    });
  };
  const pick = <T>(a: T[]) => a[Math.floor(r() * a.length)];
  const front = PD / 2;
  const gx = ref.gx ?? PW / 2 - 4.5;
  const floors = 10 + Math.floor(r() * 7);
  const FHt = 3.4;
  const BW = Math.min(15, PW - 5),
    BD = Math.min(11, PD - 6);
  const bz = -PD / 2 + 1.2 + BD / 2;
  const tint = pick(["#3f7f9a", "#2f6f86", "#4a86a8", "#3a7a78", "#5a7fa8"]);
  const glass = MAT2.curtain(tint);
  const white = MAT.plain(0xf2f4f5, 0.5);
  const steel = MAT.plain(0xb9c2c8, 0.35);
  const ring = MAT2.glow(pick([0x7fd3ff, 0xffd27a, 0x9cf0d0]));

  // the plaza: polished paving, a low glass rail with planters, and a fountain
  b.add(groundGeo(PW - 0.4, PD - 0.4, 2), MAT.paving(), 0, 0.035, 0, 0, false);
  for (const [x0, x1] of [
    [-PW / 2, gx - 2.6],
    [gx + 2.6, PW / 2],
  ]) {
    if (x1 - x0 < 0.3) continue;
    b.box(x1 - x0, 0.6, 0.6, MAT.plain(0x3a3d42, 0.5), (x0 + x1) / 2, 0, front - 0.3);
    b.plane(x1 - x0, 0.9, MAT.sunroom(), (x0 + x1) / 2, 1.05, front - 0.3);
    for (let x = x0 + 0.6; x < x1 - 0.3; x += 1.1)
      b.add(new THREE.IcosahedronGeometry(0.3, 0), MAT.plain(0x4f8f45), x, 0.75, front - 0.3);
    solid(x0, x1, front - 0.6, front);
  }
  // the podium: two floors of lit glass under a white canopy
  const PHt = 7;
  b.box(BW + 2, PHt, BD + 1, white, 0, 0, bz);
  b.add(
    boxGeo(BW + 1.2, PHt - 1.4, 0.1, PHt),
    MAT2.glow(0xfff1d0),
    0,
    PHt / 2,
    bz + (BD + 1) / 2 + 0.03,
  );
  for (let x = -(BW + 1.2) / 2; x <= (BW + 1.2) / 2 + 0.01; x += (BW + 1.2) / 6)
    b.box(0.18, PHt - 1.4, 0.2, steel, x, 0.7, bz + (BD + 1) / 2 + 0.1);
  b.box(BW + 2.6, 0.5, BD + 1.6, steel, 0, PHt, bz);
  // the entrance canopy on two slim columns, and the tower's name
  const dz = bz + (BD + 1) / 2;
  b.box(6, 0.25, 3.6, white, 0, 3.6, dz + 1.8);
  for (const px of [-2.6, 2.6]) b.box(0.18, 3.6, 0.18, steel, px, 0, dz + 3.4);
  b.plane(1.8, 2.6, MAT.plain(0x1d2a33, 0.2), 0, 1.3, dz + 0.16);
  b.plane(BW * 0.7, 1.1, MAT.plaque(pick(TOWER_NAMES)), 0, PHt - 0.8, dz + 0.2);
  // the tower: curtain walls, a white band on every floor, fins up the front corners
  const H = floors * FHt;
  const y0 = PHt + 0.5;
  b.add(boxGeo(BW, H, BD, FHt), glass, 0, y0 + H / 2, bz);
  for (let f = 1; f < floors; f++)
    b.box(BW + 0.2, 0.18, BD + 0.2, white, 0, y0 + f * FHt - 0.09, bz);
  for (const fx of [-BW / 2, -BW / 6, BW / 6, BW / 2])
    for (const fz of [BD / 2 + 0.25, -BD / 2 - 0.25]) b.box(0.3, H, 0.5, white, fx, y0, bz + fz);
  // balconies with glass rails on every other floor, on the front
  for (let f = 1; f < floors; f += 2) {
    b.box(BW * 0.45, 0.16, 1.2, white, BW * 0.2, y0 + f * FHt, bz + BD / 2 + 0.6);
    b.plane(BW * 0.45, 1.0, MAT.sunroom(), BW * 0.2, y0 + f * FHt + 0.6, bz + BD / 2 + 1.2);
  }
  // the crown: a stepped top, a glowing ring and a slim spire
  const top = y0 + H;
  b.box(BW + 0.6, 0.5, BD + 0.6, white, 0, top, bz);
  b.add(boxGeo(BW - 4, FHt * 1.5, BD - 3, FHt), glass, 0, top + 0.5 + (FHt * 1.5) / 2, bz);
  b.box(BW - 3.6, 0.35, BD - 2.6, ring, 0, top + 0.5 + FHt * 1.5, bz);
  b.box(BW - 4.4, 0.4, BD - 3.4, white, 0, top + 0.85 + FHt * 1.5, bz);
  b.add(
    new THREE.CylinderGeometry(0.08, 0.22, 7, 6),
    steel,
    BW / 4,
    top + 1.2 + FHt * 1.5 + 3.5,
    bz,
  );
  solid(-BW / 2 - 1, BW / 2 + 1, bz - BD / 2 - 0.5, bz + BD / 2 + 0.5);
  for (const px of [-2.6, 2.6]) solid(px - 0.15, px + 0.15, dz + 3.25, dz + 3.55);
  // palms and a round fountain in front
  for (const px of [-PW / 2 + 1.6, PW / 2 - 1.6]) {
    if (Math.abs(px - gx) < 3) continue;
    fanPalm(b, px, front - 2.2, 1.1);
    solid(px - 0.3, px + 0.3, front - 2.5, front - 1.9);
  }
  const fx = gx > 0 ? -PW / 4 : PW / 4;
  if (dz + 4 < front - 2) {
    b.add(new THREE.CylinderGeometry(1.4, 1.5, 0.5, 20), white, fx, 0.25, front - 3);
    b.add(new THREE.CylinderGeometry(1.2, 1.2, 0.1, 20), MAT2.water(), fx, 0.5, front - 3);
    b.add(new THREE.CylinderGeometry(0.15, 0.25, 1.2, 8), white, fx, 0.9, front - 3);
    solid(fx - 1.5, fx + 1.5, front - 4.5, front - 1.5);
  }
  b.base.identity();
  return {
    colliders,
    door: toArea(0, dz + 2.4),
    gate: toArea(gx, front + 1),
    floors,
    number: o.number,
    gx,
    type: "tower",
  };
}
