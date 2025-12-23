"use client";

import { MapPin, Loader2 } from "lucide-react";
import { useLocation } from "@/contexts/location-context";

export function Header() {
  const { locationName, isLoadingLocation, locationError } = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-lg border-b border-border/40">
      <div className="container mx-auto px-4 py-4 z-50">
        <div className="flex items-center justify-between gap-4">
          {/* Cute Mascot Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 bg-primary rounded-full flex items-center justify-center text-2xl animate-bounce-once">
                🍜
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-primary">HoneyBite</h1>
              <p className="text-xs text-muted-foreground">Couples Edition</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-1 justify-center max-w-md">
            {isLoadingLocation ? (
              <>
                <Loader2 className="h-5 w-5 text-muted-foreground animate-spin flex-shrink-0" />
                <span className="text-sm text-muted-foreground">
                  Đang lấy vị trí...
                </span>
              </>
            ) : locationError ? (
              <>
                <MapPin className="h-5 w-5 text-destructive flex-shrink-0" />
                <span className="text-sm text-destructive truncate">
                  {locationError}
                </span>
              </>
            ) : (
              <>
                <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                <span
                  className="text-sm font-medium text-foreground truncate cursor-help truncate max-w-[200px] md:max-w-full"
                  title={locationName || "Vị trí không xác định"}
                >
                  {locationName || "Vị trí không xác định"}
                </span>
              </>
            )}
          </div>

          {/* Heart Icon */}
          <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-accent text-accent-foreground text-2xl flex-shrink-0">
            💕
          </div>
        </div>
      </div>
    </header>
  );
}
