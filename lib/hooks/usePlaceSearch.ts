import { useState, useMemo, useCallback } from "react";
import { ServiceFactory } from "../services/ServiceFactory";
import {
  Place,
  SearchOptions,
} from "../services/interfaces/IPlaceSearchService";
import { Location } from "../services/interfaces/ILocationService";

/**
 * React Hook for Place Search Service
 * Handles restaurant/cafe search functionality
 */
export function usePlaceSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);

  // Get service instance (singleton)
  const service = useMemo(() => ServiceFactory.getPlaceSearchService(), []);

  // Search places
  const searchPlaces = useCallback(
    async (location: Location, options: SearchOptions) => {
      try {
        setIsSearching(true);
        const results = await service.searchPlaces(location, options);
        setPlaces(results);
        return results;
      } catch (error) {
        console.error("Place search error:", error);
        throw error;
      } finally {
        setIsSearching(false);
      }
    },
    [service]
  );

  // Find random place
  const findRandomPlace = useCallback(
    async (location: Location, options: SearchOptions) => {
      try {
        setIsSearching(true);
        const place = await service.findRandomPlace(location, options);
        if (place) {
          setPlaces([place]);
        }
        return place;
      } catch (error) {
        console.error("Random place search error:", error);
        throw error;
      } finally {
        setIsSearching(false);
      }
    },
    [service]
  );

  // Search by keyword
  const searchByKeyword = useCallback(
    async (
      location: Location,
      keyword: string,
      options: Omit<SearchOptions, "keyword">
    ) => {
      try {
        setIsSearching(true);
        const place = await service.searchByKeyword(location, keyword, options);
        if (place) {
          setPlaces([place]);
        }
        return place;
      } catch (error) {
        console.error("Keyword search error:", error);
        throw error;
      } finally {
        setIsSearching(false);
      }
    },
    [service]
  );

  // Clear places
  const clearPlaces = useCallback(() => {
    setPlaces([]);
  }, []);

  return {
    isSearching,
    places,
    searchPlaces,
    findRandomPlace,
    searchByKeyword,
    clearPlaces,
    service,
  };
}
