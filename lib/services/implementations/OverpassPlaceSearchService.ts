import {
  IPlaceSearchService,
  Place,
  SearchOptions,
  SearchFilter,
  Distance,
} from "../interfaces/IPlaceSearchService";
import { Location } from "../interfaces/ILocationService";

/**
 * Overpass API Place Search Service
 * Uses OpenStreetMap data via Overpass API
 */
export class OverpassPlaceSearchService implements IPlaceSearchService {
  private readonly OVERPASS_URL = "https://overpass-api.de/api/interpreter";

  async searchPlaces(
    location: Location,
    options: SearchOptions
  ): Promise<Place[]> {
    const radius = options.radius || 1500;
    const query = this.buildQuery(location, radius, options.filter || "all");

    try {
      const response = await fetch(
        `${this.OVERPASS_URL}?data=${encodeURIComponent(query)}`
      );
      const data = await response.json();

      return data.elements
        .filter((el: any) => el.tags && el.tags.name)
        .map((el: any) => this.mapToPlace(el));
    } catch (error) {
      console.error("Overpass search error:", error);
      return [];
    }
  }

  async searchByBounds(
    minLat: number,
    maxLat: number,
    minLng: number,
    maxLng: number,
    limit?: number
  ): Promise<Place[]> {
    try {
      // Overpass BBox: (south, west, north, east)
      // south=minLat, west=minLng, north=maxLat, east=maxLng
      const query = `
        [out:json];
        (
          node["amenity"~"restaurant|cafe|fast_food|bar"]["name"](${minLat},${minLng},${maxLat},${maxLng});
        );
        out body;
      `;

      const response = await fetch(
        `${this.OVERPASS_URL}?data=${encodeURIComponent(query)}`
      );
      const data = await response.json();

      let places = data.elements
        .filter((el: any) => el.tags && el.tags.name)
        .map((el: any) => this.mapToPlace(el));

      if (limit) {
        places = places.slice(0, limit);
      }

      return places;
    } catch (error) {
      console.error("Overpass bounds search error:", error);
      return [];
    }
  }

  async findRandomPlace(
    location: Location,
    options: SearchOptions
  ): Promise<Place | null> {
    const distance = options.distance || "near";
    const radiusLevels =
      distance === "near"
        ? [500, 1000, 1500, 2000, 3000, 4000, 5000]
        : [5000, 7000, 10000, 12000, 15000];

    for (const radius of radiusLevels) {
      try {
        const query = this.buildQuery(
          location,
          radius,
          options.filter || "all"
        );
        const response = await fetch(
          `${this.OVERPASS_URL}?data=${encodeURIComponent(query)}`
        );
        const data = await response.json();

        let validElements = data.elements.filter(
          (el: any) => el.tags && el.tags.name
        );

        // Filter by distance
        validElements = validElements.filter((el: any) => {
          const dist = this.calculateDistance(
            location.lat,
            location.lng,
            el.lat,
            el.lon
          );
          return distance === "near" ? dist <= 5 : dist > 5;
        });

        // Exclude IDs
        if (options.excludeIds && options.excludeIds.length > 0) {
          validElements = validElements.filter(
            (el: any) => !options.excludeIds!.includes(`${el.lat}-${el.lon}`)
          );
        }

        if (validElements.length > 0) {
          const randomEl =
            validElements[Math.floor(Math.random() * validElements.length)];
          return await this.mapToPlaceWithAddress(randomEl);
        }
      } catch (error) {
        console.error(`Error at radius ${radius}:`, error);
      }
    }

    return null;
  }

