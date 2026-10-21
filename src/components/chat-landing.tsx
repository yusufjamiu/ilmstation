import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { PublicShell } from "@/components/public-site";
import { useAuth } from "@/components/auth";
import { audienceLabel, useRooms } from "@/components/chatrooms";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ChatLandingPage() {
  const { loggedIn } = useAuth();
  const { rooms, loaded } = useRooms();
  const [zone, setZone] = useState<"adult" | "youth">("adult");
  const [find, setFind] = useState("");
  const [pick, setPick] = useState<string | null>(null);
  const list = useMemo(() => rooms.filter((r) => r.active && r.zone === zone && `${r.name} ${r.topic}`.toLowerCase().includes(find.toLowerCase())), [rooms, zone, find]);
  const room = list.find((r) => r.id === pick) ?? list[0];

  return <PublicShell><main className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-bold uppercase text-secondary">Thoughtful spaces, shared adab</p><h1 className="font-serif text-6xl">Chatrooms</h1></div>
      <p className="max-w-md text-sm text-muted-foreground">Join moderated rooms for reflection and learning. Sign up to take part in the conversation.</p>
    </div>
    <div className="mt-6 flex gap-2"><Button size="sm" variant={zone === "adult" ? "default" : "outline"} onClick={() => setZone("adult")}>Adult Zone</Button><Button size="sm" variant={zone === "youth" ? "default" : "outline"} onClick={() => setZone("youth")}>Youth Zone</Button></div>
    <div className="mt-4 grid min-h-[28rem] border-2 border-foreground bg-background shadow-brutal md:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="border-b-2 border-foreground md:border-b-0 md:border-r-2">
        <div className="p-4"><label className="flex h-11 items-center gap-2 border-2 border-foreground px-3"><Search className="size-4 shrink-0" /><input value={find} onChange={(e) => setFind(e.target.value)} placeholder="Find a room" aria-label="Find a room" className="w-full bg-transparent outline-none" /></label></div>
        <ul className="border-t-2 border-foreground">
          {list.map((r) => <li key={r.id}><button type="button" onClick={() => setPick(r.id)} className={cn("block w-full border-b-2 border-foreground px-5 py-4 text-left", room?.id === r.id ? "bg-primary" : "hover:bg-muted")}>
            <b className="block font-serif text-2xl font-normal leading-tight">{r.name}</b>
            <small className="text-xs font-semibold text-muted-foreground">{r.memberCount ?? 0} members · {r.topic}{audienceLabel(r.audience) ? ` · ${audienceLabel(r.audience)}` : ""}</small>
          </button></li>)}
          {!list.length && <li className="p-5 text-sm text-muted-foreground">{loaded ? "No rooms match." : "Loading rooms…"}</li>}
        </ul>
      </aside>
      <section className="flex min-w-0 flex-col">
        {room ? <>
          <div className="border-b-2 border-foreground px-6 py-4"><h2 className="font-serif text-3xl">{room.name}</h2><p className="text-sm text-muted-foreground">{room.note} · {room.memberCount ?? 0} members{audienceLabel(room.audience) ? ` · ${audienceLabel(room.audience)}` : ""}</p></div>
          <div className="flex flex-1 items-center justify-center bg-muted/30 p-8">
            <div className="max-w-md text-center">
              <p className="font-serif text-3xl">The conversation happens inside IlmStation.</p>
              <p className="mt-2 text-sm text-muted-foreground">Rooms are moderated and kept to good adab. Create a free account to join {room.name}.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {loggedIn ? <Button asChild><Link to="/app">Open in the app</Link></Button> : <><Button asChild><Link to="/signup">Sign up to join</Link></Button><Button asChild variant="outline"><Link to="/login">Log in</Link></Button></>}
              </div>
            </div>
          </div>
        </> : <p className="p-8 text-sm text-muted-foreground">{loaded ? "Rooms are being set up. Please check back soon." : "Loading rooms…"}</p>}
      </section>
    </div>
  </main></PublicShell>;
}
