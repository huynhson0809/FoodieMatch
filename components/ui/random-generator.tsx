"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sparkles,
  MapPin,
  Navigation,
  ExternalLink,
  Utensils,
  Coffee,
  LayoutGrid,
} from "lucide-react";
import { useLocation, Place, SearchFilter } from "@/contexts/location-context";

// Dynamic import Map để tránh lỗi SSR
const Map = dynamic(() => import("@/components/ui/map"), { ssr: false });

export function RandomGenerator() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [randomPlace, setRandomPlace] = useState<Place | null>(null);
  const [filter, setFilter] = useState<SearchFilter>("all");
  console.log("randomPlace", randomPlace);

  // Sử dụng global context
  const {
    location,
    locationName,
    isLoadingLocation,
    isSearchingPlaces,
    searchRadius,
    findFoodNearbyWithRetry,
    clearPlaces,
  } = useLocation();

  const handleSurpriseMe = async () => {
    setIsSpinning(true);
    setShowMap(false);
    setRandomPlace(null);
    clearPlaces();

    // Animate spinning trong 1.5s
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Tìm quán với progressive radius và filter
    try {
      const place = await findFoodNearbyWithRetry(filter);
      if (place) {
        setRandomPlace(place);
        setShowMap(true);
      }
    } catch (error) {
      console.error(error);
      alert("Không tìm thấy quán nào!");
    } finally {
      // Chỉ dừng spinning SAU KHI API hoàn tất
      setIsSpinning(false);
    }
  };

  const isReady = location && !isLoadingLocation;
  const isLoading = isSpinning || isSearchingPlaces;

  // Tạo link chỉ đường Google Maps
  const getDirectionsLink = (lat: number, lon: number) =>
    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;

  return (
    <section className="container mx-auto px-4 py-12">
      <Card className="max-w-2xl mx-auto rounded-[20px] border-2 border-border bg-card p-8 md:p-12">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Sparkles className="w-6 h-6 text-primary" />
            <h3 className="text-2xl md:text-3xl font-bold text-foreground">
              Random Food Generator
            </h3>
            <Sparkles className="w-6 h-6 text-primary" />
          </div>

          {/* Location status */}
          <div className="flex items-center justify-center gap-2 mb-4 max-w-full">
            <MapPin
              className={`w-4 h-4 flex-shrink-0 ${
                isReady ? "text-green-500" : "text-muted-foreground"
              }`}
            />
            <span
              className={`text-sm truncate max-w-[300px] ${
                isReady ? "text-green-600" : "text-muted-foreground"
              }`}
              title={locationName || undefined}
            >
              {isReady
                ? locationName || "Đã lấy được vị trí của bạn"
                : "Đang lấy vị trí..."}
            </span>
          </div>

          <p className="text-muted-foreground mb-6">
            Still can&apos;t decide? Let fate choose for you!
          </p>

          {/* Filter toggle */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <button
              onClick={() => setFilter("all")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Tất cả
            </button>
            <button
              onClick={() => setFilter("food")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === "food"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <Utensils className="w-4 h-4" />
              Đồ ăn
            </button>
            <button
              onClick={() => setFilter("drink")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === "drink"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <Coffee className="w-4 h-4" />
              Đồ uống
            </button>
          </div>

          {/* Searching indicator với radius */}
          {(isSearchingPlaces || isSpinning) && (
            <div className="mb-8 space-y-2">
              {searchRadius > 0 && (
                <p className="text-sm text-muted-foreground">
                  Đang tìm trong bán kính{" "}
                  {searchRadius >= 1000
                    ? `${searchRadius / 1000}km`
                    : `${searchRadius}m`}
                </p>
              )}
            </div>
          )}

          {/* KẾT QUẢ: Hiển thị quán ăn được chọn */}
          {randomPlace && showMap && !isSearchingPlaces && !isSpinning && (
            <div className="mb-8 animate-fade-in">
              {/* Tên quán */}
              <h4 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                {randomPlace.name}
              </h4>

              {/* Loại quán (cuisine) */}
              {randomPlace.cuisine && (
                <p className="text-lg text-primary mb-2 capitalize">
                  {randomPlace.cuisine === "restaurant"
                    ? "Nhà hàng"
                    : randomPlace.cuisine === "cafe"
                    ? "Quán cafe"
                    : randomPlace.cuisine === "fast_food"
                    ? "Đồ ăn nhanh"
                    : randomPlace.cuisine}
                </p>
              )}

              {/* Địa chỉ */}
              {randomPlace.address && (
                <p className="text-sm text-muted-foreground mb-4">
                  📍 {randomPlace.address}
                </p>
              )}

              {/* Nút chỉ đường */}
              <a
                href={getDirectionsLink(randomPlace.lat, randomPlace.lon)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-full text-sm font-semibold hover:bg-blue-600 transition-colors"
              >
                <Navigation className="w-4 h-4" />
                Chỉ đường ngay
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          <Button
            size="lg"
            className="rounded-full px-8 py-6 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={handleSurpriseMe}
            disabled={isLoading || !isReady}
          >
            {isSearchingPlaces || isSpinning ? (
              <>
                <Navigation className="w-5 h-5 mr-2 animate-pulse" />
                Đang tìm...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                {randomPlace ? "Thử lại!" : "Surprise Me!"}
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Map Section */}
      {location && showMap && randomPlace && (
        <Card className="max-w-2xl mx-auto mt-6 rounded-[20px] border-2 border-border bg-card p-4 overflow-hidden animate-fade-in">
          <div className="h-[350px] rounded-xl overflow-hidden">
            <Map center={location} markers={[randomPlace]} />
          </div>
        </Card>
      )}
    </section>
  );
}
