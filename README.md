# Cadence

**One board for every client.**

Cadence is a content calendar built for social media managers and agencies running many
client accounts at once. Plan, approve, and publish every brand's month from one board —
with per-channel post variants, drag-and-drop scheduling, an AI idea generator, and
shareable approval links your clients can use without an account.

---

## Why

Most content calendars assume one brand managing itself. A large share of social work is
done by managers running **3–15 client brands** — juggling a spreadsheet per client,
approvals scattered across email and WhatsApp, and manual cross-posting. Cadence treats
the **client as a first-class, multipliable entity**: every part of the app assumes there
is more than one.

See [docs/ABOUT.md](docs/ABOUT.md) for the full rationale.

## Features

- **Five views** — Month, Week, List, Kanban-by-status, and a per-channel **Feed preview**
  that renders how an Instagram/TikTok grid will actually look
- **Cross-client calendar** — every brand on one color-coded board, filterable by brand,
  channel, and status; one-click toggle between *all clients* and *single client*
- **Client approval flow** — a shareable link where clients approve or request changes
  with no account, scoped strictly to their own brand
- **Per-channel variants** — one idea, tailored copy per platform, with live character
  counters against each platform's real limit
- **Idea generator** — topic + hook suggestions per brand that drop onto the calendar as drafts
- **Drag-and-drop rescheduling**, bulk actions, and recurring slots ("post every Tue 9am")
- **Comments and @mentions**, with client feedback visually distinguished
- **Adaptive UI** — density toggle, light/dark, collapsible rail (bottom sheet on mobile),
  keyboard shortcuts, and remembered preferences

## Tech

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Prisma · Supabase Postgres ·
dnd-kit · Zustand

Multi-tenant workspace → brand → post data model. Publishing and AI sit behind service
interfaces (`src/lib/services/`) so real integrations drop in without reshaping the app.

## Getting started

Cadence uses **Supabase Postgres**. You'll need a Supabase project (the free tier is
plenty).

```bash
npm install
cp .env.example .env
```

Fill in `.env` with your two connection strings from
**Supabase → Project Settings → Database → Connection string → URI**:

| Variable | Which string | Port | Used for |
| --- | --- | --- | --- |
| `DATABASE_URL` | Transaction pooler | `6543` | the app at runtime |
| `DIRECT_URL` | Direct connection | `5432` | migrations & seeding |

> If your database password contains `@ : / ? # & %`, URL-encode it (`@` → `%40`)
> or the connection string won't parse.

Then create the tables and load sample data:

```bash
npm run db:setup   # prisma db push + seed 5 realistic client brands
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Sign in with `APP_PASSWORD`. Each client gets a private approval link automatically —
copy it from **manage → Copy approval link** to see the client-facing review page,
which needs no login.

Useful extras:

```bash
npm run db:push     # apply schema changes only
npm run db:seed     # re-seed sample data (wipes existing rows)
npm run db:studio   # browse the data in Prisma Studio
```

> **Note:** `db:seed` clears existing workspaces before inserting, so don't run it
> against a database holding real client data.

## Documentation

| Doc | What it covers |
| --- | --- |
| [docs/Cadence-Getting-Started.pdf](docs/Cadence-Getting-Started.pdf) | **Customer-facing** onboarding guide with worked examples — hand this to users. Rebuild with `python scripts/build-guide-pdf.py` |
| [docs/USER-GUIDE.md](docs/USER-GUIDE.md) | Step-by-step reference for every feature |
| [docs/ABOUT.md](docs/ABOUT.md) | The problem, the target user, and how Cadence helps |
| [docs/DESCRIPTION.md](docs/DESCRIPTION.md) | Short-form copy for listings and landing pages |

## Project status

The data model, approval flow, scheduling, comments, and all views are fully implemented
and persistent. Two services currently run as simulations behind swappable interfaces so
the whole workflow can be exercised end to end:

- **Publishing** — marks posts published but does not yet call the live platform APIs
- **Idea generation** — draws from a built-in angle library rather than a live AI model

Planned next: live channel publishing, per-post analytics, approval reminders, and a
content library / asset manager.
