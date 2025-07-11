"use client"

import { useState, useEffect, useRef } from "react"
import Sidebar from "../components/Sidebar"
import Header from "../components/Header"
import { MapIcon, TruckIcon, ExclamationTriangleIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline"

export default function Routes() {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const [routes, setRoutes] = useState([])
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState(null)
  const [routeError, setRouteError] = useState(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [showRouteForm, setShowRouteForm] = useState(false)
  const [routeForm, setRouteForm] = useState({
    sourceName: "",
    sourceLat: "",
    sourceLng: "",
    destName: "",
    destLat: "",
    destLng: "",
  })
  const [markers, setMarkers] = useState([])

  // Route colors for multiple routes
  const routeColors = [
    "#3b82f6", // blue
    "#ef4444", // red
    "#10b981", // green
    "#f59e0b", // amber
    "#8b5cf6", // violet
    "#06b6d4", // cyan
    "#f97316", // orange
    "#84cc16", // lime
  ]

  useEffect(() => {
    initializeMap()
  }, [])

  const initializeMap = () => {
    if (map.current || !mapContainer.current) return

    try {
      // Check if Mapbox GL JS is available
      if (typeof window !== "undefined" && window.mapboxgl) {
        window.mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

        if (!window.mapboxgl.accessToken) {
          setMapError("Mapbox access token is missing")
          return
        }

        map.current = new window.mapboxgl.Map({
          container: mapContainer.current,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [-74.006, 40.7128], // New York City
          zoom: 12,
        })

        map.current.on("load", () => {
          setMapLoaded(true)
          setMapError(null)
        })

        map.current.on("error", (e) => {
          console.error("Mapbox error:", e)
          setMapError("Failed to load map. Please check your internet connection.")
        })
      } else {
        // Load Mapbox GL JS if not available
        loadMapboxScript()
      }
    } catch (error) {
      console.error("Map initialization error:", error)
      setMapError("Failed to initialize map")
    }
  }

  const loadMapboxScript = () => {
    if (typeof window !== "undefined" && !window.mapboxgl) {
      const script = document.createElement("script")
      script.src = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"
      script.onload = () => {
        initializeMap()
      }
      script.onerror = () => {
        setMapError("Failed to load Mapbox library")
      }
      document.head.appendChild(script)

      const link = document.createElement("link")
      link.href = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css"
      link.rel = "stylesheet"
      document.head.appendChild(link)
    }
  }

  const generateRoute = async () => {
    if (!routeForm.sourceLat || !routeForm.sourceLng || !routeForm.destLat || !routeForm.destLng) {
      setRouteError("Please fill in all coordinates")
      return
    }

    setRouteLoading(true)
    setRouteError(null)

    try {
      const response = await fetch("/api/routes/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: {
            name: routeForm.sourceName || "Source",
            lat: Number.parseFloat(routeForm.sourceLat),
            lng: Number.parseFloat(routeForm.sourceLng),
          },
          destination: {
            name: routeForm.destName || "Destination",
            lat: Number.parseFloat(routeForm.destLat),
            lng: Number.parseFloat(routeForm.destLng),
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // Add unique ID and color to the route
      const newRoute = {
        ...data.route,
        id: Date.now(),
        color: routeColors[routes.length % routeColors.length],
      }

      // Add route to the list
      const updatedRoutes = [...routes, newRoute]
      setRoutes(updatedRoutes)

      // Add route to map
      if (map.current && newRoute) {
        try {
          addRouteToMap(newRoute, updatedRoutes.length - 1)
        } catch (mapError) {
          console.error("Error adding route to map:", mapError)
        }
      }

      setShowRouteForm(false)
      resetForm()
    } catch (error) {
      console.error("Error generating route:", error)
      setRouteError("Failed to generate route. Please try again later.")
    } finally {
      setRouteLoading(false)
    }
  }

  const addRouteToMap = (route, index) => {
    if (!map.current) return

    const routeId = `route-${route.id}`
    const sourceMarkerId = `source-${route.id}`
    const destMarkerId = `dest-${route.id}`

    // Add source marker
    const sourceMarker = new window.mapboxgl.Marker({
      color: "#22c55e",
      scale: 0.8,
    })
      .setLngLat([route.source.lng, route.source.lat])
      .setPopup(new window.mapboxgl.Popup().setText(`${route.source.name} (Route ${index + 1})`))
      .addTo(map.current)

    // Add destination marker
    const destMarker = new window.mapboxgl.Marker({
      color: "#ef4444",
      scale: 0.8,
    })
      .setLngLat([route.destination.lng, route.destination.lat])
      .setPopup(new window.mapboxgl.Popup().setText(`${route.destination.name} (Route ${index + 1})`))
      .addTo(map.current)

    // Store markers for cleanup
    setMarkers((prev) => [...prev, { sourceMarker, destMarker, routeId: route.id }])

    // Add route line if coordinates exist
    if (route.coordinates && route.coordinates.length > 0) {
      map.current.addSource(routeId, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: route.coordinates,
          },
        },
      })

      map.current.addLayer({
        id: routeId,
        type: "line",
        source: routeId,
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": route.color,
          "line-width": 4,
          "line-opacity": 0.8,
        },
      })
    }

    // Fit map to show all routes
    if (routes.length === 0) {
      // First route - fit to this route
      if (route.coordinates && route.coordinates.length > 0) {
        const bounds = new window.mapboxgl.LngLatBounds()
        route.coordinates.forEach((coord) => bounds.extend(coord))
        map.current.fitBounds(bounds, { padding: 50 })
      }
    } else {
      // Multiple routes - fit to all routes
      fitMapToAllRoutes([...routes, route])
    }
  }

  const fitMapToAllRoutes = (allRoutes) => {
    if (!map.current || allRoutes.length === 0) return

    const bounds = new window.mapboxgl.LngLatBounds()

    allRoutes.forEach((route) => {
      bounds.extend([route.source.lng, route.source.lat])
      bounds.extend([route.destination.lng, route.destination.lat])
    })

    map.current.fitBounds(bounds, { padding: 80 })
  }

  const deleteRoute = (routeId) => {
    if (!confirm("Are you sure you want to delete this route?")) return

    // Remove from routes array
    const updatedRoutes = routes.filter((route) => route.id !== routeId)
    setRoutes(updatedRoutes)

    // Remove from map
    if (map.current) {
      const routeLayerId = `route-${routeId}`

      try {
        // Remove layer and source
        if (map.current.getLayer(routeLayerId)) {
          map.current.removeLayer(routeLayerId)
        }
        if (map.current.getSource(routeLayerId)) {
          map.current.removeSource(routeLayerId)
        }

        // Remove markers
        const routeMarkers = markers.filter((m) => m.routeId === routeId)
        routeMarkers.forEach(({ sourceMarker, destMarker }) => {
          sourceMarker.remove()
          destMarker.remove()
        })

        // Update markers array
        setMarkers((prev) => prev.filter((m) => m.routeId !== routeId))

        // Refit map if routes remain
        if (updatedRoutes.length > 0) {
          fitMapToAllRoutes(updatedRoutes)
        }
      } catch (error) {
        console.error("Error removing route from map:", error)
      }
    }
  }

  const clearAllRoutes = () => {
    if (!confirm("Are you sure you want to clear all routes?")) return

    // Clear routes array
    setRoutes([])

    // Clear map
    if (map.current) {
      try {
        // Remove all route layers and sources
        routes.forEach((route) => {
          const routeLayerId = `route-${route.id}`
          if (map.current.getLayer(routeLayerId)) {
            map.current.removeLayer(routeLayerId)
          }
          if (map.current.getSource(routeLayerId)) {
            map.current.removeSource(routeLayerId)
          }
        })

        // Remove all markers
        markers.forEach(({ sourceMarker, destMarker }) => {
          sourceMarker.remove()
          destMarker.remove()
        })

        setMarkers([])

        // Reset map view
        map.current.flyTo({
          center: [-74.006, 40.7128],
          zoom: 12,
        })
      } catch (error) {
        console.error("Error clearing routes from map:", error)
      }
    }
  }

  const resetForm = () => {
    setRouteForm({
      sourceName: "",
      sourceLat: "",
      sourceLng: "",
      destName: "",
      destLat: "",
      destLng: "",
    })
    setRouteError(null)
  }

  const renderMapContent = () => {
    if (mapError) {
      return (
        <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
          <div className="text-center p-8">
            <ExclamationTriangleIcon className="w-16 h-16 text-destructive mx-auto mb-4" />
            <p className="text-foreground font-medium mb-2">Map Error</p>
            <p className="text-muted-foreground text-sm">{mapError}</p>
            <button
              onClick={() => {
                setMapError(null)
                initializeMap()
              }}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      )
    }

    if (!mapLoaded) {
      return (
        <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-foreground font-medium">Loading Map</p>
            <p className="text-muted-foreground text-sm">Please wait...</p>
          </div>
        </div>
      )
    }

    return null // Map will render in the container
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Delivery Routes</h1>
                <p className="text-muted-foreground">
                  Plan and manage multiple delivery routes with precise coordinates
                </p>
              </div>
              <div className="flex space-x-2">
                {routes.length > 0 && (
                  <button
                    onClick={clearAllRoutes}
                    className="flex items-center px-4 py-2 text-destructive border border-destructive rounded-md hover:bg-destructive/10"
                  >
                    <TrashIcon className="w-4 h-4 mr-2" />
                    Clear All
                  </button>
                )}
                <button
                  onClick={() => setShowRouteForm(true)}
                  className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Route
                </button>
              </div>
            </div>

            {routeError && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive text-destructive rounded-md">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                  {routeError}
                </div>
              </div>
            )}

            {/* Map */}
            <div className="bg-card p-6 rounded-lg border border-border mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center">
                  <MapIcon className="w-5 h-5 mr-2" />
                  Route Map {routes.length > 0 && `(${routes.length} route${routes.length > 1 ? "s" : ""})`}
                </h2>
                {routes.length > 0 && (
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      Source
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                      Destination
                    </div>
                  </div>
                )}
              </div>

              <div ref={mapContainer} className="w-full h-96 rounded-lg relative">
                {renderMapContent()}
              </div>
            </div>

            {/* Route Details */}
            {routes.length > 0 && (
              <div className="bg-card p-6 rounded-lg border border-border">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Route Details ({routes.length} route{routes.length > 1 ? "s" : ""})
                </h2>

                <div className="space-y-6">
                  {routes.map((route, index) => (
                    <div key={route.id} className="border border-border rounded-lg p-6 relative">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-foreground flex items-center">
                          <div className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: route.color }}></div>
                          <TruckIcon className="w-5 h-5 mr-2" />
                          Route {index + 1}
                        </h3>
                        <button
                          onClick={() => deleteRoute(route.id)}
                          className="text-destructive hover:text-destructive/80 p-1"
                          title="Delete Route"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Route Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-muted p-4 rounded-md">
                          <p className="text-sm text-muted-foreground">Distance</p>
                          <p className="text-lg font-semibold text-foreground">{route.distance || "N/A"}</p>
                        </div>
                        <div className="bg-muted p-4 rounded-md">
                          <p className="text-sm text-muted-foreground">Duration</p>
                          <p className="text-lg font-semibold text-foreground">{route.duration || "N/A"}</p>
                        </div>
                        <div className="bg-muted p-4 rounded-md">
                          <p className="text-sm text-muted-foreground">Route Type</p>
                          <p className="text-lg font-semibold text-foreground">Driving</p>
                        </div>
                        <div className="bg-muted p-4 rounded-md">
                          <p className="text-sm text-muted-foreground">Status</p>
                          <p className="text-lg font-semibold text-green-600">Active</p>
                        </div>
                      </div>

                      {/* Source and Destination */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md border border-green-200 dark:border-green-800">
                          <h4 className="font-medium text-green-800 dark:text-green-200 mb-2 flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                            Source
                          </h4>
                          <p className="text-green-700 dark:text-green-300 font-medium">{route.source?.name}</p>
                          <p className="text-sm text-green-600 dark:text-green-400">
                            Lat: {route.source?.lat}, Lng: {route.source?.lng}
                          </p>
                        </div>

                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-200 dark:border-red-800">
                          <h4 className="font-medium text-red-800 dark:text-red-200 mb-2 flex items-center">
                            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                            Destination
                          </h4>
                          <p className="text-red-700 dark:text-red-300 font-medium">{route.destination?.name}</p>
                          <p className="text-sm text-red-600 dark:text-red-400">
                            Lat: {route.destination?.lat}, Lng: {route.destination?.lng}
                          </p>
                        </div>
                      </div>

                      {/* Turn-by-turn directions */}
                      {route.steps && route.steps.length > 0 && (
                        <div>
                          <h4 className="font-medium text-foreground mb-3">Turn-by-turn Directions</h4>
                          <div className="bg-muted p-4 rounded-md">
                            <ol className="space-y-2">
                              {route.steps.map((step, stepIndex) => (
                                <li key={stepIndex} className="flex items-start">
                                  <span
                                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5 text-white"
                                    style={{ backgroundColor: route.color }}
                                  >
                                    {stepIndex + 1}
                                  </span>
                                  <span className="text-sm text-foreground">{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Route Form Modal */}
      {showRouteForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Add New Route {routes.length > 0 && `(Route ${routes.length + 1})`}
            </h2>

            {routeError && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive text-destructive rounded-md text-sm">
                {routeError}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault()
                generateRoute()
              }}
              className="space-y-4"
            >
              {/* Source */}
              <div className="border border-border rounded-md p-4">
                <h3 className="font-medium text-foreground mb-3 text-green-700 dark:text-green-300">
                  📍 Source Location
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Location Name</label>
                    <input
                      type="text"
                      value={routeForm.sourceName}
                      onChange={(e) => setRouteForm({ ...routeForm, sourceName: e.target.value })}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="e.g., Warehouse A"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Latitude <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={routeForm.sourceLat}
                        onChange={(e) => setRouteForm({ ...routeForm, sourceLat: e.target.value })}
                        className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="40.7128"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Longitude <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={routeForm.sourceLng}
                        onChange={(e) => setRouteForm({ ...routeForm, sourceLng: e.target.value })}
                        className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="-74.0060"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Destination */}
              <div className="border border-border rounded-md p-4">
                <h3 className="font-medium text-foreground mb-3 text-red-700 dark:text-red-300">
                  🎯 Destination Location
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Location Name</label>
                    <input
                      type="text"
                      value={routeForm.destName}
                      onChange={(e) => setRouteForm({ ...routeForm, destName: e.target.value })}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="e.g., Customer Location"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Latitude <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={routeForm.destLat}
                        onChange={(e) => setRouteForm({ ...routeForm, destLat: e.target.value })}
                        className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="40.7589"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Longitude <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={routeForm.destLng}
                        onChange={(e) => setRouteForm({ ...routeForm, destLng: e.target.value })}
                        className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="-74.0059"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowRouteForm(false)
                    resetForm()
                  }}
                  disabled={routeLoading}
                  className="px-4 py-2 text-muted-foreground border border-border rounded-md hover:bg-muted disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={routeLoading}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {routeLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                      Calculating...
                    </div>
                  ) : (
                    "Calculate Route"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
