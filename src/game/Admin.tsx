import { useEffect, useState, type ReactNode } from "react";
import type { User } from "firebase/auth";
import type { AdRequest, Award, Enquiry, Nasheed } from "./live";
import { connectHomes, weekKey, type ShownHome } from "./homes";
import { AD_PRICES } from "./live";

/* IlmWorld admin: reports and fines, billboard adverts, the Saturday best-home award,
   questions sent to the MSSN, and nasheeds. Only accounts listed in the Firestore
   `admins` collection can use it. */

type Report = {
  id: string;
  reporter: string;
  reported: string;
  reportedName: string;
  reason: string;
  details: string;
  messages?: { from: string; text: string }[];
  at: number;
  status: string;
  fine?: number;
};

async function fb() {
  const { auth, db, app } = await import("@/lib/firebase");
  const f = await import("firebase/firestore");
  const a = await import("firebase/auth");
  return { auth, db, app, ...f, onAuthStateChanged: a.onAuthStateChanged };
}

/** Cloudinary for nasheed uploads: set these two in Vercel's environment variables. */
const CLOUD = {
  name: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined,
  preset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined,
};
const naira = (n: number) => "₦" + n.toLocaleString("en-NG");
const when = (t: number) =>
  new Date(t).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function Admin() {
  const [state, setState] = useState<"loading" | "out" | "no" | "yes">("loading");
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<"reports" | "ads" | "award" | "mssn" | "nasheeds">("reports");
  useEffect(() => {
    let off = () => {};
    fb()
      .then(({ auth, db, doc, getDoc, onAuthStateChanged }) => {
        off = onAuthStateChanged(auth, async (u) => {
          setUser(u);
          if (!u) return setState("out");
          const ok = await getDoc(doc(db, "admins", u.uid))
            .then((d) => d.exists())
            .catch(() => false);
          setState(ok ? "yes" : "no");
        });
      })
      .catch(() => setState("out"));
    return () => off();
  }, []);

  if (state === "loading") return <Shell>Checking your account…</Shell>;
  if (state === "out")
    return (
      <Shell>
        <p>Log in with your IlmStation admin account.</p>
        <a
          href="/login"
          className="mt-3 inline-block rounded-xl bg-[#1f6f63] px-5 py-3 font-bold text-white"
        >
          Log in
        </a>
      </Shell>
    );
  if (state === "no")
    return (
      <Shell>
        <p>
          This account ({user?.email}) is not an IlmWorld admin. Add its user ID to the{" "}
          <code>admins</code> collection in Firestore:
        </p>
        <code className="mt-2 block select-all rounded-lg bg-white p-3 text-[13px]">
          {user?.uid}
        </code>
      </Shell>
    );
  const tabs: [typeof tab, string][] = [
    ["reports", "🚩 Reports"],
    ["ads", "📣 Adverts"],
    ["award", "🏆 Award"],
    ["mssn", "❓ MSSN"],
    ["nasheeds", "🎵 Nasheeds"],
  ];
  return (
    <Shell wide>
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-xl px-4 py-2 text-[14px] font-bold ${tab === k ? "bg-[#1f6f63] text-white" : "bg-white"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "reports" && <Reports />}
      {tab === "ads" && <Ads />}
      {tab === "award" && <AwardTab />}
      {tab === "mssn" && <Mssn />}
      {tab === "nasheeds" && <Nasheeds />}
    </Shell>
  );
}

