(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/contexts/location-context.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LocationProvider",
    ()=>LocationProvider,
    "useLocation",
    ()=>useLocation
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
const LocationContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
// Reverse geocoding để lấy địa chỉ chi tiết từ tọa độ
// Sử dụng BigDataCloud API (miễn phí, không cần key, hỗ trợ tiếng Việt)
async function getDetailedLocation(lat, lng) {
    try {
        // BigDataCloud free reverse geocoding API
        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=vi`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        // Tạo địa chỉ từ response của BigDataCloud
        const parts = [
            data.locality,
            data.city,
            data.principalSubdivision,
            data.countryName
        ].filter(Boolean);
        if (parts.length > 0) {
            return {
                name: parts.join(", ")
            };
        }
        // Fallback: dùng localityInfo nếu có
        if (data.localityInfo?.administrative) {
            const adminParts = data.localityInfo.administrative.slice(-3).map((a)=>a.name).reverse();
            return {
                name: adminParts.join(", ")
            };
        }
        return null;
    } catch (error) {
        console.error("Error fetching location details:", error);
        return null;
    }
}
// Tính khoảng cách giữa 2 điểm (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
// Emoji cho các loại quán ăn - dùng làm fallback thay vì ảnh
const cuisineEmojis = {
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
    default: "🍴"
};
// Lấy emoji phù hợp với loại quán
function getCuisineEmoji(cuisine, amenity) {
    const key = (cuisine || amenity || "").toLowerCase();
    // Tìm trong mapping
    for (const [keyword, emoji] of Object.entries(cuisineEmojis)){
        if (key.includes(keyword)) {
            return emoji;
        }
    }
    return cuisineEmojis.default;
}
function LocationProvider({ children }) {
    _s();
    const [location, setLocation] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [locationName, setLocationName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isLoadingLocation, setIsLoadingLocation] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [locationError, setLocationError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [places, setPlaces] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isSearchingPlaces, setIsSearchingPlaces] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [searchRadius, setSearchRadius] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    // Lấy vị trí người dùng
    const fetchLocation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "LocationProvider.useCallback[fetchLocation]": async ()=>{
            setIsLoadingLocation(true);
            setLocationError(null);
            if (!navigator.geolocation) {
                setLocationError("Trình duyệt không hỗ trợ GPS");
                setIsLoadingLocation(false);
                return;
            }
            navigator.geolocation.getCurrentPosition({
                "LocationProvider.useCallback[fetchLocation]": async (pos)=>{
                    const coords = [
                        pos.coords.latitude,
                        pos.coords.longitude
                    ];
                    setLocation(coords);
                    // Lấy địa chỉ chi tiết
                    const result = await getDetailedLocation(coords[0], coords[1]);
                    if (result) {
                        setLocationName(result.name);
                    }
                    setIsLoadingLocation(false);
                }
            }["LocationProvider.useCallback[fetchLocation]"], {
                "LocationProvider.useCallback[fetchLocation]": (error)=>{
                    console.error("Geolocation error:", error);
                    switch(error.code){
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
                }
            }["LocationProvider.useCallback[fetchLocation]"], {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            });
        }
    }["LocationProvider.useCallback[fetchLocation]"], []);
    // Tự động lấy vị trí khi mount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "LocationProvider.useEffect": ()=>{
            fetchLocation();
        }
    }["LocationProvider.useEffect"], [
        fetchLocation
    ]);
    // Tìm quán ăn quanh đây với radius cố định
    const findFoodNearby = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "LocationProvider.useCallback[findFoodNearby]": async (radius = 1500)=>{
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
                const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
                const data = await response.json();
                const validPlaces = await Promise.all(data.elements.filter({
                    "LocationProvider.useCallback[findFoodNearby]": (el)=>el.tags && el.tags.name
                }["LocationProvider.useCallback[findFoodNearby]"]).map({
                    "LocationProvider.useCallback[findFoodNearby]": (el)=>{
                        const cuisine = el.tags.cuisine || el.tags.amenity;
                        const emoji = getCuisineEmoji(cuisine, el.tags.amenity);
                        // Tạo địa chỉ từ tags
                        const addressParts = [
                            el.tags["addr:housenumber"],
                            el.tags["addr:street"],
                            el.tags["addr:city"]
                        ].filter(Boolean);
                        return {
                            id: `${el.lat}-${el.lon}`,
                            lat: el.lat,
                            lon: el.lon,
                            name: el.tags.name,
                            address: addressParts.length > 0 ? addressParts.join(", ") : undefined,
                            cuisine: cuisine,
                            emoji: emoji,
                            tags: el.tags
                        };
                    }
                }["LocationProvider.useCallback[findFoodNearby]"]));
                setPlaces(validPlaces);
                return validPlaces;
            } catch (error) {
                console.error("Error finding places:", error);
                throw new Error("Lỗi khi tìm quán!");
            } finally{
                setIsSearchingPlaces(false);
            }
        }
    }["LocationProvider.useCallback[findFoodNearby]"], [
        location
    ]);
    // Tìm quán ăn với progressive radius - tăng dần cho đến khi tìm được
    const findFoodNearbyWithRetry = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "LocationProvider.useCallback[findFoodNearbyWithRetry]": async (filter = "all", distance = "near", excludePlaceId // ID quán cần loại trừ (tránh lặp lại)
        )=>{
            if (!location) {
                throw new Error("Chưa lấy được vị trí của bạn!");
            }
            // Radius levels tùy theo distance
            // near: 500m -> 5km
            // far: 5km -> 15km
            const radiusLevels = distance === "near" ? [
                500,
                1000,
                1500,
                2000,
                3000,
                4000,
                5000
            ] : [
                5000,
                7000,
                10000,
                12000,
                15000
            ];
            for (const radius of radiusLevels){
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
                    const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
                    const data = await response.json();
                    let validElements = data.elements.filter({
                        "LocationProvider.useCallback[findFoodNearbyWithRetry].validElements": (el)=>el.tags && el.tags.name
                    }["LocationProvider.useCallback[findFoodNearbyWithRetry].validElements"]);
                    // Filter theo khoảng cách thực tế
                    if (validElements.length > 0) {
                        validElements = validElements.filter({
                            "LocationProvider.useCallback[findFoodNearbyWithRetry]": (el)=>{
                                const dist = calculateDistance(lat, lng, el.lat, el.lon);
                                if (distance === "near") {
                                    return dist <= 5; // Chỉ lấy quán trong vòng 5km
                                } else {
                                    return dist > 5; // Chỉ lấy quán trên 5km
                                }
                            }
                        }["LocationProvider.useCallback[findFoodNearbyWithRetry]"]);
                    }
                    if (validElements.length > 0) {
                        // Loai trừ quán đã chọn trước đó
                        if (excludePlaceId) {
                            validElements = validElements.filter({
                                "LocationProvider.useCallback[findFoodNearbyWithRetry]": (el)=>`${el.lat}-${el.lon}` !== excludePlaceId
                            }["LocationProvider.useCallback[findFoodNearbyWithRetry]"]);
                        }
                    }
                    if (validElements.length > 0) {
                        // Random chọn 1 quán từ danh sách
                        const randomEl = validElements[Math.floor(Math.random() * validElements.length)];
                        const cuisine = randomEl.tags.cuisine || randomEl.tags.amenity;
                        const emoji = getCuisineEmoji(cuisine, randomEl.tags.amenity);
                        // Tạo ID duy nhất cho quán
                        const placeId = `${randomEl.lat}-${randomEl.lon}`;
                        // Lấy địa chỉ đầy đủ bằng reverse geocoding từ tọa độ quán
                        let fullAddress;
                        try {
                            const geoResponse = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${randomEl.lat}&longitude=${randomEl.lon}&localityLanguage=vi`);
                            if (geoResponse.ok) {
                                const geoData = await geoResponse.json();
                                const parts = [
                                    geoData.locality,
                                    geoData.city,
                                    geoData.principalSubdivision
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
                                randomEl.tags["addr:city"]
                            ].filter(Boolean);
                            fullAddress = addressParts.length > 0 ? addressParts.join(", ") : undefined;
                        }
                        const place = {
                            id: placeId,
                            lat: randomEl.lat,
                            lon: randomEl.lon,
                            name: randomEl.tags.name,
                            address: fullAddress,
                            cuisine: cuisine,
                            emoji: emoji,
                            tags: randomEl.tags
                        };
                        setPlaces([
                            place
                        ]);
                        return place;
                    }
                    // Chưa tìm thấy, tiếp tục với radius lớn hơn
                    console.log(`Không tìm thấy quán trong ${radius}m, đang mở rộng...`);
                } catch (error) {
                    console.error(`Error at radius ${radius}:`, error);
                }
            }
            throw new Error("Không tìm thấy quán ăn nào trong bán kính 10km!");
        }
    }["LocationProvider.useCallback[findFoodNearbyWithRetry]"], [
        location
    ]);
    // Tìm quán theo keyword (tên món hoặc loại quán)
    const searchByKeyword = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "LocationProvider.useCallback[searchByKeyword]": async (keyword, distance = "near", excludePlaceId)=>{
            if (!location) {
                throw new Error("Chưa lấy được vị trí của bạn!");
            }
            if (!keyword || keyword.trim() === "") {
                throw new Error("Vui lòng nhập từ khóa tìm kiếm!");
            }
            // Radius levels tùy theo distance
            const radiusLevels = distance === "near" ? [
                500,
                1000,
                1500,
                2000,
                3000,
                4000,
                5000
            ] : [
                5000,
                7000,
                10000,
                12000,
                15000
            ];
            for (const radius of radiusLevels){
                setSearchRadius(radius);
                try {
                    const [lat, lng] = location;
                    // Overpass query tìm kiếm theo keyword trong name hoặc cuisine
                    // Case-insensitive search using regex
                    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                    const query = `
          [out:json];
          (
            node["amenity"~"restaurant|cafe|fast_food|bar"]
              ["name"~"${escapedKeyword}",i]
              (around:${radius},${lat},${lng});
            node["amenity"~"restaurant|cafe|fast_food|bar"]
              ["cuisine"~"${escapedKeyword}",i]
              (around:${radius},${lat},${lng});
          );
          out body;
        `;
                    const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
                    const data = await response.json();
                    let validElements = data.elements.filter({
                        "LocationProvider.useCallback[searchByKeyword].validElements": (el)=>el.tags && el.tags.name
                    }["LocationProvider.useCallback[searchByKeyword].validElements"]);
                    // Filter theo khoảng cách thực tế
                    if (validElements.length > 0) {
                        validElements = validElements.filter({
                            "LocationProvider.useCallback[searchByKeyword]": (el)=>{
                                const dist = calculateDistance(lat, lng, el.lat, el.lon);
                                if (distance === "near") {
                                    return dist <= 5;
                                } else {
                                    return dist > 5;
                                }
                            }
                        }["LocationProvider.useCallback[searchByKeyword]"]);
                    }
                    // Loại trừ quán đã chọn trước đó
                    if (validElements.length > 0 && excludePlaceId) {
                        validElements = validElements.filter({
                            "LocationProvider.useCallback[searchByKeyword]": (el)=>`${el.lat}-${el.lon}` !== excludePlaceId
                        }["LocationProvider.useCallback[searchByKeyword]"]);
                    }
                    if (validElements.length > 0) {
                        // Random chọn 1 quán từ danh sách
                        const randomEl = validElements[Math.floor(Math.random() * validElements.length)];
                        const cuisine = randomEl.tags.cuisine || randomEl.tags.amenity;
                        const emoji = getCuisineEmoji(cuisine, randomEl.tags.amenity);
                        const placeId = `${randomEl.lat}-${randomEl.lon}`;
                        // Lấy địa chỉ đầy đủ
                        let fullAddress;
                        try {
                            const geoResponse = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${randomEl.lat}&longitude=${randomEl.lon}&localityLanguage=vi`);
                            if (geoResponse.ok) {
                                const geoData = await geoResponse.json();
                                const parts = [
                                    geoData.locality,
                                    geoData.city,
                                    geoData.principalSubdivision
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
                                randomEl.tags["addr:city"]
                            ].filter(Boolean);
                            fullAddress = addressParts.length > 0 ? addressParts.join(", ") : undefined;
                        }
                        const place = {
                            id: placeId,
                            lat: randomEl.lat,
                            lon: randomEl.lon,
                            name: randomEl.tags.name,
                            address: fullAddress,
                            cuisine: cuisine,
                            emoji: emoji,
                            tags: randomEl.tags
                        };
                        setPlaces([
                            place
                        ]);
                        return place;
                    }
                    console.log(`Không tìm thấy "${keyword}" trong ${radius}m, đang mở rộng...`);
                } catch (error) {
                    console.error(`Error at radius ${radius}:`, error);
                }
            }
            throw new Error(`Không tìm thấy quán nào phù hợp với "${keyword}"!`);
        }
    }["LocationProvider.useCallback[searchByKeyword]"], [
        location
    ]);
    const clearPlaces = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "LocationProvider.useCallback[clearPlaces]": ()=>{
            setPlaces([]);
            setSearchRadius(0);
        }
    }["LocationProvider.useCallback[clearPlaces]"], []);
    const value = {
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
        clearPlaces
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(LocationContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/contexts/location-context.tsx",
        lineNumber: 642,
        columnNumber: 5
    }, this);
}
_s(LocationProvider, "XfiTXcwrOvQSgS0AY3N96u3pzr0=");
_c = LocationProvider;
function useLocation() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(LocationContext);
    if (context === undefined) {
        throw new Error("useLocation must be used within a LocationProvider");
    }
    return context;
}
_s1(useLocation, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "LocationProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/providers.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Providers",
    ()=>Providers
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$location$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/contexts/location-context.tsx [app-client] (ecmascript)");
"use client";
;
;
function Providers({ children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$location$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LocationProvider"], {
        children: children
    }, void 0, false, {
        fileName: "[project]/components/providers.tsx",
        lineNumber: 11,
        columnNumber: 10
    }, this);
}
_c = Providers;
var _c;
__turbopack_context__.k.register(_c, "Providers");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/node_modules/next/navigation.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {

module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/client/components/navigation.js [app-client] (ecmascript)");
}),
"[project]/node_modules/@vercel/analytics/dist/next/index.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Analytics",
    ()=>Analytics2
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
// src/nextjs/index.tsx
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
// src/nextjs/utils.ts
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
"use client";
;
;
// package.json
var name = "@vercel/analytics";
var version = "1.3.1";
// src/queue.ts
var initQueue = ()=>{
    if (window.va) return;
    window.va = function a(...params) {
        (window.vaq = window.vaq || []).push(params);
    };
};
// src/utils.ts
function isBrowser() {
    return typeof window !== "undefined";
}
function detectEnvironment() {
    try {
        const env = ("TURBOPACK compile-time value", "development");
        if ("TURBOPACK compile-time truthy", 1) {
            return "development";
        }
    } catch (e) {}
    return "production";
}
function setMode(mode = "auto") {
    if (mode === "auto") {
        window.vam = detectEnvironment();
        return;
    }
    window.vam = mode;
}
function getMode() {
    const mode = isBrowser() ? window.vam : detectEnvironment();
    return mode || "production";
}
function isDevelopment() {
    return getMode() === "development";
}
function computeRoute(pathname, pathParams) {
    if (!pathname || !pathParams) {
        return pathname;
    }
    let result = pathname;
    try {
        const entries = Object.entries(pathParams);
        for (const [key, value] of entries){
            if (!Array.isArray(value)) {
                const matcher = turnValueToRegExp(value);
                if (matcher.test(result)) {
                    result = result.replace(matcher, `/[${key}]`);
                }
            }
        }
        for (const [key, value] of entries){
            if (Array.isArray(value)) {
                const matcher = turnValueToRegExp(value.join("/"));
                if (matcher.test(result)) {
                    result = result.replace(matcher, `/[...${key}]`);
                }
            }
        }
        return result;
    } catch (e) {
        return pathname;
    }
}
function turnValueToRegExp(value) {
    return new RegExp(`/${escapeRegExp(value)}(?=[/?#]|$)`);
}
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
// src/generic.ts
var DEV_SCRIPT_URL = "https://va.vercel-scripts.com/v1/script.debug.js";
var PROD_SCRIPT_URL = "/_vercel/insights/script.js";
function inject(props = {
    debug: true
}) {
    var _a;
    if (!isBrowser()) return;
    setMode(props.mode);
    initQueue();
    if (props.beforeSend) {
        (_a = window.va) == null ? void 0 : _a.call(window, "beforeSend", props.beforeSend);
    }
    const src = props.scriptSrc || (isDevelopment() ? DEV_SCRIPT_URL : PROD_SCRIPT_URL);
    if (document.head.querySelector(`script[src*="${src}"]`)) return;
    const script = document.createElement("script");
    script.src = src;
    script.defer = true;
    script.dataset.sdkn = name + (props.framework ? `/${props.framework}` : "");
    script.dataset.sdkv = version;
    if (props.disableAutoTrack) {
        script.dataset.disableAutoTrack = "1";
    }
    if (props.endpoint) {
        script.dataset.endpoint = props.endpoint;
    }
    if (props.dsn) {
        script.dataset.dsn = props.dsn;
    }
    script.onerror = ()=>{
        const errorMessage = isDevelopment() ? "Please check if any ad blockers are enabled and try again." : "Be sure to enable Web Analytics for your project and deploy again. See https://vercel.com/docs/analytics/quickstart for more information.";
        console.log(`[Vercel Web Analytics] Failed to load script from ${src}. ${errorMessage}`);
    };
    if (isDevelopment() && props.debug === false) {
        script.dataset.debug = "false";
    }
    document.head.appendChild(script);
}
function pageview({ route, path }) {
    var _a;
    (_a = window.va) == null ? void 0 : _a.call(window, "pageview", {
        route,
        path
    });
}
// src/react.tsx
function Analytics(props) {
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Analytics.useEffect": ()=>{
            inject({
                framework: props.framework || "react",
                ...props.route !== void 0 && {
                    disableAutoTrack: true
                },
                ...props
            });
        }
    }["Analytics.useEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Analytics.useEffect": ()=>{
            if (props.route && props.path) {
                pageview({
                    route: props.route,
                    path: props.path
                });
            }
        }
    }["Analytics.useEffect"], [
        props.route,
        props.path
    ]);
    return null;
}
;
var useRoute = ()=>{
    const params = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useParams"])();
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"])();
    const path = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const finalParams = {
        ...Object.fromEntries(searchParams.entries()),
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- can be empty in pages router
        ...params || {}
    };
    return {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- can be empty in pages router
        route: params ? computeRoute(path, finalParams) : null,
        path
    };
};
// src/nextjs/index.tsx
function AnalyticsComponent(props) {
    const { route, path } = useRoute();
    return /* @__PURE__ */ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement(Analytics, {
        path,
        route,
        ...props,
        framework: "next"
    });
}
function Analytics2(props) {
    return /* @__PURE__ */ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Suspense"], {
        fallback: null
    }, /* @__PURE__ */ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement(AnalyticsComponent, {
        ...props
    }));
}
;
 //# sourceMappingURL=index.mjs.map
}),
"[project]/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/**
 * @license React
 * react-jsx-dev-runtime.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
