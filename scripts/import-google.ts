import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const prisma = new PrismaClient();

async function importGoogle() {
  const dataDir = path.join(process.cwd(), "crawl-data", "google-map");
  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith(".csv"));

  console.log(`Found ${files.length} Google Maps CSV files.`);

  const allPlaces: any[] = [];

  for (const file of files) {
    const filePath = path.join(dataDir, file);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    });

    for (const record of records as any[]) {
      if (!record.title) continue;

      const address = [
        record.street,
        record.city,
        record.state,
        record.countryCode,
      ]
        .filter(Boolean)
        .join(", ");

      allPlaces.push({
        name: record.title,
        address: address,
        phone: record.phone || null,
        website: record.website || null,
        rating: record.totalScore ? parseFloat(record.totalScore) : null,
        reviewCount: record.reviewsCount ? parseInt(record.reviewsCount) : 0,
        source: "GOOGLE",
        externalId: record.url || "UNKNOWN_" + Math.random(), // fallback
      });
    }
  }

  console.log(`Prepared ${allPlaces.length} Google places. syncing...`);

  // Bulk insert
  // Note: createMany with skipDuplicates requires a unique constraint.
  // We added @@unique([externalId, source]).

  if (allPlaces.length > 0) {
    await prisma.place.createMany({
      data: allPlaces,
      skipDuplicates: true,
    });
    console.log("Google Places import complete.");
  } else {
    console.log("No places to import.");
  }
}

importGoogle()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
