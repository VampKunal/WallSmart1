import { neon } from "@neondatabase/serverless"

let sql = null

export function db() {
  if (sql) return sql

  const url = process.env.DATABASE_URL
  if (!url) {
    console.error("DATABASE_URL environment variable is not set")
    console.error(
      "Available env vars:",
      Object.keys(process.env).filter((key) => key.includes("DATABASE")),
    )
    throw new Error("DATABASE_URL environment variable is required")
  }

  console.log("Database URL found, initializing connection...")
  sql = neon(url)
  return sql
}

export async function initializeDatabase() {
  try {
    const sql = db()
    console.log("Creating inventory_items table...")

    await sql`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        unit VARCHAR(50) NOT NULL DEFAULT 'units',
        last_restocked DATE,
        avg_restock_time INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    console.log("Database table created/verified successfully")
    return true
  } catch (error) {
    console.error("Database initialization error:", error)
    throw new Error(`Database initialization failed: ${error.message}`)
  }
}

export async function getInventoryItems() {
  try {
    const sql = db()
    console.log("Fetching inventory items...")

    // Ensure table exists
    await initializeDatabase()

    const items = await sql`
      SELECT 
        id,
        name,
        quantity,
        unit,
        last_restocked,
        avg_restock_time,
        created_at,
        updated_at
      FROM inventory_items 
      ORDER BY name ASC
    `

    console.log(`Found ${items.length} inventory items`)
    return items
  } catch (error) {
    console.error("Error fetching inventory items:", error)
    throw new Error(`Failed to fetch inventory items: ${error.message}`)
  }
}

export async function createInventoryItem(item) {
  try {
    const sql = db()
    console.log("Creating inventory item:", item.name)

    // Ensure table exists
    await initializeDatabase()

    // Validate input
    if (!item.name || item.quantity === undefined || !item.unit) {
      throw new Error("Missing required fields: name, quantity, and unit")
    }

    const result = await sql`
      INSERT INTO inventory_items (
        name, 
        quantity, 
        unit, 
        last_restocked, 
        avg_restock_time
      )
      VALUES (
        ${item.name}, 
        ${item.quantity}, 
        ${item.unit}, 
        ${item.lastRestocked || null}, 
        ${item.avgRestockTime || null}
      )
      RETURNING *
    `

    console.log("Item created successfully:", result[0])
    return result[0]
  } catch (error) {
    console.error("Error creating inventory item:", error)
    throw new Error(`Failed to create inventory item: ${error.message}`)
  }
}

export async function updateInventoryItem(id, item) {
  try {
    const sql = db()
    console.log("Updating inventory item:", id)

    // Ensure table exists
    await initializeDatabase()

    // Validate input
    if (!item.name || item.quantity === undefined || !item.unit) {
      throw new Error("Missing required fields: name, quantity, and unit")
    }

    const result = await sql`
      UPDATE inventory_items 
      SET 
        name = ${item.name}, 
        quantity = ${item.quantity}, 
        unit = ${item.unit}, 
        last_restocked = ${item.lastRestocked || null}, 
        avg_restock_time = ${item.avgRestockTime || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      throw new Error("Item not found")
    }

    console.log("Item updated successfully:", result[0])
    return result[0]
  } catch (error) {
    console.error("Error updating inventory item:", error)
    throw new Error(`Failed to update inventory item: ${error.message}`)
  }
}

export async function deleteInventoryItem(id) {
  try {
    const sql = db()
    console.log("Deleting inventory item:", id)

    // Ensure table exists
    await initializeDatabase()

    const result = await sql`
      DELETE FROM inventory_items 
      WHERE id = ${id}
      RETURNING id
    `

    if (result.length === 0) {
      throw new Error("Item not found")
    }

    console.log("Item deleted successfully:", id)
    return { success: true, id: result[0].id }
  } catch (error) {
    console.error("Error deleting inventory item:", error)
    throw new Error(`Failed to delete inventory item: ${error.message}`)
  }
}

export async function seedSampleData() {
  try {
    const sql = db()
    console.log("Checking for existing data...")

    // Check if data already exists
    const existingItems = await sql`SELECT COUNT(*) as count FROM inventory_items`
    const count = Number.parseInt(existingItems[0].count)

    if (count > 0) {
      console.log(`Sample data already exists (${count} items)`)
      return
    }

    console.log("Seeding sample data...")
    const sampleItems = [
      {
        name: "Paper Towels",
        quantity: 25,
        unit: "rolls",
        lastRestocked: "2024-01-15",
        avgRestockTime: 14,
      },
      {
        name: "Cleaning Solution",
        quantity: 8,
        unit: "bottles",
        lastRestocked: "2024-01-10",
        avgRestockTime: 21,
      },
      {
        name: "Office Supplies",
        quantity: 45,
        unit: "packs",
        lastRestocked: "2024-01-20",
        avgRestockTime: 30,
      },
      {
        name: "Hand Sanitizer",
        quantity: 12,
        unit: "bottles",
        lastRestocked: "2024-01-18",
        avgRestockTime: 18,
      },
      {
        name: "Printer Paper",
        quantity: 3,
        unit: "reams",
        lastRestocked: "2024-01-05",
        avgRestockTime: 25,
      },
    ]

    for (const item of sampleItems) {
      await createInventoryItem(item)
      console.log(`✓ Added sample item: ${item.name}`)
    }

    console.log("Sample data seeded successfully!")
  } catch (error) {
    console.error("Error seeding sample data:", error)
    throw new Error(`Failed to seed sample data: ${error.message}`)
  }
}

// Test database connection
export async function testConnection() {
  try {
    const sql = db()
    const result = await sql`SELECT 1 as test`
    console.log("Database connection test successful")
    return true
  } catch (error) {
    console.error("Database connection test failed:", error)
    throw error
  }
}