  async searchByKeyword(
    location: Location,
    keyword: string,
    options: Omit<SearchOptions, "keyword">
  ): Promise<Place | null> {
    const distance = options.distance || "near";
    const radiusLevels =
      distance === "near"
        ? [500, 1000, 1500, 2000, 3000, 4000, 5000]
        : [5000, 7000, 10000, 12000, 15000];

    const normalizedKeyword = this.removeAccents(keyword);

    for (const radius of radiusLevels) {
      try {
        // Query to get ALL places, filter client-side
        const query = `
          [out:json];
          (
            node["amenity"~"restaurant|cafe|fast_food|bar"]["name"]
              (around:${radius},${location.lat},${location.lng});
          );
          out body;
        `;

        const response = await fetch(
          `${this.OVERPASS_URL}?data=${encodeURIComponent(query)}`
        );
        const data = await response.json();

        // Filter by keyword (accent-insensitive)
        let validElements = data.elements.filter((el: any) => {
          if (!el.tags || !el.tags.name) return false;
          const normalizedName = this.removeAccents(el.tags.name);
          return normalizedName.includes(normalizedKeyword);
        });

        // Filter by distance
        validElements = validElements.filter((el: any) => {
          const dist = this.calculateDistance(
            location.lat,
            location.lng,
            el.lat,
            el.lon
          );
          return distance === "near" ? dist <= 5 : dist > 5;
        });

        // Exclude IDs
        if (options.excludeIds && options.excludeIds.length > 0) {
          validElements = validElements.filter(
            (el: any) => !options.excludeIds!.includes(`${el.lat}-${el.lon}`)
          );
        }

        if (validElements.length > 0) {
          const randomEl =
            validElements[Math.floor(Math.random() * validElements.length)];
          return await this.mapToPlaceWithAddress(randomEl);
        }
      } catch (error) {
        console.error(`Error at radius ${radius}:`, error);
      }
    }

    return null;
  }

  // Helper: Build Overpass query
  private buildQuery(
    location: Location,
    radius: number,
    filter: SearchFilter
  ): string {
    let queryFilters = "";

    if (filter === "food") {
      queryFilters = `
        node["amenity"="restaurant"](around:${radius},${location.lat},${location.lng});
        node["amenity"="fast_food"](around:${radius},${location.lat},${location.lng});
      `;
    } else if (filter === "drink") {
      queryFilters = `
        node["amenity"="cafe"](around:${radius},${location.lat},${location.lng});
        node["amenity"="bar"](around:${radius},${location.lat},${location.lng});
        node["amenity"="pub"](around:${radius},${location.lat},${location.lng});
      `;
    } else {
      queryFilters = `
        node["amenity"="restaurant"](around:${radius},${location.lat},${location.lng});
        node["amenity"="cafe"](around:${radius},${location.lat},${location.lng});
        node["amenity"="fast_food"](around:${radius},${location.lat},${location.lng});
        node["amenity"="bar"](around:${radius},${location.lat},${location.lng});
      `;
    }

    return `
      [out:json];
      (
        ${queryFilters}
      );
      out body;
    `;
  }

  // Helper: Map OSM element to Place
  private mapToPlace(el: any): Place {
    const cuisine = el.tags.cuisine || el.tags.amenity;
    return {
      id: `${el.lat}-${el.lon}`,
      lat: el.lat,
      lng: el.lon,
      name: el.tags.name,
      cuisine,
      emoji: this.getCuisineEmoji(cuisine, el.tags.amenity),
      tags: el.tags,
    };
  }

  // Helper: Map with full address
  private async mapToPlaceWithAddress(el: any): Promise<Place> {
    const place = this.mapToPlace(el);

    // Try to get full address
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${el.lat}&longitude=${el.lon}&localityLanguage=vi`
      );
      if (response.ok) {
        const data = await response.json();
        const parts = [
          data.locality,
          data.city,
          data.principalSubdivision,
        ].filter(Boolean);
        if (parts.length > 0) {
          place.address = parts.join(", ");
        }
      }
    } catch (e) {
      // Fallback to tags
      const addressParts = [
        el.tags["addr:housenumber"],
        el.tags["addr:street"],
        el.tags["addr:city"],
      ].filter(Boolean);
      if (addressParts.length > 0) {
        place.address = addressParts.join(", ");
      }
    }

    return place;
  }

  // Helper: Calculate distance (Haversine)
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Helper: Remove Vietnamese accents
  private removeAccents(str: string): string {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();
  }

  // Helper: Get cuisine emoji
  private getCuisineEmoji(cuisine?: string, amenity?: string): string {
    const emojis: Record<string, string> = {
      restaurant: "🍽️",
      cafe: "☕",
      fast_food: "🍔",
      vietnamese: "🍜",
      chinese: "🥢",
      japanese: "🍣",
      korean: "🍲",
      italian: "🍕",
      mexican: "🌮",
      indian: "🍛",
      thai: "🥘",
      seafood: "🦐",
      pizza: "🍕",
      burger: "🍔",
      coffee: "☕",
      bakery: "🥐",
      dessert: "🍰",
      ice_cream: "🍦",
      bar: "🍺",
    };

    const key = (cuisine || amenity || "").toLowerCase();
    for (const [keyword, emoji] of Object.entries(emojis)) {
      if (key.includes(keyword)) return emoji;
    }
    return "🍴";
  }
}
