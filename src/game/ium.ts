/* The Islamic University of Madinah: its striped twin-arch main gate, the colleges with
   their names in Arabic and English, and the student hostels inside the campus. */
import * as THREE from "three";
import { Batch, MAT, MAT2, groundGeo, textMat, type Box } from "./buildings";

const AR = '"Amiri", "Noto Naskh Arabic", "Geeza Pro", "Traditional Arabic", serif';
const EN = '"Work Sans", system-ui, sans-serif';

/* ---------------- textures and materials ---------------- */
const texs = new Map<string, THREE.CanvasTexture>();
function canvasTex(
  key: string,
  w: number,
  h: number,
  draw: (c: CanvasRenderingContext2D, w: number, h: number) => void,
  repeat = false,
) {
  const had = texs.get(key);
  if (had) return had;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const paint = () => {
    const c = cv.getContext("2d")!;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, w, h);
    draw(c, w, h);
  };
  paint();
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  texs.set(key, t);
  // Arabic in a proper naskh hand: drawn again once the font has arrived
  document.fonts
    ?.load(`700 40px Amiri`)
    .then(() => {
      paint();
      t.needsUpdate = true;
    })
    .catch(() => {});
  return t;
}
/** Write text that shrinks to fit. */
function fit(
  c: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  maxW: number,
  font: string,
  weight = 700,
  rtl = false,
) {
  c.save();
  c.direction = rtl ? "rtl" : "ltr";
  c.textAlign = "center";
  c.textBaseline = "middle";
  let s = size;
  c.font = `${weight} ${s}px ${font}`;
  while (c.measureText(text).width > maxW && s > 10) {
    s -= 2;
    c.font = `${weight} ${s}px ${font}`;
  }
  c.fillText(text, x, y);
  c.restore();
}

/** Materials that light up at night; the engine takes them once and makes them glow. */
const glowing: { m: THREE.MeshStandardMaterial; k: number; c: number }[] = [];
export function takeIumGlow() {
  return glowing.splice(0).map((g) => ({ ...g, map: g.m.map ?? undefined }));
}
const mats = new Map<string, THREE.MeshStandardMaterial>();
function mat(
  key: string,
  make: () => THREE.MeshStandardMaterial,
  glow = 0,
  glowC = 0xffd9a0,
): THREE.MeshStandardMaterial {
  const had = mats.get(key);
  if (had) return had;
  const m = make();
  mats.set(key, m);
  if (glow) glowing.push({ m, k: glow, c: glowC });
  return m;
}

/** Striped stone (ablaq): wide sand courses and thin brown ones, 1.2 m apart. */
function stripeTex() {
  const t = canvasTex(
    "ium-stripe",
    128,
    144,
    (c, w, h) => {
      c.fillStyle = "#e6c892";
      c.fillRect(0, 0, w, h);
      for (let i = 0; i < 900; i++) {
        c.fillStyle = `rgba(${150 + Math.random() * 80},${110 + Math.random() * 60},60,0.08)`;
        c.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
      // the brown course
      c.fillStyle = "#b08654";
      c.fillRect(0, 0, w, 24);
      c.fillStyle = "rgba(0,0,0,0.1)";
      c.fillRect(0, 24, w, 3);
      // the joints of the sand course
      c.fillStyle = "rgba(120,85,45,0.35)";
      c.fillRect(0, 86, w, 2);
      for (const x of [0, 64]) c.fillRect(x, 33, 2, 53);
      for (const x of [32, 96]) c.fillRect(x, 88, 2, 56);
      for (const x of [16, 80]) c.fillRect(x, 0, 2, 30);
    },
    true,
  );
  t.repeat.set(1, 1 / 1.2);
  return t;
}
const M = {
  stripe: () =>
    mat("stripe", () => new THREE.MeshStandardMaterial({ map: stripeTex(), roughness: 0.85 }), 0.22, 0xffe2b8),
  stripeDark: () =>
    mat(
      "stripeDark",
      () =>
        new THREE.MeshStandardMaterial({ map: stripeTex(), color: 0xa8865e, roughness: 0.85 }),
      0.16,
    ),
  sand: () =>
    mat("sand", () => new THREE.MeshStandardMaterial({ color: 0xe9cf9c, roughness: 0.8 }), 0.2),
  vLight: () =>
    mat("vL", () => new THREE.MeshStandardMaterial({ color: 0xf3e0b4, roughness: 0.75 }), 0.22),
  vDark: () =>
    mat("vD", () => new THREE.MeshStandardMaterial({ color: 0xb48654, roughness: 0.8 }), 0.15),
  dome: () =>
    mat("dome", () => new THREE.MeshStandardMaterial({ color: 0xefdcb6, roughness: 0.7 }), 0.2),
  cream: () =>
    mat("cream", () => new THREE.MeshStandardMaterial({ color: 0xefe3c7, roughness: 0.85 }), 0.18),
  trim: () =>
    mat("trim", () => new THREE.MeshStandardMaterial({ color: 0xdcc9a2, roughness: 0.8 }), 0.15),
  tex: (key: string, t: THREE.Texture, glow = 0.3, rough = 0.7) =>
    mat("t-" + key, () => new THREE.MeshStandardMaterial({ map: t, roughness: rough }), glow * 0.7, 0xffe2b8),
  /** a sign that stays readable at night */
  sign: (key: string, t: THREE.Texture) =>
    mat("s-" + key, () => new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 }), 0.9, 0xffffff),
};

/** UVs in metres (u along the face, v up), so stripes run level on every face. */
function worldUV(geo: THREE.BufferGeometry) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  if (!g.attributes.normal) g.computeVertexNormals();
  const p = g.attributes.position,
    n = g.attributes.normal;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const nx = Math.abs(n.getX(i)),
      ny = Math.abs(n.getY(i)),
      nz = Math.abs(n.getZ(i));
    if (ny > 0.7) {
      uv[i * 2] = p.getX(i);
      uv[i * 2 + 1] = p.getZ(i);
    } else {
      uv[i * 2] = nx > nz ? p.getZ(i) : p.getX(i);
      uv[i * 2 + 1] = p.getY(i);
    }
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return g;
}
function boxAt(w: number, h: number, d: number, x: number, y: number, z: number) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y + h / 2, z);
  return worldUV(g);
}

/** A pointed (two-centred) arch from (cx-a, spring) over to (cx+a, spring). */
function archPts(cx: number, a: number, spring: number, R: number, r: number, n = 10) {
  const off = R - a; // each arc's centre is this far past the middle
  const th = Math.acos(off / r);
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = Math.PI - (th * i) / n;
    pts.push([cx + off + r * Math.cos(t), spring + r * Math.sin(t)]);
  }
  for (let i = n; i >= 0; i--) {
    const t = (th * i) / n;
    pts.push([cx - off + r * Math.cos(t), spring + r * Math.sin(t)]);
  }
  return pts;
}
/** Medallion: rings round an eight-pointed star. */
function medallionTex() {
  return canvasTex("ium-med", 256, 256, (c, w) => {
    const r = w / 2;
    c.translate(r, r);
    c.fillStyle = "#e9cf9c";
    c.beginPath();
    c.arc(0, 0, r - 2, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#8f6a3e";
    for (const [rr, lw] of [
      [r - 8, 8],
      [r - 26, 3],
      [r - 60, 3],
    ] as [number, number][]) {
      c.lineWidth = lw;
      c.beginPath();
      c.arc(0, 0, rr, 0, Math.PI * 2);
      c.stroke();
    }
    c.lineWidth = 4;
    for (const rot of [0, Math.PI / 4]) {
      c.save();
      c.rotate(rot);
      c.strokeRect(-60, -60, 120, 120);
      c.restore();
    }
    for (let i = 0; i < 16; i++) {
      c.save();
      c.rotate((i / 16) * Math.PI * 2);
      c.beginPath();
      c.arc(0, -(r - 43), 9, 0, Math.PI * 2);
      c.stroke();
      c.restore();
    }
    c.fillStyle = "#b8925c";
    c.beginPath();
    c.arc(0, 0, 18, 0, Math.PI * 2);
    c.fill();
  });
}
/** The long six-sided name panel at the top of the gate. */
function gatePanelTex(ar: string) {
  return canvasTex("ium-gp-" + ar, 1024, 160, (c, w, h) => {
    c.fillStyle = "#e9cf9c";
    c.fillRect(0, 0, w, h);
    const hex = (i: number) => {
      c.beginPath();
      c.moveTo(14 + i, h / 2);
      c.lineTo(70 + i, 12 + i);
      c.lineTo(w - 70 - i, 12 + i);
      c.lineTo(w - 14 - i, h / 2);
      c.lineTo(w - 70 - i, h - 12 - i);
      c.lineTo(70 + i, h - 12 - i);
      c.closePath();
    };
    hex(0);
    c.fillStyle = "#f1dcb0";
    c.fill();
    c.strokeStyle = "#6b4a2a";
    c.lineWidth = 7;
    c.stroke();
    hex(12);
    c.lineWidth = 2;
    c.stroke();
    c.fillStyle = "#4a3018";
    fit(c, ar, w / 2, h / 2 + 6, 96, w - 200, AR, 700, true);
  });
}
function doorTex() {
  return canvasTex("ium-door", 128, 160, (c, w, h) => {
    c.fillStyle = "#3d3626";
    c.fillRect(0, 0, w, h);
    c.strokeStyle = "#8f7a4a";
    c.lineWidth = 3;
    for (let x = 8; x < w; x += 16)
      for (let y = 8; y < h; y += 16) {
        c.beginPath();
        c.moveTo(x, y - 7);
        c.lineTo(x + 7, y);
        c.lineTo(x, y + 7);
        c.lineTo(x - 7, y);
        c.closePath();
        c.stroke();
      }
    c.lineWidth = 6;
    c.strokeRect(3, 3, w - 6, h - 6);
    c.fillRect(w / 2 - 2, 0, 4, h);
  });
}

/* ---------------- the main gate ---------------- */
/** The main gate: two tall pointed arches in striped stone under crenellations, the
    university's name in a six-sided panel on top, and a domed block on each side.
    Local frame: centred on x = 0, the road side facing +z. */
export function iumGate(arName: string) {
  const g = new THREE.Group();
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, shadow = true) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.castShadow = shadow;
    mesh.receiveShadow = true;
    g.add(mesh);
    return mesh;
  };
  const W2 = 11,
    H = 17,
    DP = 4.2,
    a = 3.6,
    R = a * 1.55,
    spring = 6.2,
    t = 0.95,
    cxs = [-4.4, 4.4];
  // the central block, with the two arches cut through it
  const s = new THREE.Shape();
  s.moveTo(-W2, 0);
  for (const cx of cxs) {
    s.lineTo(cx - a, 0);
    for (const [x, y] of archPts(cx, a, spring, R, R, 14)) s.lineTo(x, y);
    s.lineTo(cx + a, 0);
  }
  s.lineTo(W2, 0);
  s.lineTo(W2, H);
  s.lineTo(-W2, H);
  s.closePath();
  const body = new THREE.ExtrudeGeometry(s, { depth: DP, bevelEnabled: false, curveSegments: 4 });
  body.translate(0, 0, -DP / 2);
  add(worldUV(body), M.stripe());
  // the darker stone at the foot of the piers
  for (const [x0, x1] of [
    [-W2, cxs[0] - a],
    [cxs[0] + a, cxs[1] - a],
    [cxs[1] + a, W2],
  ])
    add(boxAt(x1 - x0 + 0.06, 3.2, DP + 0.12, (x0 + x1) / 2, 0, 0), M.stripeDark());
  // the plain band at the top with the name panel, front and back
  add(boxAt(W2 * 2 + 0.12, 2.8, DP + 0.12, 0, H - 2.8, 0), M.sand());
  add(boxAt(W2 * 2 + 0.5, 0.3, DP + 0.5, 0, H - 2.9, 0), M.trim());
  const panel = M.sign("gate-" + arName, gatePanelTex(arName));
  for (const side of [1, -1]) {
    const p = add(new THREE.PlaneGeometry(11.5, 1.8), panel, false);
    p.position.set(0, H - 1.35, side * (DP / 2 + 0.08));
    if (side < 0) p.rotation.y = Math.PI;
  }
  // crenellations round the flat top
  const mer = M.sand();
  for (let i = 0; i < 8; i++) {
    const x = -W2 + 0.75 + (i * (W2 * 2 - 1.5)) / 7;
    for (const z of [DP / 2 - 0.3, -DP / 2 + 0.3]) add(boxAt(1.5, 1.6, 0.6, x, H, z), mer);
  }
  for (const x of [-W2 + 0.3, W2 - 0.3]) add(boxAt(0.6, 1.6, 1.2, x, H, 0), mer);
  // the voussoirs round each arch, light and dark in turn, and slim columns at the jambs
  const N = 9;
  for (const cx of cxs)
    for (const side of [-1, 1]) {
      const off = R - a;
      const thI = Math.acos(off / R),
        thO = Math.acos(off / (R + t));
      for (let i = 0; i < N; i++) {
        const angI = (k: number) => (side < 0 ? Math.PI - (thI * k) / N : (thI * k) / N);
        const angO = (k: number) => (side < 0 ? Math.PI - (thO * k) / N : (thO * k) / N);
        const ccx = cx - side * off;
        const pI = (k: number) => [ccx + R * Math.cos(angI(k)), spring + R * Math.sin(angI(k))];
        const pO = (k: number) => [
          ccx + (R + t) * Math.cos(angO(k)),
          spring + (R + t) * Math.sin(angO(k)),
        ];
        const w = new THREE.Shape();
        const [a0, a1, b1, b0] = [pI(i), pI(i + 1), pO(i + 1), pO(i)];
        w.moveTo(a0[0], a0[1]);
        w.lineTo(a1[0], a1[1]);
        w.lineTo(b1[0], b1[1]);
        w.lineTo(b0[0], b0[1]);
        w.closePath();
        for (const fz of [1, -1]) {
          const geo = new THREE.ExtrudeGeometry(w, { depth: 0.25, bevelEnabled: false });
          geo.translate(0, 0, fz > 0 ? DP / 2 : -DP / 2 - 0.25);
          add(geo, i % 2 ? M.vDark() : M.vLight());
        }
      }
      for (const fz of [1, -1]) {
        const x = cx + side * (a - 0.2);
        const z = fz * (DP / 2 + 0.05);
        const col = new THREE.CylinderGeometry(0.22, 0.26, spring - 0.6, 10);
        col.translate(x, (spring - 0.6) / 2, z);
        add(col, M.vLight());
        add(boxAt(0.75, 0.6, 0.75, x, spring - 0.6, z), M.trim());
        add(boxAt(0.7, 0.4, 0.7, x, 0, z), M.trim());
      }
    }
  // the medallion between the arches, front and back
  const med = M.tex("med", medallionTex(), 0.35);
  for (const side of [1, -1]) {
    const m = add(new THREE.CircleGeometry(1.65, 40), med, false);
    m.position.set(0, 11.6, side * (DP / 2 + 0.06));
    if (side < 0) m.rotation.y = Math.PI;
  }
  // the domed blocks on either side, each with a medallion and a latticed door
  const SW = 7.5,
    SD = 6.4,
    SH = 10.6;
  const door = M.tex("door", doorTex(), 0.15);
  for (const sx of [-1, 1]) {
    const cx = sx * (W2 + SW / 2);
    add(boxAt(SW, SH, SD, cx, 0, 0), M.stripe());
    add(boxAt(SW + 0.08, 3.6, SD + 0.08, cx, 0, 0), M.stripeDark());
    add(boxAt(SW + 0.08, 1.5, SD + 0.08, cx, SH - 1.5, 0), M.sand());
    add(boxAt(SW + 0.45, 0.28, SD + 0.45, cx, SH, 0), M.trim());
    add(boxAt(SW + 0.3, 0.2, SD + 0.3, cx, SH - 1.7, 0), M.trim());
    const drum = new THREE.CylinderGeometry(2.4, 2.4, 0.7, 28);
    drum.translate(cx, SH + 0.28 + 0.35, -0.4);
    add(drum, M.dome());
    const dome = new THREE.SphereGeometry(2.4, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2);
    dome.translate(cx, SH + 0.98, -0.4);
    add(dome, M.dome());
    for (const side of [1, -1]) {
      const m = add(new THREE.CircleGeometry(1.3, 36), med, false);
      m.position.set(cx, 6.4, side * (SD / 2 + 0.06));
      if (side < 0) m.rotation.y = Math.PI;
      const d = add(new THREE.PlaneGeometry(2.4, 3.1), door, false);
      d.position.set(cx, 1.6, side * (SD / 2 + 0.06));
      if (side < 0) d.rotation.y = Math.PI;
    }
  }
  const colliders: Box[] = [
    { x0: -1.2, x1: 1.2, z0: -DP / 2 - 0.3, z1: DP / 2 + 0.3 },
    { x0: cxs[1] + a - 0.5, x1: W2, z0: -DP / 2 - 0.3, z1: DP / 2 + 0.3 },
    { x0: -W2, x1: cxs[0] - a + 0.5, z0: -DP / 2 - 0.3, z1: DP / 2 + 0.3 },
    { x0: W2, x1: W2 + SW, z0: -SD / 2, z1: SD / 2 },
    { x0: -W2 - SW, x1: -W2, z0: -SD / 2, z1: SD / 2 },
  ];
  // built a tenth larger than drawn, so it stands as tall as the colleges behind it
  const S = 1.1;
  g.scale.setScalar(S);
  for (const c of colliders) {
    c.x0 *= S;
    c.x1 *= S;
    c.z0 *= S;
    c.z1 *= S;
  }
  return {
    group: g,
    colliders,
    halfWidth: (W2 + SW) * S,
    height: (H + 1.6) * S,
    front: (SD / 2) * S,
  };
}

