import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting coordinate extraction from Google URLs...");

  // Fetch ALL Google places (user requested to overwrite)
  const places = await prisma.place.findMany({
    where: {
      source: "GOOGLE",
      externalId: {
        not: null,
      },
    },
  });

  console.log(`Found ${places.length} Google places. Processing...`);

  let updatedCount = 0;

  for (const place of places) {
    if (!place.externalId) continue;

    const url = place.externalId;
    let lat: number | null = null;
    let lng: number | null = null;

    // Strategy 1: Look for @lat,lng
    // Example: .../@10.7984664,106.7232863,...
    const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) {
      lat = parseFloat(atMatch[1]);
      lng = parseFloat(atMatch[2]);
    }

    // Strategy 2: Look for !3d and !4d (Protobuf)
    // Example: ...!3d10.7984664!4d106.7232863...
    if (!lat || !lng) {
      const latMatch = url.match(/!3d(-?\d+\.\d+)/);
      const lngMatch = url.match(/!4d(-?\d+\.\d+)/);
      if (latMatch && lngMatch) {
        lat = parseFloat(latMatch[1]);
        lng = parseFloat(lngMatch[1]);
      }
    }

    if (lat && lng) {
      // Basic valid range check
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        await prisma.place.update({
          where: { id: place.id },
          data: { lat, lng },
        });
        updatedCount++;
        // print progress every 100
        if (updatedCount % 100 === 0) process.stdout.write(".");
      }
    }
  }

  console.log(`\nExtraction complete. Updated ${updatedCount} places.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
