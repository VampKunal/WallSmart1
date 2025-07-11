export async function POST(request) {
  try {
    const body = await request.json()
    const { itemIds } = body

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return Response.json({ error: "No items selected for route optimization" }, { status: 400 })
    }

    // Sample coordinates for demonstration (you can replace with actual item locations)
    const sampleLocations = [
      [-74.006, 40.7128], // New York
      [-74.0059, 40.7589], // Manhattan
      [-74.0014, 40.7505], // Midtown
      [-73.9857, 40.7484], // Times Square
      [-73.9776, 40.7831], // Upper West Side
    ]

    try {
      // Get coordinates for selected items (using sample data)
      const coordinates = itemIds
        .slice(0, Math.min(itemIds.length, sampleLocations.length))
        .map((_, index) => sampleLocations[index])

      if (coordinates.length < 2) {
        // Return mock route for single item
        const mockRoutes = [
          {
            id: 0,
            distance: "5.2 km",
            duration: "12 minutes",
            stops: 1,
            coordinates: coordinates,
            steps: ["Start at warehouse", "Head to delivery location", "Arrive at destination"],
          },
        ]
        return Response.json({ routes: mockRoutes })
      }

      const coordinatesString = coordinates.map((coord) => coord.join(",")).join(";")

      // Check if Mapbox token is available
      if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
        throw new Error("Mapbox access token not configured")
      }

      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

      // Actual Mapbox Directions API call
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinatesString}?access_token=${mapboxToken}&overview=full&geometries=geojson&steps=true`,
        {
          headers: {
            "User-Agent": "GreenStock-AI/1.0",
          },
        },
      )

      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.routes || data.routes.length === 0) {
        throw new Error("No routes found")
      }

      const routes = data.routes.map((route, index) => ({
        id: index,
        distance: `${(route.distance / 1000).toFixed(1)} km`,
        duration: `${Math.round(route.duration / 60)} minutes`,
        stops: coordinates.length,
        coordinates: route.geometry.coordinates,
        steps: route.legs[0]?.steps?.slice(0, 5).map((step) => step.maneuver.instruction) || [
          "Route directions unavailable",
        ],
      }))

      return Response.json({ routes })
    } catch (apiError) {
      console.log("Using fallback routes due to API error:", apiError.message)

      // Fallback mock routes
      const mockRoutes = [
        {
          id: 0,
          distance: "12.5 km",
          duration: "25 minutes",
          stops: itemIds.length,
          coordinates: sampleLocations.slice(0, itemIds.length),
          steps: [
            "Head north on Main St",
            "Turn right on Oak Ave",
            "Continue for 2.5 km",
            "Turn left on Pine St",
            "Arrive at destination",
          ],
        },
      ]

      return Response.json({ routes: mockRoutes })
    }
  } catch (error) {
    console.error("Error in POST /api/routes/optimize:", error)
    return Response.json(
      {
        error: "Failed to optimize routes. Please try again later.",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