/* ---------------- the colleges ---------------- */
const AR_NAMES: [RegExp, string][] = [
  [/Sharia/, "كلية الشريعة"],
  [/Da'wah/, "كلية الدعوة وأصول الدين"],
  [/Qur'an/, "كلية القرآن الكريم والدراسات الإسلامية"],
  [/Hadith/, "كلية الحديث الشريف والدراسات الإسلامية"],
  [/Arabic/, "كلية اللغة العربية"],
  [/Computer/, "كلية الحاسب الآلي ونظم المعلومات"],
  [/Engineering/, "كلية الهندسة"],
  [/Science/, "كلية العلوم"],
  [/Library/, "المكتبة المركزية"],
  [/Complex/, "مجمع الكليات"],
];
export function iumArabic(name: string) {
  return AR_NAMES.find(([r]) => r.test(name))?.[1] ?? "الجامعة الإسلامية";
}
/** The dark name panel over a college door: Arabic above, English below. */
function namePanelTex(ar: string, en: string) {
  return canvasTex(`ium-np-${ar}-${en}`, 1024, 220, (c, w, h) => {
    c.fillStyle = "#1c2422";
    c.fillRect(0, 0, w, h);
    c.strokeStyle = "#c9a227";
    c.lineWidth = 6;
    c.strokeRect(8, 8, w - 16, h - 16);
    c.lineWidth = 2;
    c.strokeRect(20, 20, w - 40, h - 40);
    c.fillStyle = "#f1dfa6";
    fit(c, ar, w / 2, 82, 82, w - 90, AR, 700, true);
    c.fillStyle = "#f6efd9";
    fit(c, en, w / 2, 166, 46, w - 90, EN, 700);
  });
}
/** The tall entrance: a pointed arch filled with a silver lattice over glass doors. */
function portalTex() {
  return canvasTex("ium-portal", 320, 680, (c, w, h) => {
    c.fillStyle = "#eee2c4";
    c.fillRect(0, 0, w, h);
    const arch = (inset: number) => {
      const x0 = 30 + inset,
        x1 = w - 30 - inset,
        sp = 330,
        a = (x1 - x0) / 2,
        cx = (x0 + x1) / 2,
        R = a * 1.6,
        off = R - a;
      const th = Math.acos(off / R);
      c.beginPath();
      c.moveTo(x0, h);
      c.lineTo(x0, sp);
      c.arc(cx + off, sp, R, Math.PI, Math.PI + th);
      c.arc(cx - off, sp, R, -th, 0);
      c.lineTo(x1, h);
      c.closePath();
    };
    arch(0);
    c.fillStyle = "#e0cfa8";
    c.fill();
    c.strokeStyle = "#c8b48a";
    c.lineWidth = 3;
    c.stroke();
    arch(16);
    const gr = c.createLinearGradient(0, 0, w, h);
    gr.addColorStop(0, "#3c4c56");
    gr.addColorStop(1, "#1a242b");
    c.fillStyle = gr;
    c.fill();
    c.save();
    c.clip();
    // the lattice: interlaced eight-pointed stars
    c.strokeStyle = "#b9bcb6";
    c.lineWidth = 3;
    for (let y = 60; y < 520; y += 34)
      for (let x = 30 + ((y / 34) % 2) * 17; x < w; x += 34) {
        for (const rot of [0, Math.PI / 4]) {
          c.save();
          c.translate(x, y);
          c.rotate(rot);
          c.strokeRect(-10, -10, 20, 20);
          c.restore();
        }
      }
    // the glass doors below, in a frame
    c.fillStyle = "#b9bcb6";
    c.fillRect(0, 520, w, 6);
    for (let x = 46; x < w - 40; x += 57) c.fillRect(x, 526, 5, h - 526);
    c.fillRect(0, 600, w, 4);
    c.restore();
  });
}
/** A wing window: a pointed arch screened with lattice. */
function latArchTex() {
  return canvasTex("ium-latarch", 128, 256, (c, w, h) => {
    c.fillStyle = "#eee2c4";
    c.fillRect(0, 0, w, h);
    const path = (i: number) => {
      const x0 = 8 + i,
        x1 = w - 8 - i,
        a = (x1 - x0) / 2,
        cx = (x0 + x1) / 2,
        R = a * 1.6,
        off = R - a,
        sp = 110;
      const th = Math.acos(off / R);
      c.beginPath();
      c.moveTo(x0, h - 6);
      c.lineTo(x0, sp);
      c.arc(cx + off, sp, R, Math.PI, Math.PI + th);
      c.arc(cx - off, sp, R, -th, 0);
      c.lineTo(x1, h - 6);
      c.closePath();
    };
    path(0);
    c.fillStyle = "#d9c9a2";
    c.fill();
    path(8);
    c.fillStyle = "#59615f";
    c.fill();
    c.save();
    c.clip();
    c.strokeStyle = "#c4c7c0";
    c.lineWidth = 3;
    for (let y = 10; y < h; y += 24)
      for (let x = 12 + ((y / 24) % 2) * 12; x < w; x += 24)
        for (const rot of [0, Math.PI / 4]) {
          c.save();
          c.translate(x, y);
          c.rotate(rot);
          c.strokeRect(-7, -7, 14, 14);
          c.restore();
        }
    c.restore();
  });
}
function winTex() {
  return canvasTex("ium-win", 64, 96, (c, w, h) => {
    c.fillStyle = "#d9c9a2";
    c.fillRect(0, 0, w, h);
    const g = c.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#58707c");
    g.addColorStop(1, "#22303a");
    c.fillStyle = g;
    c.fillRect(6, 6, w - 12, h - 12);
    c.fillStyle = "#d9c9a2";
    c.fillRect(w / 2 - 2, 6, 4, h - 12);
  });
}

type Placed = { x: number; z: number };
function frameOf(b: Batch, x: number, z: number, turn: number) {
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
function palm(b: Batch, x: number, z: number, s = 1) {
  b.add(new THREE.CylinderGeometry(0.14 * s, 0.24 * s, 5 * s, 6), MAT.plain(0x8a6a3e), x, 2.5 * s, z);
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.BoxGeometry(0.5 * s, 0.06, 2.6 * s);
    leaf.translate(0, 0, 1.2 * s);
    leaf.rotateX(0.45);
    leaf.rotateY((i / 7) * Math.PI * 2);
    b.add(leaf, MAT.plain(i % 2 ? 0x3f7d3a : 0x4f8f45), x, 5 * s, z);
  }
}

/** A college of the Islamic University: a cream block four storeys high, a tall pointed
    entrance filled with lattice, latticed arch windows on the wings, and the college's
    name in Arabic and English on a dark panel over the door. */
export function iumCollege(
  b: Batch,
  o: { x: number; z: number; turn: number; width: number; depth: number; name: string },
) {
  const { to, colliders, solid } = frameOf(b, o.x, o.z, o.turn);
  const W = o.width,
    D = o.depth,
    front = D / 2;
  const en = o.name.split(" · ")[0];
  const ar = iumArabic(en);
  b.add(groundGeo(W, D, 2), MAT.paving(), 0, 0.035, 0, 0, false);
  const P = 0.6,
    FH = 3.7,
    floors = /Library|Complex/.test(en) ? 3 : 4,
    H = P + floors * FH;
  const BW = W - 2,
    BD = D - 10,
    bz = -front + 1 + BD / 2,
    fz = bz + BD / 2;
  const wall = M.cream(),
    trim = M.trim();
  b.box(BW, H, BD, wall, 0, 0, bz);
  b.box(BW + 0.3, 0.7, BD + 0.3, trim, 0, 0, bz); // plinth
  b.box(BW + 0.4, 0.25, BD + 0.4, trim, 0, H, bz);
  b.box(BW, 0.9, BD, wall, 0, H + 0.25, bz); // parapet
  for (let f = 1; f < floors; f++) b.box(BW + 0.15, 0.15, BD + 0.15, trim, 0, P + f * FH, bz);
  // the entrance block standing forward, a little taller than the roof
  const PW = 9,
    PH = H + 1.8,
    PD = 1.4;
  b.box(PW, PH, PD, wall, 0, 0, fz + PD / 2);
  b.box(PW + 0.4, 0.3, PD + 0.4, trim, 0, PH, fz + PD / 2);
  b.box(PW * 0.55, 0.8, PD, wall, 0, PH + 0.3, fz + PD / 2);
  b.plane(PW - 0.8, PH - 3.2, M.tex("portal", portalTex(), 0.45, 0.5), 0, (PH - 3.2) / 2, fz + PD + 0.02);
  b.plane(PW + 1.4, 2.0, M.sign(`np-${en}`, namePanelTex(ar, en)), 0, PH - 1.75, fz + PD + 0.06);
  // windows: tall lattice arches on the middle floors, plain windows above and below
  const lat = M.tex("latarch", latArchTex(), 0.4, 0.6),
    win = M.tex("win", winTex(), 0.35, 0.4);
  const wingX: number[] = [];
  for (let x = PW / 2 + 1.6; x < BW / 2 - 0.9; x += 2.7) wingX.push(x);
  for (const s of [-1, 1])
    for (const x of wingX) {
      const wx = s * x;
      b.plane(1.6, 2.0, win, wx, P + 1.6, fz + 0.02);
      if (floors >= 4) {
        b.plane(2.0, 5.4, lat, wx, P + FH + 3.4, fz + 0.02);
        b.plane(1.6, 1.8, win, wx, P + 3 * FH + 1.8, fz + 0.02);
      } else b.plane(2.0, 5.4, lat, wx, P + FH + 3.4, fz + 0.02);
      // pilasters between the bays
      b.box(0.35, H - P, 0.25, trim, wx + 1.35, P, fz + 0.12);
    }
  // the sides and back: rows of windows
  for (let f = 0; f < floors; f++) {
    const y = P + f * FH + 1.8;
    for (let z = bz - BD / 2 + 1.8; z < fz - 1; z += 3)
      for (const s of [-1, 1]) b.plane(1.4, 1.8, win, s * (BW / 2 + 0.02), y, z, (s * Math.PI) / 2);
    for (let x = -BW / 2 + 1.8; x < BW / 2 - 1; x += 3)
      b.plane(1.4, 1.8, win, x, y, bz - BD / 2 - 0.02, Math.PI);
  }
  // steps up to the door, palms and lamps in the forecourt
  for (let i = 0; i < 3; i++) b.box(PW + 1 - i * 0.8, 0.2 * (i + 1), 1.0, trim, 0, 0, fz + PD + 2.4 - i);
  for (const s of [-1, 1]) {
    palm(b, s * (W / 2 - 1.6), front - 2.2, 0.9);
    solid(s * (W / 2 - 1.6) - 0.3, s * (W / 2 - 1.6) + 0.3, front - 2.5, front - 1.9);
    const lx = s * (PW / 2 + 2.2);
    b.add(new THREE.CylinderGeometry(0.09, 0.12, 4.2, 8), MAT.plain(0x2e2e2a), lx, 2.1, fz + PD + 2.6);
    b.add(new THREE.SphereGeometry(0.32, 10, 8), M.tex("lamp", winTex(), 1.2), lx, 4.4, fz + PD + 2.6);
    solid(lx - 0.2, lx + 0.2, fz + PD + 2.4, fz + PD + 2.8);
  }
  solid(-BW / 2 - 0.3, BW / 2 + 0.3, bz - BD / 2 - 0.3, fz + 0.3);
  solid(-PW / 2, PW / 2, fz, fz + PD + 0.3);
  const door = to(0, Math.min(front - 0.6, fz + PD + 3.4));
  b.base.identity();
  return {
    colliders,
    spots: [{ key: "door", x: door.x, z: door.z, label: o.name, labelY: H + 4 }],
  };
}

/* ---------------- the student hostels ---------------- */
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
/** A student hostel: a long cream block five storeys high with lattice balconies, an
    arcade along the ground floor and its name over the door. Front faces +z. */
export function iumHostel(
  b: Batch,
  o: { x: number; z: number; w: number; d: number; n: number; sisters: boolean; name: string },
) {
  const { colliders, solid, to } = frameOf(b, o.x, o.z, 0);
  const { w, d } = o;
  const FH = 3.3,
    floors = 5,
    H = 0.4 + floors * FH;
  const wall = M.cream(),
    trim = M.trim();
  b.add(groundGeo(w + 6, d + 8, 2), MAT.paving(), 0, 0.03, 1, 0, false);
  b.box(w, H, d, wall, 0, 0, 0);
  b.box(w + 0.3, 0.5, d + 0.3, trim, 0, 0, 0);
  b.box(w + 0.4, 0.25, d + 0.4, trim, 0, H, 0);
  b.box(w, 1.0, d, wall, 0, H + 0.25, 0);
  // water tanks and a stair head on the roof
  b.box(4, 2.6, 4, wall, w / 4, H + 0.25, -d / 6);
  for (const x of [-w / 4, -w / 4 + 2.6])
    b.add(new THREE.CylinderGeometry(0.9, 0.9, 1.6, 14), MAT.plain(0xd8d8d0), x, H + 1.05, -d / 6);
  const lat = M.tex("latarch", latArchTex(), 0.4, 0.6),
    win = M.tex("win", winTex(), 0.45, 0.4);
  const bays: number[] = [];
  const nb = Math.max(3, Math.floor((w - 2) / 3.2));
  for (let i = 0; i < nb; i++) bays.push(-w / 2 + 1 + (w - 2) * ((i + 0.5) / nb));
  for (const x of bays) {
    if (Math.abs(x) < 2.6) continue;
    // the arcade on the ground floor
    b.plane(2.4, 3.2, lat, x, 1.9, d / 2 + 0.02);
    for (let f = 1; f < floors; f++) {
      b.plane(1.5, 1.9, win, x, 0.4 + f * FH + 1.6, d / 2 + 0.02);
      // a small lattice screen under every other window
      if ((f + Math.round(x)) % 2 === 0)
        b.box(1.9, 0.9, 0.35, M.tex("lat2", latArchTex(), 0.2, 0.6), x, 0.4 + f * FH + 0.2, d / 2 + 0.17);
    }
    b.box(0.3, H - 0.4, 0.2, trim, x + 1.6, 0.4, d / 2 + 0.1);
  }
  for (let f = 0; f < floors; f++) {
    const y = 0.4 + f * FH + 1.6;
    for (let x = -w / 2 + 1.6; x < w / 2 - 1; x += 3.2)
      b.plane(1.4, 1.8, win, x, y, -d / 2 - 0.02, Math.PI);
    for (let z = -d / 2 + 1.6; z < d / 2 - 1; z += 3.2)
      for (const s of [-1, 1]) b.plane(1.4, 1.8, win, s * (w / 2 + 0.02), y, z, (s * Math.PI) / 2);
  }
  // the entrance: a pointed doorway standing forward, with the hostel's name above
  b.box(5.2, 8.2, 1.2, wall, 0, 0, d / 2 + 0.6);
  b.box(5.6, 0.3, 1.6, trim, 0, 8.2, d / 2 + 0.6);
  b.plane(4.0, 6.0, M.tex("portal", portalTex(), 0.45, 0.5), 0, 3.0, d / 2 + 1.22);
  const ar = `${o.sisters ? "سكن الطالبات" : "سكن الطلاب"} ${AR_DIGITS[o.n]}`;
  b.plane(8, 1.7, M.sign(`np-${o.name}`, namePanelTex(ar, o.name)), 0, 7.2, d / 2 + 1.26);
  // a canopy over the door on two slim posts, palms either side
  b.box(4.6, 0.2, 2.6, trim, 0, 3.6, d / 2 + 2.5);
  for (const s of [-1, 1]) {
    b.add(new THREE.CylinderGeometry(0.09, 0.09, 3.6, 8), MAT.plain(0x8a8a82), s * 2.1, 1.8, d / 2 + 3.6);
    solid(s * 2.1 - 0.15, s * 2.1 + 0.15, d / 2 + 3.45, d / 2 + 3.75);
    palm(b, s * (w / 2 - 1.5), d / 2 + 3.5, 0.9);
    solid(s * (w / 2 - 1.5) - 0.3, s * (w / 2 - 1.5) + 0.3, d / 2 + 3.2, d / 2 + 3.8);
  }
  b.add(groundGeo(3, 4, 1), MAT2.lawn(), -6, 0.05, d / 2 + 3.2, 0, false);
  b.add(groundGeo(3, 4, 1), MAT2.lawn(), 6, 0.05, d / 2 + 3.2, 0, false);
  solid(-w / 2 - 0.2, w / 2 + 0.2, -d / 2 - 0.2, d / 2 + 1.3);
  const door = to(0, d / 2 + 2.4);
  b.base.identity();
  return { colliders, door, top: H + 2 };
}

/** A small garden of date palms and benches (where a hostel used to stand outside). */
export function iumGarden(b: Batch, x: number, z: number) {
  b.add(groundGeo(20, 17, 2), MAT2.lawn(), x, 0.04, z, 0, false);
  const pts: [number, number][] = [
    [-7, -5],
    [0, -5.5],
    [7, -5],
    [-7, 4],
    [7, 4],
  ];
  const colliders: Box[] = [];
  for (const [dx, dz] of pts) {
    palm(b, x + dx, z + dz, 1);
    colliders.push({ x0: x + dx - 0.3, x1: x + dx + 0.3, z0: z + dz - 0.3, z1: z + dz + 0.3 });
  }
  for (const dx of [-3, 3]) {
    b.box(2.2, 0.45, 0.6, MAT.plain(0xd8cdb4), x + dx, 0, z + 1.5);
    colliders.push({ x0: x + dx - 1.1, x1: x + dx + 1.1, z0: z + 1.2, z1: z + 1.8 });
  }
  return colliders;
}

/* ---------------- the forecourt and the star plaza ---------------- */
/** Lawns, palms and lamps either side of the road between the gate and the colleges.
    z0 is just behind the gate, z1 by Students' Avenue (z1 < z0). */
export function iumForecourt(b: Batch, z0: number, z1: number, gardens = true) {
  const colliders: Box[] = [];
  if (!gardens) return colliders;
  const lamp = M.tex("lamp", winTex(), 1.2);
  for (const s of [-1, 1]) {
    const xc = s * 19.5;
    b.add(groundGeo(15, z0 - z1, 2), MAT2.lawn(), xc, 0.05, (z0 + z1) / 2, 0, false);
    b.add(groundGeo(15.6, z0 - z1 + 0.6, 2), MAT.plain(0xb4614a), xc, 0.045, (z0 + z1) / 2, 0, false);
    for (let z = z0 - 3; z > z1 + 1.5; z -= 6.5)
      for (const x of [s * 14.5, s * 24.5]) {
        palm(b, x, z, 1);
        colliders.push({ x0: x - 0.3, x1: x + 0.3, z0: z - 0.3, z1: z + 0.3 });
      }
    for (let z = z0 - 6.2; z > z1 + 1.5; z -= 13) {
      const x = s * 19.5;
      b.add(new THREE.CylinderGeometry(0.09, 0.13, 5, 8), MAT.plain(0x2e2e2a), x, 2.5, z);
      b.add(new THREE.SphereGeometry(0.34, 10, 8), lamp, x, 5.2, z);
      colliders.push({ x0: x - 0.2, x1: x + 0.2, z0: z - 0.2, z1: z + 0.2 });
    }
  }
  return colliders;
}
function paverTex() {
  const t = canvasTex(
    "ium-paver",
    128,
    128,
    (c, w, h) => {
      c.fillStyle = "#e8d6b8";
      c.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 16)
        for (let x = 0; x < w; x += 32) {
          const ox = (y / 16) % 2 ? 16 : 0;
          c.fillStyle = (x + y) % 64 ? "#e3cfae" : "#ddc3a4";
          c.fillRect(x + ox + 1, y + 1, 30, 14);
        }
      c.strokeStyle = "rgba(150,110,80,0.25)";
      c.lineWidth = 2;
      c.strokeRect(0, 0, w, h);
    },
    true,
  );
  t.repeat.set(1 / 4, 1 / 4);
  return t;
}
/** A flat shape on the ground (drawn in x and z). */
function flat(shape: THREE.Shape) {
  const g = new THREE.ShapeGeometry(shape, 24);
  g.rotateX(-Math.PI / 2);
  return g;
}
function stadium(hx: number, hz: number, r: number) {
  const s = new THREE.Shape();
  s.moveTo(-hx + r, -hz);
  s.lineTo(hx - r, -hz);
  s.absarc(hx - r, -hz + r, r, -Math.PI / 2, 0, false);
  s.lineTo(hx, hz - r);
  s.absarc(hx - r, hz - r, r, 0, Math.PI / 2, false);
  s.lineTo(-hx + r, hz);
  s.absarc(-hx + r, hz - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(-hx, -hz + r);
  s.absarc(-hx + r, -hz + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}
/** The star plaza (like the one at the university's heart): a long paved oval edged in red
    brick, an eight-pointed star of lawn in a ring of lawn, tall lamps, stone balls, palms
    along its sides and the yellow water tower at one corner. */
export function iumPlaza(b: Batch, cx: number, cz: number) {
  const colliders: Box[] = [];
  const solid = (x: number, z: number, r: number) =>
    colliders.push({ x0: x - r, x1: x + r, z0: z - r, z1: z + r });
  const paver = mat(
    "paver",
    () => new THREE.MeshStandardMaterial({ map: paverTex(), roughness: 0.9 }),
    0.12,
  );
  const lawn = MAT2.lawn();
  const HX = 35,
    HZ = 22;
  b.add(flat(stadium(HX + 1, HZ + 1, 19)), MAT.plain(0xb4614a), cx, 0.045, cz, 0, false);
  b.add(flat(stadium(HX, HZ, 18)), paver, cx, 0.055, cz, 0, false);
  // the round centre: a paved circle, a broken ring of lawn and the star
  const circ = new THREE.Shape();
  circ.absarc(0, 0, 17, 0, Math.PI * 2, false);
  b.add(flat(circ), MAT.plain(0xeadcc2), cx, 0.065, cz, 0, false);
  for (let k = 0; k < 8; k++) {
    const g = new THREE.RingGeometry(12.6, 15.6, 8, 1, (k * Math.PI) / 4 + 0.13, Math.PI / 4 - 0.26);
    g.rotateX(-Math.PI / 2);
    b.add(g, lawn, cx, 0.075, cz, 0, false);
  }
  const star = new THREE.Shape();
  for (let i = 0; i < 16; i++) {
    const r = i % 2 ? 8.3 : 10.8,
      a = (i / 16) * Math.PI * 2 + Math.PI / 8;
    if (i) star.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    else star.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  b.add(flat(star), lawn, cx, 0.08, cz, 0, false);
  const stone = MAT.plain(0xe8dcc6);
  b.add(new THREE.SphereGeometry(0.7, 14, 10), stone, cx, 0.6, cz);
  solid(cx, cz, 0.7);
  // tall lamps in the gaps of the lawn ring, stone balls round the paved circle
  const lamp = M.tex("lamp", winTex(), 1.2);
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4;
    const x = cx + Math.cos(a) * 14.1,
      z = cz + Math.sin(a) * 14.1;
    b.add(new THREE.CylinderGeometry(0.1, 0.16, 7.5, 8), MAT.plain(0x9a9a92), x, 3.75, z);
    b.add(new THREE.CylinderGeometry(0.42, 0.3, 0.7, 10), lamp, x, 7.7, z);
    b.add(new THREE.ConeGeometry(0.5, 0.4, 10), MAT.plain(0x9a9a92), x, 8.25, z);
    solid(x, z, 0.25);
  }
  for (let k = 0; k < 16; k++) {
    const a = (k * Math.PI) / 8 + Math.PI / 16;
    b.add(new THREE.SphereGeometry(0.4, 10, 8), stone, cx + Math.cos(a) * 17.6, 0.4, cz + Math.sin(a) * 17.6);
  }
  // long strips of lawn with young palms along both sides, and lawn at each end
  for (const s of [-1, 1]) {
    b.add(groundGeo(30, 2.6, 1), lawn, cx, 0.075, cz + s * 19.2, 0, false);
    for (let x = -12; x <= 12; x += 6) {
      palm(b, cx + x, cz + s * 19.2, 0.7);
      solid(cx + x, cz + s * 19.2, 0.25);
    }
    const end = new THREE.Shape();
    end.absarc(0, 0, 4.5, 0, Math.PI * 2, false);
    b.add(flat(end), lawn, cx + s * 27, 0.075, cz, 0, false);
    palm(b, cx + s * 27, cz, 1.1);
    solid(cx + s * 27, cz, 0.3);
  }
  // the water tower: a yellow steel frame carrying a round tank
  const tx = cx + 30,
    tz = cz - 18;
  const steel = mat(
    "tower",
    () => new THREE.MeshStandardMaterial({ color: 0xe2b448, roughness: 0.6, metalness: 0.2 }),
    0.2,
  );
  const TH = 24;
  for (const [sx, sz] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ]) {
    const leg = new THREE.CylinderGeometry(0.22, 0.3, TH + 0.6, 8);
    leg.rotateZ(sx * -0.06);
    leg.rotateX(sz * 0.06);
    b.add(leg, steel, tx + sx * 2.2, TH / 2, tz + sz * 2.2);
    colliders.push({
      x0: tx + sx * 2.9 - 0.4,
      x1: tx + sx * 2.9 + 0.4,
      z0: tz + sz * 2.9 - 0.4,
      z1: tz + sz * 2.9 + 0.4,
    });
  }
  for (let y = 4; y < TH; y += 4) {
    const w = 5.8 - (y / TH) * 1.6;
    for (const s of [-1, 1]) {
      b.box(w, 0.22, 0.22, steel, tx, y, tz + (s * w) / 2);
      b.box(0.22, 0.22, w, steel, tx + (s * w) / 2, y, tz);
    }
  }
  b.add(new THREE.CylinderGeometry(3.6, 3.2, 1.2, 24), steel, tx, TH + 0.6, tz);
  b.add(new THREE.CylinderGeometry(3.6, 3.6, 3.4, 24), M.cream(), tx, TH + 2.9, tz);
  b.add(new THREE.CylinderGeometry(3.7, 3.7, 0.5, 24), MAT.plain(0x2a6fb0), tx, TH + 3.6, tz);
  b.add(new THREE.ConeGeometry(3.9, 1.6, 24), steel, tx, TH + 5.4, tz);
  b.add(new THREE.CylinderGeometry(0.6, 0.6, 1.2, 12), M.cream(), tx, TH + 6.6, tz);
  return colliders;
}

/* ================= Taibah University (the female campus) ================= */
const ROSE = "#d2a594";
/** Rose sandstone in square panels, each with a carved lattice: a ring, a star, a grid of
    diamonds or nested squares, as on the faces of Taibah's gate. 3.2 m a panel. */
function roseLatticeTex() {
  const t = canvasTex(
    "taibah-lattice",
    256,
    256,
    (c) => {
      c.fillStyle = ROSE;
      c.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 600; i++) {
        c.fillStyle = `rgba(${120 + Math.random() * 60},70,60,0.07)`;
        c.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
      }
      const panel = (px: number, py: number, kind: number) => {
        const s = 128,
          m = 16;
        c.fillStyle = "rgba(255,240,230,0.18)";
        c.fillRect(px + 4, py + 4, s - 8, s - 8);
        c.fillStyle = "#7a5246";
        c.fillRect(px + m, py + m, s - 2 * m, s - 2 * m);
        c.strokeStyle = ROSE;
        c.lineWidth = 9;
        const cx = px + s / 2,
          cy = py + s / 2,
          r = s / 2 - m - 6;
        c.save();
        c.beginPath();
        c.rect(px + m, py + m, s - 2 * m, s - 2 * m);
        c.clip();
        if (kind === 0) {
          c.beginPath();
          c.arc(cx, cy, r, 0, Math.PI * 2);
          c.stroke();
          c.beginPath();
          c.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
          c.stroke();
          for (let k = 0; k < 4; k++) {
            c.beginPath();
            c.moveTo(cx, cy);
            c.lineTo(cx + Math.cos((k * Math.PI) / 2) * r * 1.4, cy + Math.sin((k * Math.PI) / 2) * r * 1.4);
            c.stroke();
          }
        } else if (kind === 1) {
          for (const rot of [0, Math.PI / 4]) {
            c.save();
            c.translate(cx, cy);
            c.rotate(rot);
            c.strokeRect(-r * 0.72, -r * 0.72, r * 1.44, r * 1.44);
            c.restore();
          }
          c.strokeRect(cx - r * 0.25, cy - r * 0.25, r * 0.5, r * 0.5);
        } else if (kind === 2) {
          for (let k = -3; k <= 3; k++) {
            c.beginPath();
            c.moveTo(px + m + k * 28, py + m);
            c.lineTo(px + m + k * 28 + 96, py + m + 96);
            c.moveTo(px + s - m - k * 28, py + m);
            c.lineTo(px + s - m - k * 28 - 96, py + m + 96);
            c.stroke();
          }
        } else {
          for (const f of [0.95, 0.62, 0.3]) c.strokeRect(cx - r * f, cy - r * f, r * 2 * f, r * 2 * f);
          c.beginPath();
          c.moveTo(cx - r, cy);
          c.lineTo(cx + r, cy);
          c.moveTo(cx, cy - r);
          c.lineTo(cx, cy + r);
          c.stroke();
        }
        c.restore();
      };
      panel(0, 0, 0);
      panel(128, 0, 1);
      panel(0, 128, 2);
      panel(128, 128, 3);
    },
    true,
  );
  t.repeat.set(1 / 6.4, 1 / 6.4);
  return t;
}
const TM = {
  lattice: () =>
    mat(
      "tb-lat",
      () => new THREE.MeshStandardMaterial({ map: roseLatticeTex(), roughness: 0.85 }),
      0.22,
      0xffe0d0,
    ),
  rose: () =>
    mat("tb-rose", () => new THREE.MeshStandardMaterial({ color: 0xd4a999, roughness: 0.85 }), 0.2, 0xffe0d0),
  roseDark: () =>
    mat("tb-rose2", () => new THREE.MeshStandardMaterial({ color: 0xb9887a, roughness: 0.85 }), 0.15, 0xffe0d0),
  glass: () =>
    mat(
      "tb-glass",
      () =>
        new THREE.MeshStandardMaterial({ color: 0x3f7f8a, roughness: 0.2, metalness: 0.5 }),
      0.25,
      0xbfe8f0,
    ),
  housing: () =>
    mat("tb-house", () => new THREE.MeshStandardMaterial({ color: 0xece0c8, roughness: 0.85 }), 0.18),
  base: () =>
    mat("tb-base", () => new THREE.MeshStandardMaterial({ color: 0xa88a72, roughness: 0.85 }), 0.12),
};
/** The name in blue letters, English on the left of the beam and Arabic on the right. */
function letterTex(text: string, rtl: boolean) {
  return canvasTex(`tb-letters-${text}`, 1024, 128, (c, w, h) => {
    c.fillStyle = "#2a55a8";
    c.strokeStyle = "#ffffff";
    c.lineWidth = 3;
    c.save();
    c.direction = rtl ? "rtl" : "ltr";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.font = rtl ? `700 96px ${AR}` : `800 84px ${EN}`;
    c.strokeText(text, w / 2, h / 2 + (rtl ? 8 : 4), w - 20);
    c.fillText(text, w / 2, h / 2 + (rtl ? 8 : 4), w - 20);
    c.restore();
  });
}
/** A plain emblem for the middle of the beam: a white teardrop in a sea-green oval. */
function emblemTex() {
  return canvasTex("tb-emblem", 256, 256, (c) => {
    const g = c.createRadialGradient(128, 110, 10, 128, 128, 120);
    g.addColorStop(0, "#bfe8e4");
    g.addColorStop(1, "#3c9a9a");
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(128, 128, 118, 96, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#ffffff";
    c.lineWidth = 8;
    c.stroke();
    c.fillStyle = "#ffffff";
    c.beginPath();
    c.moveTo(128, 56);
    c.bezierCurveTo(176, 120, 172, 176, 128, 184);
    c.bezierCurveTo(84, 176, 80, 120, 128, 56);
    c.fill();
  });
}
/** Taibah University's gate: a tall frame of rose sandstone carved in lattice panels, two
    round arches over the road, the name in blue letters along the top beam, and an open
    lattice crown above. Same frame as iumGate (centred, road side +z). */
export function taibahGate(arName: string, enName: string) {
  const g = new THREE.Group();
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, shadow = true) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.castShadow = shadow;
    mesh.receiveShadow = true;
    g.add(mesh);
    return mesh;
  };
  const W2 = 19.5, // half the width
    H = 20.5, // to the top of the beam
    DP = 4.8,
    pier = 1.4, // half the middle pier
    inner = 12.8, // where the side pylons begin
    spring = 8.6;
  const r = (inner - pier) / 2,
    cxs = [-(pier + r), pier + r];
  // the frame, with two round arches cut through it
  const s = new THREE.Shape();
  s.moveTo(-W2, 0);
  for (const cx of cxs) {
    s.lineTo(cx - r, 0);
    s.lineTo(cx - r, spring);
    s.absarc(cx, spring, r, Math.PI, 0, true);
    s.lineTo(cx + r, 0);
  }
  s.lineTo(W2, 0);
  s.lineTo(W2, H);
  s.lineTo(-W2, H);
  s.closePath();
  const body = new THREE.ExtrudeGeometry(s, { depth: DP, bevelEnabled: false, curveSegments: 20 });
  body.translate(0, 0, -DP / 2);
  add(worldUV(body), TM.lattice());
  // the darker arch rings, front and back
  for (const cx of cxs)
    for (const fz of [1, -1]) {
      const ring = new THREE.Shape();
      ring.absarc(cx, spring, r + 0.9, 0, Math.PI, false);
      ring.lineTo(cx - r, spring);
      ring.absarc(cx, spring, r, Math.PI, 0, true);
      ring.lineTo(cx + r + 0.9, spring);
      const geo = new THREE.ExtrudeGeometry(ring, { depth: 0.25, bevelEnabled: false, curveSegments: 20 });
      geo.translate(0, 0, fz > 0 ? DP / 2 : -DP / 2 - 0.25);
      add(geo, TM.roseDark());
    }
  // the top beam stands a little proud, with a ledge under it
  add(boxAt(W2 * 2 + 0.4, 0.35, DP + 0.6, 0, H - 4.6, 0), TM.roseDark());
  add(boxAt(W2 * 2 + 0.3, 0.3, DP + 0.4, 0, H, 0), TM.roseDark());
  // the open lattice crown on top
  const CW = 6.5,
    CH = 4.2;
  for (const sx of [-1, 1]) {
    add(boxAt(0.9, CH, DP * 0.7, sx * (CW - 0.45), H + 0.3, 0), TM.rose());
    add(boxAt(0.9, CH, DP * 0.7, sx * (CW / 3), H + 0.3, 0), TM.rose());
  }
  add(boxAt(CW * 2, 0.9, DP * 0.7, 0, H + 0.3 + CH - 0.9, 0), TM.rose());
  add(boxAt(CW * 2, 0.6, DP * 0.7, 0, H + 0.3 + CH * 0.45, 0), TM.rose());
  // the name in blue letters and the emblem, front and back
  const enM = new THREE.MeshStandardMaterial({
    map: letterTex(enName.toUpperCase(), false),
    transparent: true,
    alphaTest: 0.2,
    roughness: 0.5,
  });
  const arM = new THREE.MeshStandardMaterial({
    map: letterTex(arName, true),
    transparent: true,
    alphaTest: 0.2,
    roughness: 0.5,
  });
  const emM = new THREE.MeshStandardMaterial({ map: emblemTex(), transparent: true, alphaTest: 0.3 });
  for (const m of [enM, arM, emM]) glowing.push({ m, k: 0.8, c: 0xffffff });
  for (const side of [1, -1]) {
    const z = side * (DP / 2 + 0.06),
      ry = side < 0 ? Math.PI : 0;
    const en = add(new THREE.PlaneGeometry(13, 1.6), enM, false);
    en.position.set(-side * 10.5, H - 0.85, z);
    en.rotation.y = ry;
    const arp = add(new THREE.PlaneGeometry(9, 1.6), arM, false);
    arp.position.set(side * 10.5, H - 0.85, z);
    arp.rotation.y = ry;
    const em = add(new THREE.PlaneGeometry(2.6, 2.1), emM, false);
    em.position.set(0, H - 1.4, z + side * 0.02);
    em.rotation.y = ry;
  }
  const colliders: Box[] = [
    { x0: -pier - 0.2, x1: pier + 0.2, z0: -DP / 2, z1: DP / 2 },
    { x0: inner, x1: W2, z0: -DP / 2, z1: DP / 2 },
    { x0: -W2, x1: -inner, z0: -DP / 2, z1: DP / 2 },
  ];
  return { group: g, colliders, halfWidth: W2, height: H + CH + 0.3, front: DP / 2 };
}

