import { NextRequest, NextResponse } from "next/server";
import { ServiceFactory } from "@/lib/services/ServiceFactory";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = parseFloat(searchParams.get("lat") || "");
    const lng = parseFloat(searchParams.get("lng") || "");
    const radius = parseInt(searchParams.get("radius") || "5000"); // meters
    const filter = searchParams.get("filter") || "all";
    const excludeIds = searchParams.get("excludeIds")?.split(",") || [];

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: "Invalid location parameters" },
        { status: 400 }
      );
    }

    const service = ServiceFactory.getPlaceSearchService();

    // Convert filter to enum type if needed, or pass as is
    // Interface expects 'food' | 'drink' | 'all'
    const searchFilter = (
      ["food", "drink"].includes(filter) ? filter : "all"
    ) as "food" | "drink" | "all";

    const minDistance = parseInt(searchParams.get("minDistance") || "0"); // meters

    console.log(
      `[API] Random Search: lat=${lat}, lng=${lng}, radius=${radius}, minDistance=${minDistance}, filter=${filter}`
    );

    const keyword = searchParams.get("keyword");

    let place;
    // Call appropriate service method
    if (keyword) {
      place = await service.searchByKeyword({ lat, lng }, keyword, {
        radius: radius,
        minDistance: minDistance,
        filter: searchFilter,
        excludeIds: excludeIds.filter((id) => id.length > 0),
        distance: "near",
      });
    } else {
      place = await service.findRandomPlace(
        { lat, lng },
        {
          radius: radius,
          minDistance: minDistance,
          filter: searchFilter,
          excludeIds: excludeIds.filter((id) => id.length > 0),
          distance: "near", // Logic handled by radius mostly
        }
      );
    }

    if (!place) {
      return NextResponse.json({ place: null });
    }

    return NextResponse.json({ place });
  } catch (error) {
    console.error("Error in random place API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
