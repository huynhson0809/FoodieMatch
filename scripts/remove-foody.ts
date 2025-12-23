import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting removal of FOODY data...");

  // 1. Find Foody Places IDs to delete associated reviews
  // (Prisma deleteMany on Place won't cascade automatically if not configured in DB/Schema)
  const countFoods = await prisma.place.count({
    where: { source: "FOODY" },
  });
  console.log(`Found ${countFoods} Foody places.`);

  if (countFoods === 0) {
    console.log("Nothing to delete.");
    return;
  }

  // 3. Delete Places
  const deletedPlaces = await prisma.place.deleteMany({
    where: {
      source: "FOODY",
    },
  });
  console.log(`Deleted ${deletedPlaces.count} places with source="FOODY".`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
