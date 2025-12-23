/**
 * Location data types
 */
export interface Location {
  lat: number;
  lng: number;
}

export interface LocationName {
  name: string;
  locality?: string;
  city?: string;
  region?: string;
}

/**
 * Location Service Interface
 * Handles device location and geocoding
 */
export interface ILocationService {
  /**
   * Get current device location
   */
  getCurrentLocation(): Promise<Location>;

  /**
   * Get human-readable name for a location
   */
  getLocationName(location: Location): Promise<LocationName>;

  /**
   * Reverse geocode coordinates to address
   */
  reverseGeocode(location: Location): Promise<string>;
}
