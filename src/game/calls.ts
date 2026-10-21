/* The phone: every player has an IlmWorld number (made from their account, so it never
   changes), a phone book to look numbers up, and voice calls between players. Calls go
   straight from phone to phone (WebRTC); Firestore only passes the "hello" between them.
   Numbers look like "IW 482 1937" so they are never mistaken for real phone numbers. */

export type PhoneEntry = { uid: string; name: string; number: string };
export type CallDoc = {
  id: string;
  from: string;
  to: string;
  fromName: string;
  toName: string;
  status: "ringing" | "answered" | "ended" | "declined" | "missed";
  at: number;
  offer?: { type: RTCSdpType; sdp: string };
  answer?: { type: RTCSdpType; sdp: string };
};
type Cand = { candidate: string; sdpMid: string | null; sdpMLineIndex: number | null };

/** The signalling between two phones (Firestore, or tabs on the dev server). */
export interface CallNet {
  uid: string;
  register(e: PhoneEntry): Promise<void>;
  lookup(number: string): Promise<PhoneEntry | null>;
  create(c: Omit<CallDoc, "id">): Promise<string>;
  update(id: string, p: Partial<CallDoc>): Promise<void>;
  watch(id: string, cb: (c: CallDoc | null) => void): () => void;
  watchIncoming(cb: (c: CallDoc[]) => void): () => void;
  addCand(id: string, side: "from" | "to", c: Cand): void;
  watchCands(id: string, side: "from" | "to", cb: (c: Cand) => void): () => void;
}

/** Your IlmWorld number. */
export function numberFor(uid: string) {
  let h = 2166136261;
  for (let i = 0; i < uid.length; i++) h = Math.imul(h ^ uid.charCodeAt(i), 16777619);
  const n = String((h >>> 0) % 10_000_000).padStart(7, "0");
  return `IW ${n.slice(0, 3)} ${n.slice(3)}`;
}
/** "iw4821937", "482 1937" … → "IW 482 1937" */
export function cleanNumber(t: string) {
  const d = t.replace(/\D/g, "");
  if (d.length !== 7) return null;
  return `IW ${d.slice(0, 3)} ${d.slice(3)}`;
}
const numKey = (n: string) => n.replace(/\s/g, "");

/* ---------------- Firestore ---------------- */
export async function connectCalls(uid: string): Promise<CallNet> {
  const { db } = await import("@/lib/firebase");
  const fs = await import("firebase/firestore");
  const { doc, setDoc, getDoc, collection, query, where, onSnapshot, addDoc, updateDoc } = fs;
  return {
    uid,
    async register(e) {
      await setDoc(doc(db, "city_phones", numKey(e.number)), { ...e, at: Date.now() });
    },
    async lookup(number) {
      const s = await getDoc(doc(db, "city_phones", numKey(number)));
      return s.exists() ? (s.data() as PhoneEntry) : null;
    },
    async create(c) {
      const r = await addDoc(collection(db, "city_calls"), c);
      return r.id;
    },
    async update(id, p) {
      await updateDoc(doc(db, "city_calls", id), p);
    },
    watch(id, cb) {
      return onSnapshot(
        doc(db, "city_calls", id),
        (s) => cb(s.exists() ? ({ ...(s.data() as CallDoc), id: s.id } as CallDoc) : null),
        () => cb(null),
      );
    },
    watchIncoming(cb) {
      return onSnapshot(
        query(
          collection(db, "city_calls"),
          where("to", "==", uid),
          where("status", "==", "ringing"),
        ),
        (s) =>
          cb(
            s.docs
              .map((d) => ({ ...(d.data() as CallDoc), id: d.id }))
              .filter((c) => !!c.offer && Date.now() - c.at < 45_000),
          ),
        () => cb([]),
      );
    },
    addCand(id, side, c) {
      void addDoc(collection(db, "city_calls", id, "cand_" + side), c).catch(() => {});
    },
    watchCands(id, side, cb) {
      const seen = new Set<string>();
      return onSnapshot(collection(db, "city_calls", id, "cand_" + side), (s) =>
        s.docs.forEach((d) => {
          if (seen.has(d.id)) return;
          seen.add(d.id);
          cb(d.data() as Cand);
        }),
      );
    },
  };
}