const TAIBAH_AR: [RegExp, string][] = [
  [/Medicine/, "كلية الطب"],
  [/Pharmacy/, "كلية الصيدلة"],
  [/Computer/, "كلية علوم وهندسة الحاسب الآلي"],
  [/Engineering/, "كلية الهندسة"],
  [/Science/, "كلية العلوم"],
  [/Education/, "كلية التربية"],
  [/Arts/, "كلية الآداب والعلوم الإنسانية"],
  [/Business/, "كلية إدارة الأعمال"],
  [/Library/, "المكتبة المركزية"],
  [/Complex/, "مجمع الكليات"],
];
/** A college of Taibah University: rose sandstone four storeys high, a tall arched front of
    blue-green glass in a stone frame, glass strips down the wings, and the name over the
    door in Arabic and English. */
export function taibahCollege(
  b: Batch,
  o: { x: number; z: number; turn: number; width: number; depth: number; name: string },
) {
  const { to, colliders, solid } = frameOf(b, o.x, o.z, o.turn);
  const W = o.width,
    D = o.depth,
    front = D / 2;
  const en = o.name.split(" · ")[0];
  const ar = TAIBAH_AR.find(([re]) => re.test(en))?.[1] ?? "جامعة طيبة";
  b.add(groundGeo(W, D, 2), MAT.paving(), 0, 0.035, 0, 0, false);
  const P = 0.6,
    FH = 3.7,
    floors = /Library|Complex/.test(en) ? 3 : 4,
    H = P + floors * FH;
  const BW = W - 2,
    BD = D - 10,
    bz = -front + 1 + BD / 2,
    fz = bz + BD / 2;
  const wall = TM.rose(),
    dark = TM.roseDark(),
    glass = TM.glass();
  b.box(BW, H, BD, wall, 0, 0, bz);
  b.box(BW + 0.3, 0.8, BD + 0.3, dark, 0, 0, bz);
  b.box(BW + 0.4, 0.3, BD + 0.4, dark, 0, H, bz);
  b.box(BW, 0.8, BD, wall, 0, H + 0.3, bz);
  for (let f = 1; f < floors; f++) b.box(BW + 0.12, 0.18, BD + 0.12, dark, 0, P + f * FH, bz);
  // the tall glass front in a stone frame with a round arch over the door
  const PW = 8.4,
    PH = H + 2,
    PD = 1.2;
  b.box(PW, PH, PD, wall, 0, 0, fz + PD / 2);
  b.box(PW + 0.4, 0.3, PD + 0.4, dark, 0, PH, fz + PD / 2);
  b.box(PW - 2, PH - 3.6, 0.2, glass, 0, 0.6, fz + PD + 0.02);
  for (let y = 0.6 + 3.7; y < PH - 3; y += 3.7) b.box(PW - 2, 0.12, 0.3, dark, 0, y, fz + PD + 0.06);
  for (const x of [-1.6, 0, 1.6]) b.box(0.1, PH - 3.6, 0.3, dark, x, 0.6, fz + PD + 0.06);
  const arch = new THREE.TorusGeometry(2.1, 0.22, 6, 18, Math.PI);
  b.add(arch, dark, 0, 4.2, fz + PD + 0.18);
  b.plane(PW + 1.4, 2.0, M.sign(`np-${en}`, namePanelTex(ar, en)), 0, PH - 1.75, fz + PD + 0.06);
  // glass strips down the wings, between stone piers
  const wingX: number[] = [];
  for (let x = PW / 2 + 1.5; x < BW / 2 - 0.8; x += 2.6) wingX.push(x);
  for (const s of [-1, 1])
    for (const x of wingX) {
      b.box(1.5, H - P - 1.2, 0.12, glass, s * x, P + 0.6, fz + 0.04);
      b.box(0.5, H - P, 0.3, dark, s * (x + 1.3), P, fz + 0.15);
    }
  // the sides and back: windows in rows
  const win = M.tex("win", winTex(), 0.35, 0.4);
  for (let f = 0; f < floors; f++) {
    const y = P + f * FH + 1.8;
    for (let z = bz - BD / 2 + 1.8; z < fz - 1; z += 3)
      for (const s of [-1, 1]) b.plane(1.4, 1.8, win, s * (BW / 2 + 0.02), y, z, (s * Math.PI) / 2);
    for (let x = -BW / 2 + 1.8; x < BW / 2 - 1; x += 3)
      b.plane(1.4, 1.8, win, x, y, bz - BD / 2 - 0.02, Math.PI);
  }
  for (let i = 0; i < 3; i++) b.box(PW + 1 - i * 0.8, 0.2 * (i + 1), 1.0, dark, 0, 0, fz + PD + 2.4 - i);
  for (const s of [-1, 1]) {
    palm(b, s * (W / 2 - 1.6), front - 2.2, 0.9);
    solid(s * (W / 2 - 1.6) - 0.3, s * (W / 2 - 1.6) + 0.3, front - 2.5, front - 1.9);
  }
  solid(-BW / 2 - 0.3, BW / 2 + 0.3, bz - BD / 2 - 0.3, fz + 0.3);
  solid(-PW / 2, PW / 2, fz, fz + PD + 0.3);
  const door = to(0, Math.min(front - 0.6, fz + PD + 3.4));
  b.base.identity();
  return {
    colliders,
    spots: [{ key: "door", x: door.x, z: door.z, label: o.name, labelY: H + 4 }],
  };
}

