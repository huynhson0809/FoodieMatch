import { PrismaClient } from "@prisma/client";
import puppeteer from "puppeteer";

const prisma = new PrismaClient();

async function scrapeGoogleCoords() {
  console.log("Fetching Google places...");

  const places = await prisma.place.findMany({
    where: {
      source: "GOOGLE",
      externalId: {
        contains: "google.com/maps",
      },
      lat: null,
    },
    select: {
      id: true,
      name: true,
      externalId: true,
    },
  });

  console.log(`Found ${places.length} places to process.`);

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
    ],
  });

  // Concurrency limit - Lowered to avoid detection/blocking
  const CONCURRENCY = 2;

  let processed = 0;
  let updated = 0;
  let failed = 0;

  // Helper to process a single place
  const processPlace = async (place: (typeof places)[0]) => {
    let result = { success: false, url: "" };
    try {
      const page = await browser.newPage();

      // Set a generic real browser User-Agent
      await page.setUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      const url = place.externalId;
      if (!url) {
        await page.close();
        return result;
      }

      // Navigate
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      } catch (e) {
        // Proceed to check URL anyway
      }

      // 1. Handle Consent Form (if any)
      try {
        const consentButton = await page.$('button[aria-label="Accept all"]');
        if (consentButton) {
          await consentButton.click();
          await page.waitForNavigation({ waitUntil: "networkidle2" });
        }
      } catch (e) {}

      // 2. Wait for either a Place URL OR a Search Result List
      try {
        await page.waitForFunction(
          () => {
            const href = window.location.href;
            // Case A: Redirected to specific place
            if (href.includes("/place/") || href.includes("/@")) return true;
            // Case B: Search list loaded (look for results)
            if (document.querySelector('a[href*="/maps/place/"]')) return true;
            return false;
          },
          { timeout: 15000 }
        );
      } catch (e) {}

      // 3. Check if we are on a "List" page (not a specific place)
      // If so, click the first result
      if (!page.url().includes("/place/") && !page.url().includes("/@")) {
        try {
          // Try to find the first result link
          const firstResult = await page.$('a[href*="/maps/place/"]');
          if (firstResult) {
            console.log(
              `   -> [Redirect] Clicking first result for: ${place.name}`
            );
            await firstResult.click();
            // Wait for URL to change to place
            await page.waitForFunction(
              () => window.location.href.includes("/place/"),
              { timeout: 10000 }
            );
          }
        } catch (e) {
          // console.log("Could not click first result");
        }
      }

      // 4. Final URL check
      const finalUrl = page.url();
      result.url = finalUrl;

      // Extract
      let match = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (!match) {
        const match3d = finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
        if (match3d) {
          match = [match3d[0], match3d[1], match3d[2]] as RegExpMatchArray;
        }
      }

      if (match) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);

        await prisma.place.update({
          where: { id: place.id },
          data: { lat, lng },
        });
        result.success = true;
      }

      await page.close();
    } catch (e) {
      // fail silently
    }
    return result;
  };

  // Worker pool
  let index = 0;

  const worker = async (workerId: number) => {
    while (index < places.length) {
      const currentIndex = index++;
      if (currentIndex >= places.length) break;

      const place = places[currentIndex];

      // Random delay to avoid burst patterns
      await new Promise((r) => setTimeout(r, Math.random() * 2000 + 500));

      const res = await processPlace(place);

      if (res.success) {
        updated++;
        console.log(
          `[${currentIndex + 1}/${
            places.length
          }] [Worker ${workerId}] SUCCESS: ${place.name}`
        );
      } else {
        failed++;
        console.log(
          `[${currentIndex + 1}/${
            places.length
          }] [Worker ${workerId}] FAILED: ${place.name} (URL: ${res.url})`
        );
      }
      processed++;
    }
  };

  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(worker(i + 1));
  }

  await Promise.all(workers);

  await browser.close();
  console.log("------------------------------------------------");
  console.log(
    `Done. Processed: ${processed}, Updated: ${updated}, Failed: ${failed}`
  );
}

scrapeGoogleCoords()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
