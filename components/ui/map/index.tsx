"use client";
import { useEffect, useRef } from "react";
import { MapFactory } from "@/lib/maps/MapFactory";
import { IMapProvider, MapMarker } from "@/lib/maps/IMapProvider";

interface MapProps {
  center: [number, number];
  markers: Array<{ lat: number; lng: number; name: string }>;
  onMoveEnd?: (bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) => void;
  enableRouting?: boolean;
}

/**
 * Map Component - Provider Agnostic
 * Uses IMapProvider interface to support multiple map libraries
 * Switch providers via NEXT_PUBLIC_MAP_PROVIDER env variable
 */
export default function Map({
  center,
  markers,
  onMoveEnd,
  enableRouting = false,
}: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const providerRef = useRef<IMapProvider | null>(null);
  const onMoveEndRef = useRef(onMoveEnd);

  // Update ref when prop changes
  useEffect(() => {
    onMoveEndRef.current = onMoveEnd;
  }, [onMoveEnd]);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current) return;

    const initMap = async () => {
      // Validate center coordinates
      if (!center || isNaN(center[0]) || isNaN(center[1])) {
        console.error("[Map] Invalid center coordinates:", center);
        return;
      }

      try {
        // Create provider from factory
        const provider = MapFactory.createProvider();
        providerRef.current = provider;

        // Convert markers to MapMarker format
        const mapMarkers: MapMarker[] = [
          // User location marker
          {
            id: "user",
            lat: center[0],
            lng: center[1],
            title: "Bạn đang ở đây! 🏠",
            type: "user",
          },
          // Restaurant markers
          ...markers.map((place, idx) => ({
            id: `restaurant-${idx}`,
            lat: place.lat,
            lng: place.lng,
            title: place.name,
            // description: Removed directions
            type: "restaurant" as const,
          })),
        ];

        // Initialize map with config
        await provider.initialize(containerRef.current!, {
          center,
          zoom: 15,
          markers: mapMarkers,
        });

        // Add recenter control
        provider.addRecenterControl(() => {
          provider.setCenter(center[0], center[1], 15);
        });

        // Trigger initial bounds update so parent knows where we are
        // Small delay to ensure map is fully ready
        setTimeout(() => {
          if (!provider) return; // Guard
          const initialBounds = provider.getBounds();
          if (initialBounds && onMoveEndRef.current) {
            onMoveEndRef.current(initialBounds);
          }
        }, 500);

        provider.on("moveend", () => {
          if (!provider) return;
          const bounds = provider.getBounds();
          if (bounds && onMoveEndRef.current) {
            onMoveEndRef.current(bounds);
          }
        });

        // Initial routing check (if enabled)
        if (enableRouting) {
          provider.setMarkers(mapMarkers, true);
        }
      } catch (error) {
        console.error("[Map] Failed to initialize map provider:", error);
      }
    };

    initMap();

    // Cleanup on unmount
    return () => {
      if (providerRef.current) {
        providerRef.current.destroy();
        providerRef.current = null;
      }
    };
  }, [center]); // Re-init if center changes significantly? Usually acceptable.

  // Update markers when they change
  useEffect(() => {
    if (!providerRef.current) return;

    const mapMarkers: MapMarker[] = [
      {
        id: "user",
        lat: center[0],
        lng: center[1],
        title: "Bạn đang ở đây! 🏠",
        type: "user",
      },
      ...markers.map((place, idx) => ({
        id: `restaurant-${idx}`,
        lat: place.lat,
        lng: place.lng,
        title: place.name,
        // Pass externalId as googleMapsUrl if available
        googleMapsUrl: (() => {
          const urlOrId =
            (place as any).googleMapsUrl || (place as any).externalId;

          // Case 1: Existing URL
          if (urlOrId && urlOrId.startsWith("http")) return urlOrId;

          // Case 2: Place ID -> Construct URL
          if (urlOrId) {
            return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              place.name
            )}&query_place_id=${urlOrId}`;
          }

          // Case 3: No ID -> Fallback to Search by Name + Lat/Lng (to ensure button ALWAYS shows)
          return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            place.name
          )}&center=${place.lat},${place.lng}`;
        })(),
        type: "restaurant" as const,
      })),
    ];

    providerRef.current.setMarkers(mapMarkers, enableRouting);
  }, [markers, center, enableRouting]);

  return (
    <div
      ref={containerRef}
      style={{
        height: "100%",
        width: "100%",
        borderRadius: "15px",
        overflow: "hidden",
      }}
    />
  );
}
