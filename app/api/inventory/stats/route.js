import { getInventoryItems, testConnection } from "../../../lib/neon"

export async function GET() {
  try {
    console.log("GET /api/inventory/stats - Starting request")

    // Test connection first
    await testConnection()

    const items = await getInventoryItems()
    console.log(`GET /api/inventory/stats - Retrieved ${items.length} items`)

    const stats = {
      totalItems: items.length,
      lowStockItems: items.filter((item) => item.quantity < 10).length,
      criticalStockItems: items.filter((item) => item.quantity < 5).length,
      avgRestockTime:
        items.length > 0 ? items.reduce((acc, item) => acc + (item.avg_restock_time || 0), 0) / items.length : 0,
      totalQuantity: items.reduce((acc, item) => acc + item.quantity, 0),
      recentActivity: [
        { action: "System initialized", time: "Just now" },
        { action: "Database connection established", time: "1 minute ago" },
        { action: "Inventory data loaded", time: "2 minutes ago" },
      ],
    }

    console.log("GET /api/inventory/stats - Stats calculated:", stats)
    return Response.json(stats)
  } catch (error) {
    console.error("GET /api/inventory/stats - Error:", error)
    return Response.json(
      {
        error: "Failed to fetch inventory stats",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