function Shell({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-[100dvh] bg-[#f4efe2] px-4 py-6 font-[Work_Sans,system-ui,sans-serif] text-[#10201e]">
      <div className={`mx-auto ${wide ? "max-w-3xl" : "max-w-md"}`}>
        <h1 className="mb-4 font-serif text-3xl">
          Ilm<span className="text-[#1f6f63]">World</span> admin
        </h1>
        {children}
      </div>
    </div>
  );
}

/** Live list of a collection, newest first. */
function useList<T>(name: string) {
  const [items, setItems] = useState<T[] | null>(null);
  useEffect(() => {
    let off = () => {};
    fb()
      .then(({ db, collection, query, orderBy, limit, onSnapshot }) => {
        off = onSnapshot(
          query(collection(db, name), orderBy("at", "desc"), limit(100)),
          (snap) => setItems(snap.docs.map((d) => ({ ...(d.data() as T), id: d.id }))),
          () => setItems([]),
        );
      })
      .catch(() => setItems([]));
    return () => off();
  }, [name]);
  return items;
}

const card = "rounded-2xl bg-white p-4 shadow-sm";
const btn = "rounded-lg px-3 py-2 text-[13px] font-bold";

function Empty({ items, text }: { items: unknown[] | null; text: string }) {
  if (items === null) return <p className="opacity-60">Loading…</p>;
  if (!items.length) return <p className="opacity-60">{text}</p>;
  return null;
}

function Reports() {
  const items = useList<Report>("city_reports");
  const act = async (r: Report, fine: number | null) => {
    const { db, doc, setDoc, updateDoc } = await fb();
    if (fine)
      await setDoc(
        doc(db, "city_players", r.reported),
        { fine, fineReason: r.reason },
        { merge: true },
      );
    await updateDoc(doc(db, "city_reports", r.id), {
      status: fine ? "fined" : "dismissed",
      fine: fine ?? 0,
    });
  };
  return (
    <div className="space-y-3">
      <Empty items={items} text="No reports. Alhamdulillah." />
      {items?.map((r) => (
        <div key={r.id} className={card}>
          <div className="flex items-center justify-between gap-2">
            <b>{r.reportedName}</b>
            <span className="text-[12px] opacity-60">{when(r.at)}</span>
          </div>
          <div className="text-[14px]">
            <span className="font-semibold">{r.reason}</span>
            {r.details ? ` · ${r.details}` : ""}
          </div>
          {r.messages && r.messages.length > 0 && (
            <div className="mt-2 max-h-40 space-y-1 overflow-auto rounded-lg bg-[#f4efe2] p-2 text-[13px]">
              {r.messages.map((m, i) => (
                <div key={i}>
                  <b>{m.from === r.reported ? r.reportedName : "Reporter"}:</b> {m.text}
                </div>
              ))}
            </div>
          )}
          {r.status === "open" ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => act(r, 200)} className={`${btn} bg-[#b8573a] text-white`}>
                Fine ₦200
              </button>
              <button onClick={() => act(r, 500)} className={`${btn} bg-[#7a2e22] text-white`}>
                Fine ₦500
              </button>
              <button onClick={() => act(r, null)} className={`${btn} bg-[#e9e4d8]`}>
                Dismiss
              </button>
            </div>
          ) : (
            <div className="mt-2 text-[13px] font-semibold text-[#1f6f63]">
              {r.status === "fined" ? `Fined ${naira(r.fine ?? 0)}` : "Dismissed"}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Ads() {
  const items = useList<AdRequest>("city_ads");
  const set = async (a: AdRequest, status: AdRequest["status"]) => {
    const { db, doc, updateDoc } = await fb();
    await updateDoc(doc(db, "city_ads", a.id), {
      status,
      ...(status === "approved" ? { until: Date.now() + AD_PRICES[a.plan].days * 86400000 } : {}),
    });
  };
  return (
    <div className="space-y-3">
      <p className="text-[13px] opacity-75">
        Confirm the advertiser has paid ({naira(AD_PRICES.week.naira)} a week,{" "}
        {naira(AD_PRICES.month.naira)} a month) before you approve. Approved adverts appear on their
        billboard straight away.
      </p>
      <Empty items={items} text="No advert requests yet." />
      {items?.map((a) => (
        <div key={a.id} className={card}>
          <div className="flex items-center justify-between gap-2">
            <b>{a.boardName}</b>
            <span className="text-[12px] opacity-60">{when(a.at)}</span>
          </div>
          {a.imageUrl ? (
            <img src={a.imageUrl} alt="" className="mt-2 w-full rounded-lg" />
          ) : (
            <div className="mt-2 rounded-lg bg-[#1f6f63] p-3 text-white">
              <div className="text-[11px] uppercase opacity-80">{a.brand}</div>
              <div className="text-xl font-extrabold">{a.headline}</div>
              <div className="text-[13px]">{a.line}</div>
            </div>
          )}
          <div className="mt-2 text-[13px]">
            By <b>{a.fromName}</b> · {a.plan === "week" ? "1 week" : "1 month"} (
            {naira(AD_PRICES[a.plan].naira)}) · contact: <b className="select-all">{a.contact}</b>
            {a.link ? (
              <>
                {" "}
                · link:{" "}
                <a href={a.link} target="_blank" rel="noreferrer" className="underline">
                  {a.link}
                </a>
              </>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {a.status !== "approved" && (
              <button
                onClick={() => set(a, "approved")}
                className={`${btn} bg-[#1f6f63] text-white`}
              >
                Paid · approve
              </button>
            )}
            {a.status !== "rejected" && (
              <button onClick={() => set(a, "rejected")} className={`${btn} bg-[#e9e4d8]`}>
                {a.status === "approved" ? "Take down" : "Reject"}
              </button>
            )}
            <span className="text-[13px] font-semibold">
              {a.status === "approved"
                ? `Live until ${a.until ? when(a.until) : "—"}`
                : a.status === "rejected"
                  ? "Not shown"
                  : "Waiting"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function AwardTab() {
  const items = useList<Award>("city_awards");
  const [f, setF] = useState({ winner: "", home: "", note: "May Allah bless your home!" });
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    const { db, collection, addDoc } = await fb();
    await addDoc(collection(db, "city_awards"), {
      ...f,
      week: new Date().toISOString().slice(0, 10),
      at: Date.now(),
    });
    setF({ winner: "", home: "", note: "May Allah bless your home!" });
    setBusy(false);
  };
  return (
    <div className="space-y-3">
      <div className={card}>
        <b>Best furnished home · every Saturday</b>
        <p className="text-[13px] opacity-75">
          Every player sees the winner when they next open IlmWorld. Pick from the most liked homes
          this week (week ending {weekKey()}), or type a name.
        </p>
        <TopHomes onPick={(h) => setF({ ...f, winner: h.name, home: h.place })} />
        {(["winner", "home", "note"] as const).map((k) => (
          <label key={k} className="mt-2 block text-[13px]">
            <span className="font-semibold">
              {k === "winner"
                ? "Player's name"
                : k === "home"
                  ? "Their home (e.g. No. 12, Sabr Avenue, Lekki)"
                  : "Message"}
            </span>
            <input
              value={f[k]}
              onChange={(e) => setF({ ...f, [k]: e.target.value })}
              className="mt-0.5 w-full rounded-lg border border-[#10201e]/15 px-2.5 py-2 text-[14px]"
            />
          </label>
        ))}
        <button
          disabled={!f.winner.trim() || busy}
          onClick={save}
          className={`${btn} mt-3 w-full bg-[#1f6f63] py-3 text-white disabled:opacity-40`}
        >
          Announce the winner
        </button>
      </div>
      {items?.map((a) => (
        <div key={a.id} className={card}>
          🏆 <b>{a.winner}</b> {a.home && `· ${a.home}`}
          <div className="text-[12px] opacity-60">{a.week}</div>
        </div>
      ))}
    </div>
  );
}

function TopHomes({ onPick }: { onPick: (h: ShownHome) => void }) {
  const [list, setList] = useState<ShownHome[] | null>(null);
  useEffect(() => {
    let off = () => {};
    let live = true;
    connectHomes()
      .then((h) => {
        if (live) off = h.top(setList);
      })
      .catch(() => setList([]));
    return () => {
      live = false;
      off();
    };
  }, []);
  if (!list) return <p className="mt-2 text-[13px] opacity-60">Loading homes…</p>;
  const top = list.filter((h) => h.likes > 0).slice(0, 5);
  if (!top.length) return <p className="mt-2 text-[13px] opacity-60">No likes yet this week.</p>;
  return (
    <div className="mt-2 space-y-1.5">
      {top.map((h, i) => (
        <div
          key={h.uid}
          className="flex items-center gap-2 rounded-lg bg-[#10201e]/5 px-2.5 py-1.5 text-[13px]"
        >
          <b className="w-5">{i + 1}.</b>
          <span className="flex-1">
            <b>{h.name}</b> · {h.place} · {h.items.length} items
          </span>
          <span>❤️ {h.likes}</span>
          <button
            onClick={() => onPick(h)}
            className="rounded-md bg-[#1f6f63] px-2 py-1 text-[12px] font-bold text-white"
          >
            Pick
          </button>
        </div>
      ))}
    </div>
  );
}

function Mssn() {
  const items = useList<Enquiry>("city_enquiries");
  const [draft, setDraft] = useState<Record<string, string>>({});
  const answer = async (q: Enquiry) => {
    const text = (draft[q.id] ?? "").trim();
    if (!text) return;
    const { db, doc, updateDoc } = await fb();
    await updateDoc(doc(db, "city_enquiries", q.id), { answer: text, status: "answered" });
  };
  return (
    <div className="space-y-3">
      <Empty items={items} text="No questions yet." />
      {items?.map((q) => (
        <div key={q.id} className={card}>
          <div className="flex items-center justify-between gap-2">
            <b>{q.name}</b>
            <span className="text-[12px] opacity-60">
              {q.place} · {when(q.at)}
            </span>
          </div>
          <p className="mt-1 text-[14px]">❓ {q.text}</p>
          {q.answer ? (
            <p className="mt-1 text-[14px] text-[#1f6f63]">💬 {q.answer}</p>
          ) : (
            <div className="mt-2 flex gap-2">
              <input
                value={draft[q.id] ?? ""}
                onChange={(e) => setDraft({ ...draft, [q.id]: e.target.value })}
                placeholder="Your answer"
                className="min-w-0 flex-1 rounded-lg border border-[#10201e]/15 px-2.5 py-2 text-[14px]"
              />
              <button onClick={() => answer(q)} className={`${btn} bg-[#1f6f63] text-white`}>
                Reply
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Nasheeds() {
  const items = useList<Nasheed>("city_nasheeds");
  const [f, setF] = useState({ title: "", artist: "", url: "", ok: false });
  const [busy, setBusy] = useState("");
  const add = async () => {
    setBusy("Saving…");
    try {
      const { db, collection, addDoc } = await fb();
      await addDoc(collection(db, "city_nasheeds"), {
        title: f.title.trim(),
        artist: f.artist.trim(),
        url: f.url.trim(),
        at: Date.now(),
      });
      setF({ title: "", artist: "", url: "", ok: false });
      setBusy("");
    } catch (e) {
      setBusy("Could not save: " + (e as Error).message);
    }
  };
  const remove = async (n: Nasheed) => {
    const { db, doc, deleteDoc } = await fb();
    await deleteDoc(doc(db, "city_nasheeds", n.id));
  };
  const input = "mt-0.5 w-full rounded-lg border border-[#10201e]/15 px-2.5 py-2 text-[14px]";
  return (
    <div className="space-y-3">
      <div className={card}>
        <b>Add a nasheed</b>
        <p className="text-[13px] opacity-75">
          Paste a direct link to the audio file (ending in .mp3 or .m4a). Only add nasheeds you have
          permission to use, with no musical instruments. Press play below to check the link works.
        </p>
        <label className="mt-2 block text-[13px]">
          <span className="font-semibold">Title</span>
          <input
            value={f.title}
            onChange={(e) => setF({ ...f, title: e.target.value })}
            className={input}
          />
        </label>
        <label className="mt-2 block text-[13px]">
          <span className="font-semibold">Munshid</span>
          <input
            value={f.artist}
            onChange={(e) => setF({ ...f, artist: e.target.value })}
            className={input}
          />
        </label>
        <label className="mt-2 block text-[13px]">
          <span className="font-semibold">Audio link</span>
          <input
            value={f.url}
            placeholder="https://ilmstation.com/ilmcity/nasheed/….mp3"
            onChange={(e) => setF({ ...f, url: e.target.value })}
            className={input}
          />
        </label>
        {CLOUD.name && CLOUD.preset && (
          <label className="mt-2 block text-[13px]">
            <span className="font-semibold">…or upload the audio file (Cloudinary)</span>
            <input
              type="file"
              accept="audio/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setBusy("Uploading…");
                try {
                  const body = new FormData();
                  body.append("file", file);
                  body.append("upload_preset", CLOUD.preset!);
                  body.append("folder", "ilmworld/nasheeds");
                  const r = await fetch(
                    `https://api.cloudinary.com/v1_1/${CLOUD.name}/video/upload`,
                    { method: "POST", body },
                  );
                  const j = (await r.json()) as {
                    secure_url?: string;
                    error?: { message: string };
                  };
                  if (!j.secure_url) throw new Error(j.error?.message ?? "upload failed");
                  setF((x) => ({ ...x, url: j.secure_url! }));
                  setBusy("");
                } catch (err) {
                  setBusy("Upload failed: " + (err as Error).message);
                }
              }}
              className="mt-0.5 block w-full text-[13px]"
            />
          </label>
        )}
        {/^https:\/\//.test(f.url) && <audio controls src={f.url} className="mt-2 w-full" />}
        <label className="mt-2 flex items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            checked={f.ok}
            onChange={(e) => setF({ ...f, ok: e.target.checked })}
          />
          I have permission to use this nasheed in IlmWorld
        </label>
        <button
          disabled={!f.title.trim() || !/^https:\/\//.test(f.url) || !f.ok || busy.endsWith("…")}
          onClick={add}
          className={`${btn} mt-3 w-full bg-[#1f6f63] py-3 text-white disabled:opacity-40`}
        >
          Add nasheed
        </button>
        {busy && <p className="mt-2 text-[13px]">{busy}</p>}
      </div>
      <Empty items={items} text="No nasheeds yet." />
      {items?.map((n) => (
        <div key={n.id} className={`${card} flex items-center gap-3`}>
          <div className="min-w-0 flex-1">
            <b>{n.title}</b>
            <div className="text-[12px] opacity-70">{n.artist}</div>
            <audio controls src={n.url} className="mt-1 w-full" />
          </div>
          <button onClick={() => remove(n)} className={`${btn} bg-[#e9e4d8]`}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
