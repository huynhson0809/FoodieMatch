import {
  IPlaceSearchService,
  Location,
  Place,
  SearchOptions,
} from "../interfaces/IPlaceSearchService";

export class GoongPlaceSearchService implements IPlaceSearchService {
  private apiKey: string;
  private readonly BASE_URL = "https://rsapi.goong.io/Place";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchPlaces(
    location: Location,
    options: SearchOptions
  ): Promise<Place[]> {
    if (!options.keyword) return [];

    try {
      // Use Goong Place Search API
      const url = `${this.BASE_URL}/AutoComplete?api_key=${
        this.apiKey
      }&location=${location.lat},${location.lng}&input=${encodeURIComponent(
        options.keyword
      )}`;

      const response = await fetch(url);
      if (!response.ok) return [];

      const data = await response.json();
      if (!data.predictions) return [];

      // Map predictions to Place objects
      // Note: Goong AutoComplete returns minimal info (description, place_id)
      // We might need Detail API for coordinates, but for listing we verify what we have

      // For a proper search service, we usually need coordinates.
      // Let's try to map what we can.

      const places: Place[] = await Promise.all(
        data.predictions.map(async (p: any) => {
          // Ideally fetch details for each, but that might be expensive/slow
          // returning basic info first
          return {
            id: p.place_id,
            name: p.structured_formatting?.main_text || p.description,
            address: p.description,
            lat: 0, // Pending detail fetch
            lng: 0, // Pending detail fetch
            externalId: p.place_id,
          } as Place;
        })
      );

      return places;
    } catch (error) {
      console.error("Goong Search Error:", error);
      return [];
    }
  }

  async findRandomPlace(
    location: Location,
    options: SearchOptions
  ): Promise<Place | null> {
    // Goong doesn't have "Random", so we search mostly related to keyword or category
    return null;
  }

  async searchByKeyword(
    location: Location,
    keyword: string,
    options: Omit<SearchOptions, "keyword">
  ): Promise<Place | null> {
    const results = await this.searchPlaces(location, { ...options, keyword });
    if (results.length > 0) {
      // If we need details (lat/lng), we should fetch detail for the first one
      // Fetch detail
      try {
        const placeId = results[0].id;
        const detailUrl = `${this.BASE_URL}/Detail?place_id=${placeId}&api_key=${this.apiKey}`;
        const res = await fetch(detailUrl);
        const data = await res.json();

        if (
          data.result &&
          data.result.geometry &&
          data.result.geometry.location
        ) {
          const details = data.result;
          return {
            ...results[0],
            lat: details.geometry.location.lat,
            lng: details.geometry.location.lng,
            address: details.formatted_address || results[0].address,
            name: details.name || results[0].name,
            googleMapsUrl: details.url, // Goong might provide google map url? or we construct it
          };
        }
      } catch (e) {
        /* ignore */
      }

      return results[0];
    }
    return null;
    return null;
  }

  async searchByBounds(
    minLat: number,
    maxLat: number,
    minLng: number,
    maxLng: number,
    limit?: number
  ): Promise<Place[]> {
    return [];
  }
}
