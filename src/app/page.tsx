import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, verifySession } from "@/lib/auth";
import { PricingCards } from "@/components/PricingCards";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  LayoutGrid,
  Lightbulb,
  Link2,
  MessageSquare,
  PenLine,
  Repeat,
  Send,
  Smartphone,
  Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Cadence — one board for every client",
  description:
    "Plan, get client approval, and schedule a month of content across all your accounts — a calendar built for social media managers running many brands, not one.",
  openGraph: {
    title: "Cadence — one board for every client",
    description:
      "The content planning and client-approval calendar for social media managers and agencies.",
    images: ["/og.png"],
  },
};

/* Brand palette, straight from the logo:
   navy #0A192C · cyan #08C8DC · blue #1691D3 */

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <Image src="/cadence-mark.png" alt="" width={30} height={30} className="h-7 w-auto" priority />
      <span className="text-[17px] font-bold tracking-tight text-white">Cadence</span>
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0A192C]/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo />
        <div className="flex items-center gap-1 sm:gap-2">
          <a href="#how" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white sm:block">
            How it works
          </a>
          <a href="#features" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white sm:block">
            Features
          </a>
          <a href="#pricing" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white sm:block">
            Pricing
          </a>
          <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white">
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-gradient-to-r from-[#08C8DC] to-[#1691D3] px-4 py-2 text-sm font-semibold text-[#06263a] transition-opacity hover:opacity-90"
          >
            Create account
          </Link>
        </div>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* soft cyan glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-10rem] h-[32rem] w-[52rem] -translate-x-1/2 rounded-full opacity-25 blur-[110px]"
        style={{ background: "radial-gradient(circle, #08C8DC 0%, #1691D3 40%, transparent 70%)" }}
      />
      <div className="relative mx-auto max-w-6xl px-5 pb-8 pt-20 text-center sm:pt-28">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[13px] font-medium text-slate-300">
          <span className="h-1.5 w-1.5 rounded-full bg-[#08C8DC]" />
          For social media managers &amp; agencies
        </span>

        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-6xl">
          One board for{" "}
          <span className="bg-gradient-to-r from-[#08C8DC] to-[#1691D3] bg-clip-text text-transparent">
            every client
          </span>
          .
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
          Plan, get client approval, and schedule a month of content across all your accounts —
          from a single calendar built for managing many brands, not one.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#08C8DC] to-[#1691D3] px-6 py-3.5 text-[15px] font-semibold text-[#06263a] transition-opacity hover:opacity-90"
          >
            Create account <ArrowRight size={17} />
          </Link>
          <a
            href="#how"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-white/10"
          >
            See how it works
          </a>
        </div>
        <p className="mt-4 text-[13px] text-slate-400">
          Already invited?{" "}
          <Link href="/login" className="font-medium text-[#08C8DC] hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mx-auto max-w-5xl px-5 pb-20">
        <CalendarMock />
      </div>
    </section>
  );
}

/* A lightweight, on-brand impression of the board — not the real app, just enough
   to communicate "colour-coded content across many clients on one calendar." */
