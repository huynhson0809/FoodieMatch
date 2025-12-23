"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useLocation } from "@/contexts/location-context";
import { Loader2 } from "lucide-react";

// Import Map dynamically to avoid SSR issues
const Map = dynamic(() => import("@/components/ui/map"), { ssr: false });

// Debounce helper
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function MapExplorer() {
  const { location, searchInBounds, places, isSearchingPlaces } = useLocation();
  const [bounds, setBounds] = useState<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(null);

  // Debounce bounds to avoid too many API calls
  const debouncedBounds = useDebounce(bounds, 800);

  // When debounced bounds change, trigger search
  useEffect(() => {
    if (debouncedBounds) {
      searchInBounds(
        debouncedBounds.south, // minLat
        debouncedBounds.north, // maxLat
        debouncedBounds.west, // minLng
        debouncedBounds.east // maxLng
      ).catch(console.error);
    }
  }, [debouncedBounds, searchInBounds]);

  const handleMoveEnd = useCallback(
    (newBounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    }) => {
      setBounds(newBounds);
    },
    []
  );

  return (
    <div className="relative w-full h-[60vh] max-h-[500px] rounded-xl overflow-hidden shadow-2xl border-2 border-border bg-muted/20">
      {/* Map */}
      {location ? (
        <>
          <Map
            center={location}
            markers={places || []}
            onMoveEnd={handleMoveEnd}
            enableRouting={false}
          />
          {/* Debug log */}
          <div className="hidden">Log: {places?.length} places</div>
        </>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Đang xác định vị trí...</p>
          </div>
        </div>
      )}

      {/* Loading Indicator Overlay */}
      {isSearchingPlaces && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000]">
          <div className="bg-background/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2 border border-border">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm font-medium">Đang tìm quán...</span>
          </div>
        </div>
      )}

      {/* Places Count Overlay */}
      {places && places.length > 0 && !isSearchingPlaces && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-background/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-border text-xs font-medium">
          Tìm thấy {places.length} địa điểm
        </div>
      )}
    </div>
  );
}
