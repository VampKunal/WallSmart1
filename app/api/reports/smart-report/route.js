import { getInventoryItems } from "../../../lib/neon"

export async function POST() {
  try {
    const items = await getInventoryItems()

    const inventoryData = {
      totalItems: items.length,
      lowStockItems: items.filter((item) => item.quantity < 10),
      criticalStockItems: items.filter((item) => item.quantity < 5),
      avgQuantity: items.reduce((acc, item) => acc + item.quantity, 0) / items.length || 0,
      totalValue: items.reduce((acc, item) => acc + item.quantity, 0),
      itemsList: items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        lastRestocked: item.last_restocked,
        avgRestockTime: item.avg_restock_time,
      })),
    }

    // Calculate additional metrics
    const stockDistribution = {
      wellStocked: items.filter((item) => item.quantity >= 20).length,
      moderateStock: items.filter((item) => item.quantity >= 10 && item.quantity < 20).length,
      lowStock: inventoryData.lowStockItems.length,
      criticalStock: inventoryData.criticalStockItems.length,
    }

    try {
      // Actual OpenRouter API call
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "GreenStock AI Dashboard",
        },
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "You are an expert inventory management analyst. Provide comprehensive, actionable insights with specific recommendations. Use emojis and clear formatting for better readability.",
            },
            {
              role: "user",
              content: `Analyze this inventory data and provide a comprehensive report with insights, recommendations, and alerts. Format it professionally with emojis and clear sections.

Inventory Overview:
- Total Items: ${inventoryData.totalItems}
- Total Units: ${inventoryData.totalValue}
- Average Quantity per Item: ${Math.round(inventoryData.avgQuantity)}

Stock Distribution:
- Well Stocked (≥20 units): ${stockDistribution.wellStocked} items
- Moderate Stock (10-19 units): ${stockDistribution.moderateStock} items  
- Low Stock (5-9 units): ${stockDistribution.lowStock} items
- Critical Stock (<5 units): ${stockDistribution.criticalStock} items

Detailed Items:
${inventoryData.itemsList
  .map(
    (item) =>
      `• ${item.name}: ${item.quantity} ${item.unit}${item.lastRestocked ? ` (Last restocked: ${item.lastRestocked})` : ""}${item.avgRestockTime ? ` (Avg restock: ${item.avgRestockTime} days)` : ""}`,
  )
  .join("\n")}

Provide:
1. Executive Summary
2. Critical Alerts
3. Stock Analysis
4. Actionable Recommendations
5. Performance Metrics
6. Next Steps

Make it detailed and actionable for inventory management decisions.`,
            },
          ],
          max_tokens: 800,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`)
      }

      const data = await response.json()

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("Invalid API response")
      }

      const report = data.choices[0].message.content

      return Response.json({ report })
    } catch (apiError) {
      console.log("Using enhanced fallback report due to API error:", apiError.message)

      // ---------- enhanced fallback report (no template-syntax errors) ----------
      const criticalAlerts = []
      if (inventoryData.criticalStockItems.length > 0) {
        criticalAlerts.push(`🚨 CRITICAL: ${inventoryData.criticalStockItems.length} item(s) below 5 units`)
      }
      if (inventoryData.lowStockItems.length > 0) {
        criticalAlerts.push(`⚠️  WARNING: ${inventoryData.lowStockItems.length} item(s) need restocking`)
      }

      const performanceScore = Math.round(
        ((stockDistribution.wellStocked + stockDistribution.moderateStock) / inventoryData.totalItems) * 100,
      )

      const mockReportLines = [
        "📊 GREENSTOCK AI – INVENTORY ANALYSIS REPORT",
        `Generated: ${new Date().toLocaleString()}`,
        "────────────────────────────────────────────",
        "🎯 EXECUTIVE SUMMARY",
        `• Portfolio Health Score: ${performanceScore}%`,
        `• Total Inventory Items: ${inventoryData.totalItems}`,
        `• Total Units in Stock: ${inventoryData.totalValue}`,
        `• Average Stock per Item: ${Math.round(inventoryData.avgQuantity)} units`,
        "────────────────────────────────────────────",
        criticalAlerts.length ? criticalAlerts.join("\n") : "✅ NO CRITICAL ALERTS – all items adequately stocked.",
        "────────────────────────────────────────────",
        "📈 STOCK DISTRIBUTION",
        `• Well-stocked (≥20): ${stockDistribution.wellStocked} item(s)`,
        `• Moderate (10-19): ${stockDistribution.moderateStock} item(s)`,
        `• Low (5-9): ${stockDistribution.lowStock} item(s)`,
        `• Critical (<5): ${stockDistribution.criticalStock} item(s)`,
        "────────────────────────────────────────────",
        "⚡ IMMEDIATE ACTIONS",
        ...inventoryData.criticalStockItems.map((it) => `🔴 Restock ${it.name} (only ${it.quantity} ${it.unit} left)`),
        ...(!inventoryData.criticalStockItems.length && inventoryData.lowStockItems.length
          ? inventoryData.lowStockItems
              .slice(0, 5)
              .map((it) => `🟡 Plan restock for ${it.name} (${it.quantity} ${it.unit} remaining)`)
          : []),
        "────────────────────────────────────────────",
        "💡 STRATEGIC RECOMMENDATIONS",
        "• Set reorder points at 15 units for fast-moving items",
        "• Enable automated alerts for items below 10 units",
        "• Review supplier lead-times quarterly",
        "────────────────────────────────────────────",
        "📋 DETAILED ITEM STATUS",
        ...inventoryData.itemsList.map((it) => {
          const status =
            it.quantity < 5 ? "🔴 CRITICAL" : it.quantity < 10 ? "🟡 LOW" : it.quantity < 20 ? "🟠 MODERATE" : "🟢 OK"
          return `${status}  ${it.name}: ${it.quantity} ${it.unit}${
            it.lastRestocked ? ` | Last restocked: ${it.lastRestocked}` : ""
          }`
        }),
        "────────────────────────────────────────────",
        "🎯 NEXT STEPS",
        "1. Address critical stock items immediately",
        "2. Schedule restocking for low-stock items",
        "3. Review and optimise reorder points",
        "4. Set up automated monitoring alerts",
        "────────────────────────────────────────────",
        "Generated by GreenStock AI (fallback offline mode)",
      ]

      const mockReport = mockReportLines.join("\n")

      return Response.json({ report: mockReport })
    }
  } catch (error) {
    console.error("Error in POST /api/reports/smart-report:", error)
    return Response.json(
      {
        error: "Failed to generate smart report. Please try again later.",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