/* ---------------- test backend between tabs (dev only) ---------------- */
export function connectCallsLocal(uid: string): CallNet {
  const bc = new BroadcastChannel("ilmcity-calls");
  const subs = new Set<() => void>();
  const P = "ilmcity-calls-";
  const read = <T>(k: string, d: T): T => {
    try {
      return (JSON.parse(localStorage.getItem(P + k) ?? "null") as T) ?? d;
    } catch {
      return d;
    }
  };
  const write = (k: string, v: unknown) => {
    localStorage.setItem(P + k, JSON.stringify(v));
    bc.postMessage(k);
    subs.forEach((f) => f());
  };
  bc.onmessage = () => setTimeout(() => subs.forEach((f) => f()), 30);
  const sub = (fn: () => void) => {
    subs.add(fn);
    fn();
    const iv = setInterval(fn, 700);
    return () => {
      subs.delete(fn);
      clearInterval(iv);
    };
  };
  return {
    uid,
    async register(e) {
      const all = read<Record<string, PhoneEntry>>("phones", {});
      all[numKey(e.number)] = e;
      write("phones", all);
    },
    async lookup(number) {
      return read<Record<string, PhoneEntry>>("phones", {})[numKey(number)] ?? null;
    },
    async create(c) {
      const id = "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      write("call-" + id, { ...c, id });
      const ids = read<string[]>("calls", []);
      write("calls", [...ids, id].slice(-30));
      return id;
    },
    async update(id, p) {
      write("call-" + id, { ...read<CallDoc | null>("call-" + id, null), ...p });
    },
    watch(id, cb) {
      let last = "";
      return sub(() => {
        const c = read<CallDoc | null>("call-" + id, null);
        const k = JSON.stringify(c);
        if (k !== last) {
          last = k;
          cb(c);
        }
      });
    },
    watchIncoming(cb) {
      let last = "";
      return sub(() => {
        const list = read<string[]>("calls", [])
          .map((id) => read<CallDoc | null>("call-" + id, null))
          .filter(
            (c): c is CallDoc =>
              !!c &&
              !!c.offer &&
              c.to === uid &&
              c.status === "ringing" &&
              Date.now() - c.at < 45_000,
          );
        const k = list.map((c) => c.id).join();
        if (k !== last) {
          last = k;
          cb(list);
        }
      });
    },
    addCand(id, side, c) {
      const k = `cand-${id}-${side}`;
      write(k, [...read<Cand[]>(k, []), c]);
    },
    watchCands(id, side, cb) {
      let n = 0;
      return sub(() => {
        const all = read<Cand[]>(`cand-${id}-${side}`, []);
        while (n < all.length) cb(all[n++]);
      });
    },
  };
}

/* ---------------- a voice call ---------------- */
const STUN: RTCIceServer = {
  urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"],
};
/** STUN finds a direct way between phones; the TURN relay (from our server) carries the
    call when there is none, e.g. between two different mobile networks. */
async function iceConfig(): Promise<RTCConfiguration> {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 3500);
    const r = await fetch("/api/turn", { signal: ctl.signal });
    clearTimeout(t);
    const j = (await r.json()) as { iceServers?: RTCIceServer | RTCIceServer[] };
    const relays = j.iceServers
      ? Array.isArray(j.iceServers)
        ? j.iceServers
        : [j.iceServers]
      : [];
    return { iceServers: [STUN, ...relays] };
  } catch {
    return { iceServers: [STUN] };
  }
}

export type CallUi = {
  id: string;
  other: string;
  /** you rang them, or they rang you */
  outgoing: boolean;
  state: "ringing" | "connecting" | "live" | "ended";
  why?: string;
  since?: number;
  muted?: boolean;
};

export class VoiceCall {
  private pc: RTCPeerConnection | null = null;
  private mic: MediaStream | null = null;
  private audio: HTMLAudioElement | null = null;
  private offs: (() => void)[] = [];
  ui: CallUi;
  private ended = false;
  private ringTimer = 0;

  private constructor(
    private net: CallNet,
    private id: string,
    other: string,
    outgoing: boolean,
    private onUi: (u: CallUi) => void,
  ) {
    this.ui = { id, other, outgoing, state: outgoing ? "ringing" : "ringing" };
  }

  /** Ring another player. */
  static async dial(
    net: CallNet,
    me: { name: string },
    to: PhoneEntry,
    onUi: (u: CallUi) => void,
  ): Promise<VoiceCall> {
    const mic = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    const c = new VoiceCall(net, "", to.name, true, onUi);
    c.mic = mic;
    c.peer("from", "to", await iceConfig());
    const offer = await c.pc!.createOffer();
    await c.pc!.setLocalDescription(offer);
    // the call appears on their phone together with everything needed to answer it
    const id = await net.create({
      from: net.uid,
      to: to.uid,
      fromName: me.name,
      toName: to.name,
      status: "ringing",
      at: Date.now(),
      offer: { type: offer.type, sdp: offer.sdp ?? "" },
    });
    c.ready(id);
    c.offs.push(
      net.watch(id, async (d) => {
        if (!d || c.ended) return;
        if (d.answer && c.pc && !c.pc.currentRemoteDescription) {
          c.set({ state: "connecting" });
          await c.remote(d.answer);
        }
        if (d.status === "declined") c.finish("They are busy right now.");
        else if (d.status === "ended") c.finish("Call ended.");
      }),
    );
    // nobody answers in 40 seconds
    c.ringTimer = window.setTimeout(() => {
      if (c.ui.state === "ringing") {
        void net.update(id, { status: "missed" }).catch(() => {});
        c.finish("No answer.");
      }
    }, 40_000);
    c.emit();
    return c;
  }

