import { NextResponse } from "next/server";
import { ServiceFactory } from "@/lib/services/ServiceFactory";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const minLat = parseFloat(searchParams.get("minLat") || "0");
    const maxLat = parseFloat(searchParams.get("maxLat") || "0");
    const minLng = parseFloat(searchParams.get("minLng") || "0");
    const maxLng = parseFloat(searchParams.get("maxLng") || "0");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!minLat || !maxLat || !minLng || !maxLng) {
      return NextResponse.json(
        {
          error:
            "Missing required query parameters (minLat, maxLat, minLng, maxLng)",
        },
        { status: 400 }
      );
    }

    const service = ServiceFactory.getPlaceSearchService();
    console.log(
      `[API] Searching bounds: ${minLat}, ${maxLat}, ${minLng}, ${maxLng}`
    );

    const places = await service.searchByBounds(
      minLat,
      maxLat,
      minLng,
      maxLng,
      limit
    );
    console.log(`[API] Found ${places.length} places`);

    return NextResponse.json({ places });
  } catch (error) {
    console.error("Bounds Search Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
