"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

// Types
export type SearchFilter = "food" | "drink" | "all";

export interface Place {
  id: string; // Unique identifier (lat-lon combo)
  lat: number;
  lng: number;
  name: string;
  address?: string;
  cuisine?: string;
  emoji?: string;
  tags?: Record<string, string>;
  // New fields
  rating?: number;
  reviewCount?: number;
  distance?: number;
  googleMapsUrl?: string; // or construct it client side
}

interface LocationContextType {
  // Location state
  location: [number, number] | null;
  locationName: string | null;
  isLoadingLocation: boolean;
  locationError: string | null;

  // Places state
  places: Place[];
  isSearchingPlaces: boolean;
  searchRadius: number;

  // Actions
  refreshLocation: () => void;
  findFoodNearby: (radius?: number) => Promise<Place[]>;
  findFoodNearbyWithRetry: (
    filter?: SearchFilter,
    distance?: "near" | "far",
    excludePlaceId?: string
  ) => Promise<Place | null>;
  searchByKeyword: (
    keyword: string,
    distance?: "near" | "far",
    excludePlaceId?: string
  ) => Promise<Place | null>;
  searchInBounds: (
    minLat: number,
    maxLat: number,
    minLng: number,
    maxLng: number
  ) => Promise<void>;
  clearPlaces: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(
  undefined
);

// Reverse geocoding để lấy địa chỉ chi tiết từ tọa độ
// Sử dụng BigDataCloud API (miễn phí, không cần key, hỗ trợ tiếng Việt)
async function getDetailedLocation(
  lat: number,
  lng: number
): Promise<{
  name: string;
} | null> {
  try {
    // BigDataCloud free reverse geocoding API
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=vi`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    // Tạo địa chỉ từ response của BigDataCloud
    const parts = [
      data.locality, // Phường/Xã
      data.city, // Quận/Huyện hoặc Thành phố
      data.principalSubdivision, // Tỉnh/Thành phố trực thuộc TW
      data.countryName, // Việt Nam
    ].filter(Boolean);

    if (parts.length > 0) {
      return {
        name: parts.join(", "),
      };
    }

    // Fallback: dùng localityInfo nếu có
    if (data.localityInfo?.administrative) {
      const adminParts = data.localityInfo.administrative
        .slice(-3)
        .map((a: { name: string }) => a.name)
        .reverse();
      return {
        name: adminParts.join(", "),
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching location details:", error);
    return null;
  }
}

// Emoji cho các loại quán ăn - dùng làm fallback thay vì ảnh
const cuisineEmojis: Record<string, string> = {
  restaurant: "🍽️",
  cafe: "☕",
  fast_food: "🍔",
  vietnamese: "🍜",
  chinese: "🥢",
  japanese: "🍣",
  korean: "🍲",
  italian: "🍕",
  mexican: "🌮",
  indian: "🍛",
  thai: "🥘",
  seafood: "🦐",
  pizza: "🍕",
  burger: "🍔",
  coffee: "☕",
  bakery: "🥐",
  dessert: "🍰",
  ice_cream: "🍦",
  bar: "🍺",
  default: "🍴",
};

// Lấy emoji phù hợp với loại quán
function getCuisineEmoji(cuisine?: string, amenity?: string): string {
  const key = (cuisine || amenity || "").toLowerCase();

  // Tìm trong mapping
  for (const [keyword, emoji] of Object.entries(cuisineEmojis)) {
    if (key.includes(keyword)) {
      return emoji;
    }
  }
  return cuisineEmojis.default;
}

interface LocationProviderProps {
  children: ReactNode;
}

export function LocationProvider({ children }: LocationProviderProps) {
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [searchRadius, setSearchRadius] = useState(0);

  // Lấy vị trí người dùng
  const fetchLocation = useCallback(async () => {
    setIsLoadingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Trình duyệt không hỗ trợ GPS");
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords: [number, number] = [
          pos.coords.latitude,
          pos.coords.longitude,
        ];
        setLocation(coords);

        // Lấy địa chỉ chi tiết
        const result = await getDetailedLocation(coords[0], coords[1]);
        if (result) {
          setLocationName(result.name);
        }
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Bạn đã từ chối quyền truy cập vị trí");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Không thể xác định vị trí");
            break;
          case error.TIMEOUT:
            setLocationError("Hết thời gian chờ lấy vị trí");
            break;
          default:
            setLocationError("Lỗi không xác định");
        }
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // Cache 5 phút
      }
    );
  }, []);

  // Tự động lấy vị trí khi mount
  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  // Tìm quán ăn quanh đây với radius cố định
  const findFoodNearby = useCallback(
    async (radius: number = 1500): Promise<Place[]> => {
      if (!location) {
        throw new Error("Chưa lấy được vị trí của bạn!");
      }

      setIsSearchingPlaces(true);
      setSearchRadius(radius);
      const [lat, lng] = location;

      const query = `
      [out:json];
      (
        node["amenity"="restaurant"](around:${radius},${lat},${lng});
        node["amenity"="cafe"](around:${radius},${lat},${lng});
        node["amenity"="fast_food"](around:${radius},${lat},${lng});
      );
      out body;
    `;

      try {
        const response = await fetch(
          `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(
            query
          )}`
        );
        const data = await response.json();

        const validPlaces: Place[] = await Promise.all(
          data.elements
            .filter(
              (el: { tags?: { name?: string }; lat: number; lon: number }) =>
                el.tags && el.tags.name
            )
            .map(
              (el: {
                lat: number;
                lon: number;
                tags: Record<string, string>;
              }) => {
                const cuisine = el.tags.cuisine || el.tags.amenity;
                const emoji = getCuisineEmoji(cuisine, el.tags.amenity);

                // Tạo địa chỉ từ tags
                const addressParts = [
                  el.tags["addr:housenumber"],
                  el.tags["addr:street"],
                  el.tags["addr:city"],
                ].filter(Boolean);

                return {
                  id: `${el.lat}-${el.lon}`,
                  lat: el.lat,
                  lng: el.lon,
                  name: el.tags.name,
                  address:
                    addressParts.length > 0
                      ? addressParts.join(", ")
                      : undefined,
                  cuisine: cuisine,
                  emoji: emoji,
                  tags: el.tags,
                };
              }
            )
        );

        setPlaces(validPlaces);
        return validPlaces;
      } catch (error) {
        console.error("Error finding places:", error);
        throw new Error("Lỗi khi tìm quán!");
      } finally {
        setIsSearchingPlaces(false);
      }
    },
    [location]
  );

  // Tìm quán ăn với progressive radius - tăng dần cho đến khi tìm được
  const findFoodNearbyWithRetry = useCallback(
    async (
      filter: SearchFilter = "all",
      distance: "near" | "far" = "near",
      excludePlaceId?: string
    ): Promise<Place | null> => {
      if (!location) {
        throw new Error("Chưa lấy được vị trí của bạn!");
      }

      // Radius levels
      const radiusLevels =
        distance === "near"
          ? [1000, 2000, 3000, 5000, 10000]
          : [10000, 15000, 20000, 25000];

      const [lat, lng] = location;

      for (const radius of radiusLevels) {
        setSearchRadius(radius);

        try {
          // If distance is 'far', we want minDistance to be 5km (5000m)
          const minDist = distance === "far" ? 5000 : 0;

          const params = new URLSearchParams({
            lat: lat.toString(),
            lng: lng.toString(),
            radius: radius.toString(),
            minDistance: minDist.toString(),
            filter: filter,
          });

          if (excludePlaceId) {
            params.append("excludeIds", excludePlaceId);
          }

          const response = await fetch(
            `/api/places/random?${params.toString()}`
          );

          if (!response.ok) {
            throw new Error("Lỗi kết nối server");
          }

          const data = await response.json();

          if (data.place) {
            const p = data.place;
            // Map backend Place to frontend Place if needed (mostly same structure)
            const mappedPlace: Place = {
              id: p.id,
              name: p.name,
              lat: p.lat,
              lng: p.lng, // BE uses lng, FE uses lng
              address: p.address,
              cuisine: p.cuisine || "restaurant",
              emoji: p.emoji || "🍽️",
              tags: p.tags,
              rating: p.rating,
              reviewCount: p.reviewCount,
              distance: p.distance,
              googleMapsUrl: p.externalId,
            };

            setPlaces([mappedPlace]); // Update context state
            return mappedPlace;
          }
        } catch (error) {
          console.error(`Error at radius ${radius}:`, error);
        }
      }

      throw new Error("Không tìm thấy quán ăn nào trong bán kính tìm kiếm!");
    },
    [location]
  );

  // Tìm quán theo keyword (tên món hoặc loại quán) - API First
  const searchByKeyword = useCallback(
    async (
      keyword: string,
      distance: "near" | "far" = "near",
      excludePlaceId?: string
    ): Promise<Place | null> => {
      if (!location) {
        throw new Error("Chưa lấy được vị trí của bạn!");
      }

      if (!keyword || keyword.trim() === "") {
        throw new Error("Vui lòng nhập từ khóa tìm kiếm!");
      }

      // Radius levels tùy theo distance
      const radiusLevels =
        distance === "near"
          ? [1000, 2000, 3000, 5000, 10000]
          : [5000, 10000, 15000, 20000];

      const [lat, lng] = location;

      // 1. Try searching in Database (via API) First
      for (const radius of radiusLevels) {
        setSearchRadius(radius);

        try {
          const minDist = distance === "far" ? 5000 : 0;
          const params = new URLSearchParams({
            lat: lat.toString(),
            lng: lng.toString(),
            radius: radius.toString(),
            minDistance: minDist.toString(),
            keyword: keyword.trim(),
          });

          if (excludePlaceId) {
            params.append("excludeIds", excludePlaceId);
          }

          const response = await fetch(
            `/api/places/random?${params.toString()}`
          );
          if (response.ok) {
            const data = await response.json();
            if (data.place) {
              const p = data.place;
              const mappedPlace: Place = {
                id: p.id,
                name: p.name,
                lat: p.lat,
                lng: p.lng,
                address: p.address,
                cuisine: p.cuisine || "restaurant",
                emoji: p.emoji || "🍽️",
                tags: p.tags,
                rating: p.rating,
                reviewCount: p.reviewCount,
                distance: p.distance,
                googleMapsUrl: p.externalId,
              };
              setPlaces([mappedPlace]);
              return mappedPlace;
            }
          }
        } catch (error) {
          // Ignore API error and try next radius or fallback
          console.warn("DB Search failed for radius " + radius, error);
        }
      }

      // 2. Fallback to Overpass/Goong if DB found nothing

      // Normalize keyword
      const normalize = (str: string) =>
        str
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/đ/g, "d")
          .replace(/Đ/g, "D")
          .toLowerCase();
      const normalizedKeyword = normalize(keyword);

      for (const radius of radiusLevels) {
        setSearchRadius(radius);
        try {
          const query = `
            [out:json];
            (
              node["amenity"~"restaurant|cafe|fast_food|bar"]["name"]
                (around:${radius},${lat},${lng});
            );
            out body;
          `;

          const response = await fetch(
            `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(
              query
            )}`
          );
          if (!response.ok) continue;

          const data = await response.json();
          let validElements = data.elements.filter((el: any) => {
            if (!el.tags?.name) return false;
            return normalize(el.tags.name).includes(normalizedKeyword);
          });

          // Filter distance
          if (validElements.length > 0) {
            validElements = validElements.filter((el: any) => {
              const R = 6371e3; // meters
              const φ1 = (lat * Math.PI) / 180;
              const φ2 = (el.lat * Math.PI) / 180;
              const Δφ = ((el.lat - lat) * Math.PI) / 180;
              const Δλ = ((el.lon - lng) * Math.PI) / 180;
              const a =
                Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) *
                  Math.cos(φ2) *
                  Math.sin(Δλ / 2) *
                  Math.sin(Δλ / 2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              const d = R * c; // in meters

              if (distance === "near") return d <= 5000;
              return d > 5000;
            });
          }

          if (validElements.length > 0) {
            const randomEl =
              validElements[Math.floor(Math.random() * validElements.length)];

            // Calculate distance for display
            const R = 6371;
            const dLat = ((randomEl.lat - lat) * Math.PI) / 180;
            const dLon = ((randomEl.lon - lng) * Math.PI) / 180;
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos((lat * Math.PI) / 180) *
                Math.cos((randomEl.lat * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distKm = R * c;

            const place: Place = {
              id: `${randomEl.lat}-${randomEl.lon}`,
              lat: randomEl.lat,
              lng: randomEl.lon,
              name: randomEl.tags.name,
              cuisine: randomEl.tags.cuisine || "restaurant",
              emoji: "🍽️",
              distance: distKm,
              tags: randomEl.tags,
            };

            // Reverse geocode address (Simplified for brevity as fallback)
            // We can skip heavy reverse geocode if needed, or add it back.
            // Adding basic address from tags if available
            const addr = [
              randomEl.tags["addr:housenumber"],
              randomEl.tags["addr:street"],
            ]
              .filter(Boolean)
              .join(" ");
            if (addr) place.address = addr;

            setPlaces([place]);
            return place;
          }
        } catch (e) {
          console.error("Fallback search error", e);
        }
      }

      throw new Error(`Không tìm thấy quán nào phù hợp với "${keyword}"!`);
    },
    [location]
  );

  const searchInBounds = useCallback(
    async (
      minLat: number,
      maxLat: number,
      minLng: number,
      maxLng: number
    ): Promise<void> => {
      setIsSearchingPlaces(true);
      try {
        const params = new URLSearchParams({
          minLat: minLat.toString(),
          maxLat: maxLat.toString(),
          minLng: minLng.toString(),
          maxLng: maxLng.toString(),
          limit: "50", // Fetch reasonable amount
        });

        const response = await fetch(`/api/places/search?${params.toString()}`);
        if (!response.ok) throw new Error("API call failed");

        const data = await response.json();
        if (data.places) {
          // Map backend places to frontend places
          const mappedPlaces: Place[] = data.places.map((p: any) => ({
            id: p.id,
            name: p.name,
            lat: p.lat,
            lng: p.lng,
            address: p.address,
            cuisine: p.cuisine || "restaurant",
            emoji: p.emoji || "🍽️", // Should use reusable logic
            photos: p.images || [],
            rating: p.rating,
            reviewCount: p.reviewCount,
            externalId: p.externalId,
            googleMapsUrl: p.externalId,
          }));

          // Deduplicate or replace? Replacing is cleaner for "Search This Area".
          setPlaces(mappedPlaces);
        }
      } catch (error) {
        console.error("Error searching in bounds:", error);
      } finally {
        setIsSearchingPlaces(false);
      }
    },
    []
  );

  const clearPlaces = useCallback(() => {
    setPlaces([]);
    setSearchRadius(0);
  }, []);

  const value: LocationContextType = {
    location,
    locationName,
    isLoadingLocation,
    locationError,
    places,
    isSearchingPlaces,
    searchRadius,
    refreshLocation: fetchLocation,
    findFoodNearby,
    findFoodNearbyWithRetry,
    searchByKeyword,
    searchInBounds,
    clearPlaces,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

// Custom hook để sử dụng context
export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
}
