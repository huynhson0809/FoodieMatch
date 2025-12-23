import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.place.count();
  console.log(`Total places in DB: ${count}`);

  const sample = await prisma.place.findFirst();
  console.log("Sample place:", sample);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