/** An air-conditioning box under a window. */
function acTex() {
  return canvasTex("tb-ac", 64, 48, (c, w, h) => {
    c.fillStyle = "#e8e8e2";
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#9a9a94";
    for (let y = 8; y < h - 6; y += 6) c.fillRect(6, y, w - 12, 2);
  });
}
/** Taibah's student housing: a tall cream block five storeys high, windows in pairs with
    air-conditioning boxes, piers standing out between the bays, a brown base and its name
    over the door. Front faces +z. */
export function taibahHousing(
  b: Batch,
  o: { x: number; z: number; w: number; d: number; n: number; name: string },
) {
  const { colliders, solid, to } = frameOf(b, o.x, o.z, 0);
  const { w, d } = o;
  const FH = 3.2,
    floors = 5,
    H = 0.8 + floors * FH;
  const wall = TM.housing(),
    base = TM.base(),
    trim = M.trim();
  b.add(groundGeo(w + 6, d + 8, 2), MAT.paving(), 0, 0.03, 1, 0, false);
  b.box(w, H, d, wall, 0, 0, 0);
  b.box(w + 0.2, 1.2, d + 0.2, base, 0, 0, 0);
  b.box(w + 0.4, 0.3, d + 0.4, trim, 0, H, 0);
  b.box(w, 0.8, d, wall, 0, H + 0.3, 0);
  const win = M.tex("win", winTex(), 0.45, 0.4),
    ac = M.tex("ac", acTex(), 0.1, 0.6);
  const bay = 4.2;
  const nb = Math.max(2, Math.floor((w - 1) / bay));
  for (let i = 0; i < nb; i++) {
    const x = -w / 2 + 0.5 + (w - 1) * ((i + 0.5) / nb);
    if (Math.abs(x) < 2.8) continue;
    for (let f = 0; f < floors; f++) {
      const y = 0.8 + f * FH + 1.7;
      for (const dx of [-0.8, 0.8]) b.plane(1.2, 1.4, win, x + dx, y, d / 2 + 0.02);
      b.box(2.9, 0.12, 0.3, trim, x, y - 0.85, d / 2 + 0.1);
      b.box(0.7, 0.5, 0.45, ac, x + (f % 2 ? 0.8 : -0.8), y + 0.95, d / 2 + 0.22);
    }
    // a pier standing out between bays
    if (i < nb - 1) b.box(0.8, H - 1.2, 0.6, wall, x + (w - 1) / nb / 2, 1.2, d / 2 + 0.3);
  }
  for (let f = 0; f < floors; f++) {
    const y = 0.8 + f * FH + 1.7;
    for (let x = -w / 2 + 1.6; x < w / 2 - 1; x += 2.8)
      b.plane(1.2, 1.4, win, x, y, -d / 2 - 0.02, Math.PI);
    for (let z = -d / 2 + 1.6; z < d / 2 - 1; z += 2.8)
      for (const s of [-1, 1]) b.plane(1.2, 1.4, win, s * (w / 2 + 0.02), y, z, (s * Math.PI) / 2);
  }
  // the entrance: steps, a flat canopy on two columns, glass doors and the name
  b.box(4.6, H, 1.0, wall, 0, 0, d / 2 + 0.5);
  b.box(2.6, 2.6, 0.12, TM.glass(), 0, 0.6, d / 2 + 1.04);
  for (let i = 0; i < 3; i++) b.box(4.4 - i * 0.6, 0.2 * (i + 1), 0.8, trim, 0, 0, d / 2 + 3 - i * 0.7);
  b.box(4.4, 0.25, 2.4, trim, 0, 3.4, d / 2 + 2.1);
  for (const s of [-1, 1]) {
    b.add(new THREE.CylinderGeometry(0.18, 0.18, 3.4, 10), MAT.plain(0xf2efe6), s * 1.9, 1.7, d / 2 + 3.1);
    solid(s * 1.9 - 0.2, s * 1.9 + 0.2, d / 2 + 2.9, d / 2 + 3.3);
  }
  const ar = `سكن الطالبات ${AR_DIGITS[o.n]}`;
  b.plane(7, 1.5, M.sign(`np-${o.name}`, namePanelTex(ar, o.name)), 0, 4.8, d / 2 + 1.04);
  solid(-w / 2 - 0.2, w / 2 + 0.2, -d / 2 - 0.2, d / 2 + 1.1);
  const door = to(0, d / 2 + 2.6);
  b.base.identity();
  return { colliders, door, top: H + 2 };
}

