import { testConnection, initializeDatabase, getInventoryItems } from "../../lib/neon"

export async function GET() {
  try {
    console.log("Testing database connection...")

    // Test basic connection
    await testConnection()
    console.log("✓ Database connection successful")

    // Test table creation
    await initializeDatabase()
    console.log("✓ Database table initialized")

    // Test data retrieval
    const items = await getInventoryItems()
    console.log(`✓ Retrieved ${items.length} items`)

    return Response.json({
      success: true,
      message: "Database connection and operations successful",
      itemCount: items.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Database test failed:", error)
    return Response.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
