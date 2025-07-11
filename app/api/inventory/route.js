import { getInventoryItems, createInventoryItem, seedSampleData, testConnection } from "../../lib/neon"

export async function GET() {
  try {
    console.log("GET /api/inventory - Starting request")

    // Test connection first
    await testConnection()

    const items = await getInventoryItems()
    console.log(`GET /api/inventory - Retrieved ${items.length} items`)

    // If no items exist, seed with sample data
    if (items.length === 0) {
      console.log("No items found, seeding sample data...")
      await seedSampleData()
      const newItems = await getInventoryItems()
      console.log(`GET /api/inventory - After seeding: ${newItems.length} items`)
      return Response.json(newItems)
    }

    return Response.json(items)
  } catch (error) {
    console.error("GET /api/inventory - Error:", error)
    return Response.json(
      {
        error: "Failed to fetch inventory items",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function POST(request) {
  try {
    console.log("POST /api/inventory - Starting request")

    const body = await request.json()
    console.log("POST /api/inventory - Request body:", body)

    // Validate required fields
    if (!body.name || body.quantity === undefined || !body.unit) {
      console.log("POST /api/inventory - Validation failed: missing required fields")
      return Response.json(
        {
          error: "Missing required fields",
          details: "name, quantity, and unit are required",
          received: body,
        },
        { status: 400 },
      )
    }

    // Test connection first
    await testConnection()

    const itemData = {
      name: body.name.trim(),
      quantity: Number.parseInt(body.quantity, 10),
      unit: body.unit.trim(),
      lastRestocked: body.lastRestocked || null,
      avgRestockTime: body.avgRestockTime ? Number.parseInt(body.avgRestockTime, 10) : null,
    }

    console.log("POST /api/inventory - Creating item with data:", itemData)
    const item = await createInventoryItem(itemData)

    console.log("POST /api/inventory - Item created successfully:", item)
    return Response.json(item, { status: 201 })
  } catch (error) {
    console.error("POST /api/inventory - Error:", error)
    return Response.json(
      {
        error: "Failed to create inventory item",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