"use strict";
"production" !== ("TURBOPACK compile-time value", "development") && function() {
    function getComponentNameFromType(type) {
        if (null == type) return null;
        if ("function" === typeof type) return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if ("string" === typeof type) return type;
        switch(type){
            case REACT_FRAGMENT_TYPE:
                return "Fragment";
            case REACT_PROFILER_TYPE:
                return "Profiler";
            case REACT_STRICT_MODE_TYPE:
                return "StrictMode";
            case REACT_SUSPENSE_TYPE:
                return "Suspense";
            case REACT_SUSPENSE_LIST_TYPE:
                return "SuspenseList";
            case REACT_ACTIVITY_TYPE:
                return "Activity";
            case REACT_VIEW_TRANSITION_TYPE:
                return "ViewTransition";
        }
        if ("object" === typeof type) switch("number" === typeof type.tag && console.error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), type.$$typeof){
            case REACT_PORTAL_TYPE:
                return "Portal";
            case REACT_CONTEXT_TYPE:
                return type.displayName || "Context";
            case REACT_CONSUMER_TYPE:
                return (type._context.displayName || "Context") + ".Consumer";
            case REACT_FORWARD_REF_TYPE:
                var innerType = type.render;
                type = type.displayName;
                type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
                return type;
            case REACT_MEMO_TYPE:
                return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
            case REACT_LAZY_TYPE:
                innerType = type._payload;
                type = type._init;
                try {
                    return getComponentNameFromType(type(innerType));
                } catch (x) {}
        }
        return null;
    }
    function testStringCoercion(value) {
        return "" + value;
    }
    function checkKeyStringCoercion(value) {
        try {
            testStringCoercion(value);
            var JSCompiler_inline_result = !1;
        } catch (e) {
            JSCompiler_inline_result = !0;
        }
        if (JSCompiler_inline_result) {
            JSCompiler_inline_result = console;
            var JSCompiler_temp_const = JSCompiler_inline_result.error;
            var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
            JSCompiler_temp_const.call(JSCompiler_inline_result, "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.", JSCompiler_inline_result$jscomp$0);
            return testStringCoercion(value);
        }
    }
    function getTaskName(type) {
        if (type === REACT_FRAGMENT_TYPE) return "<>";
        if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE) return "<...>";
        try {
            var name = getComponentNameFromType(type);
            return name ? "<" + name + ">" : "<...>";
        } catch (x) {
            return "<...>";
        }
    }
    function getOwner() {
        var dispatcher = ReactSharedInternals.A;
        return null === dispatcher ? null : dispatcher.getOwner();
    }
    function UnknownOwner() {
        return Error("react-stack-top-frame");
    }
    function hasValidKey(config) {
        if (hasOwnProperty.call(config, "key")) {
            var getter = Object.getOwnPropertyDescriptor(config, "key").get;
            if (getter && getter.isReactWarning) return !1;
        }
        return void 0 !== config.key;
    }
    function defineKeyPropWarningGetter(props, displayName) {
        function warnAboutAccessingKey() {
            specialPropKeyWarningShown || (specialPropKeyWarningShown = !0, console.error("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)", displayName));
        }
        warnAboutAccessingKey.isReactWarning = !0;
        Object.defineProperty(props, "key", {
            get: warnAboutAccessingKey,
            configurable: !0
        });
    }
    function elementRefGetterWithDeprecationWarning() {
        var componentName = getComponentNameFromType(this.type);
        didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = !0, console.error("Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."));
        componentName = this.props.ref;
        return void 0 !== componentName ? componentName : null;
    }
    function ReactElement(type, key, props, owner, debugStack, debugTask) {
        var refProp = props.ref;
        type = {
            $$typeof: REACT_ELEMENT_TYPE,
            type: type,
            key: key,
            props: props,
            _owner: owner
        };
        null !== (void 0 !== refProp ? refProp : null) ? Object.defineProperty(type, "ref", {
            enumerable: !1,
            get: elementRefGetterWithDeprecationWarning
        }) : Object.defineProperty(type, "ref", {
            enumerable: !1,
            value: null
        });
        type._store = {};
        Object.defineProperty(type._store, "validated", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: 0
        });
        Object.defineProperty(type, "_debugInfo", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: null
        });
        Object.defineProperty(type, "_debugStack", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugStack
        });
        Object.defineProperty(type, "_debugTask", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugTask
        });
        Object.freeze && (Object.freeze(type.props), Object.freeze(type));
        return type;
    }
    function jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStack, debugTask) {
        var children = config.children;
        if (void 0 !== children) if (isStaticChildren) if (isArrayImpl(children)) {
            for(isStaticChildren = 0; isStaticChildren < children.length; isStaticChildren++)validateChildKeys(children[isStaticChildren]);
            Object.freeze && Object.freeze(children);
        } else console.error("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
        else validateChildKeys(children);
        if (hasOwnProperty.call(config, "key")) {
            children = getComponentNameFromType(type);
            var keys = Object.keys(config).filter(function(k) {
                return "key" !== k;
            });
            isStaticChildren = 0 < keys.length ? "{key: someKey, " + keys.join(": ..., ") + ": ...}" : "{key: someKey}";
            didWarnAboutKeySpread[children + isStaticChildren] || (keys = 0 < keys.length ? "{" + keys.join(": ..., ") + ": ...}" : "{}", console.error('A props object containing a "key" prop is being spread into JSX:\n  let props = %s;\n  <%s {...props} />\nReact keys must be passed directly to JSX without using spread:\n  let props = %s;\n  <%s key={someKey} {...props} />', isStaticChildren, children, keys, children), didWarnAboutKeySpread[children + isStaticChildren] = !0);
        }
        children = null;
        void 0 !== maybeKey && (checkKeyStringCoercion(maybeKey), children = "" + maybeKey);
        hasValidKey(config) && (checkKeyStringCoercion(config.key), children = "" + config.key);
        if ("key" in config) {
            maybeKey = {};
            for(var propName in config)"key" !== propName && (maybeKey[propName] = config[propName]);
        } else maybeKey = config;
        children && defineKeyPropWarningGetter(maybeKey, "function" === typeof type ? type.displayName || type.name || "Unknown" : type);
        return ReactElement(type, children, maybeKey, getOwner(), debugStack, debugTask);
    }
    function validateChildKeys(node) {
        isValidElement(node) ? node._store && (node._store.validated = 1) : "object" === typeof node && null !== node && node.$$typeof === REACT_LAZY_TYPE && ("fulfilled" === node._payload.status ? isValidElement(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
    }
    function isValidElement(object) {
        return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
    }
    var React = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)"), REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = Symbol.for("react.memo"), REACT_LAZY_TYPE = Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = Symbol.for("react.activity"), REACT_VIEW_TRANSITION_TYPE = Symbol.for("react.view_transition"), REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference"), ReactSharedInternals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, hasOwnProperty = Object.prototype.hasOwnProperty, isArrayImpl = Array.isArray, createTask = console.createTask ? console.createTask : function() {
        return null;
    };
    React = {
        react_stack_bottom_frame: function(callStackForError) {
            return callStackForError();
        }
    };
    var specialPropKeyWarningShown;
    var didWarnAboutElementRef = {};
    var unknownOwnerDebugStack = React.react_stack_bottom_frame.bind(React, UnknownOwner)();
    var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
    var didWarnAboutKeySpread = {};
    exports.Fragment = REACT_FRAGMENT_TYPE;
    exports.jsxDEV = function(type, config, maybeKey, isStaticChildren) {
        var trackActualOwner = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
        if (trackActualOwner) {
            var previousStackTraceLimit = Error.stackTraceLimit;
            Error.stackTraceLimit = 10;
            var debugStackDEV = Error("react-stack-top-frame");
            Error.stackTraceLimit = previousStackTraceLimit;
        } else debugStackDEV = unknownOwnerDebugStack;
        return jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStackDEV, trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask);
    };
}();
}),
"[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
'use strict';
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
else {
    module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)");
}
}),
]);

//# sourceMappingURL=_aca7917a._.js.map