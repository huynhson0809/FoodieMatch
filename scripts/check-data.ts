import { prisma } from "../lib/db";

async function main() {
  const total = await prisma.place.count();
  const withExternalId = await prisma.place.count({
    where: {
      externalId: {
        not: null,
      },
    },
  });

  const sample = await prisma.place.findMany({
    take: 5,
    select: {
      name: true,
      externalId: true,
    },
  });

  console.log(`Total Places: ${total}`);
  console.log(`With externalId: ${withExternalId}`);
  console.log("Sample:", sample);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
