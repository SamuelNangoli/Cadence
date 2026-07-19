/**
 * One-off: give every brand an approval link, and replace any short/guessable
 * seeded token with a cryptographically random one.
 *
 * Safe to re-run — brands that already have a strong token are left alone.
 *
 *   npx tsx prisma/backfill-share-links.ts
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";

const prisma = new PrismaClient();
const newToken = () => randomBytes(24).toString("base64url");

// Seeded demo tokens were human-readable and therefore guessable.
const WEAK = /^[a-z]+-review-[a-z]+$/;

async function main() {
  const brands = await prisma.brand.findMany({ include: { shareLinks: true } });

  for (const brand of brands) {
    const existing = brand.shareLinks[0];

    if (!existing) {
      const link = await prisma.shareLink.create({
        data: { brandId: brand.id, token: newToken() },
      });
      console.log(`created  ${brand.name} -> /share/${link.token}`);
      continue;
    }

    if (WEAK.test(existing.token)) {
      const link = await prisma.shareLink.update({
        where: { id: existing.id },
        data: { token: newToken() },
      });
      console.log(`replaced ${brand.name} -> /share/${link.token}  (was "${existing.token}")`);
      continue;
    }

    console.log(`ok       ${brand.name} -> /share/${existing.token}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
