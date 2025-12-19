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
  lon: number;
  name: string;
  address?: string;
  cuisine?: string;
  emoji?: string;
  tags?: Record<string, string>;
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

// Tính khoảng cách giữa 2 điểm (Haversine formula)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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
                  lon: el.lon,
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
      excludePlaceId?: string // ID quán cần loại trừ (tránh lặp lại)
    ): Promise<Place | null> => {
      if (!location) {
        throw new Error("Chưa lấy được vị trí của bạn!");
      }

      // Radius levels tùy theo distance
      // near: 500m -> 5km
      // far: 5km -> 15km
      const radiusLevels =
        distance === "near"
          ? [500, 1000, 1500, 2000, 3000, 4000, 5000]
          : [5000, 7000, 10000, 12000, 15000];

      for (const radius of radiusLevels) {
        setSearchRadius(radius);

        try {
          const [lat, lng] = location;

          // Build query based on filter
          let queryFilters = "";
          if (filter === "food") {
            queryFilters = `
              node["amenity"="restaurant"](around:${radius},${lat},${lng});
              node["amenity"="fast_food"](around:${radius},${lat},${lng});
            `;
          } else if (filter === "drink") {
            queryFilters = `
              node["amenity"="cafe"](around:${radius},${lat},${lng});
              node["amenity"="bar"](around:${radius},${lat},${lng});
              node["amenity"="pub"](around:${radius},${lat},${lng});
              node["shop"="coffee"](around:${radius},${lat},${lng});
              node["shop"="tea"](around:${radius},${lat},${lng});
            `;
          } else {
            // all
            queryFilters = `
              node["amenity"="restaurant"](around:${radius},${lat},${lng});
              node["amenity"="cafe"](around:${radius},${lat},${lng});
              node["amenity"="fast_food"](around:${radius},${lat},${lng});
              node["amenity"="bar"](around:${radius},${lat},${lng});
            `;
          }

          const query = `
          [out:json];
          (
            ${queryFilters}
          );
          out body;
        `;

          const response = await fetch(
            `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(
              query
            )}`
          );
          const data = await response.json();

          let validElements = data.elements.filter(
            (el: { tags?: { name?: string } }) => el.tags && el.tags.name
          );

          // Filter theo khoảng cách thực tế
          if (validElements.length > 0) {
            validElements = validElements.filter(
              (el: { lat: number; lon: number }) => {
                const dist = calculateDistance(lat, lng, el.lat, el.lon);
                if (distance === "near") {
                  return dist <= 5; // Chỉ lấy quán trong vòng 5km
                } else {
                  return dist > 5; // Chỉ lấy quán trên 5km
                }
              }
            );
          }

          if (validElements.length > 0) {
            // Loai trừ quán đã chọn trước đó
            if (excludePlaceId) {
              validElements = validElements.filter(
                (el: { lat: number; lon: number }) =>
                  `${el.lat}-${el.lon}` !== excludePlaceId
              );
            }
          }

          if (validElements.length > 0) {
            // Random chọn 1 quán từ danh sách
            const randomEl =
              validElements[Math.floor(Math.random() * validElements.length)];
            const cuisine = randomEl.tags.cuisine || randomEl.tags.amenity;
            const emoji = getCuisineEmoji(cuisine, randomEl.tags.amenity);

            // Tạo ID duy nhất cho quán
            const placeId = `${randomEl.lat}-${randomEl.lon}`;

            // Lấy địa chỉ đầy đủ bằng reverse geocoding từ tọa độ quán
            let fullAddress: string | undefined;
            try {
              const geoResponse = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${randomEl.lat}&longitude=${randomEl.lon}&localityLanguage=vi`
              );
              if (geoResponse.ok) {
                const geoData = await geoResponse.json();
                const parts = [
                  geoData.locality,
                  geoData.city,
                  geoData.principalSubdivision,
                ].filter(Boolean);
                if (parts.length > 0) {
                  fullAddress = parts.join(", ");
                }
              }
            } catch (e) {
              console.error("Error getting place address:", e);
            }

            // Fallback: dùng tags nếu reverse geocoding fail
            if (!fullAddress) {
              const addressParts = [
                randomEl.tags["addr:housenumber"],
                randomEl.tags["addr:street"],
                randomEl.tags["addr:city"],
              ].filter(Boolean);
              fullAddress =
                addressParts.length > 0 ? addressParts.join(", ") : undefined;
            }

            const place: Place = {
              id: placeId,
              lat: randomEl.lat,
              lon: randomEl.lon,
              name: randomEl.tags.name,
              address: fullAddress,
              cuisine: cuisine,
              emoji: emoji,
              tags: randomEl.tags,
            };

            setPlaces([place]);
            return place;
          }

          // Chưa tìm thấy, tiếp tục với radius lớn hơn
          console.log(`Không tìm thấy quán trong ${radius}m, đang mở rộng...`);
        } catch (error) {
          console.error(`Error at radius ${radius}:`, error);
        }
      }

      throw new Error("Không tìm thấy quán ăn nào trong bán kính 10km!");
    },
    [location]
  );

  // Helper function to remove Vietnamese accents for accent-insensitive search
  const removeAccents = (str: string): string => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();
  };

  // Tìm quán theo keyword (tên món hoặc loại quán)
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
          ? [500, 1000, 1500, 2000, 3000, 4000, 5000]
          : [5000, 7000, 10000, 12000, 15000];

      // Normalize keyword to remove accents for comparison
      const normalizedKeyword = removeAccents(keyword);

      for (const radius of radiusLevels) {
        setSearchRadius(radius);

        try {
          const [lat, lng] = location;

          // Query để lấy TẤT CẢ quán ăn trong bán kính
          // Sau đó filter trên client-side với accent-insensitive matching
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
          const data = await response.json();

          // Filter theo keyword với accent-insensitive matching
          let validElements = data.elements.filter(
            (el: { tags?: { name?: string; cuisine?: string } }) => {
              if (!el.tags || !el.tags.name) return false;

              // Normalize tên quán và cuisine để so sánh
              const normalizedName = removeAccents(el.tags.name);
              const normalizedCuisine = el.tags.cuisine
                ? removeAccents(el.tags.cuisine)
                : "";

              // Match nếu keyword có trong tên hoặc cuisine
              return (
                normalizedName.includes(normalizedKeyword) ||
                normalizedCuisine.includes(normalizedKeyword)
              );
            }
          );

          // Filter theo khoảng cách thực tế
          if (validElements.length > 0) {
            validElements = validElements.filter(
              (el: { lat: number; lon: number }) => {
                const dist = calculateDistance(lat, lng, el.lat, el.lon);
                if (distance === "near") {
                  return dist <= 5;
                } else {
                  return dist > 5;
                }
              }
            );
          }

          // Loại trừ quán đã chọn trước đó
          if (validElements.length > 0 && excludePlaceId) {
            validElements = validElements.filter(
              (el: { lat: number; lon: number }) =>
                `${el.lat}-${el.lon}` !== excludePlaceId
            );
          }

          if (validElements.length > 0) {
            // Random chọn 1 quán từ danh sách
            const randomEl =
              validElements[Math.floor(Math.random() * validElements.length)];
            const cuisine = randomEl.tags.cuisine || randomEl.tags.amenity;
            const emoji = getCuisineEmoji(cuisine, randomEl.tags.amenity);
            const placeId = `${randomEl.lat}-${randomEl.lon}`;

            // Lấy địa chỉ đầy đủ
            let fullAddress: string | undefined;
            try {
              const geoResponse = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${randomEl.lat}&longitude=${randomEl.lon}&localityLanguage=vi`
              );
              if (geoResponse.ok) {
                const geoData = await geoResponse.json();
                const parts = [
                  geoData.locality,
                  geoData.city,
                  geoData.principalSubdivision,
                ].filter(Boolean);
                if (parts.length > 0) {
                  fullAddress = parts.join(", ");
                }
              }
            } catch (e) {
              console.error("Error getting place address:", e);
            }

            if (!fullAddress) {
              const addressParts = [
                randomEl.tags["addr:housenumber"],
                randomEl.tags["addr:street"],
                randomEl.tags["addr:city"],
              ].filter(Boolean);
              fullAddress =
                addressParts.length > 0 ? addressParts.join(", ") : undefined;
            }

            const place: Place = {
              id: placeId,
              lat: randomEl.lat,
              lon: randomEl.lon,
              name: randomEl.tags.name,
              address: fullAddress,
              cuisine: cuisine,
              emoji: emoji,
              tags: randomEl.tags,
            };

            setPlaces([place]);
            return place;
          }

          console.log(
            `Không tìm thấy "${keyword}" trong ${radius}m, đang mở rộng...`
          );
        } catch (error) {
          console.error(`Error at radius ${radius}:`, error);
        }
      }

      throw new Error(`Không tìm thấy quán nào phù hợp với "${keyword}"!`);
    },
    [location]
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
