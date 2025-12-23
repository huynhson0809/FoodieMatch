import { useState, useEffect, useMemo, useCallback } from "react";
import { ServiceFactory } from "../services/ServiceFactory";
import { Location } from "../services/interfaces/ILocationService";

/**
 * React Hook for Location Service
 * Manages device location and geocoding
 */
export function useLocationService() {
  const [location, setLocation] = useState<Location | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get service instance (singleton)
  const service = useMemo(() => ServiceFactory.getLocationService(), []);

  // Fetch current location on mount
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const loc = await service.getCurrentLocation();
        setLocation(loc);

        // Get location name
        const name = await service.reverseGeocode(loc);
        setLocationName(name);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocation();
  }, [service]);

  // Refresh location
  const refreshLocation = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const loc = await service.getCurrentLocation();
      setLocation(loc);

      const name = await service.reverseGeocode(loc);
      setLocationName(name);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  return {
    location,
    locationName,
    isLoadingLocation: isLoading,
    locationError: error,
    refreshLocation,
    service,
  };
}