function flagTex() {
  return canvasTex("tb-flag", 192, 128, (c, w, h) => {
    c.fillStyle = "#1f7a3c";
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#ffffff";
    c.fillRect(40, 84, 110, 6);
    c.beginPath();
    c.moveTo(150, 80);
    c.lineTo(162, 87);
    c.lineTo(150, 94);
    c.fill();
  });
}
/** Taibah's star roundabout: a white-edged circle with an eight-pointed star of lawn, a
    golden flower in the middle and a tall flagpole flying the green flag, with palms. */
export function taibahPlaza(b: Batch, cx: number, cz: number) {
  const colliders: Box[] = [];
  const solid = (x: number, z: number, r: number) =>
    colliders.push({ x0: x - r, x1: x + r, z0: z - r, z1: z + r });
  const lawn = MAT2.lawn();
  const disc = (r: number) => {
    const s = new THREE.Shape();
    s.absarc(0, 0, r, 0, Math.PI * 2, false);
    return flat(s);
  };
  // the paved square it sits in, with palms round it
  b.add(groundGeo(70, 44, 3), MAT.paving(), cx, 0.045, cz, 0, false);
  b.add(disc(18), MAT.plain(0xb4614a), cx, 0.05, cz, 0, false);
  b.add(disc(17.2), MAT.plain(0xf3efe6), cx, 0.06, cz, 0, false);
  b.add(disc(15.4), lawn, cx, 0.07, cz, 0, false);
  // white star points over the lawn, then the green star, then the gold flower
  const star = (ro: number, ri: number, rot: number) => {
    const s = new THREE.Shape();
    for (let i = 0; i < 16; i++) {
      const r = i % 2 ? ri : ro,
        a = (i / 16) * Math.PI * 2 + rot;
      if (i) s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      else s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    return flat(s);
  };
  b.add(star(15.2, 11.6, Math.PI / 8), MAT.plain(0xf3efe6), cx, 0.08, cz, 0, false);
  b.add(star(13.4, 9.8, Math.PI / 8), lawn, cx, 0.09, cz, 0, false);
  b.add(star(7, 3.4, 0), MAT.plain(0xd4a63a), cx, 0.1, cz, 0, false);
  b.add(disc(2.4), MAT.plain(0x5a4a30), cx, 0.11, cz, 0, false);
  // the flagpole and the green flag
  const FH = 34;
  b.add(new THREE.CylinderGeometry(1.1, 1.4, 1.2, 16), MAT.plain(0x6a6a64), cx, 0.6, cz);
  b.add(new THREE.CylinderGeometry(0.18, 0.32, FH, 10), MAT.plain(0xe8e8e4), cx, FH / 2, cz);
  const flag = new THREE.PlaneGeometry(9, 6, 8, 1);
  const p = flag.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin((p.getX(i) + 4.5) * 0.7) * 0.5 * ((p.getX(i) + 4.5) / 9));
  flag.computeVertexNormals();
  const flagM = mat(
    "tb-flagm",
    () =>
      new THREE.MeshStandardMaterial({ map: flagTex(), side: THREE.DoubleSide, roughness: 0.8 }),
    0.3,
  );
  b.add(flag, flagM, cx + 4.7, FH - 3.4, cz, 0, false);
  solid(cx, cz, 1.4);
  // low lamps round the circle and palms round the square
  const lamp = M.tex("lamp", winTex(), 1.2);
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4 + Math.PI / 8;
    const x = cx + Math.cos(a) * 19.6,
      z = cz + Math.sin(a) * 19.6;
    b.add(new THREE.CylinderGeometry(0.08, 0.12, 4.5, 8), MAT.plain(0x2e2e2a), x, 2.25, z);
    b.add(new THREE.SphereGeometry(0.32, 10, 8), lamp, x, 4.7, z);
    solid(x, z, 0.2);
  }
  for (const s of [-1, 1])
    for (let k = -2; k <= 2; k++) {
      const x = cx + s * 30,
        z = cz + k * 8;
      palm(b, x, z, 1);
      solid(x, z, 0.3);
      const x2 = cx + k * 10,
        z2 = cz + s * 20.5;
      if (Math.abs(k) === 2) {
        palm(b, x2, z2, 1);
        solid(x2, z2, 0.3);
      }
    }
  return colliders;
}

/* ================= Masjid Quba ================= */
function basaltTex() {
  const t = canvasTex(
    "quba-basalt",
    128,
    64,
    (c, w, h) => {
      c.fillStyle = "#5e605c";
      c.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 16)
        for (let x = (y / 16) % 2 ? -16 : 0; x < w; x += 32) {
          c.fillStyle = ["#666864", "#5a5c58", "#626460", "#6c6e69"][(x + y) & 3];
          c.fillRect(x + 1, y + 1, 30, 14);
        }
    },
    true,
  );
  t.repeat.set(1 / 4, 1 / 2);
  return t;
}
/** White marble paving with grey bands in a large diamond pattern, as round Quba. */
function qubaPaveTex() {
  const t = canvasTex(
    "quba-pave",
    256,
    256,
    (c, w, h) => {
      c.fillStyle = "#eef0f0";
      c.fillRect(0, 0, w, h);
      c.strokeStyle = "rgba(160,168,172,0.5)";
      c.lineWidth = 1;
      for (let x = 0; x <= w; x += 32) {
        c.beginPath();
        c.moveTo(x, 0);
        c.lineTo(x, h);
        c.moveTo(0, x);
        c.lineTo(w, x);
        c.stroke();
      }
      c.strokeStyle = "#7d868c";
      c.lineWidth = 10;
      c.beginPath();
      c.moveTo(w / 2, 0);
      c.lineTo(w, h / 2);
      c.lineTo(w / 2, h);
      c.lineTo(0, h / 2);
      c.closePath();
      c.stroke();
    },
    true,
  );
  t.repeat.set(1 / 16, 1 / 16);
  return t;
}
const QM = {
  white: () =>
    mat("q-white", () => new THREE.MeshStandardMaterial({ color: 0xf6f5f1, roughness: 0.7 }), 0.4, 0xfff6e8),
  basalt: () =>
    mat("q-basalt", () => new THREE.MeshStandardMaterial({ map: basaltTex(), roughness: 0.9 }), 0.12, 0xfff0d8),
  cone: () =>
    mat(
      "q-cone",
      () => new THREE.MeshStandardMaterial({ color: 0x5d6266, roughness: 0.45, metalness: 0.3 }),
      0.1,
    ),
  dark: () => mat("q-dark", () => new THREE.MeshStandardMaterial({ color: 0x3a3f44, roughness: 0.6 }), 0),
  wood: () =>
    mat("q-wood", () => new THREE.MeshStandardMaterial({ color: 0x6b4a2e, roughness: 0.7 }), 0.15),
  canopy: () =>
    mat(
      "q-canopy",
      () =>
        new THREE.MeshStandardMaterial({ color: 0x8e9499, roughness: 0.5, metalness: 0.4, side: THREE.DoubleSide }),
      0.1,
    ),
  pave: () =>
    mat("q-pave", () => new THREE.MeshStandardMaterial({ map: qubaPaveTex(), roughness: 0.6 }), 0.12),
};
/** A white dome with soft ribs, on a short drum, with a small finial. */
function ribbedDome(b: Batch, x: number, y: number, z: number, r: number, ribs = 16) {
  const g = new THREE.SphereGeometry(r, 32, 14, 0, Math.PI * 2, 0, Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const px = p.getX(i),
      pz = p.getZ(i);
    const k = 1 + 0.035 * Math.cos(ribs * Math.atan2(pz, px));
    p.setX(i, px * k);
    p.setZ(i, pz * k);
  }
  g.computeVertexNormals();
  b.add(new THREE.CylinderGeometry(r * 1.02, r * 1.04, r * 0.32, 32), QM.white(), x, y + r * 0.16, z);
  b.add(g, QM.white(), x, y + r * 0.32, z);
  b.add(new THREE.CylinderGeometry(0.06 * r, 0.1 * r, 0.35 * r, 8), QM.cone(), x, y + r * 1.48, z);
}
/** A tall white minaret: a square foot, an eight-sided shaft with two carved balconies,
    a slender lantern and a dark pointed cap with the crescent. */
function qubaMinaret(b: Batch, x: number, z: number, H: number) {
  const w = QM.white();
  b.box(4.6, H + 4, 4.6, w, x, 0, z);
  b.box(4.8, 4.6, 4.8, QM.basalt(), x, 0, z);
  for (let k = 0; k < 6; k++) b.box(0.6, 0.9, 0.6, w, x - 2 + k * 0.8, H + 4, z + 2.1);
  const oct = (r0: number, r1: number, h: number, y: number) =>
    b.add(new THREE.CylinderGeometry(r1, r0, h, 8), w, x, y + h / 2, z, Math.PI / 8);
  const balcony = (r: number, y: number) => {
    b.add(new THREE.CylinderGeometry(r, r * 0.72, 1.2, 16), w, x, y - 0.6, z); // corbel
    b.add(new THREE.CylinderGeometry(r, r, 0.25, 16), w, x, y + 0.12, z);
    // the carved railing: a ring of little posts under a rail
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      b.box(0.22, 0.9, 0.22, w, x + Math.cos(a) * (r - 0.15), y + 0.25, z + Math.sin(a) * (r - 0.15));
    }
    b.add(new THREE.TorusGeometry(r - 0.15, 0.1, 4, 20).rotateX(Math.PI / 2), w, x, y + 1.2, z, 0);
  };
  let y = H + 4;
  oct(2.0, 1.9, 9, y);
  y += 9;
  balcony(2.7, y);
  oct(1.7, 1.6, 6.5, y + 1.3);
  y += 7.8;
  balcony(2.3, y);
  oct(1.3, 1.25, 3.4, y + 1.3);
  y += 4.7;
  // the dark cap and the crescent
  b.add(new THREE.CylinderGeometry(1.45, 1.45, 0.4, 16), w, x, y + 0.2, z);
  const cone = new THREE.LatheGeometry(
    [
      new THREE.Vector2(1.45, 0),
      new THREE.Vector2(1.5, 1.2),
      new THREE.Vector2(1.2, 3),
      new THREE.Vector2(0.55, 4.6),
      new THREE.Vector2(0.05, 5.6),
    ],
    16,
  );
  b.add(cone, QM.cone(), x, y + 0.4, z);
  b.add(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 6), QM.cone(), x, y + 6.4, z);
  const cr = new THREE.TorusGeometry(0.35, 0.07, 6, 16, Math.PI * 1.4);
  b.add(cr, QM.cone(), x, y + 7.3, z, Math.PI / 2);
  return y + 7.6;
}
/** Masjid Quba: a long white mosque on a dark basalt base with small crenellations along
    its top, four tall white minarets with dark caps, a cluster of big ribbed domes over the
    prayer hall, rows of little domes over the rest, a shaded court in the middle, and a
    wide white plaza round it with palms, lamps and folded umbrellas.
    Local frame: centred on the mosque, the front (the road) towards +z. */
