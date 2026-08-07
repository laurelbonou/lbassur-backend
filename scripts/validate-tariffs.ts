import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const durationRank: Record<string, number> = {
  "10 JOURS": 10,
  "20 JOURS": 20,
  "1 MOIS": 30,
  "2 MOIS": 60,
  "3 MOIS": 90,
  "6 MOIS": 180,
  "1 AN": 365,
};

async function main() {
  const rules = await prisma.tariffRule.findMany({
    where: { active: true, duration: { in: Object.keys(durationRank) } },
    include: { insurer: { select: { slug: true } } },
  });

  const groups = new Map<string, typeof rules>();
  for (const rule of rules) {
    const key = [
      rule.insurer.slug,
      rule.insuranceTypeLabel,
      rule.zone,
      rule.vehicleUsage,
      rule.vehiclePower,
      rule.vehicleEnergy,
      rule.pricingStatus,
      rule.bonusRate,
      rule.guaranteePackage,
    ].join("|");
    groups.set(key, [...(groups.get(key) ?? []), rule]);
  }

  const errors: string[] = [];
  for (const [key, group] of groups) {
    const ordered = group.sort((a, b) => durationRank[a.duration!] - durationRank[b.duration!]);
    for (let index = 1; index < ordered.length; index += 1) {
      const previous = ordered[index - 1];
      const current = ordered[index];
      if (current.price.lessThanOrEqualTo(previous.price)) {
        errors.push(
          `${key}: ${previous.duration} (${previous.price}) !< ${current.duration} (${current.price})`,
        );
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Tariff monotonicity check failed:\n${errors.join("\n")}`);
  }
  console.log(`Tariff monotonicity check passed for ${groups.size} series.`);
}

main()
  .finally(() => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
