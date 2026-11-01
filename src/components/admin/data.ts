import { centres as siteCentres, events as siteEvents } from "@/components/public-site";
import { quizQuestionsFor, visualQuestions, type VisualKind } from "@/components/quiz-visual";
import type { PlanId } from "@/components/premium";

/* Seed data for the admin. Deterministic (no Math.random / Date.now) so the
   server render and first client render agree. */

export type Plan = "free" | PlanId;
export type Role = "learner" | "guardian" | "teacher";
export type UserStatus = "active" | "suspended" | "invited";
export type AdminUser = {
  id: string; name: string; email: string; role: Role; plan: Plan; status: UserStatus;
  city: string; joined: string; lastActive: string; streak: number; xp: number; kids: number; hifzJuz: number;
};

const first = ["Abdullah", "Aisha", "Yusuf", "Fatimah", "Bilal", "Khadijah", "Umar", "Zainab", "Ibrahim", "Hafsah", "Musa", "Ruqayyah", "Ali", "Safiyyah", "Hamza", "Maryam", "Idris", "Sumayyah", "Harun", "Asma", "Tariq", "Halimah", "Sulaiman", "Amina"];
const last = ["Bello", "Abdullahi", "Lawal", "Ibrahim", "Sani", "Okafor", "Adeyemi", "Musa", "Usman", "Balogun", "Yusuf", "Danjuma"];
const cities = ["Lagos", "Abuja", "Kano", "Ibadan", "Kaduna", "Ilorin"];
const planCycle: Plan[] = ["free", "free", "individual", "free", "family2", "free", "individual", "family5", "free", "custom", "free", "individual"];
const roleCycle: Role[] = ["learner", "learner", "guardian", "learner", "teacher", "learner", "guardian", "learner"];

