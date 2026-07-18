/**
 * Seed: one agency workspace ("Northbeam Studio") with five client brands,
 * connected channels, a month of realistic posts in every status, per-channel
 * variants, comments, recurring slots, and a live client share link.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Anchor "today" so the seeded calendar is always busy around the current month.
const NOW = new Date();
const Y = NOW.getFullYear();
const M = NOW.getMonth();

function at(day: number, hour: number, minute = 0, monthOffset = 0) {
  return new Date(Y, M + monthOffset, day, hour, minute);
}

type SeedPost = {
  title: string;
  contentType: string;
  status: string;
  day: number;
  hour: number;
  minute?: number;
  monthOffset?: number;
  emoji: string;
  approvalState?: string;
  platforms: string[];
  copy: Record<string, string>;
  comments?: { author: string; authorType: string; body: string }[];
};

const brands: {
  name: string;
  handle: string;
  industry: string;
  description: string;
  accentColor: string;
  channels: { platform: string; handle: string }[];
  slots: { weekday: number; hour: number; minute?: number; label: string; platform: string; contentType?: string }[];
  posts: SeedPost[];
}[] = [
  {
    name: "Bloom & Basil",
    handle: "@bloomandbasil",
    industry: "Plant shop",
    description: "Neighborhood plant shop with a cult following. Voice: warm, a little nerdy about botany.",
    accentColor: "#16a34a",
    channels: [
      { platform: "instagram", handle: "@bloomandbasil" },
      { platform: "tiktok", handle: "@bloomandbasil" },
      { platform: "facebook", handle: "Bloom & Basil" },
    ],
    slots: [
      { weekday: 2, hour: 9, label: "Plant care tip", platform: "instagram", contentType: "carousel" },
      { weekday: 5, hour: 17, label: "New arrivals reel", platform: "instagram", contentType: "reel" },
    ],
    posts: [
      {
        title: "Monstera repotting step-by-step",
        contentType: "carousel", status: "published", day: 2, hour: 9, emoji: "🪴",
        platforms: ["instagram", "facebook"],
        copy: {
          instagram: "Your monstera is root-bound and it's telling you. 🪴 Swipe for the 5-step repot we do in-store — including the one mistake that kills more monsteras than pests do (hint: pot size). Save this for spring!",
          facebook: "Root-bound monstera? Here's the exact 5-step repotting process we use in the shop — and the pot-size mistake to avoid. Full guide in the photos.",
        },
        comments: [{ author: "Maya (Bloom & Basil)", authorType: "client", body: "This one did numbers last time — love the refresh." }],
      },
      {
        title: "\"Plants that survive dark apartments\" reel",
        contentType: "reel", status: "published", day: 6, hour: 17, emoji: "🌿",
        platforms: ["instagram", "tiktok"],
        copy: {
          instagram: "North-facing window? No window?? These 6 plants genuinely don't care. 🌚🌿 #lowlightplants #plantsofinstagram",
          tiktok: "plants for your cave apartment, ranked by how hard they are to kill 🌚 #planttok #lowlightplants",
        },
      },
      {
        title: "Summer watering myth-busting",
        contentType: "carousel", status: "scheduled", day: 21, hour: 9, emoji: "💧",
        platforms: ["instagram", "facebook"],
        copy: {
          instagram: "\"Water more in summer\" is only half true — and the other half is why your fern is crispy. 💧 Swipe: how heat actually changes watering, per plant type.",
          facebook: "Summer watering is not just \"more.\" Here's how heat changes what your plants need, plant by plant.",
        },
      },
      {
        title: "Staff picks: August restock",
        contentType: "reel", status: "approved", day: 24, hour: 17, emoji: "🌱",
        approvalState: "approved",
        platforms: ["instagram", "tiktok"],
        copy: {
          instagram: "The August restock is UNHINGED. Variegated everything. Staff picks inside — come fight us for the pink princess. 🌱",
          tiktok: "restock day at the plant shop >>> everything else. august picks 🌱 #plantshop #restock",
        },
        comments: [
          { author: "Maya (Bloom & Basil)", authorType: "client", body: "Approved! Can we make sure the pink princess is the cover frame?" },
          { author: "Alex Rivera", authorType: "team", body: "@Maya yep — cover frame swapped to the pink princess shot." },
        ],
      },
      {
        title: "Propagation station how-to",
        contentType: "carousel", status: "needs_approval", day: 28, hour: 9, emoji: "🧪",
        approvalState: "pending",
        platforms: ["instagram"],
        copy: { instagram: "Turn one pothos into ten. 🧪 Our full propagation-station setup — jars, nodes, water schedule — in 7 slides. Beginners welcome, this is genuinely hard to mess up." },
      },
      {
        title: "Fall pre-order teaser",
        contentType: "story", status: "draft", day: 30, hour: 12, emoji: "🍂",
        platforms: ["instagram"],
        copy: { instagram: "Something's coming for fall… 🍂 (pre-order list opens Friday — link up in stories)" },
      },
      { title: "Plant of the month: ZZ raven", contentType: "image", status: "idea", day: 8, hour: 10, monthOffset: 1, emoji: "🖤", platforms: ["instagram"], copy: {} },
    ],
  },
  {
    name: "Forge Fitness",
    handle: "@forgefit",
    industry: "Gym / fitness studio",
    description: "Strength-first gym. Voice: direct, motivating, zero fluff.",
    accentColor: "#ea580c",
    channels: [
      { platform: "instagram", handle: "@forgefit" },
      { platform: "tiktok", handle: "@forgefitness" },
      { platform: "youtube", handle: "Forge Fitness" },
    ],
    slots: [
      { weekday: 1, hour: 6, label: "Monday motivation", platform: "instagram" },
      { weekday: 4, hour: 12, label: "Technique Thursday", platform: "youtube", contentType: "video" },
    ],
    posts: [
      {
        title: "Member spotlight: Dana's 200lb deadlift",
        contentType: "reel", status: "published", day: 7, hour: 6, emoji: "🏋️",
        platforms: ["instagram", "tiktok"],
        copy: {
          instagram: "10 months ago Dana couldn't deadlift the bar. Yesterday: 200lbs. 🏋️ No secret program. Just showing up 3x a week. Your turn — first week free, link in bio.",
          tiktok: "POV: you stopped waiting for motivation and just showed up for 10 months 🏋️ 200lb club. #gymtok #deadlift",
        },
        comments: [{ author: "Coach Ben", authorType: "client", body: "Dana signed the release — good to post." }],
      },
      {
        title: "Technique Thursday: fixing squat depth",
        contentType: "video", status: "scheduled", day: 23, hour: 12, emoji: "🎯",
        platforms: ["youtube", "instagram"],
        copy: {
          youtube: "Can't hit depth on squats? It's (probably) not your flexibility. In this 8-minute breakdown, Coach Ben covers ankle position, stance width, and the bracing cue that fixes 80% of shallow squats.",
          instagram: "Shallow squats? It's probably not your hips. 🎯 3 fixes in 60 seconds — full breakdown on YouTube.",
        },
      },
      {
        title: "August challenge announcement",
        contentType: "image", status: "needs_approval", day: 27, hour: 6, emoji: "🔥",
        approvalState: "changes_requested",
        platforms: ["instagram", "tiktok"],
        copy: {
          instagram: "THE AUGUST FORGE CHALLENGE 🔥 4 weeks. 12 workouts. Leaderboard on the wall. Winner gets 3 months free. Sign-ups open Monday at the front desk.",
          tiktok: "we're doing a challenge in august and the prize is actually good this time 🔥 #gymchallenge",
        },
        comments: [
          { author: "Coach Ben", authorType: "client", body: "Prize changed — it's 3 months free PLUS a hoodie. Can you update the copy and graphic?" },
        ],
      },
      {
        title: "Hypertrophy vs strength explainer",
        contentType: "video", status: "draft", day: 31, hour: 12, emoji: "📊",
        platforms: ["youtube"],
        copy: { youtube: "Training for size vs training for strength — what actually changes? Sets, reps, rest, and how to pick your lane (or run both)." },
      },
      { title: "Fall class schedule reveal", contentType: "image", status: "idea", day: 4, hour: 6, monthOffset: 1, emoji: "🗓️", platforms: ["instagram"], copy: {} },
    ],
  },
  {
    name: "Lumen Skincare",
    handle: "@lumenskin",
    industry: "DTC skincare",
    description: "Science-forward skincare brand. Voice: calm, precise, ingredient-literate.",
    accentColor: "#db2777",
    channels: [
      { platform: "instagram", handle: "@lumenskin" },
      { platform: "tiktok", handle: "@lumenskincare" },
      { platform: "x", handle: "@lumenskin" },
    ],
    slots: [
      { weekday: 3, hour: 11, label: "Ingredient deep-dive", platform: "instagram", contentType: "carousel" },
    ],
    posts: [
      {
        title: "Niacinamide deep-dive",
        contentType: "carousel", status: "published", day: 9, hour: 11, emoji: "🧴",
        platforms: ["instagram", "x"],
        copy: {
          instagram: "Niacinamide: the ingredient on every label, explained properly. 🧴 What the 4% vs 10% debate actually means, what it pairs with, and when it's doing nothing for you. Slides by our formulation team.",
          x: "The 4% vs 10% niacinamide debate, settled by our formulation chemist (thread) 🧵",
        },
      },
      {
        title: "SPF reapplication myths",
        contentType: "reel", status: "approved", day: 22, hour: 11, emoji: "☀️",
        approvalState: "approved",
        platforms: ["instagram", "tiktok"],
        copy: {
          instagram: "\"Reapply every 2 hours\" — even indoors? At your desk? ☀️ Our chemist answers the SPF questions you actually have.",
          tiktok: "asking our formulation chemist the SPF questions you're too afraid to google ☀️ #skintok #spf",
        },
        comments: [{ author: "Priya (Lumen)", authorType: "client", body: "Approved — this is exactly the tone we want." }],
      },
      {
        title: "Launch teaser: Barrier Serum",
        contentType: "image", status: "needs_approval", day: 25, hour: 9, emoji: "✨",
        approvalState: "pending",
        platforms: ["instagram", "x", "tiktok"],
        copy: {
          instagram: "Two years of formulation. 14 rounds of testing. One serum. ✨ 08.01",
          x: "Two years of formulation. 14 rounds of testing. One serum. 08.01 ✨",
          tiktok: "we've been hiding something for two years ✨ 08.01 #skincarelaunch",
        },
      },
      {
        title: "Customer results roundup",
        contentType: "carousel", status: "draft", day: 29, hour: 11, emoji: "📸",
        platforms: ["instagram"],
        copy: { instagram: "12 weeks of Lumen, in your words (and photos). Real routines, real results — shared with permission. 📸" },
      },
      { title: "\"Skincare in your 40s\" series kickoff", contentType: "reel", status: "idea", day: 6, hour: 11, monthOffset: 1, emoji: "🌟", platforms: ["instagram", "tiktok"], copy: {} },
    ],
  },
  {
    name: "Harbor & Oak",
    handle: "@harborandoak",
    industry: "Coffee roastery",
    description: "Small-batch coffee roastery + café. Voice: cozy, craft-obsessed.",
    accentColor: "#b45309",
    channels: [
      { platform: "instagram", handle: "@harborandoak" },
      { platform: "facebook", handle: "Harbor & Oak Coffee" },
    ],
    slots: [
      { weekday: 6, hour: 8, label: "Weekend café feature", platform: "instagram" },
    ],
    posts: [
      {
        title: "New single-origin: Huila, Colombia",
        contentType: "image", status: "published", day: 12, hour: 8, emoji: "☕",
        platforms: ["instagram", "facebook"],
        copy: {
          instagram: "New on the bar: a washed Huila from the Rojas family farm. ☕ Stone fruit, panela, and a finish that hangs around like a good Sunday. Roasted Tuesday, pouring now.",
          facebook: "This week's single-origin: a washed Colombia Huila from the Rojas family farm. Stone fruit and panela sweetness. Available in-store and online.",
        },
      },
      {
        title: "Cold brew at home tutorial",
        contentType: "carousel", status: "scheduled", day: 26, hour: 8, emoji: "🧊",
        platforms: ["instagram"],
        copy: { instagram: "Our cold brew ratio, straight from the bar: 1:8, 18 hours, coarse as beach sand. 🧊 Full method in the slides — no fancy gear required." },
      },
      {
        title: "Barista latte art series ep. 1",
        contentType: "reel", status: "draft", day: 19, hour: 8, emoji: "🎨",
        platforms: ["instagram"],
        copy: { instagram: "Ep. 1: the tulip. 🌷 Sam breaks down milk texture, pour height, and the wiggle. New episode every week this summer." },
      },
      { title: "Fall menu brainstorm", contentType: "text", status: "idea", day: 11, hour: 8, monthOffset: 1, emoji: "🍁", platforms: ["instagram"], copy: {} },
    ],
  },
  {
    name: "Pixelwave",
    handle: "@pixelwavehq",
    industry: "B2B SaaS",
    description: "Analytics platform for e-commerce teams. Voice: sharp, practical, a little funny on X.",
    accentColor: "#4f46e5",
    channels: [
      { platform: "linkedin", handle: "Pixelwave" },
      { platform: "x", handle: "@pixelwavehq" },
      { platform: "youtube", handle: "Pixelwave" },
    ],
    slots: [
      { weekday: 2, hour: 10, label: "Customer story", platform: "linkedin" },
      { weekday: 4, hour: 15, label: "Product tip thread", platform: "x", contentType: "text" },
    ],
    posts: [
      {
        title: "Case study: Everdry +32% AOV",
        contentType: "image", status: "published", day: 14, hour: 10, emoji: "📈",
        platforms: ["linkedin", "x"],
        copy: {
          linkedin: "Everdry's team had a hunch their bundles were underpriced. Their dashboard said otherwise — the problem was placement, not price.\n\nOne repositioned upsell later: +32% AOV in six weeks.\n\nFull breakdown of how they found it (and what they tried first) in the case study. Link in comments.",
          x: "Everdry thought their bundles were underpriced. Data said: wrong placement, right price. One change → +32% AOV. Case study 👇",
        },
      },
      {
        title: "Feature launch: cohort alerts",
        contentType: "video", status: "scheduled", day: 22, hour: 10, emoji: "🚨",
        platforms: ["linkedin", "x", "youtube"],
        copy: {
          linkedin: "Shipping today: Cohort Alerts.\n\nStop checking dashboards to find out a cohort went sideways. Set a threshold once — we'll tell you the moment retention, AOV, or repeat rate drifts.\n\n90-second demo below.",
          x: "New: Cohort Alerts 🚨 Your retention dips, we ping you. No more dashboard doomscrolling. 90-sec demo:",
          youtube: "Cohort Alerts in 90 seconds — set a threshold on retention, AOV, or repeat purchase rate, and get pinged the moment a cohort drifts. Here's how to set it up.",
        },
      },
      {
        title: "\"Metrics that lie\" thread",
        contentType: "text", status: "needs_approval", day: 24, hour: 15, emoji: "🧵",
        approvalState: "pending",
        platforms: ["x", "linkedin"],
        copy: {
          x: "5 e-commerce metrics that are lying to you (and what to look at instead) 🧵\n\n1/ Average order value. An average of two bimodal clusters is a number that describes no one…",
          linkedin: "Five e-commerce metrics that routinely mislead teams — and the segment-level views that fix them. (1) AOV averages across bimodal customer clusters…",
        },
        comments: [
          { author: "Jordan Lee", authorType: "team", body: "@Sam can you sanity-check point 3 with the data team before this goes to Chris?" },
        ],
      },
      {
        title: "Webinar promo: attribution 101",
        contentType: "image", status: "draft", day: 30, hour: 10, emoji: "🎓",
        platforms: ["linkedin"],
        copy: { linkedin: "Attribution is where good marketing budgets go to die.\n\nJoin our head of data science on Aug 14 for a no-hype walkthrough of last-touch vs multi-touch vs incrementality — and when each one is actually the right tool." },
      },
      { title: "Q3 product recap video", contentType: "video", status: "idea", day: 15, hour: 10, monthOffset: 1, emoji: "🎬", platforms: ["youtube", "linkedin"], copy: {} },
    ],
  },
];

async function main() {
  await prisma.workspace.deleteMany();

  const workspace = await prisma.workspace.create({
    data: { name: "Northbeam Studio" },
  });

  for (const b of brands) {
    const brand = await prisma.brand.create({
      data: {
        workspaceId: workspace.id,
        name: b.name,
        handle: b.handle,
        industry: b.industry,
        description: b.description,
        accentColor: b.accentColor,
        channels: { create: b.channels.map((c) => ({ ...c, connected: true })) },
        recurringSlots: {
          create: b.slots.map((s) => ({
            weekday: s.weekday,
            hour: s.hour,
            minute: s.minute ?? 0,
            label: s.label,
            platform: s.platform,
            contentType: s.contentType ?? "image",
          })),
        },
      },
    });

    for (const p of b.posts) {
      await prisma.post.create({
        data: {
          brandId: brand.id,
          title: p.title,
          contentType: p.contentType,
          status: p.status,
          scheduledAt: at(p.day, p.hour, p.minute ?? 0, p.monthOffset ?? 0),
          mediaEmoji: p.emoji,
          approvalState: p.approvalState ?? "none",
          variants: {
            create: p.platforms.map((platform) => ({
              platform,
              copy: p.copy[platform] ?? "",
            })),
          },
          comments: p.comments ? { create: p.comments } : undefined,
        },
      });
    }
  }

  // A live client-review link for Bloom & Basil (stable token for demos).
  const bloom = await prisma.brand.findFirstOrThrow({ where: { name: "Bloom & Basil" } });
  await prisma.shareLink.create({
    data: { brandId: bloom.id, token: "bloom-review-jul" },
  });
  const forge = await prisma.brand.findFirstOrThrow({ where: { name: "Forge Fitness" } });
  await prisma.shareLink.create({
    data: { brandId: forge.id, token: "forge-review-jul" },
  });

  console.log("Seeded workspace", workspace.name, "with", brands.length, "brands.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
