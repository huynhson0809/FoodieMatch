import { Location } from "./ILocationService";

/**
 * Place data types
 */
export interface Place {
  id: string;
  lat: number;
  lng: number;
  name: string;
  address?: string;
  cuisine?: string;
  emoji?: string;
  photos?: string[]; // Array of photo URLs
  tags?: Record<string, string>;
  rating?: number;
  reviewCount?: number;
  distance?: number;
  externalId?: string;
  googleMapsUrl?: string;
}

export type SearchFilter = "food" | "drink" | "all";
export type Distance = "near" | "far";

/**
 * Search options for place queries
 */
export interface SearchOptions {
  filter?: SearchFilter;
  distance?: Distance;
  keyword?: string;
  excludeIds?: string[]; // To prevent repeating suggestions
  radius?: number; // For initial search radius
  minDistance?: number; // For "Far" search (> 5km)
}

/**
 * Place Search Service Interface
 * Handles searching for restaurants, cafes, etc.
 */
export interface IPlaceSearchService {
  /**
   * Search for places near a location
   */
  searchPlaces(location: Location, options: SearchOptions): Promise<Place[]>;

  /**
   * Find a random place matching criteria
   * Progressive radius search until found
   */
  findRandomPlace(
    location: Location,
    options: SearchOptions
  ): Promise<Place | null>;

  /**
   * Search by keyword in place names
   */
  searchByKeyword(
    location: Location,
    keyword: string,
    options: Omit<SearchOptions, "keyword">
  ): Promise<Place | null>;

  /**
   * Search for places within a bounding box
   */
  searchByBounds(
    minLat: number,
    maxLat: number,
    minLng: number,
    maxLng: number,
    limit?: number
  ): Promise<Place[]>;
}
