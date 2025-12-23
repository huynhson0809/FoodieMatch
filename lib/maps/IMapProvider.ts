/**
 * Map Provider Interface
 * Abstraction layer for all map services (Leaflet, VietBanDo, Google Maps, etc.)
 */

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description?: string;
  googleMapsUrl?: string; // URL to view on Google Maps
  type: "user" | "restaurant";
}

export interface MapConfig {
  center: [number, number];
  zoom: number;
  markers?: MapMarker[];
}

export interface IMapProvider {
  /**
   * Initialize map in container
   */
  initialize(container: HTMLElement, config: MapConfig): Promise<void>;

  /**
   * Update markers on the map
   */
  setMarkers(markers: MapMarker[], enableRouting?: boolean): void;

  /**
   * Center map on specific coordinates
   */
  setCenter(lat: number, lng: number, zoom?: number): void;

  /**
   * Add recenter control to map
   */
  addRecenterControl(onRecenter: () => void): void;

  /**
   * Cleanup and destroy map instance
   */
  /**
   * Cleanup and destroy map instance
   */
  destroy(): void;

  /**
   * Attach event listener to map
   */
  on(event: string, callback: () => void): void;

  /**
   * Get current map bounds
   */
  getBounds(): {
    north: number;
    south: number;
    east: number;
    west: number;
  } | null;
}
