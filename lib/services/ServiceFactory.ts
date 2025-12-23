import { ILocationService } from "./interfaces/ILocationService";
import { IPlaceSearchService } from "./interfaces/IPlaceSearchService";
import { BrowserLocationService } from "./implementations/BrowserLocationService";
import { OverpassPlaceSearchService } from "./implementations/OverpassPlaceSearchService";
import { GoongPlaceSearchService } from "./implementations/GoongPlaceSearchService";
import { PrismaPlaceSearchService } from "./implementations/PrismaPlaceSearchService";
import { ChainPlaceSearchService } from "./implementations/ChainPlaceSearchService";

/**
 * Service Factory
 * Creates service instances based on environment configuration
 */
export class ServiceFactory {
  private static locationService: ILocationService | null = null;
  private static placeSearchService: IPlaceSearchService | null = null;

  /**
   * Get Location Service instance (singleton)
   */
  static getLocationService(): ILocationService {
    if (!this.locationService) {
      // Currently only browser-based location
      this.locationService = new BrowserLocationService();
    }
    return this.locationService;
  }

  /**
   * Get Place Search Service instance (singleton)
   * Provider selected via NEXT_PUBLIC_PLACE_SEARCH_PROVIDER env variable
   *
   * Supported providers:
   * - 'goong': Goong Places API (Vietnam-optimized, requires API key)
   * - 'overpass': OpenStreetMap via Overpass API (free, worldwide)
   */
  static getPlaceSearchService(): IPlaceSearchService {
    if (!this.placeSearchService) {
      // Always build the chain: Prisma -> Goong (if key) -> Overpass
      const services: IPlaceSearchService[] = [];

      // 1. Prisma (Database)
      services.push(new PrismaPlaceSearchService());

      // 2. Goong (if configured)
      const goongKey = process.env.NEXT_PUBLIC_GOONG_API_KEY;
      if (goongKey) {
        services.push(new GoongPlaceSearchService(goongKey));
      }

      // 3. Overpass (OSM) - Final fallback
      services.push(new OverpassPlaceSearchService());

      console.log(
        `[ServiceFactory] Initializing Search Chain with ${
          services.length
        } providers: ${services.map((s) => s.constructor.name).join(" -> ")}`
      );

      this.placeSearchService = new ChainPlaceSearchService(services);
      // Service chain initialized
    }
    return this.placeSearchService;
  }

  /**
   * Reset services (for testing or provider switching)
   */
  static reset(): void {
    this.locationService = null;
    this.placeSearchService = null;
  }
}