export function qubaMosque(
  b: Batch,
  cx: number,
  cz: number,
  plaza: { x0: number; x1: number; z1: number; gardens?: boolean },
) {
  b.base.makeTranslation(cx, 0, cz);
  const colliders: Box[] = [];
  const solid = (x0: number, x1: number, z0: number, z1: number) =>
    colliders.push({ x0: cx + x0, x1: cx + x1, z0: cz + z0, z1: cz + z1 });
  // posts on the open plaza: solid to walk into, but added after the area is laid out
  const late: Box[] = [];
  const decor = (x0: number, x1: number, z0: number, z1: number) =>
    late.push({ x0: cx + x0, x1: cx + x1, z0: cz + z0, z1: cz + z1 });
  // 58 m long: the back corner minarets stop just short of the local market's ground
  const W = 52,
    D = 20,
    H = 13,
    BH = 4.6;
  const w = QM.white();
  // the plaza
  const px0 = plaza.x0 - cx,
    px1 = plaza.x1 - cx,
    pz1 = plaza.z1 - cz,
    pz0 = -D / 2 - 6;
  b.add(groundGeo(px1 - px0, pz1 - pz0, 1), QM.pave(), (px0 + px1) / 2, 0.05, (pz0 + pz1) / 2, 0, false);
  // the body: basalt below, white above, a cornice and small crenellations all round
  b.box(W, H, D, w, 0, 0, 0);
  b.box(W + 0.2, BH, D + 0.2, QM.basalt(), 0, 0, 0);
  b.box(W + 0.5, 0.3, D + 0.5, w, 0, H - 1.2, 0);
  for (const [len, fixed, alongX] of [
    [W, D / 2, true],
    [W, -D / 2, true],
    [D, W / 2, false],
    [D, -W / 2, false],
  ] as [number, number, boolean][])
    for (let t = -len / 2 + 0.5; t < len / 2 - 0.3; t += 1.1) {
      const x = alongX ? t : fixed,
        z = alongX ? fixed : t;
      b.box(0.6, 0.8, 0.6, w, x, H, z);
      b.box(0.3, 0.35, 0.3, w, x, H + 0.8, z);
    }
  // windows high in the white wall, doors in the basalt base, and the tall front portal
  for (let x = -W / 2 + 3; x < W / 2 - 2; x += 4) {
    if (Math.abs(x) < 5) continue;
    for (const s of [1, -1]) {
      b.box(1.0, 1.8, 0.1, QM.dark(), x, 7.6, s * (D / 2 + 0.05));
      b.add(new THREE.CircleGeometry(0.5, 10, 0, Math.PI), QM.dark(), x, 9.4, s * (D / 2 + 0.11), s < 0 ? Math.PI : 0, false);
    }
    if (Math.round(x) % 8 === 1) {
      b.box(1.8, 2.8, 0.14, QM.wood(), x, 0, D / 2 + 0.12);
      b.box(1.8, 2.8, 0.14, QM.wood(), x, 0, -D / 2 - 0.12);
    }
  }
  for (let z = -D / 2 + 4; z < D / 2 - 2; z += 4)
    for (const s of [1, -1]) {
      b.box(0.1, 1.8, 1.0, QM.dark(), s * (W / 2 + 0.05), 7.6, z);
      if (Math.round(z) % 8 === 0) b.box(0.14, 2.8, 1.8, QM.wood(), s * (W / 2 + 0.12), 0, z);
    }
  b.box(9, H + 2.4, 1.6, w, 0, 0, D / 2 + 0.8);
  b.box(9.2, BH, 1.8, QM.basalt(), 0, 0, D / 2 + 0.8);
  b.box(4.2, 7.5, 0.1, QM.dark(), 0, 0, D / 2 + 1.65);
  b.add(new THREE.CircleGeometry(2.1, 16, 0, Math.PI), QM.dark(), 0, 7.5, D / 2 + 1.66, 0, false);
  b.box(3, 3.4, 0.12, QM.wood(), 0, 0, D / 2 + 1.72);
  for (let k = -4; k <= 4; k++) b.box(0.6, 0.8, 0.6, w, k * 1.0, H + 2.4, D / 2 + 1.4);
  // the domes: the great dome and three more over the prayer hall, at the east end
  ribbedDome(b, 13.5, H, 2, 6.0, 20);
  ribbedDome(b, 4, H, 2.5, 3.7);
  ribbedDome(b, 23, H, 2.5, 3.7);
  ribbedDome(b, 13.5, H, -5.6, 3.3);
  b.box(26, 1.2, 16, w, 13.5, H, 0); // the raised roof they stand on
  // little domes in rows over the west end, round the shaded court
  for (let x = -24; x <= -1; x += 3.3)
    for (let z = -6.6; z <= 6.6; z += 3.3) {
      if (x > -18 && x < -6 && z > -4.5 && z < 4.5) continue;
      b.add(new THREE.CylinderGeometry(1.2, 1.25, 0.5, 10), w, x, H + 0.25, z);
      b.add(new THREE.SphereGeometry(1.2, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), w, x, H + 0.5, z);
    }
  // the shaded court: a grey sliding canopy in peaks over its middle
  for (let i = 0; i < 4; i++) {
    const g = new THREE.ConeGeometry(2.2, 1.4, 4, 1, true);
    g.rotateY(Math.PI / 4);
    b.add(g, QM.canopy(), -16 + i * 3.1, H + 1.5, -2.2, 0, false);
    b.add(g.clone(), QM.canopy(), -16 + i * 3.1, H + 1.5, 2.2, 0, false);
  }
  b.box(13, 0.3, 9, QM.dark(), -11.35, H + 0.6, 0);
  // the four minarets at the corners
  for (const [mx, mz] of [
    [-W / 2 - 1.5, D / 2 + 1.5],
    [W / 2 + 1.5, D / 2 + 1.5],
    [-W / 2 - 1.5, -D / 2 - 1.5],
    [W / 2 + 1.5, -D / 2 - 1.5],
  ]) {
    qubaMinaret(b, mx, mz, H);
    solid(mx - 2.4, mx + 2.4, mz - 2.4, mz + 2.4);
  }
  // palms in round lawns, lamps and folded umbrellas on the plaza
  const lamp = M.tex("lamp", winTex(), 1.2);
  if (plaza.gardens !== false) {
  // the gardens in front: four big round lawns with palms, and long beds along the road
  for (const [lx, r] of [
    [-W / 2 + 2, 4.2],
    [-W / 2 + 15, 3.4],
    [W / 2 - 15, 3.4],
    [W / 2 - 2, 4.2],
  ] as [number, number][]) {
    const lz = D / 2 + (pz1 - D / 2) * 0.5;
    const ring = new THREE.Shape();
    ring.absarc(0, 0, r, 0, Math.PI * 2, false);
    b.add(flat(ring), MAT2.lawn(), lx, 0.07, lz, 0, false);
    b.add(new THREE.TorusGeometry(r + 0.1, 0.12, 4, 32).rotateX(Math.PI / 2), MAT.plain(0x2f7a52), lx, 0.25, lz, 0);
    palm(b, lx, lz, 1.15);
    decor(lx - 0.4, lx + 0.4, lz - 0.4, lz + 0.4);
    if (r > 4) {
      for (const dx of [-2.2, 2.2]) {
        palm(b, lx + dx, lz + 1.4, 0.8);
        decor(lx + dx - 0.3, lx + dx + 0.3, lz + 1.1, lz + 1.7);
      }
    }
  }
  for (const s of [-1, 1]) {
    const bx = s * (W / 4 + 4),
      bz = pz1 - 2.6;
    b.add(groundGeo(W / 2 - 14, 2.2, 1), MAT2.lawn(), bx, 0.07, bz, 0, false);
    b.box(W / 2 - 13.4, 0.3, 2.6, MAT.plain(0x2f7a52), bx, 0, bz);
    for (let k = -2; k <= 2; k++) {
      palm(b, bx + k * 4, bz, 0.7);
      decor(bx + k * 4 - 0.3, bx + k * 4 + 0.3, bz - 0.3, bz + 0.3);
    }
  }
  }
  for (const x of [px0 + 3, px1 - 3])
    for (let z = pz0 + 3; z < pz1 - 2; z += 6) {
      if (Math.abs(x) < W / 2 + 4 && z > -D / 2 - 4 && z < D / 2 + 4) continue;
      // a folded umbrella: a tall white pole with its canopy closed round it
      b.add(new THREE.CylinderGeometry(0.16, 0.2, 7, 8), w, x, 3.5, z);
      b.add(new THREE.ConeGeometry(0.6, 3.6, 8), w, x, 6.2, z);
      decor(x - 0.3, x + 0.3, z - 0.3, z + 0.3);
    }
  for (let x = px0 + 15; x < px1 - 6; x += 12) {
    const z = pz1 - 1.2;
    if (Math.abs(x) < 6) continue;
    b.add(new THREE.CylinderGeometry(0.08, 0.12, 4.6, 8), MAT.plain(0xe8e8e2), x, 2.3, z);
    b.add(new THREE.SphereGeometry(0.3, 10, 8), lamp, x - 0.45, 4.5, z);
    b.add(new THREE.SphereGeometry(0.3, 10, 8), lamp, x + 0.45, 4.5, z);
    decor(x - 0.2, x + 0.2, z - 0.2, z + 0.2);
  }
  solid(-W / 2 - 0.3, W / 2 + 0.3, -D / 2 - 0.3, D / 2 + 0.3);
  solid(-4.6, 4.6, D / 2, D / 2 + 1.7);
  b.base.identity();
  return { colliders, late, door: { x: cx, z: cz + D / 2 + 3.6 }, top: H + 32 };
}

/* ================= the Quba Walkway ================= */
function bikeTex() {
  return canvasTex("walk-bike", 128, 128, (c) => {
    c.fillStyle = "#3f8f5a";
    c.fillRect(0, 0, 128, 128);
    c.strokeStyle = "#ffffff";
    c.lineWidth = 7;
    for (const x of [34, 94]) {
      c.beginPath();
      c.arc(x, 82, 20, 0, Math.PI * 2);
      c.stroke();
    }
    c.beginPath();
    c.moveTo(34, 82);
    c.lineTo(56, 50);
    c.lineTo(84, 50);
    c.lineTo(94, 82);
    c.moveTo(56, 50);
    c.lineTo(66, 82);
    c.lineTo(84, 50);
    c.moveTo(50, 40);
    c.lineTo(62, 40);
    c.moveTo(80, 50);
    c.lineTo(78, 38);
    c.lineTo(88, 38);
    c.stroke();
  });
}
function walkTex() {
  const t = canvasTex(
    "walk-pave",
    64,
    64,
    (c) => {
      c.fillStyle = "#e6d7bb";
      c.fillRect(0, 0, 64, 64);
      c.fillStyle = "#dcc9a8";
      for (let y = 0; y < 64; y += 16) for (let x = (y / 16) % 2 ? 8 : 0; x < 64; x += 16) c.fillRect(x + 1, y + 1, 14, 6);
    },
    true,
  );
  t.repeat.set(1 / 2, 1 / 2);
  return t;
}
/** The Quba Walkway: a paved footpath and a green cycle lane side by side, from the
    Prophet's Mosque to Masjid Quba. `pts` is the line of the path (world x, z); the cycle
    lane runs on its left as you walk to Quba, the footpath on its right. Where it crosses a
    road it is striped as a crossing; where it is out on its own it has lamps, palms and
    benches. Returns the solid boxes (lamp posts, palms, benches). */
export function qubaWalkway(
  b: Batch,
  pts: [number, number][],
  onRoad: (x: number, z: number) => boolean,
  furnished: (x: number, z: number) => boolean,
) {
  const colliders: Box[] = [];
  const walkM = mat("walk-m", () => new THREE.MeshStandardMaterial({ map: walkTex(), roughness: 0.85 }), 0.1);
  const bikeM = mat("bike-m", () => new THREE.MeshStandardMaterial({ color: 0x3f8f5a, roughness: 0.8 }), 0.1);
  const iconM = mat("bike-icon", () => new THREE.MeshStandardMaterial({ map: bikeTex(), roughness: 0.8 }), 0.2);
  const lineM = mat("walk-line", () => new THREE.MeshStandardMaterial({ color: 0xf8f8f4, roughness: 0.6 }), 0.3);
  const zebraM = lineM;
  const lamp = M.tex("lamp", winTex(), 1.2);
  const strip = (x0: number, z0: number, x1: number, z1: number, off0: number, off1: number, m: THREE.Material, y: number) => {
    const dx = x1 - x0,
      dz = z1 - z0,
      len = Math.hypot(dx, dz),
      ux = dx / len,
      uz = dz / len;
    const nx = uz,
      nz = -ux; // the left-hand side, walking from the first point to the next
    const mid = (off0 + off1) / 2;
    const g = new THREE.PlaneGeometry(off1 - off0, len + (off1 - off0) * 0.6);
    g.rotateX(-Math.PI / 2);
    // stretch the texture in metres along the path
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (off1 - off0), uv.getY(i) * len);
    b.add(g, m, (x0 + x1) / 2 + nx * mid, y, (z0 + z1) / 2 + nz * mid, Math.atan2(dx, dz), false);
    return { len, ux, uz, nx, nz };
  };
  let run = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, z0] = pts[i],
      [x1, z1] = pts[i + 1];
    // footpath on the right, cycle lane on the left, white lines between and along
    const s = strip(x0, z0, x1, z1, -2.2, 0, walkM, 0.075);
    strip(x0, z0, x1, z1, 0.08, 2.1, bikeM, 0.075);
    strip(x0, z0, x1, z1, -0.06, 0.08, lineM, 0.08);
    strip(x0, z0, x1, z1, 2.1, 2.25, lineM, 0.08);
    const { len, ux, uz, nx, nz } = s;
    for (let t = 0; t < len; t += 1) {
      const x = x0 + ux * t,
        z = z0 + uz * t;
      run++;
      // a bicycle painted on the lane every 24 m
      if (run % 24 === 12) {
        const ic = new THREE.PlaneGeometry(1.6, 1.6);
        ic.rotateX(-Math.PI / 2);
        b.add(ic, iconM, x + nx * 1.1, 0.085, z + nz * 1.1, Math.atan2(ux, uz) + Math.PI / 2, false);
      }
      // a zebra crossing where it crosses a road
      if (onRoad(x, z)) {
        const zb = new THREE.PlaneGeometry(4.3, 0.5);
        zb.rotateX(-Math.PI / 2);
        if (Math.floor(t) % 2 === 0)
          b.add(zb, zebraM, x + nx * 0.02, 0.09, z + nz * 0.02, Math.atan2(ux, uz), false);
      }
      // out on its own: a lamp every 25 m, a palm and a bench in between
      if (!furnished(x, z) || onRoad(x, z)) continue;
      const ex = x + nx * 3.2,
        ez = z + nz * 3.2;
      if (run % 25 === 0) {
        b.add(new THREE.CylinderGeometry(0.09, 0.13, 5, 8), MAT.plain(0xeeeee8), ex, 2.5, ez);
        b.add(new THREE.SphereGeometry(0.34, 10, 8), lamp, ex, 5.2, ez);
        colliders.push({ x0: ex - 0.2, x1: ex + 0.2, z0: ez - 0.2, z1: ez + 0.2 });
      } else if (run % 25 === 12) {
        palm(b, ex, ez, 0.95);
        colliders.push({ x0: ex - 0.3, x1: ex + 0.3, z0: ez - 0.3, z1: ez + 0.3 });
      } else if (run % 50 === 19) {
        b.add(new THREE.BoxGeometry(2, 0.45, 0.6), MAT.plain(0xd8cdb4), ex, 0.22, ez, Math.atan2(ux, uz) + Math.PI / 2);
        colliders.push({ x0: ex - 1, x1: ex + 1, z0: ez - 1, z1: ez + 1 });
      }
    }
  }
  return colliders;
}

/** Quba's great forecourt: white paving from Quba Road back towards the mosque, with big
    round lawns, palms in rows, long garden beds and lamps (x0..x1, z0 near the road down to
    z1 further back, z1 < z0). Returns posts to make solid once the area is laid out. */
export function qubaForecourt(b: Batch, x0: number, x1: number, z0: number, z1: number) {
  const late: Box[] = [];
  const post = (x: number, z: number, r: number) => late.push({ x0: x - r, x1: x + r, z0: z - r, z1: z + r });
  const cx = (x0 + x1) / 2,
    W = x1 - x0,
    L = z0 - z1;
  b.add(groundGeo(W, L, 1), QM.pave(), cx, 0.055, (z0 + z1) / 2, 0, false);
  const lamp = M.tex("lamp", winTex(), 1.2);
  // a broad walk down the middle to the mosque, lawns and palms either side
  for (const s of [-1, 1]) {
    // long lawns with a row of palms down each
    const lx = cx + s * (W / 2 - 8);
    b.add(groundGeo(7, L - 8, 1), MAT2.lawn(), lx, 0.07, (z0 + z1) / 2, 0, false);
    b.box(7.4, 0.3, L - 7.6, MAT.plain(0x2f7a52), lx, 0, (z0 + z1) / 2);
    b.add(groundGeo(6.4, L - 9, 1), MAT2.lawn(), lx, 0.31, (z0 + z1) / 2, 0, false);
    for (let z = z0 - 7; z > z1 + 4; z -= 7) {
      palm(b, lx, z, 1.05);
      post(lx, z, 0.35);
    }
    // round lawns with palms nearer the middle
    for (let k = 0; k < 3; k++) {
      const rx = cx + s * 13,
        rz = z0 - 9 - k * ((L - 18) / 2);
      const ring = new THREE.Shape();
      ring.absarc(0, 0, 3.8, 0, Math.PI * 2, false);
      b.add(flat(ring), MAT2.lawn(), rx, 0.08, rz, 0, false);
      b.add(new THREE.TorusGeometry(3.9, 0.12, 4, 32).rotateX(Math.PI / 2), MAT.plain(0x2f7a52), rx, 0.25, rz, 0);
      palm(b, rx, rz, 1.15);
      post(rx, rz, 0.4);
    }
    // double lamps down the walk
    for (let z = z0 - 4; z > z1 + 3; z -= 12) {
      const x = cx + s * 5;
      b.add(new THREE.CylinderGeometry(0.08, 0.12, 4.6, 8), MAT.plain(0xe8e8e2), x, 2.3, z);
      b.add(new THREE.SphereGeometry(0.3, 10, 8), lamp, x - 0.45, 4.5, z);
      b.add(new THREE.SphereGeometry(0.3, 10, 8), lamp, x + 0.45, 4.5, z);
      post(x, z, 0.2);
    }
  }
  return late;
}

