"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Navigation, TrendingUp } from "lucide-react";

interface RestaurantGridProps {
  searchQuery: string;
  category: string | null;
}

const restaurants = [
  {
    id: 1,
    name: "Phở 24",
    image: "/pho-bo.jpg",
    rating: 4.8,
    distance: "0.5 km",
    isTikTokHot: true,
    category: "liquid",
  },
  {
    id: 2,
    name: "Bánh Mì Huỳnh Hoa",
    image: "/banh-my.webp",
    rating: 4.9,
    distance: "1.2 km",
    isTikTokHot: true,
    category: "dry",
  },
  {
    id: 3,
    name: "Cơm Tấm Sườn Nướng",
    image: "/com-tam.jpeg",
    rating: 4.7,
    distance: "0.8 km",
    isTikTokHot: false,
    category: "dry",
  },
  {
    id: 4,
    name: "Bún Bò Huế O Xuân",
    image: "/bun-bo-hue.jpg",
    rating: 4.6,
    distance: "1.5 km",
    isTikTokHot: true,
    category: "liquid",
  },
  {
    id: 5,
    name: "Gỏi Cuốn Saigon",
    image: "/goi-cuon.webp",
    rating: 4.5,
    distance: "0.9 km",
    isTikTokHot: false,
    category: "dry",
  },
  {
    id: 6,
    name: "Hủ Tiếu Nam Vang",
    image: "/vietnamese-hu-tieu-noodle-soup.jpg",
    rating: 4.8,
    distance: "1.1 km",
    isTikTokHot: true,
    category: "liquid",
  },
];

// Remove Vietnamese accents for accent-insensitive search
const removeAccents = (str: string): string => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
};

export function RestaurantGrid({ searchQuery, category }: RestaurantGridProps) {
  const filteredRestaurants = restaurants.filter((restaurant) => {
    const normalizedName = removeAccents(restaurant.name);
    const normalizedQuery = removeAccents(searchQuery);
    const matchesSearch = normalizedName.includes(normalizedQuery);
    const matchesCategory = !category || restaurant.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Trending Restaurants Near You
        </h3>
        <p className="text-muted-foreground">
          {filteredRestaurants.length} delicious options found
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRestaurants.map((restaurant) => (
          <Card
            key={restaurant.id}
            className="group overflow-hidden rounded-[20px] border-2 border-border hover:border-primary transition-all duration-300 hover:shadow-xl bg-card"
          >
            {/* Food Image */}
            <div className="relative h-48 overflow-hidden">
              <img
                src={restaurant.image || "/placeholder.svg"}
                alt={restaurant.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              {restaurant.isTikTokHot && (
                <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground border-0 rounded-full px-3 py-1 font-bold">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  TikTok Hot
                </Badge>
              )}
            </div>

            {/* Restaurant Info */}
            <div className="p-5">
              <h4 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                {restaurant.name}
              </h4>

              <div className="flex items-center justify-between mb-4">
                {/* Star Rating */}
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-chart-4 text-chart-4" />
                  <span className="font-bold text-foreground">
                    {restaurant.rating}
                  </span>
                </div>

                {/* Distance */}
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Navigation className="w-4 h-4" />
                  <span className="text-sm">{restaurant.distance}</span>
                </div>
              </div>

              {/* Get Directions Button */}
              <Button
                className="w-full rounded-full font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
                size="lg"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Get Directions
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredRestaurants.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-2xl font-bold text-foreground mb-2">
            No restaurants found
          </h3>
          <p className="text-muted-foreground">
            Try adjusting your search or category
          </p>
        </div>
      )}
    </section>
  );
}
