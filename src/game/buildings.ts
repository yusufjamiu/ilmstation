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
};

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
  private parts = new Map<THREE.Material, THREE.BufferGeometry[]>();
  private noShadow = new Set<THREE.Material>();
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  /** The transform applied to everything added (a compound's position and turn). */
  base = new THREE.Matrix4();

  add(geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0, ry = 0, shadow = true) {
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
    this.add(boxGeo(w, h, d, tile), mat, x, y + h / 2, z, ry);
  }
  /** An upright plane facing +z (before `ry`). */
  plane(w: number, h: number, mat: THREE.Material, x: number, y: number, z: number, ry = 0) {
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
};

const WALLS = [
  0xe8dcb5, 0xd9e3cf, 0xf0d9c2, 0xd8e0e6, 0xeedfa8, 0xe6cfd6, 0xf2ece0, 0xcfe0d8, 0xe9c9a8,
];
const FRAMES = [0xb8322a, 0x2a56a8, 0xe0b52c, 0x1f6f63, 0x6a2f8a, 0xf4efe4];
const GATES = [0x1d4d2e, 0x1d2f5a, 0x1a1a1a, 0x6a1f24, 0x2a5f7a];
const ROOFS = [0x3f6fa8, 0x9a3a2a, 0x3d7a4a, 0x6a6f74, 0x8a5a2a];
const FENCES = [0xf4f1ea, 0xe9e4d6, 0xdcd6c8];

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
  },
): Compound {
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

  // compound floor
  b.add(groundGeo(PW - 0.4, PD - 0.4, 2), MAT.paving(), 0, 0.035, 0, 0, false);

  // fence: block wall with coping, and a gate between two pillars
  const FH = 2.1,
    T = 0.24;
  const fenceM = MAT.block(fence);
  const cope = MAT.plain(0xf7f5ef);
  const gw = 4.4;
  const gx = (r() < 0.5 ? -1 : 1) * (PW / 2 - 4.5);
  const seg = (x0: number, x1: number, z: number) => {
    if (x1 - x0 < 0.05) return;
    b.box(x1 - x0, FH, T, fenceM, (x0 + x1) / 2, 0, z, 0, 2);
    b.box(x1 - x0 + 0.1, 0.12, T + 0.14, cope, (x0 + x1) / 2, FH, z);
    solid(x0, x1, z - T / 2, z + T / 2);
  };
  const front = PD / 2;
  seg(-PW / 2, gx - gw / 2 - 0.3, front);
  seg(gx + gw / 2 + 0.3, PW / 2, front);
  seg(-PW / 2, PW / 2, -PD / 2);
  for (const sx of [-PW / 2, PW / 2]) {
    b.add(boxGeo(T, FH, PD, 2), fenceM, sx, FH / 2, 0, 0);
    b.box(T + 0.14, 0.12, PD, cope, sx, FH, 0);
    solid(sx - T / 2, sx + T / 2, -PD / 2, PD / 2);
  }
  for (const px of [gx - gw / 2 - 0.3, gx + gw / 2 + 0.3]) {
    b.box(0.6, 2.5, 0.6, fenceM, px, 0, front, 0, 2);
    b.box(0.75, 0.14, 0.75, cope, px, 2.5, front);
    solid(px - 0.3, px + 0.3, front - 0.3, front + 0.3);
  }
  // gate leaves, closed with a small opening to walk through
  b.add(boxGeo(gw * 0.5, 2.1, 0.07), MAT.gate(gateC), gx - gw * 0.25, 1.1, front - 0.05);
  b.add(boxGeo(gw * 0.25, 2.1, 0.07), MAT.gate(gateC), gx + gw * 0.38, 1.1, front - 0.05);
  solid(gx - gw / 2, gx, front - 0.2, front + 0.2);
  // house number on the pillar
  b.plane(0.5, 0.25, MAT.plaque("No. " + o.number), gx + gw / 2 + 0.3, 1.9, front + 0.31);

  // the building, at the back of the compound
  const BW = Math.min(PW - 4, 11 + Math.floor(r() * 4)),
    BD = Math.min(PD - 9, 8 + Math.floor(r() * 3));
  const bz = -PD / 2 + 1.5 + BD / 2;
  const FHt = 3.2;
  const wallM = MAT.plaster(wall);
  const trim = MAT.plain(0xf7f5ef);
  b.box(BW + 0.3, 0.45, BD + 0.3, MAT.plain(0x8a8174), 0, 0, bz); // plinth
  for (let f = 0; f < floors; f++) {
    const y = 0.45 + f * FHt;
    b.box(BW, FHt - 0.25, BD, wallM, 0, y, bz);
    b.box(BW + 0.25, 0.25, BD + 0.25, trim, 0, y + FHt - 0.25, bz); // floor slab edge
    // windows on the front and sides
    const n = Math.max(2, Math.floor(BW / 3));
    for (let i = 0; i < n; i++) {
      const wx = -BW / 2 + (BW / n) * (i + 0.5);
      if (f === 0 && Math.abs(wx) < 1.2) continue; // the front door
      b.plane(1.3, 1.5, MAT.window(frame), wx, y + 1.55, bz + BD / 2 + 0.02);
      b.box(1.5, 0.08, 0.18, trim, wx, y + 0.76, bz + BD / 2 + 0.05);
      b.plane(1.3, 1.5, MAT.window(frame), wx, y + 1.55, bz - BD / 2 - 0.02, Math.PI);
    }
    for (const s of [1, -1]) {
      b.plane(1.2, 1.4, MAT.window(frame), s * (BW / 2 + 0.02), y + 1.55, bz, (s * Math.PI) / 2);
      // a split air-conditioner on the side wall
      if ((f + (s > 0 ? 1 : 0)) % 2 === 0 && r() < 0.6)
        b.add(
          boxGeo(0.35, 0.55, 0.8),
          MAT.grille(),
          s * (BW / 2 + 0.2),
          y + 1.0,
          bz + BD / 4,
          Math.PI / 2,
        );
    }
    // balcony on the upper floors
    if (f > 0) {
      b.box(BW * 0.55, 0.18, 1.3, trim, 0, y - 0.1, bz + BD / 2 + 0.65);
      b.plane(BW * 0.55, 1.0, MAT.rail(), 0, y + 0.55, bz + BD / 2 + 1.3);
      for (const s of [1, -1])
        b.plane(1.3, 1.0, MAT.rail(), s * BW * 0.275, y + 0.55, bz + BD / 2 + 0.65, Math.PI / 2);
    }
  }
  const top = 0.45 + floors * FHt;
  // front door with a canopy and steps
  b.plane(1.1, 2.3, MAT.door(0x6b4226), 0, 0.45 + 1.15, bz + BD / 2 + 0.02);
  b.box(2.2, 0.15, 1.2, trim, 0, 2.95, bz + BD / 2 + 0.6);
  b.box(2.0, 0.22, 0.9, MAT.plain(0x9a9184), 0, 0, bz + BD / 2 + 0.45);
  solid(-BW / 2, BW / 2, bz - BD / 2, bz + BD / 2);

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
    // satellite dish
    b.add(
      new THREE.SphereGeometry(0.45, 12, 6, 0, Math.PI * 2, 0, 0.9),
      MAT.plain(0xe9e9e4, 0.4),
      -BW / 2 + 1.5,
      top + 1.0,
      bz,
      0,
    );
  } else {
    // long-span roof: a low hipped roof of corrugated sheets
    const roof = new THREE.ConeGeometry(1, 1, 4, 1, true);
    roof.rotateY(Math.PI / 4);
    roof.scale((BW + 1.4) / Math.SQRT2, 2.4, (BD + 1.4) / Math.SQRT2);
    const uv = roof.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 8, uv.getY(i) * 3);
    b.add(roof, MAT.zinc(roofC), 0, top + 1.2, bz);
    b.box(BW + 1.4, 0.2, BD + 1.4, MAT.plain(0xf2efe6), 0, top - 0.1, bz); // fascia board
  }

  // a generator and plants in the front yard
  if (r() < 0.5)
    b.box(
      1.1,
      0.8,
      0.7,
      MAT.plain(r() < 0.5 ? 0xd9a520 : 0x2f6fb0, 0.6),
      -BW / 2 + 1,
      0,
      bz + BD / 2 + 2.5,
    );
  for (let i = 0; i < 3; i++) {
    const px = -PW / 2 + 1.2 + r() * (PW - 2.4);
    b.add(
      new THREE.CylinderGeometry(0.3, 0.22, 0.5, 10),
      MAT.plain(0xb0603a),
      px,
      0.25,
      front - 0.9,
    );
    b.add(
      new THREE.IcosahedronGeometry(0.5, 0),
      MAT.plain(r() < 0.5 ? 0x3f7d3a : 0x4f8f45),
      px,
      0.85,
      front - 0.9,
    );
  }

  b.base.identity();
  return {
    colliders,
    door: toArea(0, bz + BD / 2 + 1.2),
    gate: toArea(gx, front + 1),
    floors,
    number: o.number,
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
