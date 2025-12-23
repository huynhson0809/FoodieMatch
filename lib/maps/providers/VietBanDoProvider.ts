import { IMapProvider, MapConfig, MapMarker } from "../IMapProvider";

/**
 * VietBanDo Map Provider Implementation
 * Uses VietBanDo SDK to conform to IMapProvider interface
 */
export class VietBanDoProvider implements IMapProvider {
  private map: any = null;
  private apiKey: string;
  private markers: Map<string, any> = new Map();
  private sdkLoaded: boolean = false;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async initialize(container: HTMLElement, config: MapConfig): Promise<void> {
    // Load VietBanDo SDK
    await this.loadSDK();

    // Initialize map
    // @ts-ignore - VietBanDo SDK types not available
    this.map = new window.vbd.Map(container, {
      center: config.center,
      zoom: config.zoom,
    });

    // Add markers if provided
    if (config.markers) {
      this.setMarkers(config.markers);
    }
  }

  setMarkers(markers: MapMarker[]): void {
    if (!this.map) return;

    // Clear existing markers
    this.markers.forEach((marker) => {
      marker.setMap(null);
    });
    this.markers.clear();

    // Add new markers
    markers.forEach((markerData) => {
      // @ts-ignore
      const marker = new window.vbd.Marker({
        position: [markerData.lat, markerData.lng],
        map: this.map,
        title: markerData.title,
      });

      // Add popup if there's a description
      if (markerData.description) {
        // @ts-ignore
        const infoWindow = new window.vbd.InfoWindow({
          content: this.createPopupContent(markerData),
        });

        marker.addListener("click", () => {
          infoWindow.open(this.map, marker);
        });
      }

      this.markers.set(markerData.id, marker);
    });
  }

  setCenter(lat: number, lng: number, zoom?: number): void {
    if (!this.map) return;

    this.map.setCenter([lat, lng]);
    if (zoom !== undefined) {
      this.map.setZoom(zoom);
    }
  }

  addRecenterControl(onRecenter: () => void): void {
    if (!this.map) return;

    // Create custom control button
    const controlDiv = document.createElement("div");
    controlDiv.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 1000;
    `;

    const controlButton = document.createElement("button");
    controlButton.innerHTML = "🎯";
    controlButton.title = "Về vị trí của tôi";
    controlButton.style.cssText = `
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

    controlButton.onclick = onRecenter;
    controlDiv.appendChild(controlButton);

    // Add to map container
    const mapContainer = this.map.getDiv();
    mapContainer.appendChild(controlDiv);
  }

  destroy(): void {
    this.markers.forEach((marker) => {
      marker.setMap(null);
    });
    this.markers.clear();

    if (this.map) {
      // VietBanDo map cleanup
      this.map = null;
    }
  }

  // Load VietBanDo SDK dynamically
  private async loadSDK(): Promise<void> {
    if (this.sdkLoaded) return;

    return new Promise((resolve, reject) => {
      // Check if SDK already loaded
      // @ts-ignore
      if (window.vbd) {
        this.sdkLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.vietbando.com/v2/vbdapis.js?key=${this.apiKey}`;
      script.async = true;

      script.onload = () => {
        this.sdkLoaded = true;
        resolve();
      };

      script.onerror = () => {
        reject(new Error("Failed to load VietBanDo SDK"));
      };

      document.head.appendChild(script);
    });
  }

  // Helper: Create popup content
  private createPopupContent(marker: MapMarker): string {
    return `
      <div style="text-align: center; padding: 10px;">
        <b style="color: #ec4899; font-size: 1.125rem;">${marker.title}</b>
        ${
          marker.description
            ? `<br/><p style="margin-top: 8px;">${marker.description}</p>`
            : ""
        }
      </div>
    `;
  }
}
