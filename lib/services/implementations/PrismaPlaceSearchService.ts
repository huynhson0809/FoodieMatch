import { Location } from "../ILocationService";
import {
  IPlaceSearchService,
  Place,
  SearchOptions,
} from "../interfaces/IPlaceSearchService";
import { prisma } from "../../db";
import { Prisma } from "@prisma/client";

export class PrismaPlaceSearchService implements IPlaceSearchService {
  async searchPlaces(
    location: Location,
    options: SearchOptions
  ): Promise<Place[]> {
    // If keyword is present, search by keyword
    if (options.keyword) {
      const result = await this.searchByKeyword(
        location,
        options.keyword,
        options
      );
      return result ? [result] : [];
    }

    // Since we don't have lat/lng in imported data yet mostly,
    // "Nearby" search via DB is limited.
    // We will return a set of places that HAVE coordinates if possible,
    // or just return recent ones if no coordinates requirements are strict (but interface implies map usage)

    const dbPlaces = await prisma.place.findMany({
      take: 20,
    });

    return dbPlaces.map(this.mapToPlace);
  }

  async findRandomPlace(
    location: Location,
    options: SearchOptions
  ): Promise<Place | null> {
    const lat = location.lat;
    const lng = location.lng;
    const radiusKm = (options.radius || 5000) / 1000; // Convert to km
    const minDistanceKm = (options.minDistance || 0) / 1000; // Convert to km

    console.log(
      `[PrismaService] Finding random place with radiusKm=${radiusKm}, minDistanceKm=${minDistanceKm}`
    );

    const excludeIds = options.excludeIds || [];
    const filter = options.filter || "all";

    // Build Drink Keywords for filtering
    const drinkKeywords = [
      "%cafe%",
      "%coffee%",
      "%cà phê%",
      "%trà%",
      "%tea%",
      "%bar%",
      "%pub%",
      "%lounge%",
      "%sinh tố%",
      "%nước ép%",
    ];

    // Construct SQL condition for filter
    let filterCondition = Prisma.empty;
    if (filter === "drink") {
      // Must match at least one drink keyword
      filterCondition = Prisma.sql`AND (
            ${Prisma.join(
              drinkKeywords.map((k) => Prisma.sql`name ILIKE ${k}`),
              " OR "
            )}
        )`;
    } else if (filter === "food") {
      // Must NOT match any drink keyword (Simple heuristic)
      filterCondition = Prisma.sql`AND NOT (
             ${Prisma.join(
               drinkKeywords.map((k) => Prisma.sql`name ILIKE ${k}`),
               " OR "
             )}
        )`;
    }

    try {
      const result = await prisma.$queryRaw<any[]>`
        SELECT 
          id, 
          name, 
          lat, 
          lng, 
          address, 
          images, 
          rating,
          "reviewCount", 
          "priceRange",
          "externalId",
          (
            6371 * acos(
              cos(radians(${lat})) * cos(radians(lat)) * cos(radians(lng) - radians(${lng})) + 
              sin(radians(${lat})) * sin(radians(lat))
            )
          ) AS distance
        FROM "Place"
        WHERE lat IS NOT NULL AND lng IS NOT NULL
        ${filterCondition}
        AND (
          6371 * acos(
            cos(radians(${lat})) * cos(radians(lat)) * cos(radians(lng) - radians(${lng})) + 
            sin(radians(${lat})) * sin(radians(lat))
          )
        ) <= ${radiusKm}
        AND (
          6371 * acos(
            cos(radians(${lat})) * cos(radians(lat)) * cos(radians(lng) - radians(${lng})) + 
            sin(radians(${lat})) * sin(radians(lat))
          )
        ) >= ${minDistanceKm}
        ${
          excludeIds.length > 0
            ? Prisma.sql`AND id NOT IN (${Prisma.join(excludeIds)})`
            : Prisma.empty
        }
        -- For random mode, we still want randomness, but constrained by distance
        ORDER BY RANDOM()
        LIMIT 1;
      `;

      if (result.length === 0) {
        return null;
      }

      const dbPlace = result[0];
      return this.mapToPlace(dbPlace);
    } catch (e) {
      console.error("Error in findRandomPlace:", e);
      return null;
    }
  }

