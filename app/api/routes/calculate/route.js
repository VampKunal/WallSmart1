export async function POST(request) {
  try {
    const body = await request.json()
    const { source, destination } = body

    if (!source || !destination || !source.lat || !source.lng || !destination.lat || !destination.lng) {
      return Response.json({ error: "Source and destination coordinates are required" }, { status: 400 })
    }

    try {
      const coordinates = `${source.lng},${source.lat};${destination.lng},${destination.lat}`

      // Check if Mapbox token is available
      if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
        throw new Error("Mapbox access token not configured")
      }

      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

      // Actual Mapbox Directions API call
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?access_token=${mapboxToken}&overview=full&geometries=geojson&steps=true`,
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

      const route = data.routes[0]

      const routeData = {
        source: {
          name: source.name || "Source",
          lat: source.lat,
          lng: source.lng,
        },
        destination: {
          name: destination.name || "Destination",
          lat: destination.lat,
          lng: destination.lng,
        },
        distance: `${(route.distance / 1000).toFixed(1)} km`,
        duration: `${Math.round(route.duration / 60)} minutes`,
        coordinates: route.geometry.coordinates,
        steps: route.legs[0]?.steps?.map((step) => step.maneuver.instruction) || [],
      }

      return Response.json({ route: routeData })
    } catch (apiError) {
      console.log("Using fallback route due to API error:", apiError.message)

      // Calculate straight-line distance as fallback
      const distance = calculateDistance(source.lat, source.lng, destination.lat, destination.lng)
      const estimatedDuration = Math.round(distance * 2) // Rough estimate: 2 minutes per km

      const fallbackRoute = {
        source: {
          name: source.name || "Source",
          lat: source.lat,
          lng: source.lng,
        },
        destination: {
          name: destination.name || "Destination",
          lat: destination.lat,
          lng: destination.lng,
        },
        distance: `${distance.toFixed(1)} km`,
        duration: `${estimatedDuration} minutes`,
        coordinates: [
          [source.lng, source.lat],
          [destination.lng, destination.lat],
        ],
        steps: [
          "Head towards destination",
          `Travel ${distance.toFixed(1)} km to ${destination.name || "destination"}`,
          "Arrive at destination",
        ],
      }

      return Response.json({ route: fallbackRoute })
    }
  } catch (error) {
    console.error("Error in POST /api/routes/calculate:", error)
    return Response.json(
      {
        error: "Failed to calculate route. Please try again later.",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

// Helper function to calculate straight-line distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  return distance
}
