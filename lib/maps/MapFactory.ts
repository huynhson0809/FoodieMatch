import { IMapProvider } from "./IMapProvider";
import { LeafletProvider } from "./providers/LeafletProvider";
import { VietBanDoProvider } from "./providers/VietBanDoProvider";
/**
 * Map Provider Factory
 * Creates appropriate map provider based on environment configuration
 */
export class MapFactory {
  static createProvider(): IMapProvider {
    const provider = process.env.NEXT_PUBLIC_MAP_PROVIDER || "leaflet";
    console.log(`[MapFactory] Using map provider: ${provider}`);

    switch (provider.toLowerCase()) {
      case "vietbando":
        const vietbandoKey = process.env.NEXT_PUBLIC_VIETBANDO_API_KEY;
        if (!vietbandoKey) {
          console.warn(
            "[MapFactory] NEXT_PUBLIC_VIETBANDO_API_KEY not found, falling back to Leaflet"
          );
          return new LeafletProvider();
        }
        return new VietBanDoProvider(vietbandoKey);

      case "leaflet":
      default:
        return new LeafletProvider();
    }
  }
}
