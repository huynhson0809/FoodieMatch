import { Location } from "../interfaces/ILocationService";
import {
  IPlaceSearchService,
  Place,
  SearchOptions,
} from "../interfaces/IPlaceSearchService";

export class ChainPlaceSearchService implements IPlaceSearchService {
  private services: IPlaceSearchService[];

  constructor(services: IPlaceSearchService[]) {
    this.services = services;
  }

  async searchPlaces(
    location: Location,
    options: SearchOptions
  ): Promise<Place[]> {
    for (const service of this.services) {
      try {
        const results = await service.searchPlaces(location, options);
        if (results && results.length > 0) {
          console.log(
            `[Chain] Search succeeded with ${service.constructor.name}`
          );
          return results;
        }
      } catch (e) {
        console.warn(`[Chain] Service ${service.constructor.name} failed:`, e);
        // Continue to next service
      }
    }
    console.log("[Chain] All services failed to return results.");
    return [];
  }

  async findRandomPlace(
    location: Location,
    options: SearchOptions
  ): Promise<Place | null> {
    for (const service of this.services) {
      try {
        const result = await service.findRandomPlace(location, options);
        if (result) {
          console.log(
            `[Chain] Random place found with ${service.constructor.name}`
          );
          return result;
        }
      } catch (e) {
        console.warn(
          `[Chain] Service ${service.constructor.name} failed (random):`,
          e
        );
      }
    }
    return null;
  }

  async searchByKeyword(
    location: Location,
    keyword: string,
    options: Omit<SearchOptions, "keyword">
  ): Promise<Place | null> {
    for (const service of this.services) {
      try {
        const result = await service.searchByKeyword(
          location,
          keyword,
          options
        );
        if (result) {
          console.log(
            `[Chain] Keyword search succeeded with ${service.constructor.name}`
          );
          return result;
        }
      } catch (e) {
        console.warn(
          `[Chain] Service ${service.constructor.name} failed (keyword):`,
          e
        );
      }
    }
    return null;
  }

  async searchByBounds(
    minLat: number,
    maxLat: number,
    minLng: number,
    maxLng: number,
    limit?: number
  ): Promise<Place[]> {
    for (const service of this.services) {
      try {
        const results = await service.searchByBounds(
          minLat,
          maxLat,
          minLng,
          maxLng,
          limit
        );
        if (results && results.length > 0) {
          // If a service returns results for bounds, we might want to return them.
          // Or we might want to aggregate. For now, first come first serve.
          return results;
        }
      } catch (e) {
        console.warn(
          `[Chain] Service ${service.constructor.name} failed (bounds):`,
          e
        );
      }
    }
    return [];
  }
}
