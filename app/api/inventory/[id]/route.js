import { updateInventoryItem, deleteInventoryItem, testConnection } from "../../../lib/neon"

export async function PUT(request, { params }) {
  try {
    console.log("PUT /api/inventory/[id] - Starting request for ID:", params.id)

    const body = await request.json()
    console.log("PUT /api/inventory/[id] - Request body:", body)

    const id = Number.parseInt(params.id, 10)

    if (isNaN(id)) {
      console.log("PUT /api/inventory/[id] - Invalid ID:", params.id)
      return Response.json({ error: "Invalid item ID" }, { status: 400 })
    }

    // Validate required fields
    if (!body.name || body.quantity === undefined || !body.unit) {
      console.log("PUT /api/inventory/[id] - Validation failed: missing required fields")
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

    console.log("PUT /api/inventory/[id] - Updating item with data:", itemData)
    const item = await updateInventoryItem(id, itemData)

    console.log("PUT /api/inventory/[id] - Item updated successfully:", item)
    return Response.json(item)
  } catch (error) {
    console.error("PUT /api/inventory/[id] - Error:", error)

    if (error.message.includes("Item not found")) {
      return Response.json({ error: "Item not found" }, { status: 404 })
    }

    return Response.json(
      {
        error: "Failed to update inventory item",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    console.log("DELETE /api/inventory/[id] - Starting request for ID:", params.id)

    const id = Number.parseInt(params.id, 10)

    if (isNaN(id)) {
      console.log("DELETE /api/inventory/[id] - Invalid ID:", params.id)
      return Response.json({ error: "Invalid item ID" }, { status: 400 })
    }

    // Test connection first
    await testConnection()

    console.log("DELETE /api/inventory/[id] - Deleting item with ID:", id)
    const result = await deleteInventoryItem(id)

    console.log("DELETE /api/inventory/[id] - Item deleted successfully:", result)
    return Response.json(result)
  } catch (error) {
    console.error("DELETE /api/inventory/[id] - Error:", error)

    if (error.message.includes("Item not found")) {
      return Response.json({ error: "Item not found" }, { status: 404 })
    }

    return Response.json(
      {
        error: "Failed to delete inventory item",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
