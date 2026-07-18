/**
 * AI idea generation abstraction. Swap the stub for a Claude-backed generator
 * by implementing IdeaGenerator and switching in getIdeaGenerator() (e.g. when
 * ANTHROPIC_API_KEY is set).
 */
import type { IdeaSuggestion } from "../types";
import type { Platform } from "../platforms";

export interface IdeaGeneratorInput {
  brandName: string;
  industry: string;
  description: string;
  platforms: Platform[];
}

export interface IdeaGenerator {
  generate(input: IdeaGeneratorInput, count: number): Promise<IdeaSuggestion[]>;
}

type Template = { title: string; hook: string; contentType: IdeaSuggestion["contentType"] };

const ANGLES: Template[] = [
  { title: "Behind the scenes: how {thing} actually gets made", hook: "People buy process. Show the unglamorous middle part nobody posts.", contentType: "reel" },
  { title: "The {industry} mistake almost everyone makes", hook: "Lead with the mistake, save the fix for slide 3 — earns the swipe.", contentType: "carousel" },
  { title: "We answered your top 5 questions", hook: "Pull real questions from comments/DMs. Zero-research content that always performs.", contentType: "video" },
  { title: "Before / after: a real customer story", hook: "Specific numbers or photos beat adjectives. Get permission, tag them.", contentType: "image" },
  { title: "Hot take: {contrarian} is overrated", hook: "A defensible contrarian opinion is the cheapest reach there is.", contentType: "text" },
  { title: "A day at {brand}, in 30 seconds", hook: "Timelapse + trending audio. Low effort, high familiarity-building.", contentType: "reel" },
  { title: "Myth vs fact: {industry} edition", hook: "Bust 3 myths your audience half-believes. Invite disagreement in the caption.", contentType: "carousel" },
  { title: "What {price} actually pays for", hook: "Price-transparency content builds trust and pre-handles objections.", contentType: "carousel" },
  { title: "Meet the team: {role} edition", hook: "Faces outperform logos. One person, three quick questions.", contentType: "reel" },
  { title: "Our tools/setup, explained", hook: "Gear and stack posts get saved and shared by peers — great for reach.", contentType: "image" },
  { title: "POV: your first visit to {brand}", hook: "First-person walkthrough lowers the barrier for new customers.", contentType: "reel" },
  { title: "3 things we'd never do (and why)", hook: "Negative framing of your standards — differentiates without bragging.", contentType: "text" },
];

class StubIdeaGenerator implements IdeaGenerator {
  async generate(input: IdeaGeneratorInput, count: number): Promise<IdeaSuggestion[]> {
    await new Promise((r) => setTimeout(r, 500));
    // Deterministic-ish rotation so repeated clicks give fresh angles.
    const start = Math.floor(Math.random() * ANGLES.length);
    const picks: IdeaSuggestion[] = [];
    for (let i = 0; i < count; i++) {
      const t = ANGLES[(start + i) % ANGLES.length];
      picks.push({
        title: t.title
          .replace("{thing}", input.industry.toLowerCase().includes("saas") ? "a feature" : "your product")
          .replace("{industry}", input.industry.toLowerCase())
          .replace("{brand}", input.brandName)
          .replace("{contrarian}", "following trends")
          .replace("{price}", "your price")
          .replace("{role}", "founder"),
        hook: t.hook,
        contentType: t.contentType,
        platforms: input.platforms.slice(0, 2),
      });
    }
    return picks;
  }
}

export function getIdeaGenerator(): IdeaGenerator {
  return new StubIdeaGenerator();
}
