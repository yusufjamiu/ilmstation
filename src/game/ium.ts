/* The Islamic University of Madinah: its striped twin-arch main gate, the colleges with
   their names in Arabic and English, and the student hostels inside the campus. */
import * as THREE from "three";
import { Batch, MAT, MAT2, groundGeo, type Box } from "./buildings";

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
export function iumForecourt(b: Batch, z0: number, z1: number) {
  const colliders: Box[] = [];
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