/* ================= car parks ================= */
const CAR_COLOURS = [0xf2f2ee, 0x1d1f22, 0x9aa0a6, 0x2b4f86, 0x8a1c22, 0xd8d2c4, 0x3a5a40, 0x5a5f66];
function parkSignTex() {
  return canvasTex("park-sign", 128, 128, (c) => {
    c.fillStyle = "#1f5fbf";
    c.fillRect(0, 0, 128, 128);
    c.strokeStyle = "#ffffff";
    c.lineWidth = 6;
    c.strokeRect(6, 6, 116, 116);
    c.fillStyle = "#ffffff";
    c.font = `800 92px ${EN}`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("P", 64, 70);
  });
}
/** A car park: dark asphalt with a kerb, white bays along the back (and the front too when
    deep enough), cars parked in some of them, and a blue P sign at the entrance. Local
    frame: the entrance side towards +z. Returns the parked cars and the sign as solid. */
export function parkingLot(
  b: Batch,
  o: { x: number; z: number; turn: number; w: number; d: number; seed: number },
) {
  const { colliders, solid } = frameOf(b, o.x, o.z, o.turn);
  const { w, d } = o;
  let s = o.seed >>> 0 || 1;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const asphalt = mat("park-asphalt", () => new THREE.MeshStandardMaterial({ color: 0x4a4d50, roughness: 0.95 }), 0);
  const line = mat("park-line", () => new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.6 }), 0.3);
  const kerb = MAT.plain(0xd8d2c2);
  b.add(groundGeo(w, d, 2), asphalt, 0, 0.045, 0, 0, false);
  // kerbs on three sides, open at the entrance
  b.box(w + 0.4, 0.18, 0.3, kerb, 0, 0, -d / 2);
  b.box(0.3, 0.18, d, kerb, -w / 2, 0, 0);
  b.box(0.3, 0.18, d, kerb, w / 2, 0, 0);
  const BAY = 2.7,
    BD = 5;
  const rows = d >= 17 ? [-d / 2 + BD / 2, d / 2 - BD / 2 - 0.4] : [-d / 2 + BD / 2];
  const n = Math.floor((w - 0.6) / BAY);
  const x0 = -(n * BAY) / 2;
  for (const rz of rows) {
    for (let i = 0; i <= n; i++) {
      const g = new THREE.PlaneGeometry(0.14, BD);
      g.rotateX(-Math.PI / 2);
      b.add(g, line, x0 + i * BAY, 0.06, rz, 0, false);
    }
    for (let i = 0; i < n; i++) {
      if (rnd() < 0.35) continue; // an empty bay
      const cx = x0 + (i + 0.5) * BAY,
        col = CAR_COLOURS[Math.floor(rnd() * CAR_COLOURS.length)];
      const body = MAT.plain(col, 0.4);
      // a simple car, nose to the aisle
      const face = rz < 0 ? 1 : -1;
      b.box(1.8, 0.75, 4.2, body, cx, 0.32, rz);
      b.box(1.6, 0.6, 2.2, body, cx, 1.07, rz - face * 0.2);
      b.box(1.62, 0.42, 2.0, MAT.plain(0x1c2a33, 0.2), cx, 1.12, rz - face * 0.2);
      for (const wx of [-0.82, 0.82])
        for (const wz of [-1.35, 1.35]) {
          const wh = new THREE.CylinderGeometry(0.34, 0.34, 0.26, 10);
          wh.rotateZ(Math.PI / 2);
          b.add(wh, MAT.plain(0x161616), cx + wx, 0.34, rz + wz);
        }
      solid(cx - 0.95, cx + 0.95, rz - 2.15, rz + 2.15);
    }
  }
  // the P sign at the entrance corner
  const sx = w / 2 - 0.8,
    sz = d / 2 - 0.6;
  b.add(new THREE.CylinderGeometry(0.06, 0.06, 2.8, 8), MAT.plain(0x9a9a92), sx, 1.4, sz);
  const sign = M.sign("park", parkSignTex());
  b.add(new THREE.PlaneGeometry(0.9, 0.9), sign, sx, 2.9, sz + 0.05, 0, false);
  b.add(new THREE.PlaneGeometry(0.9, 0.9), sign, sx, 2.9, sz - 0.05, Math.PI, false);
  solid(sx - 0.15, sx + 0.15, sz - 0.15, sz + 0.15);
  b.base.identity();
  return colliders;
}

/** A simple parked car, nose to the aisle (face +1: nose to +z). */
function carAt(
  b: Batch,
  cx: number,
  rz: number,
  face: number,
  col: number,
  solid: (x0: number, x1: number, z0: number, z1: number) => void,
  police = false,
) {
  const body = MAT.plain(col, 0.4);
  b.box(1.8, 0.75, 4.2, body, cx, 0.32, rz);
  b.box(1.6, 0.6, 2.2, body, cx, 1.07, rz - face * 0.2);
  b.box(1.62, 0.42, 2.0, MAT.plain(0x1c2a33, 0.2), cx, 1.12, rz - face * 0.2);
  for (const wx of [-0.82, 0.82])
    for (const wz of [-1.35, 1.35]) {
      const wh = new THREE.CylinderGeometry(0.34, 0.34, 0.26, 10);
      wh.rotateZ(Math.PI / 2);
      b.add(wh, MAT.plain(0x161616), cx + wx, 0.34, rz + wz);
    }
  if (police) {
    // a stripe down each side and the light bar on the roof
    for (const sx of [-0.91, 0.91]) b.box(0.02, 0.22, 3.6, MAT.plain(0x1d3a6b, 0.4), cx + sx, 0.62, rz);
    b.box(1.1, 0.16, 0.3, MAT.plain(0x2f6fe0, 0.2), cx - 0.28, 1.68, rz - face * 0.2);
    b.box(0.55, 0.16, 0.3, MAT.plain(0xd83a3a, 0.2), cx + 0.28, 1.68, rz - face * 0.2);
  }
  solid(cx - 0.95, cx + 0.95, rz - 2.15, rz + 2.15);
}

/** A big covered car park: double rows of bays under white shade roofs on steel posts,
    aisles between them, kerbs at the back and sides, open along the front (+z) and at the
    ends of each aisle. w runs along x, d along z. */
export function coveredParking(
  b: Batch,
  o: { x: number; z: number; turn: number; w: number; d: number; seed: number; police?: number },
) {
  const { colliders, solid } = frameOf(b, o.x, o.z, o.turn);
  const { w, d } = o;
  let s = o.seed >>> 0 || 1;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const asphalt = mat("park-asphalt", () => new THREE.MeshStandardMaterial({ color: 0x4a4d50, roughness: 0.95 }), 0);
  const line = mat("park-line", () => new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.6 }), 0.3);
  const shade = mat(
    "park-shade",
    () => new THREE.MeshStandardMaterial({ color: 0xf4f1e8, roughness: 0.85, side: THREE.DoubleSide }),
    0,
  );
  const steel = MAT.plain(0x8d9399, 0.35);
  const trim = MAT.plain(0x1f6f63, 0.5);
  const kerb = MAT.plain(0xd8d2c2);
  b.add(groundGeo(w, d, 2), asphalt, 0, 0.045, 0, 0, false);
  b.box(w + 0.4, 0.18, 0.3, kerb, 0, 0, -d / 2);
  const BAY = 2.7,
    BD = 5,
    AISLE = 6,
    DOUBLE = BD * 2 + 0.4;
  const n = Math.floor((w - 1.4) / BAY);
  const x0 = -(n * BAY) / 2;
  let police = o.police ?? 0;
  // double rows from the back, an aisle in front of each
  const rows: number[] = [];
  for (let z = -d / 2 + 0.4; z + DOUBLE <= d / 2 - 0.3; z += DOUBLE + AISLE) rows.push(z);
  for (const zb of rows) {
    const mid = zb + BD + 0.2;
    for (const [rz, face] of [
      [zb + BD / 2, -1],
      [mid + 0.2 + BD / 2, 1],
    ] as [number, number][]) {
      for (let i = 0; i <= n; i++) {
        const g = new THREE.PlaneGeometry(0.14, BD);
        g.rotateX(-Math.PI / 2);
        b.add(g, line, x0 + i * BAY, 0.06, rz, 0, false);
      }
      for (let i = 0; i < n; i++) {
        if (police > 0) {
          carAt(b, x0 + (i + 0.5) * BAY, rz, face, 0xf4f4f2, solid, true);
          police--;
          continue;
        }
        if (rnd() < 0.3) continue; // an empty bay
        carAt(b, x0 + (i + 0.5) * BAY, rz, face, CAR_COLOURS[Math.floor(rnd() * CAR_COLOURS.length)], solid);
      }
    }
    // the shade roof: posts down the middle, a beam on top, a white roof sloping to both sides
    const span = n * BAY + 0.6;
    for (let i = 0; i <= n; i += 2) {
      const px = x0 + i * BAY;
      b.add(new THREE.CylinderGeometry(0.11, 0.13, 3.3, 8), steel, px, 1.65, mid);
      b.box(0.14, 0.14, DOUBLE, steel, px, 2.72, mid);
      solid(px - 0.16, px + 0.16, mid - 0.16, mid + 0.16);
    }
    b.box(span, 0.2, 0.2, steel, 0, 3.12, mid);
    for (const side of [-1, 1]) {
      const g = new THREE.PlaneGeometry(span, DOUBLE / 2 + 0.5);
      g.rotateX(-Math.PI / 2 + side * 0.09);
      b.add(g, shade, 0, 3.45 - 0.25, mid + side * (DOUBLE / 4 + 0.25), 0, true);
      b.box(span, 0.32, 0.08, trim, 0, 3.05, mid + side * (DOUBLE / 2 + 0.5));
    }
  }
  // the P sign at the front corner
  const sx = w / 2 - 0.25,
    sz = d / 2 - 0.25;
  b.add(new THREE.CylinderGeometry(0.06, 0.06, 2.8, 8), MAT.plain(0x9a9a92), sx, 1.4, sz);
  const sign = M.sign("park", parkSignTex());
  b.add(new THREE.PlaneGeometry(0.9, 0.9), sign, sx, 2.9, sz + 0.05, 0, false);
  b.add(new THREE.PlaneGeometry(0.9, 0.9), sign, sx, 2.9, sz - 0.05, Math.PI, false);
  solid(sx - 0.12, sx + 0.12, sz - 0.12, sz + 0.12);
  b.base.identity();
  return colliders;
}

function policeBadgeTex(saudi: boolean) {
  return canvasTex(`police-badge-${saudi}`, 256, 256, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.fillStyle = saudi ? "#1f6f4a" : "#1d3a6b";
    c.beginPath();
    c.arc(w / 2, h / 2, 120, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#d9b44a";
    c.lineWidth = 12;
    c.stroke();
    // a gold star
    c.fillStyle = "#e8c45a";
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 34 : 78,
        a = -Math.PI / 2 + (i * Math.PI) / 5;
      c.lineTo(w / 2 + r * Math.cos(a), h / 2 + r * Math.sin(a));
    }
    c.closePath();
    c.fill();
  });
}

/** A police station in its own walled compound: a grand gate with lanterns and a guard
    booth, a forecourt with lawns, palms and the flag in a round garden, the two-storey station
    at the back with a pillared porch and the badge over the door, and a covered car park with
    the patrol cars along one side. Front (+z) on the street. */
