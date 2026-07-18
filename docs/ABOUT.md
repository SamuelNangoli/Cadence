# What Cadence Is For

*One board for every client.*

---

## The problem

Most content calendars are built for **a brand managing itself** — one account, one
team, one voice. But a large share of social media work isn't done that way. It's done
by managers and small agencies running **3 to 15 client brands at once**, and for them
a single-brand tool quietly falls apart.

What that job actually looks like today:

- **A spreadsheet per client.** Different tab layouts, different colors, no way to see
  Tuesday across all of them. Nobody can answer "what's going out this week?" without
  opening eight files.
- **Approvals over email and WhatsApp.** Copy pasted into a message, a screenshot of a
  mockup, three days of silence, then "can we change the second line?" buried in a
  thread. Nobody can say with confidence which posts are actually cleared to run.
- **Posting by hand.** Manually reformatting one idea for Instagram, then LinkedIn,
  then X — retyping the same message and re-counting characters each time.
- **Context-switching tax.** Every client lives somewhere different, so moving between
  accounts means reloading your entire mental model.

The failure isn't any single step. It's that **oversight is impossible**. Something
slips, a client says "I never approved that," and there's no record either way.

---

## What Cadence does

Cadence treats **the client as a first-class, multipliable entity**. Every part of the
app assumes there's more than one brand — that's the design premise, not a feature.

It delivers three things a single-brand calendar structurally cannot:

### 1. Oversight across every account, on one board
All clients on one color-coded calendar, filterable by brand, channel, and status. One
glance answers "what's going out this week, for everyone, and what's stuck?" A
one-click toggle drops you into a single client when you need to focus, and back out
when you need the overview.

### 2. A real client approval loop
Each client gets a **shareable link** — no account, no password, no onboarding. They
see the actual copy for each channel, then **approve** or **request changes** with a
note. The decision lands on your board instantly and the post's approval state is
tracked on the record.

The result is an **audit trail**: every post carries who approved it and when, or what
changes were asked for. "I never approved that" stops being an argument.

### 3. One idea, tailored per platform
Write a post once, then adjust the copy per channel in tabbed variants, each with a
live counter against that platform's real character limit. No retyping, no counting
by hand, no publishing a truncated post because nobody noticed X's 280 limit.

---

## Who it's for

**The primary user is a social media manager or small agency handling multiple client
brands.** Cadence earns its place when:

- You manage **more than one** account and you're tired of one spreadsheet per client.
- Your clients need to **sign off** before anything publishes.
- You post the same idea to **several platforms** with different copy each time.
- You need to answer *"what's the status of everything, right now?"* in seconds.

It's a **poor fit** if you run a single brand with no external approval step — a
simpler scheduler will serve you better. Cadence's value is concentrated in exactly
the complexity it was built for: many accounts, many stakeholders, many channels.

---

## How it helps, concretely

| The old way | With Cadence |
| --- | --- |
| One spreadsheet per client | Every client on one filterable, color-coded board |
| "Did the client approve this?" | Approval state tracked on every post, with a timestamped trail |
| Approvals lost in email/WhatsApp | A shareable link — client approves or requests changes, no account |
| Retyping copy for each platform | Per-channel variants with live character counters |
| Rewriting recurring posts weekly | Recurring slots that auto-fill the calendar as drafts |
| Staring at a blank calendar | Idea generator that drops fresh angles in as drafts |
| Guessing how a grid will look | Feed preview that renders the actual Instagram/TikTok grid |
| Rescheduling posts one at a time | Drag-and-drop, plus bulk shift and bulk status changes |

---

## The workflow it encodes

Cadence enforces a status pipeline that mirrors how this work really moves:

```
Idea → Draft → Needs approval → Approved → Scheduled → Published
```

Every post sits at exactly one stage, is color-coded by it, and can be filtered and
dragged between stages. The pipeline is the product: it's how you know, at any moment,
what's blocked and on whom.

The client approval flow plugs directly into it — a client's decision on the share
link moves the post to **Approved**, or bounces it back to **Draft** with their note
attached.

---

## Design principles

- **The client is multipliable.** Nothing assumes a single brand.
- **Calm but information-dense.** A manager scans this board dozens of times a day. It
  should be readable at a glance and never noisy — hence per-client accent colors,
  status color-coding, and a density toggle.
- **The view belongs to the user.** Month, week, list, kanban, or feed preview; single
  client or all; compact or comfortable; light or dark. Cadence remembers the choice.
- **Clients shouldn't need onboarding.** The person approving content is not a user of
  your software. Their surface is a link that works on a phone.
- **Integrations stay behind interfaces.** Publishing and AI sit behind service
  abstractions so channels can be added without reshaping the app.

---

## Where it goes next

The foundation — multi-tenant data model, approvals, scheduling, per-channel variants
— is built. Planned next:

- **Live channel publishing** through the real platform APIs
- **Per-post analytics** once posts are live
- **Automated approval reminders** for clients sitting on a decision
- **A content library / asset manager** for reusable media

---

## In one line

**Cadence turns the chaos of spreadsheets, scattered approvals, and manual
cross-posting into a single board where a manager can plan, approve, and publish every
client's month.**
