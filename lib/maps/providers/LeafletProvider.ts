import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { IMapProvider, MapConfig, MapMarker } from "../IMapProvider";

/**
 * Leaflet Map Provider Implementation
 * Wraps Leaflet library to conform to IMapProvider interface
 */
export class LeafletProvider implements IMapProvider {
  private map: L.Map | null = null;
  private markers: Map<string, L.Marker> = new Map();
  private recenterButton: HTMLButtonElement | null = null;

  async initialize(container: HTMLElement, config: MapConfig): Promise<void> {
    // Initialize Leaflet map
    this.map = L.map(container).setView(config.center, config.zoom);

    // Add CartoDB Voyager tiles (matching current implementation)
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
      }
    ).addTo(this.map);

    // Add markers if provided
    if (config.markers) {
      this.setMarkers(config.markers);
    }
  }

  async setMarkers(
    markers: MapMarker[],
    enableRouting: boolean = false
  ): Promise<void> {
    if (!this.map) return;

    // Clear existing markers
    this.markers.forEach((marker) => marker.remove());
    this.markers.clear();

    // Remove existing route layer if any
    this.map.eachLayer((layer: any) => {
      if (layer.options && layer.options.id === "route-line") {
        this.map?.removeLayer(layer);
      }
    });

    const userMarker = markers.find((m) => m.type === "user");
    const restaurantMarker = markers.find((m) => m.type === "restaurant");

    // Add all markers first
    markers.forEach((markerData) => {
      const icon = this.createIcon(markerData.type, markerData.title);
      const marker = L.marker([markerData.lat, markerData.lng], { icon });

      // Always use custom popup to include Google Maps button
      marker.bindPopup(this.createPopup(markerData));

      marker.addTo(this.map!);
      this.markers.set(markerData.id, marker);
    });

    // Draw route ONLY if routing is enabled and we have both start/end points
    if (enableRouting && userMarker && restaurantMarker) {
      await this.drawRoute(userMarker, restaurantMarker);
    }
  }

  private async drawRoute(start: MapMarker, end: MapMarker): Promise<void> {
    try {
      // OSRM Public API (Usage limits apply, acceptable for demo/dev)
      // Format: {lon},{lat};{lon},{lat}
      const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;

      const response = await fetch(url);
      if (!response.ok) return;

      const data = await response.json();
      if (data.routes && data.routes[0]) {
        const coordinates = data.routes[0].geometry.coordinates.map(
          (coord: number[]) => [coord[1], coord[0]]
        ); // Flip to [lat, lng] for Leaflet

        // Draw polyline
        const routeLine = L.polyline(coordinates, {
          color: "#3b82f6", // Blue
          weight: 5,
          opacity: 0.8,
          lineCap: "round",
          lineJoin: "round",
          // @ts-expect-error - Custom option for identification
          id: "route-line",
        });

        routeLine.addTo(this.map!);

        // Fit bounds to show route
        this.map!.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
      }
    } catch (error) {
      console.error("Leaflet Routing Error:", error);
    }
  }

  setCenter(lat: number, lng: number, zoom?: number): void {
    if (!this.map) return;

    if (zoom !== undefined) {
      this.map.flyTo([lat, lng], zoom, {
        animate: true,
        duration: 1.5,
      });
    } else {
      this.map.panTo([lat, lng]);
    }
  }

  addRecenterControl(onRecenter: () => void): void {
    if (!this.map) return;

    // Create custom control button
    this.recenterButton = document.createElement("button");
    this.recenterButton.innerHTML = "🎯";
    this.recenterButton.title = "Về vị trí của tôi";
    this.recenterButton.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 1000;
      background-color: white;
      border: 2px solid #ffb6c1;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      font-size: 20px;
    `;

    this.recenterButton.onclick = onRecenter;

    // Add to map container
    const mapContainer = this.map.getContainer();
    mapContainer.appendChild(this.recenterButton);
  }

  destroy(): void {
    if (this.recenterButton) {
      this.recenterButton.remove();
      this.recenterButton = null;
    }

    this.markers.forEach((marker) => marker.remove());
    this.markers.clear();

    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  // Helper: Create custom div icon
  private createIcon(type: "user" | "restaurant", title?: string): L.DivIcon {
    if (type === "user") {
      return L.divIcon({
        className: "custom-user-marker",
        html: `
          <div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>
          <div style="position: absolute; top: -30px; left: 50%; transform: translateX(-50%); background: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; white-space: nowrap; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Bạn</div>
        `,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
    } else {
      return L.divIcon({
        className: "custom-place-marker",
        html: `
          <div style="position: relative; display: flex; flex-col: column; align-items: center;">
             <div style="background-color: #ef4444; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.2);"></div>
             ${
               title
                 ? `<div style="position: absolute; top: -24px; left: 50%; transform: translateX(-50%); background: rgba(255,255,255,0.95); padding: 2px 6px; border-radius: 4px; font-size: 10px; white-space: nowrap; font-weight: 600; box-shadow: 0 1px 3px rgba(0,0,0,0.2); color: #333; z-index: 10;">${
                     title.length > 20 ? title.substring(0, 18) + ".." : title
                   }</div>`
                 : ""
             }
          </div>
        `,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
        popupAnchor: [0, -10],
      });
    }
  }

  // Helper: Create popup HTML
  private createPopup(marker: MapMarker): string {
    let popupContent = `
      <div style="text-align: center;">
        <b style="color: #ec4899; font-size: 1.125rem;">${marker.title}</b>
        ${marker.description ? `<br/><p>${marker.description}</p>` : ""}
    `;

    // Add Google Maps button if URL is provided
    if (marker.googleMapsUrl) {
      popupContent += `
        <br/>
        <a href="${marker.googleMapsUrl}" target="_blank" rel="noopener noreferrer" 
           style="display: inline-block; margin-top: 8px; background-color: #4285F4; color: white; padding: 4px 12px; border-radius: 4px; text-decoration: none; font-size: 0.8rem; font-weight: 500;">
           Xem trên Google Maps
        </a>
      `;
    }

    popupContent += `</div>`;
    return popupContent;
  }

  on(event: string, callback: () => void): void {
    if (!this.map) return;
    this.map.on(event, callback);
  }

  getBounds(): {
    north: number;
    south: number;
    east: number;
    west: number;
  } | null {
    if (!this.map) return null;
    const bounds = this.map.getBounds();
    return {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    };
  }
}