export function policeCompound(
  b: Batch,
  o: { x: number; z: number; turn: number; w: number; d: number; name: string; saudi: boolean; seed: number },
) {
  const { to, colliders, solid } = frameOf(b, o.x, o.z, o.turn);
  const W = o.w,
    D = o.d;
  const navy = o.saudi ? 0x1f5f46 : 0x1d3a6b;
  const wallM = MAT.plaster(0xefe8d8),
    white = MAT.plaster(0xf6f4ee),
    capM = MAT.plain(navy, 0.5),
    stone = MAT.plain(0xd9cdb2, 0.8),
    lamp = mat("police-lamp", () => new THREE.MeshStandardMaterial({ color: 0xfff1cc, roughness: 0.4 }), 1.3),
    blue = mat("police-blue", () => new THREE.MeshStandardMaterial({ color: 0x3a7bd5, roughness: 0.3 }), 1.0, 0x6aa8ff);
  // the ground: paving, with lawns either side of the drive
  b.add(groundGeo(W, D, 2), MAT.pavement(), 0, 0.035, 0, 0, false);
  // the walls, with pillars, and the gate in the middle of the front
  const WH = 2.6,
    GATE = 5;
  const wallRun = (ax: number, az: number, bx: number, bz: number) => {
    const along = Math.abs(bx - ax) > Math.abs(bz - az);
    const len = along ? Math.abs(bx - ax) : Math.abs(bz - az);
    const cx = (ax + bx) / 2,
      cz = (az + bz) / 2;
    b.box(along ? len : 0.4, WH, along ? 0.4 : len, wallM, cx, 0, cz);
    b.box(along ? len + 0.2 : 0.6, 0.2, along ? 0.6 : len + 0.2, capM, cx, WH, cz);
    const n = Math.max(1, Math.round(len / 6));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const px = ax + (bx - ax) * t,
        pz = az + (bz - az) * t;
      b.box(0.8, WH + 0.5, 0.8, wallM, px, 0, pz);
      b.box(1.0, 0.18, 1.0, capM, px, WH + 0.5, pz);
    }
    solid(Math.min(ax, bx) - 0.25, Math.max(ax, bx) + 0.25, Math.min(az, bz) - 0.25, Math.max(az, bz) + 0.25);
  };
  const hw = W / 2 - 0.3,
    hd = D / 2 - 0.3;
  wallRun(-hw, -hd, hw, -hd);
  wallRun(-hw, -hd, -hw, hd);
  wallRun(hw, -hd, hw, hd);
  wallRun(-hw, hd, -GATE - 0.9, hd);
  wallRun(GATE + 0.9, hd, hw, hd);
  // the gate: tall pillars with lanterns, a beam with the name, the sliding gate drawn back
  for (const s of [-1, 1]) {
    const px = s * (GATE + 0.2);
    b.box(1.5, 5.2, 1.5, stone, px, 0, hd);
    b.box(1.8, 0.3, 1.8, capM, px, 5.2, hd);
    b.add(new THREE.BoxGeometry(0.5, 0.7, 0.5), lamp, px, 5.85, hd);
    b.box(0.7, 0.12, 0.7, capM, px, 6.25, hd);
    solid(px - 0.8, px + 0.8, hd - 0.8, hd + 0.8);
  }
  b.box(2 * GATE + 1.4, 1.1, 0.6, capM, 0, 5.0, hd);
  const sign = textMat(o.name.toUpperCase(), { bg: o.saudi ? "#1f5f46" : "#1d3a6b", fg: "#ffffff" });
  b.plane(2 * GATE - 0.4, 0.8, sign, 0, 5.55, hd + 0.32);
  b.plane(2 * GATE - 0.4, 0.8, sign, 0, 5.55, hd - 0.32, Math.PI);
  // the sliding gate, open, behind the wall on the right
  for (let i = 0; i < 9; i++) b.box(0.08, 2.1, 0.08, MAT.plain(0x2a2d31, 0.4), GATE + 1.3 + i * 0.55, 0, hd - 0.6);
  b.box(4.6, 0.12, 0.1, MAT.plain(0x2a2d31, 0.4), GATE + 3.5, 2.0, hd - 0.6);
  b.box(4.6, 0.12, 0.1, MAT.plain(0x2a2d31, 0.4), GATE + 3.5, 0.15, hd - 0.6);
  // the guard booth on the left, and its barrier (raised)
  const gx = -GATE - 3.2,
    gz = hd - 3;
  b.box(3, 2.8, 3, white, gx, 0, gz);
  b.box(3.6, 0.25, 3.6, capM, gx, 2.8, gz);
  b.plane(2.2, 1.1, MAT.window(navy), gx, 1.7, gz + 1.52);
  b.plane(1.1, 1.1, MAT.window(navy), gx + 1.52, 1.7, gz, Math.PI / 2);
  solid(gx - 1.6, gx + 1.6, gz - 1.6, gz + 1.6);
  const arm = new THREE.BoxGeometry(0.12, 0.12, 4.2);
  arm.translate(0, 0, 2.1);
  arm.rotateX(-0.9);
  arm.rotateY(Math.PI / 2);
  b.box(0.35, 1.1, 0.35, MAT.plain(0xd83a3a, 0.5), -GATE + 0.6, 0, hd - 1.6);
  b.add(arm, MAT.plain(0xf2f2ee, 0.5), -GATE + 0.6, 1.05, hd - 1.6);
  // the station at the back
  const BW = Math.min(W - 14, 34),
    BD = D >= 30 ? 12 : 8,
    H = D >= 30 ? 8.6 : 5.2,
    bz0 = -hd + 1.2,
    front = bz0 + BD;
  b.box(BW + 0.6, 0.45, BD + 0.6, stone, 0, 0, bz0 + BD / 2);
  b.box(BW, H, BD, white, 0, 0.45, bz0 + BD / 2);
  b.box(BW + 0.5, 0.7, BD + 0.5, capM, 0, H + 0.1, bz0 + BD / 2);
  if (H > 6) b.box(BW + 0.15, 0.35, BD + 0.15, capM, 0, 4.4, bz0 + BD / 2);
  const floors = H > 6 ? [2.3, 6.4] : [2.4];
  for (const y of floors)
    for (let x = -BW / 2 + 2.2; x <= BW / 2 - 2.1; x += 2.6) {
      if (Math.abs(x) < 5) continue;
      b.plane(1.7, 1.6, MAT.window(navy), x, y, front + 0.02);
    }
  for (const y of floors)
    for (const s of [-1, 1])
      for (let z = bz0 + 2; z <= front - 1.8; z += 2.6)
        b.plane(1.7, 1.6, MAT.window(navy), s * (BW / 2 + 0.02), y, z, (s * Math.PI) / 2);
  // the entrance: a taller middle block with a pillared porch, the badge and the name
  const EW = 9;
  b.box(EW, H + 1.6, 1.2, white, 0, 0.45, front + 0.6);
  b.box(EW + 0.5, 0.6, 1.6, capM, 0, H + 2.0, front + 0.6);
  const porchD = 4.2;
  b.box(EW + 1.4, 0.4, porchD + 0.4, capM, 0, 4.0, front + 1.2 + porchD / 2);
  for (const x of [-EW / 2, -EW / 6, EW / 6, EW / 2]) {
    b.add(new THREE.CylinderGeometry(0.28, 0.32, 3.6, 12), white, x, 0.45 + 1.8, front + 1.2 + porchD - 0.3);
    solid(x - 0.35, x + 0.35, front + porchD + 0.55, front + porchD + 1.25);
  }
  for (let i = 0; i < 3; i++)
    b.box(EW + 1.4 - i * 0.6, 0.15, porchD + 1.2 - i * 0.5, stone, 0, i * 0.15, front + 1.2 + porchD / 2 + 0.3 - i * 0.25);
  b.plane(3.2, 3.0, MAT.door(navy), 0, 0.45 + 1.5, front + 1.22);
  b.plane(1.3, 1.6, MAT.window(navy), -2.9, 2.0, front + 1.22);
  b.plane(1.3, 1.6, MAT.window(navy), 2.9, 2.0, front + 1.22);
  b.plane(EW - 1, 1.2, textMat(o.name, { bg: o.saudi ? "#1f5f46" : "#1d3a6b", fg: "#ffffff" }), 0, H - 0.2, front + 1.22);
  const badge = mat(`police-badge-${o.saudi}`, () => new THREE.MeshStandardMaterial({ map: policeBadgeTex(o.saudi), transparent: true, roughness: 0.5 }), 0.3);
  b.add(new THREE.PlaneGeometry(2.4, 2.4), badge, 0, H + 1.0 - (H > 6 ? 0 : 0.2), front + 1.23, 0, false);
  b.add(new THREE.BoxGeometry(0.6, 0.6, 0.6), blue, 0, 3.55, front + 1.5);
  solid(-BW / 2 - 0.3, BW / 2 + 0.3, bz0 - 0.3, front + 1.25);
  // the drive from the gate, a round garden with the flag, lawns and palms
  const driveZ0 = front + porchD + 1.6;
  const drive = MAT.plain(0xcfc6b2, 0.9);
  b.add(groundGeo(2 * GATE, hd - driveZ0 + 0.3, 2), drive, 0, 0.05, (hd + driveZ0) / 2, 0, false);
  const fz = (driveZ0 + hd) / 2;
  const room = hd - driveZ0;
  if (room > 9) {
    const ring = new THREE.CircleGeometry(3.4, 28);
    ring.rotateX(-Math.PI / 2);
    b.add(ring, MAT.plain(0xb4614a), 0, 0.07, fz, 0, false);
    const lawn = new THREE.CircleGeometry(3.0, 28);
    lawn.rotateX(-Math.PI / 2);
    b.add(lawn, MAT2.lawn(), 0, 0.08, fz, 0, false);
    b.add(new THREE.CylinderGeometry(0.06, 0.08, 9, 8), MAT.plain(0xd8dce0, 0.3), 0, 4.5, fz);
    const fc = o.saudi ? [0x1f7a3e, 0x1f7a3e, 0x1f7a3e] : [0x1f8a3a, 0xfdfdfd, 0x1f8a3a];
    for (const [i, c] of fc.entries()) b.plane(0.6, 1.2, MAT.plain(c), 0.3 + i * 0.6, 8.2, fz, 0);
    for (const [i, c] of fc.entries()) b.plane(0.6, 1.2, MAT.plain(c), 0.3 + i * 0.6, 8.2, fz - 0.01, Math.PI);
    if (o.saudi) b.plane(1.2, 0.18, MAT.plain(0xfdfdfd), 0.9, 8.0, fz + 0.01);
    solid(-0.4, 0.4, fz - 0.4, fz + 0.4);
  }
  // lawns with palms between the drive and the car park / the far wall
  const lawnX0 = GATE + 1.2;
  for (const s of [-1, 1]) {
    if (s === 1) continue; // the right side is the car park
    const x1 = s * (hw - 1.2);
    const lw = Math.abs(x1) - lawnX0,
      lx = s * (lawnX0 + lw / 2);
    const lz0 = driveZ0 - 1,
      lz1 = hd - 4.6;
    if (lw > 3 && lz1 - lz0 > 3) {
      b.add(groundGeo(lw, lz1 - lz0, 2), MAT2.lawn(), lx, 0.06, (lz0 + lz1) / 2, 0, false);
      for (let z = lz0 + 2; z < lz1 - 1; z += 5)
        for (const x of [s * (lawnX0 + 1.5), x1 - s * 1.5]) {
          palm(b, x, z, 0.9);
          solid(x - 0.3, x + 0.3, z - 0.3, z + 0.3);
        }
    }
  }
  // lamps along the drive
  for (let z = driveZ0 + 1.5; z < hd - 2; z += 7)
    for (const x of [-GATE - 0.6, GATE + 0.6]) {
      b.add(new THREE.CylinderGeometry(0.07, 0.1, 4, 8), MAT.plain(0x2e2e2a), x, 2, z);
      b.add(new THREE.SphereGeometry(0.28, 10, 8), lamp, x, 4.1, z);
      solid(x - 0.15, x + 0.15, z - 0.15, z + 0.15);
    }
  b.base.identity();
  // the covered car park with the patrol cars, along the right-hand side
  const px0 = GATE + 1.6,
    px1 = hw - 0.5;
  const pz0 = front + 1.6,
    pz1 = hd - 0.6;
  if (px1 - px0 > 11 && pz1 - pz0 > 8) {
    // turned so its bays face the drive (its front is the drive side)
    const c = to((px0 + px1) / 2, (pz0 + pz1) / 2);
    colliders.push(
      ...coveredParking(b, {
        x: c.x,
        z: c.z,
        turn: o.turn - Math.PI / 2,
        w: pz1 - pz0,
        d: px1 - px0,
        seed: o.seed,
        police: 4,
      }),
    );
  }
  const spot = to(0, front + porchD + 2.2);
  return {
    colliders,
    spots: [{ key: "police", x: spot.x, z: spot.z, label: o.name, labelY: H + 3.4 }],
  };
}

/** Masjid Quba's compound: white marble paving all round the mosque, a low white wall with
    railings and lamp pillars (open at the gates), rows of palms and lamps, and a big covered
    car park reached from its own gate. `free` says if a spot is clear of what's already
    there; `skip` lists ground already paved (the mosque's own plaza). */
export function qubaCompound(
  b: Batch,
  o: {
    x0: number;
    x1: number;
    z0: number;
    z1: number;
    gates: [number, number][];
    skip: Box[];
    park: Box & { gate: number };
    free: (x0: number, x1: number, z0: number, z1: number) => boolean;
    seed: number;
  },
) {
  const colliders: Box[] = [];
  const solid = (x0: number, x1: number, z0: number, z1: number) => colliders.push({ x0, x1, z0, z1 });
  const blocked = (x0: number, x1: number, z0: number, z1: number) =>
    !o.free(x0, x1, z0, z1) || colliders.some((c) => x0 < c.x1 && x1 > c.x0 && z0 < c.z1 && z1 > c.z0);
  b.base.identity();
  // the paving, in strips around the plaza already there
  const pave = (x0: number, x1: number, z0: number, z1: number) => {
    if (x1 - x0 < 0.5 || z1 - z0 < 0.5) return;
    b.add(groundGeo(x1 - x0, z1 - z0, 1), QM.pave(), (x0 + x1) / 2, 0.042, (z0 + z1) / 2, 0, false);
  };
  const sk = o.skip[0];
  pave(o.x0, sk.x0, o.z0, o.z1);
  pave(sk.x1, o.x1, o.z0, o.z1);
  pave(sk.x0, sk.x1, o.z0, sk.z0);
  // the car park's drive from its gate
  const P = o.park;
  const asphalt = mat("park-asphalt", () => new THREE.MeshStandardMaterial({ color: 0x4a4d50, roughness: 0.95 }), 0);
  b.add(groundGeo(12, o.z1 - P.z1 + 0.2, 2), asphalt, P.gate, 0.047, (P.z1 + o.z1) / 2, 0, false);
  // the wall: a white base and pillars, green railings between, a lamp on every other pillar
  const base = QM.white(),
    rail = MAT.rail(),
    cap = MAT.plain(0x2f6b55, 0.5),
    lamp = mat("q-lamp", () => new THREE.MeshStandardMaterial({ color: 0xfff1cc, roughness: 0.4 }), 1.3);
  const openAt = (x: number) => o.gates.some(([a, c]) => x > a && x < c);
  const run = (ax: number, az: number, bx: number, bz: number, gated: boolean) => {
    const along = Math.abs(bx - ax) > Math.abs(bz - az);
    const len = Math.hypot(bx - ax, bz - az);
    const n = Math.round(len / 4);
    let k = 0;
    for (let i = 0; i < n; i++) {
      const t0 = i / n,
        t1 = (i + 1) / n;
      const sx = ax + (bx - ax) * t0,
        sz = az + (bz - az) * t0,
        ex = ax + (bx - ax) * t1,
        ez = az + (bz - az) * t1;
      const mx = (sx + ex) / 2,
        mz = (sz + ez) / 2;
      if (gated && (openAt(sx + 0.5) || openAt(ex - 0.5))) continue;
      const seg = len / n;
      const bx0 = Math.min(sx, ex) - 0.25,
        bx1 = Math.max(sx, ex) + 0.25,
        bz0 = Math.min(sz, ez) - 0.25,
        bz1 = Math.max(sz, ez) + 0.25;
      if (!o.free(bx0, bx1, bz0, bz1)) continue;
      b.box(along ? seg : 0.45, 0.6, along ? 0.45 : seg, base, mx, 0, mz);
      b.box(along ? seg : 0.55, 0.08, along ? 0.55 : seg, cap, mx, 0.6, mz);
      b.plane(seg, 1.4, rail, mx, 1.35, mz, along ? 0 : Math.PI / 2);
      b.box(along ? seg : 0.1, 0.08, along ? 0.1 : seg, cap, mx, 2.05, mz);
      solid(bx0, bx1, bz0, bz1);
      // a pillar at the start of every segment (and both ends of a run)
      for (const [px, pz] of i === n - 1 ? [[sx, sz], [ex, ez]] : [[sx, sz]]) {
        b.box(0.7, 2.5, 0.7, base, px, 0, pz);
        b.box(0.85, 0.14, 0.85, cap, px, 2.5, pz);
        if (k++ % 2 === 0) b.add(new THREE.BoxGeometry(0.34, 0.45, 0.34), lamp, px, 2.86, pz);
      }
    }
  };
  run(o.x0, o.z1, o.x1, o.z1, true);
  run(o.x0, o.z0, o.x1, o.z0, false);
  run(o.x0, o.z0, o.x0, o.z1, false);
  run(o.x1, o.z0, o.x1, o.z1, false);
  // gate posts: two tall white pillars with lanterns at each opening
  for (const [a, c] of o.gates)
    for (const px of [a, c]) {
      const pz = o.z1;
      if (!o.free(px - 0.8, px + 0.8, pz - 0.8, pz + 0.8)) continue;
      b.box(1.3, 4.2, 1.3, base, px, 0, pz);
      b.box(1.6, 0.25, 1.6, cap, px, 4.2, pz);
      b.add(new THREE.BoxGeometry(0.5, 0.7, 0.5), lamp, px, 4.8, pz);
      solid(px - 0.7, px + 0.7, pz - 0.7, pz + 0.7);
    }
  // the covered car park
  colliders.push(
    ...coveredParking(b, {
      x: (P.x0 + P.x1) / 2,
      z: (P.z0 + P.z1) / 2,
      turn: 0,
      w: P.x1 - P.x0,
      d: P.z1 - P.z0,
      seed: o.seed,
    }),
  );
  // rows of palms, and lamps between them, on the open paving
  const inPark = (x: number, z: number) => x > P.x0 - 2 && x < P.x1 + 2 && z > P.z0 - 2 && z < P.z1 + 3;
  const onDrive = (x: number, z: number) => Math.abs(x - P.gate) < 7.5 && z > P.z1 - 1;
  const inSkip = (x: number, z: number) =>
    o.skip.some((s) => x > s.x0 - 2 && x < s.x1 + 2 && z > s.z0 - 2 && z < s.z1 + 2);
  const atGate = (x: number, z: number) => z > o.z1 - 6 && o.gates.some(([a, c]) => x > a - 2 && x < c + 2);
  let i = 0;
  for (let z = o.z1 - 4; z > o.z0 + 3; z -= 8)
    for (let x = o.x0 + 4; x < o.x1 - 3; x += 8) {
      i++;
      if (inPark(x, z) || onDrive(x, z) || inSkip(x, z) || atGate(x, z)) continue;
      if (i % 3 === 0) {
        if (blocked(x - 0.2, x + 0.2, z - 0.2, z + 0.2)) continue;
        b.add(new THREE.CylinderGeometry(0.08, 0.12, 4.6, 8), MAT.plain(0x2e2e2a), x, 2.3, z);
        b.add(new THREE.SphereGeometry(0.3, 10, 8), lamp, x, 4.7, z);
        solid(x - 0.2, x + 0.2, z - 0.2, z + 0.2);
      } else {
        if (blocked(x - 0.4, x + 0.4, z - 0.4, z + 0.4)) continue;
        palm(b, x, z, 1.05);
        solid(x - 0.3, x + 0.3, z - 0.3, z + 0.3);
      }
    }
  b.base.identity();
  return colliders;
}