function CalendarMock() {
  const clients = [
    { name: "Bloom & Basil", color: "#16a34a" },
    { name: "Forge Fitness", color: "#ea580c" },
    { name: "Lumen Skincare", color: "#db2777" },
    { name: "Pixelwave", color: "#1691D3" },
  ];
  // [dayIndex 0-20, client color, label]
  const posts: [number, string, string][] = [
    [1, "#16a34a", "Repotting carousel"],
    [3, "#ea580c", "Member spotlight"],
    [4, "#db2777", "Ingredient deep-dive"],
    [7, "#1691D3", "Case study"],
    [9, "#16a34a", "Reel: low-light plants"],
    [10, "#ea580c", "Technique Thursday"],
    [12, "#db2777", "SPF myths"],
    [13, "#1691D3", "Feature launch"],
    [16, "#16a34a", "Summer watering"],
    [17, "#ea580c", "August challenge"],
    [19, "#db2777", "Barrier serum teaser"],
  ];
  const byDay = new Map<number, [string, string][]>();
  posts.forEach(([d, c, l]) => {
    if (!byDay.has(d)) byDay.set(d, []);
    byDay.get(d)!.push([c, l]);
  });

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1f35] p-2 shadow-2xl shadow-black/40">
      <div className="rounded-xl bg-[#0A192C] p-3 sm:p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          </div>
          <span className="ml-2 text-[13px] font-semibold text-white">July 2026</span>
          <div className="ml-auto flex flex-wrap gap-2">
            {clients.map((c) => (
              <span key={c.name} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                <span className="hidden sm:inline">{c.name}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <div key={i} className="pb-1 text-center text-[10px] font-semibold text-slate-500">
              {d}
            </div>
          ))}
          {Array.from({ length: 21 }).map((_, i) => (
            <div
              key={i}
              className="min-h-[52px] rounded-md border border-white/[0.04] bg-white/[0.02] p-1 sm:min-h-[66px]"
            >
              <div className="mb-1 text-[9px] text-slate-500">{i + 1}</div>
              <div className="flex flex-col gap-1">
                {(byDay.get(i) ?? []).map(([color, label], j) => (
                  <div
                    key={j}
                    className="flex items-center gap-1 rounded px-1 py-0.5"
                    style={{ background: `${color}22` }}
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />
                    <span className="truncate text-[8px] font-medium text-slate-200 sm:text-[9px]">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* The specific ask: a short "how is this different from a normal calendar" block. */
function VsCalendar() {
  const calendar = [
    "Organizes your time — meetings and events",
    "One event = a title and a time slot",
    "No idea what a “post” or a “channel” is",
    "No approval step — things just happen",
    "Colour-coding breaks down past a few clients",
  ];
  const cadence = [
    "Organizes your clients’ content across every account",
    "One post = channels, per-platform copy, media, status",
    "Built around posts, brands, and platforms",
    "A real client approval loop before anything ships",
    "Designed for 3–15 brands on one board from day one",
  ];
  return (
    <section className="mx-auto max-w-5xl px-5 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          It looks like a calendar. It isn’t one.
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-slate-300">
          A calendar organizes <span className="font-semibold text-white">your time</span>. Cadence
          organizes <span className="font-semibold text-white">your clients’ content</span> — and
          gets it approved.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <div className="mb-4 flex items-center gap-2 text-slate-400">
            <CalendarDays size={18} />
            <span className="text-sm font-semibold uppercase tracking-wide">A normal calendar</span>
          </div>
          <ul className="space-y-3">
            {calendar.map((t) => (
              <li key={t} className="flex gap-2.5 text-[14px] leading-snug text-slate-400">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-600" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-[#08C8DC]/30 bg-gradient-to-b from-[#08C8DC]/[0.07] to-transparent p-6">
          <div className="mb-4 flex items-center gap-2">
            <Image src="/cadence-mark.png" alt="" width={20} height={20} className="h-5 w-auto" />
            <span className="bg-gradient-to-r from-[#08C8DC] to-[#1691D3] bg-clip-text text-sm font-semibold uppercase tracking-wide text-transparent">
              Cadence
            </span>
          </div>
          <ul className="space-y-3">
            {cadence.map((t) => (
              <li key={t} className="flex gap-2.5 text-[14px] leading-snug text-slate-100">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#08C8DC]" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: <PenLine size={20} />,
      title: "Plan",
      body: "Add each client as a brand with its own channels and colour. Drop posts onto one shared calendar — write the idea once, then tailor the copy per platform with live character counters.",
    },
    {
      icon: <Send size={20} />,
      title: "Approve",
      body: "Send each client a private link — no login, no account. They approve posts or request changes, and the decision lands back on your board instantly, with a record of who said yes and when.",
    },
    {
      icon: <CalendarDays size={20} />,
      title: "Schedule",
      body: "Approved posts move through a clear workflow — idea, draft, needs approval, approved, scheduled. Drag to reschedule, set recurring slots, and preview how each client’s feed will actually look.",
    },
    {
      icon: <LayoutGrid size={20} />,
      title: "Oversee",
      body: "See every client on one board, filter to what’s waiting on someone, and never lose track of what’s going out where. One glance answers “what’s the status of everything, right now?”",
    },
  ];
  return (
    <section id="how" className="scroll-mt-16 border-t border-white/5 bg-white/[0.015] py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            How Cadence works
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-300">
            From a blank calendar to a client-approved month — four steps.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="relative rounded-2xl border border-white/10 bg-[#0d1f35] p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#08C8DC] to-[#1691D3] text-[#06263a]">
                {s.icon}
              </div>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#08C8DC]">STEP {i + 1}</span>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">{s.title}</h3>
              <p className="text-[13.5px] leading-relaxed text-slate-400">{s.body}</p>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-[13px] leading-relaxed text-slate-500">
          Cadence is the planning and approval layer that sits before publishing. When a month is
          approved, you post through your usual tools — Cadence keeps the whole roster, and every
          sign-off, in one place.
        </p>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    {
      icon: <Users size={19} />,
      title: "Every client, one board",
      body: "All your brands on a single colour-coded calendar. Toggle between all clients and one, and filter by brand, channel, or status.",
    },
    {
      icon: <Link2 size={19} />,
      title: "Client approval links",
      body: "A shareable link where clients approve or request changes — no account needed. The status and a record land back on your board.",
    },
    {
      icon: <PenLine size={19} />,
      title: "One idea, tailored per platform",
      body: "Write once, adjust the copy for each channel, with live character counts against every platform’s real limit.",
    },
    {
      icon: <Smartphone size={19} />,
      title: "Feed preview",
      body: "See how a client’s Instagram or TikTok grid will actually look before anything goes live — catch an ugly run in advance.",
    },
    {
      icon: <Lightbulb size={19} />,
      title: "Idea generator",
      body: "Blank week? Get topic-and-hook suggestions tailored to each brand, and drop the ones you like straight onto the calendar.",
    },
    {
      icon: <Repeat size={19} />,
      title: "Recurring slots",
      body: "Set “post every Tuesday at 9am” once and fill weeks ahead with draft cards, so a recurring commitment is never forgotten.",
    },
    {
      icon: <MessageSquare size={19} />,
      title: "Comments & @mentions",
      body: "Discuss any post with your team or capture client feedback in one place — never lost in email or WhatsApp threads.",
    },
    {
      icon: <LayoutGrid size={19} />,
      title: "Five ways to look",
      body: "Month, week, list, a kanban board by status, and a feed preview — plus density and light/dark, remembered per person.",
    },
  ];
  return (
    <section id="features" className="scroll-mt-16 py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Everything a manager juggles, in one place
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-300">
            Built for the reality of running many accounts — not bolted onto a tool made for one.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-white/10 bg-[#0d1f35] p-5 transition-colors hover:border-[#08C8DC]/30"
            >
              <div className="mb-3.5 flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[#08C8DC]">
                {f.icon}
              </div>
              <h3 className="mb-1.5 text-[15px] font-semibold text-white">{f.title}</h3>
              <p className="text-[13px] leading-relaxed text-slate-400">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-16 border-t border-white/5 bg-white/[0.015] py-20">
      <div className="mx-auto max-w-5xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Simple pricing</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-300">
            Priced per workspace, not per seat. Start free, upgrade as you take on more clients.
          </p>
        </div>
        <div className="mt-10">
          <PricingCards variant="landing" ctaLabel="Get started" />
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-[13px] text-slate-500">
          Prices shown in USD and UGX — switch above. Every plan includes the full board, client
          approval links, and all calendar views.
        </p>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="px-5 py-20">
      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0d1f35] to-[#0A192C] p-10 text-center sm:p-14">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-64 w-[40rem] -translate-x-1/2 rounded-full opacity-20 blur-[90px]"
          style={{ background: "radial-gradient(circle, #08C8DC 0%, transparent 70%)" }}
        />
        <div className="relative">
          <Image src="/cadence-mark.png" alt="" width={44} height={44} className="mx-auto mb-5 h-10 w-auto" />
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">
            Stop juggling spreadsheets and screenshots.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-slate-300">
            Plan every client’s month, get it approved, and keep the whole roster on one board.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#08C8DC] to-[#1691D3] px-7 py-3.5 text-[15px] font-semibold text-[#06263a] transition-opacity hover:opacity-90"
          >
            Create account <ArrowRight size={17} />
          </Link>
          <p className="mt-4 text-[13px] text-slate-400">
            Already invited?{" "}
            <Link href="/login" className="font-medium text-[#08C8DC] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 sm:flex-row">
        <Logo />
        <p className="text-[13px] text-slate-500">One board for every client.</p>
        <div className="flex items-center gap-5 text-[13px] text-slate-400">
          <a href="#how" className="transition-colors hover:text-white">How it works</a>
          <a href="#features" className="transition-colors hover:text-white">Features</a>
          <Link href="/login" className="transition-colors hover:text-white">Sign in</Link>
        </div>
      </div>
    </footer>
  );
}

export default async function LandingPage() {
  // Already signed in? Skip the marketing page and go straight to the board —
  // so reopening the app (or tapping the home-screen icon) stays in the account
  // instead of dropping back here.
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (await verifySession(token)) redirect("/app");

  return (
    <main className="min-h-dvh bg-[#0A192C] font-sans text-white antialiased">
      <Nav />
      <Hero />
      <VsCalendar />
      <HowItWorks />
      <Features />
      <Pricing />
      <FinalCta />
      <Footer />
    </main>
  );
}
