import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const prisma = new PrismaClient();

async function importFoody() {
  const dataDir = path.join(process.cwd(), "crawl-data", "foody");
  const restaurantFile = path.join(dataDir, "restaurant.csv");

  // 1. Import Restaurants
  console.log("Reading Restaurants...");
  const restContent = fs.readFileSync(restaurantFile, "utf-8");
  const restaurants = parse(restContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });

  const placeData: any[] = [];
  for (const record of restaurants as any[]) {
    if (!record["Restaurant Name"]) continue;
    placeData.push({
      name: record["Restaurant Name"],
      address: record.Address || "Unknown",
      priceRange: record.Price,
      source: "FOODY",
      externalId: record.RestaurantID,
    });
  }

  console.log(`Inserting ${placeData.length} restaurants...`);
  if (placeData.length > 0) {
    await prisma.place.createMany({
      data: placeData,
      skipDuplicates: true,
    });
  }

  console.log("Done.");
}

importFoody()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
