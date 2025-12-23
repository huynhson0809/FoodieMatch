"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Soup,
  Utensils,
  ArrowLeft,
  RefreshCw,
  Navigation,
  ExternalLink,
  MapPin,
  Map as MapIcon,
} from "lucide-react";
import { useLocation } from "@/contexts/location-context";
import type { Place } from "@/lib/services/interfaces/IPlaceSearchService";
import type { SearchFilter } from "@/lib/services/interfaces/IPlaceSearchService";
import { MapExplorer } from "@/components/ui/map-explorer";

// Dynamic import Map to avoid SSR issues
const Map = dynamic(() => import("@/components/ui/map"), { ssr: false });
const DynamicMapExplorer = dynamic(
  () => import("@/components/ui/map-explorer").then((mod) => mod.MapExplorer),
  { ssr: false }
);

// Types
type Mode = "random" | "explore";
type Step = "category" | "distance" | "result";
type Distance = "near" | "far";

interface SelectionState {
  category: SearchFilter | null;
  distance: Distance | null;
}

export function HeroSection() {
  const [mode, setMode] = useState<Mode>("explore");
  const [step, setStep] = useState<Step>("category");
  const [selection, setSelection] = useState<SelectionState>({
    category: null,
    distance: null,
  });
  const [history, setHistory] = useState<string[]>([]);
  const [result, setResult] = useState<Place | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Use LocationContext for shared state and logic
  const { location, findFoodNearbyWithRetry } = useLocation();

  // Handle category selection - go directly to distance
  const handleCategorySelect = (category: SearchFilter) => {
    setSelection((prev) => ({ ...prev, category }));
    setStep("distance");
  };

  // Handle distance selection and search
  const handleDistanceSelect = async (distance: Distance) => {
    setSelection((prev) => ({ ...prev, distance }));
    setStep("result");
    await searchPlace(selection.category!, distance);
  };

  // Search for place (random mode)
  const searchPlace = async (category: SearchFilter, distance: Distance) => {
    if (!location) return;

    setIsSearching(true);
    setResult(null);

    const excludeIds = history.join(",");

    try {
      const place = await findFoodNearbyWithRetry(
        category,
        distance,
        excludeIds
      );
      setResult(place);
      if (place) {
        setHistory((prev) => [...prev, place.id]);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Regenerate result - exclude current place
  const handleRegenerate = async () => {
    if (selection.category && selection.distance) {
      await searchPlace(selection.category, selection.distance);
    }
  };

  // Start over
  const handleStartOver = () => {
    setStep("category");
    setSelection({ category: null, distance: null });
    setResult(null);
    // Keep history intentionally so we don't suggest same places again
  };

  // Go back one step
  const handleBack = () => {
    if (step === "distance") {
      setStep("category");
    } else if (step === "result") {
      setStep("distance");
    }
  };

  // Get directions link
  const getDirectionsLink = (lat: number, lng: number) =>
    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <section className="container mx-auto px-4 py-8 md:py-12">
      {/* Mode Switcher */}
      <div className="max-w-md mx-auto mb-8 animate-fade-in">
        <div className="flex gap-3 p-2 bg-muted/50 rounded-full">
          <button
            onClick={() => setMode("random")}
            className={`flex-1 px-4 py-3 rounded-full font-semibold transition-all flex items-center justify-center gap-2 ${
              mode === "random"
                ? "bg-primary text-primary-foreground shadow-lg"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>🎲</span> Random
          </button>
          <button
            onClick={() => setMode("explore")}
            className={`flex-1 px-4 py-3 rounded-full font-semibold transition-all flex items-center justify-center gap-2 ${
              mode === "explore"
                ? "bg-primary text-primary-foreground shadow-lg"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MapIcon className="w-4 h-4" /> Khám phá map
          </button>
        </div>
      </div>

      {mode === "explore" ? (
        // EXPLORE MODE (Map Explorer)
        <div className="animate-fade-in">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-2">
              Bản đồ Ẩm thực 🗺️
            </h2>
            <p className="text-muted-foreground">
              Di chuyển bản đồ để tìm quán ngon quanh đây
            </p>
          </div>
          <DynamicMapExplorer />
        </div>
      ) : (
        // RANDOM MODE (Original Wizard)
        <div className="animate-fade-in">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4 text-balance">
              {step === "result" ? "Gợi ý cho bạn! 🎉" : "Hôm nay ăn gì? 🤔"}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {step === "category" && "Chọn loại quán bạn muốn"}
              {step === "distance" && "Bạn muốn đi xa hay gần?"}
              {step === "result" && "Hy vọng bạn thích quán này!"}
            </p>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 mt-4">
              {["category", "distance", "result"].map((s, i) => (
                <div
                  key={s}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    step === s
                      ? "bg-primary"
                      : i <
                        ["category", "distance", "result"].indexOf(step as Step)
                      ? "bg-primary/50"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Random Wizard Steps */}
          <div className="max-w-4xl mx-auto">
            {/* Step 1: Category */}
            {step === "category" && (
              <div className="grid md:grid-cols-2 gap-6">
                <Card
                  className="group relative overflow-hidden rounded-[20px] border-2 border-border hover:border-primary transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-2xl bg-gradient-to-br from-chart-2 to-chart-3"
                  onClick={() => handleCategorySelect("food")}
                >
                  <div className="p-8 md:p-12 flex flex-col items-center text-center h-full">
                    <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Utensils
                        className="w-10 h-10 text-chart-2"
                        strokeWidth={2.5}
                      />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-2">
                      Đồ ăn
                    </h3>
                    <p className="text-white/90">Phở, Cơm, Bún...</p>
                    <div className="mt-4 text-5xl animate-bounce">🍜</div>
                  </div>
                </Card>

                <Card
                  className="group relative overflow-hidden rounded-[20px] border-2 border-border hover:border-accent transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-2xl bg-gradient-to-br from-accent to-chart-1"
                  onClick={() => handleCategorySelect("drink")}
                >
                  <div className="p-8 md:p-12 flex flex-col items-center text-center h-full">
                    <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Soup
                        className="w-10 h-10 text-accent"
                        strokeWidth={2.5}
                      />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-2">
                      Đồ uống
                    </h3>
                    <p className="text-white/90">Cafe, Trà sữa...</p>
                    <div className="mt-4 text-5xl animate-bounce">☕</div>
                  </div>
                </Card>
              </div>
            )}

            {/* Step 2: Distance */}
            {step === "distance" && (
              <div>
                <Button variant="ghost" onClick={handleBack} className="mb-4">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
                </Button>
                <div className="grid md:grid-cols-2 gap-6">
                  <Card
                    className="group relative overflow-hidden rounded-[20px] border-2 border-border hover:border-green-500 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-2xl bg-gradient-to-br from-green-400 to-teal-500"
                    onClick={() => handleDistanceSelect("near")}
                  >
                    <div className="p-8 md:p-12 flex flex-col items-center text-center">
                      <div className="text-5xl mb-4">📍</div>
                      <h3 className="text-3xl font-bold text-white">Gần đây</h3>
                      <p className="text-white/90">Dưới 5km</p>
                    </div>
                  </Card>
                  <Card
                    className="group relative overflow-hidden rounded-[20px] border-2 border-border hover:border-blue-500 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-2xl bg-gradient-to-br from-blue-400 to-indigo-500"
                    onClick={() => handleDistanceSelect("far")}
                  >
                    <div className="p-8 md:p-12 flex flex-col items-center text-center">
                      <div className="text-5xl mb-4">🚗</div>
                      <h3 className="text-3xl font-bold text-white">Xa hơn</h3>
                      <p className="text-white/90">Trên 5km</p>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* Step 3: Result */}
            {step === "result" && (
              <div>
                {isSearching ? (
                  <div className="text-center py-12">
                    <div className="text-6xl animate-spin-slow mb-4">🎰</div>
                    <p className="text-muted-foreground">Đang quay thưởng...</p>
                  </div>
                ) : result ? (
                  <div className="space-y-6">
                    <Card className="rounded-[20px] border-2 border-primary bg-card p-6 text-center shadow-lg relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-accent" />
                      <div className="text-6xl mb-4">
                        {result.emoji || "🍴"}
                      </div>
                      <h3 className="text-3xl font-bold mb-2">{result.name}</h3>
                      {result.cuisine && (
                        <p className="text-primary font-medium mb-2 capitalize">
                          {result.cuisine}
                        </p>
                      )}

                      <div className="flex justify-center gap-4 mb-4 text-sm">
                        {result.distance && (
                          <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                            <Navigation className="w-3 h-3" />{" "}
                            {result.distance.toFixed(1)} km
                          </div>
                        )}
                        {result.rating && (
                          <div className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                            ⭐ {result.rating} ({result.reviewCount})
                          </div>
                        )}
                      </div>

                      <p className="text-muted-foreground mb-6 flex justify-center items-center gap-1">
                        <MapPin className="w-4 h-4" /> {result.address}
                      </p>

                      <div className="flex flex-col sm:flex-row justify-center gap-3">
                        <Button
                          asChild
                          size="lg"
                          className="rounded-full shadow-lg"
                        >
                          <a
                            href={result.googleMapsUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Navigation className="w-4 h-4 mr-2" /> Google Maps
                          </a>
                        </Button>
                        <Button
                          asChild
                          variant="secondary"
                          size="lg"
                          className="rounded-full border-2"
                        >
                          <a
                            href={getDirectionsLink(result.lat, result.lng)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Chỉ đường
                          </a>
                        </Button>
                      </div>
                    </Card>

                    {/* Mini Map for Random Result */}
                    {location && (
                      <div className="rounded-xl overflow-hidden border-2 h-64">
                        <Map
                          center={location}
                          markers={[result]}
                          enableRouting={true}
                        />
                      </div>
                    )}

                    <div className="flex justify-center gap-4">
                      <Button
                        onClick={handleRegenerate}
                        size="lg"
                        className="rounded-full"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" /> Chọn quán khác
                      </Button>
                      <Button
                        onClick={handleStartOver}
                        variant="outline"
                        size="lg"
                        className="rounded-full"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại đầu
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">😢</div>
                    <p className="text-muted-foreground mb-6">
                      Không tìm thấy quán nào!
                    </p>
                    <Button onClick={handleStartOver}>Thử lại</Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