  async searchByKeyword(
    location: Location,
    keyword: string,
    options: Omit<SearchOptions, "keyword">
  ): Promise<Place | null> {
    const lat = location.lat;
    const lng = location.lng;
    const radiusKm = (options.radius || 5000) / 1000;
    const minDistanceKm = (options.minDistance || 0) / 1000;
    const excludeIds = options.excludeIds || [];
    const searchKeyword = `%${keyword}%`;
    const filter = options.filter || "all";

    // Build Drink Keywords for filtering (Same logic)
    const drinkKeywords = [
      "%cafe%",
      "%coffee%",
      "%cà phê%",
      "%trà%",
      "%tea%",
      "%bar%",
      "%pub%",
      "%lounge%",
      "%sinh tố%",
      "%nước ép%",
    ];

    // Normalize keyword for unaccented search
    const normalize = (str: string) =>
      str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D");
    const normalizedKeyword = normalize(keyword);

    // Search both original and unaccented if different
    const originalPattern = `%${keyword}%`;
    const unaccentPattern = `%${normalizedKeyword}%`;

    let filterCondition = Prisma.empty;
    if (filter === "drink") {
      filterCondition = Prisma.sql`AND (
            ${Prisma.join(
              drinkKeywords.map((k) => Prisma.sql`name ILIKE ${k}`),
              " OR "
            )}
        )`;
    } else if (filter === "food") {
      filterCondition = Prisma.sql`AND NOT (
             ${Prisma.join(
               drinkKeywords.map((k) => Prisma.sql`name ILIKE ${k}`),
               " OR "
             )}
        )`;
    }

    try {
      const result = await prisma.$queryRaw<any[]>`
        SELECT 
          id, 
          name, 
          lat, 
          lng, 
          address, 
          images, 
          rating,
          "reviewCount", 
          "priceRange",
          "externalId",
          (
            6371 * acos(
              cos(radians(${lat})) * cos(radians(lat)) * cos(radians(lng) - radians(${lng})) + 
              sin(radians(${lat})) * sin(radians(lat))
            )
          ) AS distance
        FROM "Place"
        WHERE lat IS NOT NULL AND lng IS NOT NULL
        AND (
            name ILIKE ${originalPattern}
            OR address ILIKE ${originalPattern}
            OR name ILIKE ${unaccentPattern}
        )
        ${filterCondition}
        AND (
          6371 * acos(
            cos(radians(${lat})) * cos(radians(lat)) * cos(radians(lng) - radians(${lng})) + 
            sin(radians(${lat})) * sin(radians(lat))
          )
        ) <= ${radiusKm}
        AND (
          6371 * acos(
            cos(radians(${lat})) * cos(radians(lat)) * cos(radians(lng) - radians(${lng})) + 
            sin(radians(${lat})) * sin(radians(lat))
          )
        ) >= ${minDistanceKm}
        ${
          excludeIds.length > 0
            ? Prisma.sql`AND id NOT IN (${Prisma.join(excludeIds)})`
            : Prisma.empty
        }
        ORDER BY distance ASC
        LIMIT 1;
      `;

      if (result.length === 0) {
        return null;
      }

      return this.mapToPlace(result[0]);
    } catch (e) {
      console.error("Error in searchByKeyword:", e);
      return null;
    }
  }

  async searchByBounds(
    minLat: number,
    maxLat: number,
    minLng: number,
    maxLng: number,
    limit: number = 50
  ): Promise<Place[]> {
    try {
      // Find places within bounds that have valid coordinates
      const places = await prisma.place.findMany({
        where: {
          lat: {
            gte: minLat,
            lte: maxLat,
          },
          lng: {
            gte: minLng,
            lte: maxLng,
          },
        },
        select: {
          id: true,
          name: true,
          lat: true,
          lng: true,
          address: true,
          images: true,
          rating: true,
          reviewCount: true,
          priceRange: true,
          externalId: true,
        },
        take: limit,
      });

      return places.map(this.mapToPlace);
    } catch (error) {
      console.error("Error searching by bounds:", error);
      return [];
    }
  }

  private mapToPlace(dbPlace: any): Place {
    return {
      id: dbPlace.id,
      name: dbPlace.name,
      lat: dbPlace.lat || 0, // Fallback
      lng: dbPlace.lng || 0, // Fallback
      address: dbPlace.address,
      // Extract first image if array
      photos: dbPlace.images || [],
      rating: dbPlace.rating,
      reviewCount: dbPlace.reviewCount,
      distance: dbPlace.distance,
      externalId: dbPlace.externalId,
      googleMapsUrl: dbPlace.externalId,
      // tags?
    };
  }
}
