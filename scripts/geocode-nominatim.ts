import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const PHOTON_ENDPOINT = "https://photon.komoot.io/api/";

// Photon is faster/more lenient, but still be nice.
const DELAY_MS = 500;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = new URL(PHOTON_ENDPOINT);
    url.searchParams.append("q", address);
    url.searchParams.append("limit", "1");

    const response = await fetch(url.toString());

    if (!response.ok) {
      console.error(`Status ${response.status} for ${address}`);
      return null;
    }

    const data = await response.json();
    // Photon returns GeoJSON
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].geometry.coordinates;
      return { lat, lng };
    }
  } catch (error) {
    console.error(`Error geocoding ${address}:`, error);
  }
  return null;
}

async function main() {
  console.log("Starting geocoding process...");

  // Fetch places without lat/lng
  // Limit to small batches to observe progress or just run continuously
  const places = await prisma.place.findMany({
    where: {
      lat: null,
      lng: null,
      // Only process those with addresses that look valid (not "Unknown")
      address: {
        not: "Unknown",
      },
    },
    take: 100, // Process 100 at a time in this run, user can loop script or increase limit
  });

  console.log(`Found ${places.length} places to geocode.`);

  for (const place of places) {
    console.log(`Geocoding: ${place.name} - ${place.address}`);

    // Try address first
    const coords = await geocodeAddress(place.address);

    if (coords) {
      console.log(`  Found: ${coords.lat}, ${coords.lng}`);
      await prisma.place.update({
        where: { id: place.id },
        data: {
          lat: coords.lat,
          lng: coords.lng,
        },
      });
    } else {
      console.log(`  Not found.`);
    }

    await sleep(DELAY_MS);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
