"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Import Map component dynamic để tránh lỗi SSR
const Map = dynamic(() => import("@/components/ui/map"), { ssr: false });

export default function HomePage() {
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Lấy vị trí người dùng
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLocation([pos.coords.latitude, pos.coords.longitude]);
      });
    }
  }, []);

  // 2. Hàm gọi Overpass API (Miễn phí)
  const findFoodNearby = async () => {
    if (!location) return alert("Chưa lấy được vị trí của bạn!");
    setLoading(true);

    const [lat, lng] = location;
    const radius = 1000; // Tìm trong 1km

    // Câu lệnh query Overpass: Tìm nhà hàng, quán cafe, đồ ăn nhanh
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
      // Gọi đến server công cộng của Overpass
      const response = await fetch(
        `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(
          query
        )}`
      );
      const data = await response.json();

      // Lọc kết quả và lấy random 1 quán (hoặc lấy hết)
      const validPlaces = data.elements.filter(
        (el: any) => el.tags && el.tags.name
      );

      if (validPlaces.length > 0) {
        // Ví dụ: Random 1 quán
        const randomPlace =
          validPlaces[Math.floor(Math.random() * validPlaces.length)];
        setPlaces([randomPlace]); // Chỉ hiển thị quán được random
      } else {
        alert("Không tìm thấy quán nào quanh đây trên bản đồ OpenStreetMap!");
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi khi tìm quán!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 flex flex-col items-center gap-4">
      <h1 className="text-2xl font-bold text-pink-500">
        Couple Foodie (Free Version)
      </h1>

      <button
        onClick={findFoodNearby}
        disabled={loading || !location}
        className="bg-green-500 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-green-600 disabled:bg-gray-400"
      >
        {loading ? "Đang quét map..." : "Random Quán Ăn Free 🎲"}
      </button>

      {/* Hiển thị kết quả text */}
      {places.length > 0 && (
        <div className="text-center bg-white p-4 rounded shadow mb-4">
          <h2 className="text-xl font-bold">{places[0].tags.name}</h2>
          <p className="text-gray-600">
            {places[0].tags["addr:street"] || "Địa chỉ chưa cập nhật trên OSM"}
          </p>
        </div>
      )}

      {/* Hiển thị bản đồ */}
      {location && (
        <div className="w-full max-w-md h-[400px] border-2 border-pink-200 rounded-xl overflow-hidden">
          <Map center={location} markers={places} />
        </div>
      )}
    </div>
  );
}
