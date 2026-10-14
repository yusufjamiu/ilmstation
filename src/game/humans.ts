import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";

/* People of IlmCity.
   A real human skeleton with motion-captured walking, running and idle movement
   (Mixamo rig, free for games). Only the hands come from that model: the head, face,
   neck and every piece of clothing are our own, built here and stitched onto the
   skeleton so they bend and swing as the person walks. */

export type Outfit = "thobe" | "kaftan" | "abaya" | "hisbah";
export type Look = {
  outfit: Outfit;
  robe: number;
  skin: number;
  trousers?: number;
  /** kufi colour; null = no cap */
  cap?: number | null;
  hijab?: number;
  beard?: boolean;
  shoe?: number;
};

type Rig = {
  root: THREE.Object3D;
  mixer: THREE.AnimationMixer;
  act: Record<string, THREE.AnimationAction>;
  bones: Record<string, THREE.Bone>;
  gait: number; // 0 idle → 1 walk → 2 run
  target: number;
  speed: number;
  posed: boolean;
  once: THREE.AnimationAction | null;
};

let base: { scene: THREE.Group; clips: THREE.AnimationClip[] } | null = null;
let loading: Promise<boolean> | null = null;
const rigs = new Set<Rig>();

export function humansReady() {
  return base !== null;
}

/** Download the skeleton once (≈ 430 KB). Resolves false if it cannot load. */
export function loadHumans(url = "/ilmcity/human.glb"): Promise<boolean> {
  if (loading) return loading;
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  loading = loader
    .loadAsync(url)
    .then((g) => {
      base = { scene: g.scene, clips: g.animations };
      return true;
    })
    .catch(() => false);
  return loading;
}

const bn = (n: string) => n.replace(/^mixamorig:?/, "");

/* ---------------- geometry helpers ---------------- */

type Ring = { c: THREE.Vector3; u: THREE.Vector3; v: THREE.Vector3; ru: number; rv: number };
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const AX = V(1, 0, 0),
  AY = V(0, 1, 0),
  AZ = V(0, 0, 1);

