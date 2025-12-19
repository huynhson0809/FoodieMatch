"use client";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";

// 1. Cấu hình Icon (Giữ nguyên như cũ)
const iconUser = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Icon màu đỏ cho quán ăn (để phân biệt với user)
const iconFood = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

interface MapProps {
  center: [number, number];
  markers: Array<{ lat: number; lon: number; name: string }>;
}

// 2. Component con để xử lý nút "Về vị trí hiện tại"
function RecenterButton({ center }: { center: [number, number] }) {
  const map = useMap(); // Hook này cho phép điều khiển map

  const handleRecenter = () => {
    // Hiệu ứng bay (flyTo) mượt mà về vị trí user
    map.flyTo(center, 15, {
      animate: true,
      duration: 1.5, // Bay trong 1.5 giây
    });
  };

  return (
    <button
      onClick={handleRecenter}
      style={{
        position: "absolute",
        top: "10px",
        right: "10px",
        zIndex: 1000, // Đè lên bản đồ
        backgroundColor: "white",
        border: "2px solid #ffb6c1", // Viền hồng
        borderRadius: "50%",
        width: "40px",
        height: "40px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
        fontSize: "20px",
      }}
      title="Về vị trí của tôi"
    >
      🎯
    </button>
  );
}

export default function Map({ center, markers }: MapProps) {
  // Hàm tạo Deep Link chỉ đường
  const getDirectionsLink = (lat: number, lng: number) => {
    // Link này hoạt động trên cả Android và iOS
    // Nếu có App Google Maps nó sẽ mở App, nếu không nó mở web
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  };

  return (
    <MapContainer
      center={center}
      zoom={15}
      style={{ height: "100%", width: "100%", borderRadius: "15px" }}
    >
      {/* 3. Thay đổi Theme bản đồ: CartoDB Voyager (Màu pastel, bỏ nhãn rườm rà) */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />

      {/* Nút quay về vị trí hiện tại */}
      <RecenterButton center={center} />

      {/* Marker vị trí User */}
      <Marker position={center} icon={iconUser}>
        <Popup>Bạn đang ở đây! 🏠</Popup>
      </Marker>

      {/* Marker quán ăn */}
      {markers.map((place, idx) => (
        <Marker key={idx} position={[place.lat, place.lon]} icon={iconFood}>
          <Popup>
            <div className="text-center">
              <b className="text-pink-600 text-lg">{place.name}</b> <br />
              {/* 4. Nút Deep Link chỉ đường */}
              <a
                href={getDirectionsLink(place.lat, place.lon)}
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-2 bg-blue-500 text-white px-3 py-1 rounded-lg text-sm font-bold no-underline hover:bg-blue-600"
              >
                🚀 Chỉ đường ngay
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