export const seedUsers: AdminUser[] = Array.from({ length: 36 }, (_, i) => {
  const name = `${first[i % first.length]} ${last[(i * 5) % last.length]}`;
  const plan = planCycle[i % planCycle.length] ?? "free";
  const role = plan === "family2" || plan === "family5" ? "guardian" : roleCycle[i % roleCycle.length] ?? "learner";
  const day = 1 + ((i * 7) % 28);
  return {
    id: `u${100 + i}`, name, email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@mail.ng`, role, plan,
    status: i % 13 === 5 ? "suspended" : i % 11 === 9 ? "invited" : "active",
    city: cities[i % cities.length] ?? "Lagos",
    joined: `2026-${String(1 + (i % 9)).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    lastActive: `2026-10-${String(26 - (i % 20)).padStart(2, "0")}`,
    streak: (i * 13) % 45, xp: 400 + ((i * 937) % 9200),
    kids: plan === "family2" ? 1 + (i % 2) : plan === "family5" ? 2 + (i % 4) : plan === "custom" ? 12 : 0,
    hifzJuz: (i * 3) % 7 === 0 ? 0 : (i * 3) % 7,
  };
});

export type Difficulty = "Beginner" | "Intermediate" | "Advanced";
export type Audience = "adults" | "kids" | "both";
export type AdminQuestion = {
  id: string; topic: string; q: string; options: string[]; answer: number; why: string; visual: VisualKind;
  difficulty: Difficulty; audience: Audience; status: "published" | "draft";
};
export const topics = Object.keys(visualQuestions);
export const visualKinds: VisualKind[] = ["arabic", "prayer", "seerah", "fiqh", "quran", "hadith", "aqeedah", "dua", "tafsir"];

export const seedQuestions: AdminQuestion[] = topics.flatMap((topic, t) => quizQuestionsFor(topic).map((q, i) => ({
  ...q, options: [...q.options], id: `q${t}${i}`, topic,
  difficulty: (["Beginner", "Intermediate", "Advanced"] as const)[i % 3] ?? "Beginner",
  audience: i === 0 ? "both" : "adults",
  status: "published",
})));

export type EventStatus = "published" | "draft" | "cancelled";
export type AdminEvent = {
  id: string; title: string; speaker: string; topic: string; format: string; location: string;
  date: string; time: string; total: number; booked: number; price: number; earlyBird: number; status: EventStatus;
};
const months: Record<string, string> = { SEP: "09", OCT: "10", NOV: "11", DEC: "12" };
export const seedEvents: AdminEvent[] = [
  ...siteEvents.map((e) => ({
    id: e.id, title: e.title, speaker: e.speaker, topic: e.topic, format: e.format, location: e.location,
    date: `2026-${months[e.month] ?? "10"}-${e.day}`, time: e.time, total: e.total, booked: e.total - e.seats,
    price: e.price, earlyBird: e.price ? Math.round(e.price * 0.8) : 0, status: "published" as EventStatus,
  })),
  { id: "zakah", title: "Zakah Made Simple", speaker: "Ustadh Ibrahim Sani", topic: "Fiqh", format: "Live online", location: "Zoom room", date: "2026-11-15", time: "5:00 PM WAT", total: 200, booked: 0, price: 1500, earlyBird: 1000, status: "draft" },
];

export type Registration = { id: string; eventId: string; name: string; email: string; tickets: number; paid: number; status: "confirmed" | "pending" | "refunded" };
export const seedRegistrations: Registration[] = seedUsers.slice(0, 18).map((u, i) => {
  const ev = seedEvents[i % 4] ?? seedEvents[0]!;
  const tickets = 1 + (i % 3 === 0 ? 1 : 0);
  return { id: `r${i}`, eventId: ev.id, name: u.name, email: u.email, tickets, paid: ev.price * tickets, status: i % 7 === 3 ? "pending" : i % 9 === 8 ? "refunded" : "confirmed" };
});

export type AdminCentre = { id: string; name: string; city: string; address: string; status: string; schedule: string; places: number; capacity: number; programmes: string[]; lead: string };
const leads = ["Ustadh Musa Abdullahi", "Ustadhah Hafsah Lawal", "Hafidh Ahmad Bello", "Shaykh Idris Usman"];
export const seedCentres: AdminCentre[] = siteCentres.map((c, i) => ({
  id: c.id, name: c.name, city: c.city, address: c.address, status: c.status, schedule: c.schedule,
  places: c.places, capacity: [60, 40, 90, 50][i] ?? 50, programmes: [...c.programmes], lead: leads[i] ?? "Unassigned",
}));
export const centreStatuses = ["Enrolling now", "Limited places", "Waitlist", "Closed"];

export type Room = { id: string; name: string; topic: string; members: number; online: number; description: string; locked: boolean; kids: boolean };
export const seedRooms: Room[] = [
  { id: "daily", name: "Daily Ayah Reflection", topic: "Qur’an", members: 248, online: 38, description: "One ayah, one reflection, every day.", locked: false, kids: false },
  { id: "sisters", name: "Sisters’ Study Circle", topic: "Community", members: 184, online: 21, description: "A welcoming space for questions and shared notes.", locked: false, kids: false },
  { id: "arabic", name: "Arabic Practice Room", topic: "Arabic", members: 126, online: 16, description: "Build vocabulary through short daily prompts.", locked: false, kids: false },
  { id: "parents", name: "Muslim Parents’ Corner", topic: "Family", members: 97, online: 12, description: "Practical conversations for intentional homes.", locked: false, kids: false },
  { id: "kids-circle", name: "Little Learners Circle", topic: "Kids", members: 64, online: 0, description: "Teacher-led kids circle. No private messages.", locked: true, kids: true },
];

export type Report = { id: string; roomId: string; author: string; text: string; reason: string; reporter: string; at: string; status: "open" | "kept" | "removed" };
export const seedReports: Report[] = [
  { id: "m1", roomId: "daily", author: "Tariq Okafor", text: "Join my channel for free Qur’an PDFs, link in bio!!", reason: "Spam / promotion", reporter: "Aisha Abdullahi", at: "2026-10-26 08:14", status: "open" },
  { id: "m2", roomId: "sisters", author: "Halimah Musa", text: "Does anyone have notes from last week’s fiqh session?", reason: "Off-topic", reporter: "Zainab Usman", at: "2026-10-25 19:42", status: "open" },
  { id: "m3", roomId: "arabic", author: "Harun Sani", text: "This is a stupid question honestly, just google it.", reason: "Unkind language", reporter: "Asma Bello", at: "2026-10-25 16:03", status: "open" },
  { id: "m4", roomId: "parents", author: "Idris Balogun", text: "WhatsApp me on 0803… for private tutoring deals", reason: "Sharing contact details", reporter: "Fatimah Lawal", at: "2026-10-24 11:20", status: "removed" },
  { id: "m5", roomId: "daily", author: "Bilal Ibrahim", text: "Here is a reflection on 2:286 that helped me this week.", reason: "Unverified source", reporter: "Umar Adeyemi", at: "2026-10-23 21:10", status: "kept" },
];

export type SponsorStatus = "new" | "contacted" | "active" | "declined";
export type Sponsor = { id: string; name: string; email: string; org: string; tier: "learner" | "circle" | "centre"; learners: number; monthly: number; status: SponsorStatus; at: string; note: string };
export const sponsorTiers = { learner: "Sponsor a learner", circle: "Fund a circle", centre: "Partner a centre" } as const;
export const seedSponsors: Sponsor[] = [
  { id: "s1", name: "Alhaji Kabir Danjuma", email: "kabir@danjuma.ng", org: "", tier: "learner", learners: 3, monthly: 15000, status: "active", at: "2026-08-12", note: "Prefers quarterly impact letters." },
  { id: "s2", name: "Ngozi Adeyemi", email: "csr@crescentbank.ng", org: "Crescent Bank CSR", tier: "centre", learners: 120, monthly: 600000, status: "contacted", at: "2026-10-20", note: "Wants naming rights on Abuja programme." },
  { id: "s3", name: "Masjid an-Nur Committee", email: "nur@masjid.ng", org: "Masjid an-Nur", tier: "circle", learners: 15, monthly: 75000, status: "active", at: "2026-07-03", note: "" },
  { id: "s4", name: "Yusuf Balogun", email: "yusuf.b@mail.ng", org: "", tier: "learner", learners: 1, monthly: 5000, status: "new", at: "2026-10-25", note: "" },
  { id: "s5", name: "Fatimah Sani", email: "fatimah@sani.org", org: "Sani Family Waqf", tier: "circle", learners: 30, monthly: 150000, status: "new", at: "2026-10-24", note: "Asked about Kano circles." },
  { id: "s6", name: "Bright Path Schools", email: "admin@brightpath.ng", org: "Bright Path Schools", tier: "centre", learners: 80, monthly: 400000, status: "declined", at: "2026-06-18", note: "Budget moved to next year." },
];

export const planPrices: Record<Plan, number> = { free: 0, individual: 3500, family2: 6000, family5: 10000, custom: 45000 };
export const planNames: Record<Plan, string> = { free: "Free", individual: "Individual", family2: "Family · 2", family5: "Family · 5", custom: "Custom" };

export type Payment = { id: string; user: string; plan: Plan; amount: number; status: "paid" | "failed" | "refunded"; date: string };
export const seedPayments: Payment[] = seedUsers.filter((u) => u.plan !== "free").map((u, i) => ({
  id: `p${i}`, user: u.name, plan: u.plan, amount: planPrices[u.plan], status: i % 8 === 6 ? "failed" : i % 11 === 10 ? "refunded" : "paid",
  date: `2026-10-${String(1 + ((i * 3) % 25)).padStart(2, "0")}`,
}));

export type Surface = "app" | "web" | "both";
export type Announcement = { id: string; title: string; body: string; surface: Surface; audience: "everyone" | "premium" | "guardians" | "kids"; status: "draft" | "live" | "ended"; start: string; end: string };
export const seedAnnouncements: Announcement[] = [
  { id: "a1", title: "Ramadan Quest opens in 24 days", body: "Set your intention and join the 30-day quest chain.", surface: "app", audience: "everyone", status: "live", start: "2026-10-20", end: "2026-11-20" },
  { id: "a2", title: "Seerah Walk — 12 seats left", body: "Join Shaykh Musa in Lekki for lessons from Madinah.", surface: "web", audience: "everyone", status: "live", start: "2026-10-15", end: "2026-11-04" },
  { id: "a3", title: "New: Play Pass for kids", body: "Give your child 60 minutes of Kids Mode on any device.", surface: "both", audience: "guardians", status: "draft", start: "2026-11-01", end: "2026-11-30" },
];

export type Flag = { key: string; label: string; description: string; surface: Surface; on: boolean };
export const seedFlags: Flag[] = [
  { key: "ilmbot", label: "IlmBot", description: "AI study companion in the app.", surface: "app", on: true },
  { key: "ilmbot_junior", label: "IlmBot Junior", description: "Filtered bot inside Kids Mode.", surface: "app", on: true },
  { key: "duels", label: "Live duels", description: "Challenge a friend to real-time quizzes.", surface: "app", on: true },
  { key: "play_pass", label: "Play Pass", description: "Guardian-issued 60-minute kids codes.", surface: "app", on: true },
  { key: "hifz_reminders", label: "Hifz reminders", description: "In-app and calendar revision reminders.", surface: "app", on: true },
  { key: "ramadan", label: "Ramadan hub", description: "Seasonal Ramadan screen and quest chain.", surface: "both", on: false },
  { key: "event_payments", label: "Paid event tickets", description: "Show prices and checkout on events.", surface: "web", on: true },
  { key: "chatrooms", label: "Public chatrooms", description: "Community rooms on the website.", surface: "web", on: true },
  { key: "sponsorship", label: "Sponsorship section", description: "Sponsor block on the landing page.", surface: "web", on: true },
  { key: "maintenance", label: "Maintenance mode", description: "Show a maintenance banner everywhere.", surface: "both", on: false },
];

export type AdminRole = "owner" | "editor" | "moderator" | "support";
export type Admin = { id: string; name: string; email: string; role: AdminRole; lastSeen: string };
export const seedAdmins: Admin[] = [
  { id: "ad1", name: "Yusuf Jamiu", email: "yusuf@ilmstation.app", role: "owner", lastSeen: "2026-10-26" },
  { id: "ad2", name: "Hafsah Lawal", email: "hafsah@ilmstation.app", role: "editor", lastSeen: "2026-10-25" },
  { id: "ad3", name: "Umar Adeyemi", email: "umar@ilmstation.app", role: "moderator", lastSeen: "2026-10-26" },
  { id: "ad4", name: "Amina Yusuf", email: "amina@ilmstation.app", role: "support", lastSeen: "2026-10-22" },
];
export const roleAccess: Record<AdminRole, string> = {
  owner: "Everything, including admins and billing",
  editor: "Content, events, centres, announcements, IlmWorld (except adverts)",
  moderator: "Chatrooms, reports, user suspension, IlmWorld adverts",
  support: "Users and payments (read + refunds)",
};

export type AuditEntry = { id: string; at: string; actor: string; action: string };
export const seedAudit: AuditEntry[] = [
  { id: "l1", at: "2026-10-26 08:30", actor: "Umar Adeyemi", action: "Removed a message in Muslim Parents’ Corner" },
  { id: "l2", at: "2026-10-25 17:05", actor: "Hafsah Lawal", action: "Published 3 Seerah questions" },
  { id: "l3", at: "2026-10-25 09:12", actor: "Yusuf Jamiu", action: "Raised Seerah Walk ticket price to ₦5,000" },
];

// Last 14 days of activity for dashboard charts.
export const activity = [412, 438, 401, 466, 489, 455, 520, 534, 512, 548, 571, 559, 602, 618].map((v, i) => ({ day: `Oct ${13 + i}`, learners: v, quizzes: Math.round(v * 2.4) }));
export const quizzesByTopic = topics.map((t, i) => ({ topic: t, plays: [1840, 1320, 1610, 2210, 760, 980, 1450, 1190][i] ?? 900 }));