/** Join rings into a tube. Rings around the Y axis use u = X and v = Z. */
function loft(rings: Ring[], n = 20, capEnd = false) {
  const pos: number[] = [],
    uv: number[] = [],
    idx: number[] = [];
  rings.forEach((r, i) => {
    for (let k = 0; k <= n; k++) {
      const a = (k / n) * Math.PI * 2;
      const p = r.c
        .clone()
        .addScaledVector(r.u, Math.sin(a) * r.ru)
        .addScaledVector(r.v, Math.cos(a) * r.rv);
      pos.push(p.x, p.y, p.z);
      uv.push(k / n, i / (rings.length - 1));
    }
  });
  for (let i = 0; i < rings.length - 1; i++)
    for (let k = 0; k < n; k++) {
      const a = i * (n + 1) + k,
        b = a + n + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  if (capEnd) {
    const r = rings[rings.length - 1];
    const ci = pos.length / 3;
    pos.push(r.c.x, r.c.y, r.c.z);
    uv.push(0.5, 1);
    const s = (rings.length - 1) * (n + 1);
    for (let k = 0; k < n; k++) idx.push(s + k, ci, s + k + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
const hring = (y: number, rx: number, rz: number, cz = 0, cx = 0): Ring => ({
  c: V(cx, y, cz),
  u: AX,
  v: AZ,
  ru: rx,
  rv: rz,
});

/* ---------------- automatic skin weights ---------------- */

type Seg = { i: number; a: THREE.Vector3; b: THREE.Vector3 };
const closest = new THREE.Vector3();
function segDist(p: THREE.Vector3, s: Seg) {
  const ab = s.b.clone().sub(s.a);
  const t = THREE.MathUtils.clamp(p.clone().sub(s.a).dot(ab) / Math.max(1e-6, ab.lengthSq()), 0, 1);
  closest.copy(s.a).addScaledVector(ab, t);
  return closest.distanceTo(p);
}
type Weigher = (p: THREE.Vector3) => [number, number][];

function skin(geo: THREE.BufferGeometry, weigh: Weigher) {
  const p = geo.attributes.position as THREE.BufferAttribute;
  const si = new Uint16Array(p.count * 4),
    sw = new Float32Array(p.count * 4);
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const w = weigh(v)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
    const tot = w.reduce((s, x) => s + x[1], 0) || 1;
    w.forEach(([b, x], k) => {
      si[i * 4 + k] = b;
      sw[i * 4 + k] = x / tot;
    });
  }
  geo.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(si, 4));
  geo.setAttribute("skinWeight", new THREE.Float32BufferAttribute(sw, 4));
  return geo;
}

/* ---------------- textures ---------------- */

const texCache = new Map<string, THREE.Texture>();
function canvasTex(
  key: string,
  w: number,
  h: number,
  draw: (c: CanvasRenderingContext2D) => void,
  setup?: (t: THREE.CanvasTexture) => void,
) {
  const hit = texCache.get(key);
  if (hit) return hit;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  draw(cv.getContext("2d")!);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  setup?.(t);
  texCache.set(key, t);
  return t;
}
const css = (c: number) => "#" + c.toString(16).padStart(6, "0");
const shade = (c: number, f: number) => {
  const col = new THREE.Color(c);
  col.multiplyScalar(f);
  return "#" + col.getHexString();
};

/** A soft woven-cloth texture so robes don't look like plastic. */
function clothTex() {
  return canvasTex(
    "cloth",
    128,
    128,
    (c) => {
      c.fillStyle = "#fff";
      c.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 2200; i++) {
        const g = 225 + Math.floor(Math.random() * 30);
        c.fillStyle = `rgb(${g},${g},${g})`;
        c.fillRect(Math.random() * 128, Math.random() * 128, 1 + Math.random() * 2, 1);
      }
      c.globalAlpha = 0.035;
      c.fillStyle = "#000";
      for (let y = 0; y < 128; y += 2) c.fillRect(0, y, 128, 1);
      for (let x = 0; x < 128; x += 2) c.fillRect(x, 0, 1, 128);
    },
    (t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(6, 10);
    },
  );
}

/** The face is painted on the head: eyes, brows, nose, lips, and a beard or short hair. */
function faceTex(skinC: number, beard: boolean, hair: boolean) {
  const key = `face${skinC}${beard}${hair}`;
  return canvasTex(key, 512, 256, (c) => {
    const W = 512,
      H = 256;
    c.fillStyle = css(skinC);
    c.fillRect(0, 0, W, H);
    // the front of the head is at u = 0.25
    const fx = W * 0.25;
    const dark = shade(skinC, 0.55);
    if (hair) {
      c.fillStyle = "#16100c";
      c.fillRect(0, 0, W, H * 0.3);
      c.beginPath();
      c.ellipse(fx, H * 0.3, W * 0.12, H * 0.07, 0, 0, Math.PI);
      c.fill();
      c.fillRect(W * 0.42, 0, W * 0.58, H * 0.55); // back of the head
      c.fillRect(0, 0, W * 0.08, H * 0.55);
    }
    // ears shading
    c.fillStyle = shade(skinC, 0.85);
    for (const ex of [0, 0.5])
      c.fillRect(W * ex - 6 + (ex === 0 ? W : 0) * 0, H * 0.42, 12, H * 0.16);
    // brows
    c.strokeStyle = "#140d09";
    c.lineCap = "round";
    c.lineWidth = 5;
    for (const s of [-1, 1]) {
      c.beginPath();
      c.moveTo(fx + s * 20, H * 0.405);
      c.quadraticCurveTo(fx + s * 33, H * 0.385, fx + s * 46, H * 0.41);
      c.stroke();
    }
    // eyes
    for (const s of [-1, 1]) {
      const x = fx + s * 33,
        y = H * 0.47;
      c.fillStyle = "#f4efe6";
      c.beginPath();
      c.ellipse(x, y, 11, 5.5, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#2a170c";
      c.beginPath();
      c.arc(x, y + 0.5, 5, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#050302";
      c.beginPath();
      c.arc(x, y + 0.5, 2.4, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "rgba(255,255,255,0.8)";
      c.fillRect(x + 1, y - 2.5, 2, 2);
      c.strokeStyle = "#140d09";
      c.lineWidth = 2.5;
      c.beginPath();
      c.ellipse(x, y, 11.5, 6, 0, Math.PI * 1.05, Math.PI * 1.95);
      c.stroke();
    }
    // nose
    c.fillStyle = dark;
    c.globalAlpha = 0.45;
    c.beginPath();
    c.ellipse(fx - 7, H * 0.565, 4, 3, 0, 0, Math.PI * 2);
    c.ellipse(fx + 7, H * 0.565, 4, 3, 0, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 0.18;
    c.fillRect(fx - 3, H * 0.47, 6, H * 0.08);
    c.globalAlpha = 1;
    // lips
    c.fillStyle = shade(skinC, 0.62);
    c.beginPath();
    c.ellipse(fx, H * 0.64, 17, 4.5, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = shade(skinC, 0.4);
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(fx - 16, H * 0.638);
    c.quadraticCurveTo(fx, H * 0.648, fx + 16, H * 0.638);
    c.stroke();
    if (beard) {
      c.fillStyle = "#17100b";
      c.beginPath();
      c.globalAlpha = 0.92;
      c.moveTo(fx - 62, H * 0.5);
      c.quadraticCurveTo(fx - 56, H * 0.8, fx, H * 0.83);
      c.quadraticCurveTo(fx + 56, H * 0.8, fx + 62, H * 0.5);
      c.lineTo(fx + 54, H * 0.5);
      c.quadraticCurveTo(fx + 44, H * 0.68, fx + 20, H * 0.685);
      c.lineTo(fx - 20, H * 0.685);
      c.quadraticCurveTo(fx - 44, H * 0.68, fx - 54, H * 0.5);
      c.fill();
      c.globalAlpha = 1;
      // moustache
      c.beginPath();
      c.ellipse(fx, H * 0.605, 22, 5, 0, 0, Math.PI * 2);
      c.fill();
      // redraw lips over the beard
      c.fillStyle = shade(skinC, 0.62);
      c.beginPath();
      c.ellipse(fx, H * 0.64, 14, 3.5, 0, 0, Math.PI * 2);
      c.fill();
    }
  });
}

/** Little white embroidery on the kufi. */
function kufiTex() {
  return canvasTex("kufi", 256, 64, (c) => {
    c.fillStyle = "#fff";
    c.fillRect(0, 0, 256, 64);
    c.strokeStyle = "rgba(0,0,0,0.22)";
    c.lineWidth = 2;
    for (let x = 0; x < 256; x += 16) {
      c.beginPath();
      c.moveTo(x, 34);
      c.lineTo(x + 8, 22);
      c.lineTo(x + 16, 34);
      c.stroke();
      c.beginPath();
      c.arc(x + 8, 46, 3, 0, Math.PI * 2);
      c.stroke();
    }
    c.fillStyle = "rgba(0,0,0,0.12)";
    c.fillRect(0, 56, 256, 8);
  });
}

/* ---------------- templates (one per outfit shape) ---------------- */

const templates = new Map<string, THREE.Object3D>();

function buildTemplate(look: Look) {
  const t = cloneSkinned(base!.scene) as THREE.Object3D;
  t.updateMatrixWorld(true);
  let hands: THREE.SkinnedMesh | null = null;
  t.traverse((o) => {
    if ((o as THREE.SkinnedMesh).isSkinnedMesh) hands = o as THREE.SkinnedMesh;
  });
  const skel = (hands as unknown as THREE.SkinnedMesh).skeleton;
  (hands as unknown as THREE.SkinnedMesh).userData.role = "skin";
  const bi: Record<string, number> = {};
  const P: Record<string, THREE.Vector3> = {};
  skel.bones.forEach((b, i) => {
    bi[bn(b.name)] = i;
    P[bn(b.name)] = new THREE.Vector3().setFromMatrixPosition(b.matrixWorld);
  });
  const seg = (a: string, b: string): Seg => ({ i: bi[a], a: P[a], b: P[b] });
  const SEG: Record<string, Seg> = {
    Hips: seg("Hips", "Spine"),
    Spine: seg("Spine", "Spine1"),
    Spine1: seg("Spine1", "Spine2"),
    Spine2: seg("Spine2", "Neck"),
    Neck: seg("Neck", "Head"),
    Head: seg("Head", "HeadTop_End"),
  };
  for (const s of ["Left", "Right"]) {
    SEG[s + "Shoulder"] = seg(s + "Shoulder", s + "Arm");
    SEG[s + "Arm"] = seg(s + "Arm", s + "ForeArm");
    SEG[s + "ForeArm"] = seg(s + "ForeArm", s + "Hand");
    SEG[s + "UpLeg"] = seg(s + "UpLeg", s + "Leg");
    SEG[s + "Leg"] = seg(s + "Leg", s + "Foot");
    SEG[s + "Foot"] = seg(s + "Foot", s + "ToeBase");
    SEG[s + "ToeBase"] = seg(s + "ToeBase", s + "Toe_End");
  }
  const near =
    (names: string[], power = 4): Weigher =>
    (p) =>
      names.map((n) => [SEG[n].i, 1 / (Math.pow(segDist(p, SEG[n]), power) + 1e-7)]);
  const only =
    (n: string): Weigher =>
    () => [[bi[n], 1]];

  const female = look.outfit === "abaya";
  const long = look.outfit === "thobe" || female;
  const hipY = P.LeftUpLeg.y,
    kneeY = P.LeftLeg.y;
  /** Torso near the body bones; below the hips a robe follows hips and both legs. */
  const robeWeigh: Weigher = (p) => {
    if (p.y > hipY + 0.02)
      return near([
        "Hips",
        "Spine",
        "Spine1",
        "Spine2",
        "Neck",
        "LeftShoulder",
        "RightShoulder",
        "LeftArm",
        "RightArm",
      ])(p);
    const depth = THREE.MathUtils.clamp((hipY - p.y) / (hipY - 0.05), 0, 1);
    const hips = 1 - 0.75 * Math.pow(depth, 0.6);
    const left = THREE.MathUtils.smoothstep(p.x, -0.09, 0.09);
    const knee = THREE.MathUtils.clamp((kneeY - p.y) / 0.3, 0, 1);
    const legs = 1 - hips;
    return [
      [bi.Hips, hips],
      [bi.LeftUpLeg, legs * left * (1 - knee * 0.45)],
      [bi.LeftLeg, legs * left * knee * 0.45],
      [bi.RightUpLeg, legs * (1 - left) * (1 - knee * 0.45)],
      [bi.RightLeg, legs * (1 - left) * knee * 0.45],
    ];
  };

  const parts: { geo: THREE.BufferGeometry; role: string; double?: boolean }[] = [];
  const add = (geo: THREE.BufferGeometry, weigh: Weigher, role: string, double = false) =>
    parts.push({ geo: skin(geo, weigh), role, double });

  // --- robe / top ---
  const flare = female ? 1.12 : 1;
  const torso = [
    hring(1.53, 0.062, 0.06, -0.025),
    hring(1.5, 0.12, 0.085, -0.02),
    hring(1.468, 0.185, 0.105, -0.02),
    hring(1.43, 0.205, 0.12, -0.015),
    hring(1.36, 0.19, 0.13, 0),
    hring(1.25, 0.172, 0.128, 0.005),
    hring(1.12, 0.168, 0.122, 0.01),
    hring(1.0, 0.185, 0.13, 0.01),
  ];
  const robeRings = long
    ? [
        ...torso,
        hring(0.9, 0.2, 0.145, 0.01),
        hring(0.7, 0.212 * flare, 0.158 * flare, 0.01),
        hring(0.45, 0.225 * flare, 0.17 * flare, 0.01),
        hring(0.22, 0.238 * flare, 0.18 * flare, 0.01),
        hring(female ? 0.03 : 0.1, 0.248 * flare, 0.186 * flare, 0.01),
      ]
    : [...torso, hring(0.9, 0.205, 0.148, 0.01), hring(0.74, 0.222, 0.16, 0.01)];
  add(loft(robeRings, 24), robeWeigh, "robe", true);

  // --- sleeves ---
  for (const s of [1, -1]) {
    const side = s > 0 ? "Left" : "Right";
    const y = P[side + "Arm"].y,
      z = P[side + "Arm"].z;
    const w = female ? 1.25 : 1;
    const ring = (x: number, r: number): Ring => ({
      c: V(x * s, y, z),
      u: AZ,
      v: AY,
      ru: r,
      rv: r,
    });
    add(
      loft(
        [
          ring(0.1, 0.07 * w),
          ring(0.18, 0.068 * w),
          ring(0.3, 0.064 * w),
          ring(0.43, 0.058 * w),
          ring(0.56, 0.053 * w),
          ring(0.66, 0.05 * w),
          ring(0.705, 0.052 * w),
        ],
        14,
      ),
      near([side + "Shoulder", side + "Arm", side + "ForeArm"], 5),
      "robe",
      true,
    );
  }

  // --- trousers (kaftan and uniform) ---
  if (!long)
    for (const s of [1, -1]) {
      const side = s > 0 ? "Left" : "Right";
      const x = P[side + "UpLeg"].x;
      add(
        loft(
          [
            hring(1.0, 0.1, 0.1, 0.0, x * 0.7),
            hring(0.88, 0.095, 0.095, 0.0, x),
            hring(0.53, 0.07, 0.072, 0.0, x),
            hring(0.25, 0.06, 0.062, 0.0, x),
            hring(0.09, 0.062, 0.064, -0.01, x),
          ],
          14,
        ),
        near(["Hips", side + "UpLeg", side + "Leg"], 5),
        "trousers",
      );
    }

  // --- shoes ---
  for (const s of [1, -1]) {
    const side = s > 0 ? "Left" : "Right";
    const x = P[side + "Foot"].x;
    const g = new THREE.SphereGeometry(0.06, 14, 8);
    g.scale(0.85, 0.6, 2.05);
    g.translate(x, 0.035, 0.05);
    // flatten the sole
    const pa = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pa.count; i++) if (pa.getY(i) < 0.005) pa.setY(i, 0.005);
    g.computeVertexNormals();
    add(g, near([side + "Foot", side + "ToeBase"], 4), "shoe");
  }

  // --- neck ---
  const neck = new THREE.CylinderGeometry(0.048, 0.055, 0.16, 14, 1, true);
  neck.translate(0, 1.56, -0.015);
  add(neck, near(["Neck", "Head", "Spine2"], 4), "skin");

  // --- head with the face painted on ---
  const hc = V(0, 1.668, 0.005);
  const head = new THREE.SphereGeometry(0.1, 32, 24);
  {
    const pa = head.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pa.count; i++) {
      const y = pa.getY(i) * 1.22;
      let x = pa.getX(i) * 0.9,
        z = pa.getZ(i) * 1.08;
      const low = Math.max(0, -y / 0.122); // 0 at middle, 1 at chin
      x *= 1 - 0.28 * low * low;
      z *= 1 - 0.12 * low;
      if (z > 0 && y < 0) z += 0.012 * low; // chin forward
      if (z < 0 && y > -0.02) z *= 1.06; // back of skull
      pa.setXYZ(i, x + hc.x, y + hc.y, z + hc.z);
    }
    head.computeVertexNormals();
  }
  add(head, only("Head"), "face");
  // ears and a hint of a nose
  for (const s of [1, -1]) {
    const e = new THREE.SphereGeometry(0.022, 8, 6);
    e.scale(0.5, 1.2, 0.9);
    e.translate(0.091 * s, 1.665, -0.005);
    add(e, only("Head"), "skin");
  }
  const nose = new THREE.SphereGeometry(0.012, 8, 6);
  nose.scale(0.95, 1.4, 0.8);
  nose.translate(0, 1.648, 0.106);
  add(nose, only("Head"), "skin");

  // --- cap / hijab ---
  if (female) {
    // a shell over the head with an opening for the face
    const h = new THREE.SphereGeometry(0.118, 44, 32);
    const pa = h.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pa.count; i++)
      pa.setXYZ(i, pa.getX(i) * 0.95 + hc.x, pa.getY(i) * 1.15 + hc.y, pa.getZ(i) * 1.06 + hc.z);
    const idx = h.index!.array;
    const keep: number[] = [];
    const inFace = (i: number) => {
      const x = pa.getX(i),
        y = pa.getY(i) - hc.y,
        z = pa.getZ(i);
      return z > 0.04 && (x / 0.078) ** 2 + ((y + 0.02) / 0.1) ** 2 < 1;
    };
    for (let k = 0; k < idx.length; k += 3)
      if (!(inFace(idx[k]) || inFace(idx[k + 1]) || inFace(idx[k + 2])))
        keep.push(idx[k], idx[k + 1], idx[k + 2]);
    h.setIndex(keep);
    h.computeVertexNormals();
    add(h, only("Head"), "hijab", true);
    // the khimar falls over the shoulders and chest
    add(
      loft(
        [
          hring(1.585, 0.1, 0.108, 0.0),
          hring(1.54, 0.118, 0.115, -0.012),
          hring(1.48, 0.195, 0.135, -0.015),
          hring(1.4, 0.222, 0.152, -0.005),
          hring(1.31, 0.226, 0.158, 0.0),
        ],
        24,
      ),
      (p) =>
        p.y > 1.56
          ? [[bi.Head, 0.7] as [number, number], [bi.Neck, 0.3] as [number, number]]
          : near(["Neck", "Spine2", "LeftShoulder", "RightShoulder"], 3)(p),
      "hijab",
      true,
    );
  } else if (look.cap !== null) {
    const k = new THREE.CylinderGeometry(0.098, 0.106, 0.075, 28, 1, true);
    k.translate(0, hc.y + 0.085, -0.004);
    add(k, only("Head"), "kufi", true);
    const top = new THREE.CircleGeometry(0.098, 28);
    top.rotateX(-Math.PI / 2);
    top.translate(0, hc.y + 0.1225, -0.004);
    add(top, only("Head"), "kufiTop");
  }

  // our own bind pose: the skeleton exactly as it stands now, in the template's space
  t.updateMatrixWorld(true);
  const ownSkel = new THREE.Skeleton(skel.bones);
  for (const part of parts) {
    const m = new THREE.SkinnedMesh(part.geo, new THREE.MeshStandardMaterial());
    m.userData.role = part.role;
    m.userData.double = part.double;
    m.castShadow = true;
    m.frustumCulled = false;
    t.add(m);
    m.bind(ownSkel, new THREE.Matrix4());
  }
  (hands as unknown as THREE.SkinnedMesh).frustumCulled = false;
  (hands as unknown as THREE.SkinnedMesh).castShadow = true;
  return t;
}

/* ---------------- materials ---------------- */

const matCache = new Map<string, THREE.Material>();
function material(role: string, look: Look, double: boolean) {
  const hair = look.outfit !== "abaya" && look.cap === null;
  let key = role + double;
  let make: () => THREE.MeshStandardMaterial;
  const std = (color: number, extra: THREE.MeshStandardMaterialParameters = {}) =>
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.85,
      side: double ? THREE.DoubleSide : THREE.FrontSide,
      ...extra,
    });
  switch (role) {
    case "skin":
      key += look.skin;
      make = () => std(look.skin, { roughness: 0.6 });
      break;
    case "face":
      key += `${look.skin}${!!look.beard}${hair}`;
      make = () =>
        new THREE.MeshStandardMaterial({
          map: faceTex(look.skin, !!look.beard, hair),
          roughness: 0.62,
        });
      break;
    case "robe":
      key += look.robe;
      make = () => std(look.robe, { map: clothTex() });
      break;
    case "trousers":
      key += look.trousers ?? 0x2d3138;
      make = () => std(look.trousers ?? 0x2d3138, { map: clothTex() });
      break;
    case "hijab":
      key += look.hijab ?? 0x2a2a35;
      make = () => std(look.hijab ?? 0x2a2a35, { map: clothTex() });
      break;
    case "kufi":
      key += look.cap ?? 0xffffff;
      make = () => std(look.cap ?? 0xffffff, { map: kufiTex() });
      break;
    case "kufiTop":
      key += look.cap ?? 0xffffff;
      make = () => std(look.cap ?? 0xffffff);
      break;
    default:
      key += look.shoe ?? 0x2a1d14;
      make = () => std(look.shoe ?? 0x2a1d14, { roughness: 0.5 });
  }
  let m = matCache.get(key);
  if (!m) matCache.set(key, (m = make()));
  return m;
}

/* ---------------- making a person ---------------- */

export const HUMAN_SCALE = 1.2;

export function makeHuman(look: Look) {
  const tkey = `${look.outfit}|${look.cap === null ? "bare" : "cap"}`;
  let t = templates.get(tkey);
  if (!t) templates.set(tkey, (t = buildTemplate(look)));
  const root = cloneSkinned(t) as THREE.Object3D;
  root.scale.setScalar(HUMAN_SCALE);
  const bones: Record<string, THREE.Bone> = {};
  root.traverse((o) => {
    if ((o as THREE.Bone).isBone) bones[bn(o.name)] = o as THREE.Bone;
    const m = o as THREE.SkinnedMesh;
    if (m.isSkinnedMesh) {
      m.material = material(m.userData.role ?? "skin", look, !!m.userData.double);
      m.castShadow = true;
      m.frustumCulled = false;
    }
  });
  const mixer = new THREE.AnimationMixer(root);
  const act: Record<string, THREE.AnimationAction> = {};
  for (const c of base!.clips) act[c.name] = mixer.clipAction(c);
  for (const n of ["idle", "walk", "run"]) {
    act[n].play();
    act[n].setEffectiveWeight(n === "idle" ? 1 : 0);
  }
  // everybody moves a little differently
  act.idle.time = Math.random() * act.idle.getClip().duration;
  act.walk.time = Math.random() * act.walk.getClip().duration;
  mixer.update(0);
  const rig: Rig = {
    root,
    mixer,
    act,
    bones,
    gait: 0,
    target: 0,
    speed: 0,
    posed: false,
    once: null,
  };
  rigs.add(rig);
  root.userData.rig = rig;
  return root;
}

export function rigOf(o: THREE.Object3D): Rig | undefined {
  let r: Rig | undefined;
  o.traverse((c) => {
    if (!r && c.userData.rig) r = c.userData.rig as Rig;
  });
  return r;
}

/** 0 = standing, 1 = walking; `speed` (world units per second) picks walk or run. */
export function setGait(o: THREE.Object3D, amount: number, speed = 2.2) {
  const r = rigOf(o);
  if (!r) return;
  r.speed = speed;
  r.target = amount <= 0 ? 0 : speed > 4.2 ? 2 : 1;
}

/** Nod or shake the head while talking. */
export function gesture(o: THREE.Object3D, name: "agree" | "headShake") {
  const r = rigOf(o);
  if (!r || !r.act[name]) return;
  const a = r.act[name];
  a.reset();
  a.setLoop(THREE.LoopOnce, 1);
  a.clampWhenFinished = false;
  a.setEffectiveWeight(1);
  a.fadeIn(0.2).play();
  r.once = a;
}

const qa = new THREE.Quaternion(),
  qb = new THREE.Quaternion(),
  ax = new THREE.Vector3();
/** Turn a bone about a world axis (the skeleton's own axes differ bone to bone). */
function turn(b: THREE.Bone | undefined, axis: THREE.Vector3, angle: number) {
  if (!b?.parent) return;
  b.parent.updateWorldMatrix(true, false);
  b.parent.getWorldQuaternion(qa);
  ax.copy(axis).applyQuaternion(qa.invert()).normalize();
  qb.setFromAxisAngle(ax, angle);
  b.quaternion.premultiply(qb);
  b.updateMatrixWorld(true);
}

/** Sitting on the masjid carpet on the heels, hands on the thighs. */
export function sitHuman(o: THREE.Object3D) {
  const r = rigOf(o);
  if (!r) return false;
  r.posed = true;
  r.act.idle.setEffectiveWeight(1);
  r.act.walk.setEffectiveWeight(0);
  r.act.run.setEffectiveWeight(0);
  r.mixer.update(0);
  const b = r.bones;
  o.updateMatrixWorld(true);
  const X = new THREE.Vector3(1, 0, 0);
  b.Hips.position.y -= 72; // the skeleton is in centimetres
  turn(b.LeftUpLeg, X, -1.5);
  turn(b.RightUpLeg, X, -1.5);
  turn(b.LeftLeg, X, 2.95);
  turn(b.RightLeg, X, 2.95);
  turn(b.LeftArm, X, -0.55);
  turn(b.RightArm, X, -0.55);
  turn(b.LeftForeArm, X, -0.5);
  turn(b.RightForeArm, X, -0.5);
  return true;
}

const camPos = new THREE.Vector3(),
  tmp = new THREE.Vector3();
/** Run every frame: blends idle/walk/run and plays the animation of people near the camera. */
export function tickHumans(dt: number, camera: THREE.Camera, radius = 70) {
  camera.getWorldPosition(camPos);
  for (const r of rigs) {
    if (r.posed) continue;
    if (!r.root.parent) continue;
    r.root.getWorldPosition(tmp);
    if (tmp.distanceToSquared(camPos) > radius * radius) continue;
    r.gait += (r.target - r.gait) * Math.min(1, dt * 7);
    const g = r.gait;
    const idle = Math.max(0, 1 - g),
      walk = g <= 1 ? g : 2 - g,
      run = Math.max(0, g - 1);
    r.act.idle.setEffectiveWeight(idle);
    r.act.walk.setEffectiveWeight(walk);
    r.act.run.setEffectiveWeight(run);
    // match the feet to the ground speed
    const s = HUMAN_SCALE;
    r.act.walk.timeScale = THREE.MathUtils.clamp(r.speed / (1.35 * s), 0.6, 1.6);
    r.act.run.timeScale = THREE.MathUtils.clamp(r.speed / (3.6 * s), 0.7, 1.5);
    if (r.once && !r.once.isRunning()) r.once = null;
    r.mixer.update(dt);
  }
}

export function forgetHuman(o: THREE.Object3D) {
  const r = rigOf(o);
  if (r) rigs.delete(r);
}
