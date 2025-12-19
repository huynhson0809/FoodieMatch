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
} from "lucide-react";
import { useLocation, Place, SearchFilter } from "@/contexts/location-context";

// Dynamic import Map để tránh lỗi SSR
const Map = dynamic(() => import("@/components/ui/map"), { ssr: false });

// Types
type Mode = "random" | "search";
type Step = "category" | "keyword" | "distance" | "result";
type Distance = "near" | "far";

interface SelectionState {
  category: SearchFilter | null;
  keyword: string;
  distance: Distance | null;
}

export function HeroSection() {
  const [mode, setMode] = useState<Mode>("random");
  const [step, setStep] = useState<Step>("category");
  const [selection, setSelection] = useState<SelectionState>({
    category: null,
    keyword: "",
    distance: null,
  });
  const [result, setResult] = useState<Place | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const { location, findFoodNearbyWithRetry, searchByKeyword } = useLocation();

  // Handle category selection - go directly to distance
  const handleCategorySelect = (category: SearchFilter) => {
    setSelection((prev) => ({ ...prev, category }));
    setStep("distance");
  };

  // Handle keyword submit - go to distance
  const handleKeywordSubmit = (keyword: string) => {
    setSelection((prev) => ({ ...prev, keyword }));
    setStep("distance");
  };

  // Handle distance selection and search
  const handleDistanceSelect = async (distance: Distance) => {
    setSelection((prev) => ({ ...prev, distance }));
    setStep("result");

    if (mode === "random") {
      await searchPlace(selection.category!, distance);
    } else {
      // search mode
      await searchByKeywordPlace(selection.keyword, distance);
    }
  };

  // Search for place (random mode)
  const searchPlace = async (
    category: SearchFilter,
    distance: Distance,
    excludeId?: string
  ) => {
    setIsSearching(true);
    setResult(null);

    try {
      const place = await findFoodNearbyWithRetry(
        category,
        distance,
        excludeId
      );
      setResult(place);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Search by keyword (search mode)
  const searchByKeywordPlace = async (
    keyword: string,
    distance: Distance,
    excludeId?: string
  ) => {
    setIsSearching(true);
    setResult(null);

    try {
      const place = await searchByKeyword(keyword, distance, excludeId);
      setResult(place);
    } catch (error) {
      console.error("Search error:", error);
      alert(error instanceof Error ? error.message : "Lỗi tìm kiếm!");
    } finally {
      setIsSearching(false);
    }
  };

  // Regenerate result - exclude current place
  const handleRegenerate = async () => {
    if (mode === "random" && selection.category && selection.distance) {
      await searchPlace(selection.category, selection.distance, result?.id);
    } else if (mode === "search" && selection.keyword && selection.distance) {
      await searchByKeywordPlace(
        selection.keyword,
        selection.distance,
        result?.id
      );
    }
  };

  // Start over
  const handleStartOver = () => {
    setStep(mode === "random" ? "category" : "keyword");
    setSelection({ category: null, keyword: "", distance: null });
    setResult(null);
  };

  // Go back one step
  const handleBack = () => {
    if (step === "distance") {
      setStep(mode === "random" ? "category" : "keyword");
    } else if (step === "result") {
      setStep("distance");
    }
  };

  // Get directions link
  const getDirectionsLink = (lat: number, lon: number) =>
    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;

  return (
    <section className="container mx-auto px-4 py-12 md:py-16">
      {/* Mode Toggle */}
      {step !== "result" && (
        <div className="max-w-md mx-auto mb-8 animate-fade-in">
          <div className="flex gap-3 p-2 bg-muted/50 rounded-full">
            <button
              onClick={() => {
                setMode("random");
                setStep("category");
                setSelection({ category: null, keyword: "", distance: null });
              }}
              className={`flex-1 px-6 py-3 rounded-full font-semibold transition-all ${
                mode === "random"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🎲 Random cho tôi
            </button>
            <button
              onClick={() => {
                setMode("search");
                setStep("keyword");
                setSelection({ category: null, keyword: "", distance: null });
              }}
              className={`flex-1 px-6 py-3 rounded-full font-semibold transition-all ${
                mode === "search"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🔍 Tôi biết muốn gì
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-4 text-balance">
          {step === "result"
            ? "Đây là gợi ý cho bạn! 🎉"
            : "Can't decide? Let us help! 🎉"}
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          {step === "category" && "Bạn muốn ăn gì hôm nay?"}
          {step === "keyword" && "Món bạn muốn tìm?"}
          {step === "distance" && "Bạn muốn đi xa hay gần?"}
          {step === "result" && "Perfect match cho hôm nay!"}
        </p>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {mode === "random" ? (
            <>
              {["category", "distance", "result"].map((s, i) => (
                <div
                  key={s}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    step === s
                      ? "bg-primary"
                      : i < ["category", "distance", "result"].indexOf(step)
                      ? "bg-primary/50"
                      : "bg-muted"
                  }`}
                />
              ))}
            </>
          ) : (
            <>
              {["keyword", "distance", "result"].map((s, i) => (
                <div
                  key={s}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    step === s
                      ? "bg-primary"
                      : i < ["keyword", "distance", "result"].indexOf(step)
                      ? "bg-primary/50"
                      : "bg-muted"
                  }`}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Step 1: Category Selection */}
      {step === "category" && (
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto animate-fade-in">
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
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-3">
                Đồ ăn
              </h3>
              <p className="text-white/90 text-lg">Phở, Cơm, Bún & More</p>
              <div className="mt-6 text-6xl animate-bounce">🍜</div>
            </div>
          </Card>

          <Card
            className="group relative overflow-hidden rounded-[20px] border-2 border-border hover:border-accent transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-2xl bg-gradient-to-br from-accent to-chart-1"
            onClick={() => handleCategorySelect("drink")}
          >
            <div className="p-8 md:p-12 flex flex-col items-center text-center h-full">
              <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Soup className="w-10 h-10 text-accent" strokeWidth={2.5} />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-3">
                Đồ uống
              </h3>
              <p className="text-white/90 text-lg">Cafe, Trà sữa & More</p>
              <div className="mt-6 text-6xl animate-bounce">☕</div>
            </div>
          </Card>
        </div>
      )}

      {/* Step 1b: Keyword Input (Search Mode) */}
      {step === "keyword" && (
        <div className="max-w-2xl mx-auto animate-fade-in">
          <Card className="p-8 md:p-12 rounded-[20px] border-2">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl md:text-3xl font-bold mb-2">
                Bạn muốn tìm món gì?
              </h3>
              <p className="text-muted-foreground">
                Nhập tên món hoặc loại quán (VD: phở, burger, sushi, cafe...)
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const keyword = (
                  e.currentTarget.elements.namedItem(
                    "keyword"
                  ) as HTMLInputElement
                ).value.trim();
                if (keyword) {
                  handleKeywordSubmit(keyword);
                }
              }}
              className="space-y-4"
            >
              <input
                type="text"
                name="keyword"
                placeholder="Nhập tên món ăn..."
                defaultValue={selection.keyword}
                className="w-full px-6 py-4 rounded-full border-2 border-border bg-background text-lg focus:outline-none focus:border-primary transition-colors"
                autoFocus
                required
              />
              <Button
                type="submit"
                className="w-full py-6 rounded-full text-lg font-semibold"
              >
                Tìm kiếm →
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* Step 2: Distance Selection */}
      {step === "distance" && (
        <div className="max-w-4xl mx-auto animate-fade-in">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-6 text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>

          <div className="grid md:grid-cols-2 gap-6">
            <Card
              className="group relative overflow-hidden rounded-[20px] border-2 border-border hover:border-green-500 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-2xl bg-gradient-to-br from-green-400 to-teal-500"
              onClick={() => handleDistanceSelect("near")}
            >
              <div className="p-8 md:p-12 flex flex-col items-center text-center h-full">
                <div className="text-6xl mb-6">📍</div>
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-3">
                  Gần đây
                </h3>
                <p className="text-white/90 text-lg">Trong vòng 5km</p>
              </div>
            </Card>

            <Card
              className="group relative overflow-hidden rounded-[20px] border-2 border-border hover:border-blue-500 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-2xl bg-gradient-to-br from-blue-400 to-indigo-500"
              onClick={() => handleDistanceSelect("far")}
            >
              <div className="p-8 md:p-12 flex flex-col items-center text-center h-full">
                <div className="text-6xl mb-6">🚗</div>
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-3">
                  Xa hơn
                </h3>
                <p className="text-white/90 text-lg">
                  Trên 5km, sẵn sàng đi xa
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Step 3: Result */}
      {step === "result" && (
        <div className="max-w-4xl mx-auto animate-fade-in">
          {isSearching ? (
            <div className="text-center py-12">
              <div className="text-6xl animate-spin-slow mb-4">🎰</div>
              <p className="text-muted-foreground">Đang tìm quán phù hợp...</p>
            </div>
          ) : result ? (
            <div className="space-y-6">
              {/* Result Card */}
              <Card className="rounded-[20px] border-2 border-primary bg-card p-8 text-center">
                <div className="text-6xl mb-4">{result.emoji || "🍴"}</div>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  {result.name}
                </h3>
                {result.cuisine && (
                  <p className="text-lg text-primary mb-2 capitalize">
                    {result.cuisine === "restaurant"
                      ? "Nhà hàng"
                      : result.cuisine === "cafe"
                      ? "Quán cafe"
                      : result.cuisine === "fast_food"
                      ? "Đồ ăn nhanh"
                      : result.cuisine}
                  </p>
                )}
                {result.address && (
                  <p className="text-sm text-muted-foreground mb-4 flex items-center justify-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {result.address}
                  </p>
                )}
                <a
                  href={getDirectionsLink(result.lat, result.lon)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition-colors"
                >
                  <Navigation className="w-5 h-5" />
                  Chỉ đường ngay
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Card>

              {/* Map */}
              {location && (
                <Card className="rounded-[20px] border-2 border-border bg-card p-4 overflow-hidden">
                  <div className="h-[300px] rounded-xl overflow-hidden">
                    <Map center={location} markers={[result]} />
                  </div>
                </Card>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="lg"
                  onClick={handleRegenerate}
                  disabled={isSearching}
                  className="rounded-full px-8"
                >
                  <RefreshCw
                    className={`w-5 h-5 mr-2 ${
                      isSearching ? "animate-spin" : ""
                    }`}
                  />
                  {isSearching ? "Đang tìm..." : "Tìm quán khác"}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleStartOver}
                  className="rounded-full px-8"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Chọn lại từ đầu
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">😢</div>
              <p className="text-muted-foreground mb-6">
                Không tìm thấy quán phù hợp
              </p>
              <Button onClick={handleStartOver} className="rounded-full">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Thử lại
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