  /** Answer a call that is ringing on your phone. */
  static async answer(net: CallNet, d: CallDoc, onUi: (u: CallUi) => void): Promise<VoiceCall> {
    const mic = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    const c = new VoiceCall(net, d.id, d.fromName, false, onUi);
    c.mic = mic;
    c.peer("to", "from", await iceConfig());
    c.ready(d.id);
    c.set({ state: "connecting" });
    await c.remote(d.offer!);
    const ans = await c.pc!.createAnswer();
    await c.pc!.setLocalDescription(ans);
    await net.update(d.id, { answer: { type: ans.type, sdp: ans.sdp ?? "" }, status: "answered" });
    c.offs.push(
      net.watch(d.id, (x) => {
        if (x?.status === "ended") c.finish("Call ended.");
      }),
    );
    return c;
  }
  static decline(net: CallNet, d: CallDoc) {
    void net.update(d.id, { status: "declined" }).catch(() => {});
  }

  private pending: Cand[] = [];
  private mine: "from" | "to" = "from";
  private theirs: "from" | "to" = "to";
  /** The call has its id: send what we gathered and listen for theirs. */
  private ready(id: string) {
    this.id = id;
    this.ui = { ...this.ui, id };
    for (const c of this.pending) this.net.addCand(id, this.mine, c);
    this.pending = [];
    const pc = this.pc!;
    this.offs.push(
      this.net.watchCands(id, this.theirs, (c) => {
        // wait until we know their side of the call before adding their routes
        if (!pc.remoteDescription) this.early.push(c);
        else void pc.addIceCandidate(c).catch(() => {});
      }),
    );
  }
  private early: Cand[] = [];
  private async remote(d: RTCSessionDescriptionInit) {
    const pc = this.pc!;
    await pc.setRemoteDescription(d);
    for (const c of this.early) await pc.addIceCandidate(c).catch(() => {});
    this.early = [];
  }
  private peer(mine: "from" | "to", theirs: "from" | "to", ice: RTCConfiguration) {
    const pc = new RTCPeerConnection(ice);
    this.pc = pc;
    this.mine = mine;
    this.theirs = theirs;
    this.mic?.getTracks().forEach((t) => pc.addTrack(t, this.mic!));
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        const j = e.candidate.toJSON();
        const c = {
          candidate: j.candidate ?? "",
          sdpMid: j.sdpMid ?? null,
          sdpMLineIndex: j.sdpMLineIndex ?? null,
        };
        if (this.id) this.net.addCand(this.id, mine, c);
        else this.pending.push(c);
      }
    };
    pc.ontrack = (e) => {
      if (!this.audio) {
        this.audio = new Audio();
        this.audio.autoplay = true;
      }
      this.audio.srcObject = e.streams[0];
      void this.audio.play().catch(() => {});
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") this.set({ state: "live", since: Date.now() });
      else if (pc.connectionState === "failed") this.finish("The line is bad. Try again later.");
      else if (pc.connectionState === "disconnected")
        setTimeout(() => {
          if (pc.connectionState === "disconnected") this.finish("Call dropped.");
        }, 4000);
    };
  }

  mute(on: boolean) {
    this.mic?.getAudioTracks().forEach((t) => (t.enabled = !on));
    this.set({ muted: on });
  }
  hangUp() {
    void this.net.update(this.id, { status: "ended" }).catch(() => {});
    this.finish("Call ended.");
  }
  private set(p: Partial<CallUi>) {
    this.ui = { ...this.ui, ...p };
    this.emit();
  }
  private emit() {
    this.onUi({ ...this.ui });
  }
  private finish(why: string) {
    if (this.ended) return;
    this.ended = true;
    clearTimeout(this.ringTimer);
    this.offs.forEach((f) => f());
    this.pc?.close();
    this.mic?.getTracks().forEach((t) => t.stop());
    if (this.audio) this.audio.srcObject = null;
    this.set({ state: "ended", why });
  }
}
