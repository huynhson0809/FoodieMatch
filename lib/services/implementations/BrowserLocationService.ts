import {
  ILocationService,
  Location,
  LocationName,
} from "../interfaces/ILocationService";

/**
 * Browser-based Location Service
 * Uses browser geolocation API and BigDataCloud for geocoding
 */
export class BrowserLocationService implements ILocationService {
  async getCurrentLocation(): Promise<Location> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject(new Error("Location permission denied"));
              break;
            case error.POSITION_UNAVAILABLE:
              reject(new Error("Location unavailable"));
              break;
            case error.TIMEOUT:
              reject(new Error("Location request timeout"));
              break;
            default:
              reject(new Error("Unknown location error"));
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // Cache 5 minutes
        }
      );
    });
  }

  async getLocationName(location: Location): Promise<LocationName> {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${location.lat}&longitude=${location.lng}&localityLanguage=vi`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      return {
        name: [data.locality, data.city, data.principalSubdivision]
          .filter(Boolean)
          .join(", "),
        locality: data.locality,
        city: data.city,
        region: data.principalSubdivision,
      };
    } catch (error) {
      console.error("Error getting location name:", error);
      return { name: "Unknown location" };
    }
  }

  async reverseGeocode(location: Location): Promise<string> {
    const locationName = await this.getLocationName(location);
    return locationName.name;
  }
}
