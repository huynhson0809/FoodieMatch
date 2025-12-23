import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const keyword = "cơm";
  console.log(`Checking database for places containing '${keyword}'...`);

  // 1. Check raw count
  const allMatches = await prisma.place.findMany({
    where: {
      name: {
        contains: keyword,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      name: true,
      lat: true,
      lng: true,
      address: true,
    },
    take: 10,
  });

  console.log(`Found ${allMatches.length} raw matches.`);
  allMatches.forEach((p) => {
    const hasCoords = p.lat !== null && p.lng !== null;
    console.log(
      `- ${p.name}: [${hasCoords ? "HAS COORDS" : "NO COORDS"}] (${p.lat}, ${
        p.lng
      }) - ${p.address}`
    );
  });

  if (allMatches.length === 0) {
    console.log("No matches found. Try 'com' (no accent)?");
    const noAccentMatches = await prisma.place.findMany({
      where: {
        name: {
          contains: "com",
          mode: "insensitive",
        },
      },
      select: { name: true },
      take: 5,
    });
    console.log(
      `Found ${noAccentMatches.length} matches for 'com':`,
      noAccentMatches.map((p) => p.name)
    );
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
