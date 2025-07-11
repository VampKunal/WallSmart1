import { getInventoryItems } from "../../../lib/neon"

export async function POST(request) {
  try {
    const body = await request.json()
    const { message } = body

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return Response.json({ error: "Message is required" }, { status: 400 })
    }

    const trimmedMessage = message.trim()

    let items = []
    let inventoryContext = {
      totalItems: 0,
      items: [],
    }

    try {
      items = await getInventoryItems()
      inventoryContext = {
        totalItems: items.length,
        items: items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          lastRestocked: item.last_restocked,
        })),
      }
    } catch (dbError) {
      console.error("Database error in chat:", dbError)
      // Continue with empty inventory context
    }

    try {
      // Actual OpenRouter API call
      const apiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
              content: `You are a highly intelligent AI assistant for inventory management and general business questions. You have access to inventory data: ${JSON.stringify(inventoryContext)}. 

You can help with:
- Inventory analysis and management
- Business advice and strategies
- General questions about operations
- Mathematical calculations
- Data analysis and insights
- Planning and optimization
- Technology and software questions
- Market trends and business intelligence

Be conversational, helpful, and provide detailed answers. If asked about inventory, use the provided data. For other questions, use your general knowledge to provide comprehensive, accurate responses.`,
            },
            {
              role: "user",
              content: trimmedMessage,
            },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      })

      if (!apiResponse.ok) {
        throw new Error(`OpenRouter API error: ${apiResponse.status} ${apiResponse.statusText}`)
      }

      const data = await apiResponse.json()

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("Invalid API response format")
      }

      const response = data.choices[0].message.content

      return Response.json({ response })
    } catch (apiError) {
      console.log("Using enhanced fallback response due to API error:", apiError.message)

      // Enhanced fallback logic for all types of questions
      let response = "I'm here to help with your questions!"

      const lowerMessage = trimmedMessage.toLowerCase()

      // Inventory-related questions
      if (lowerMessage.includes("low stock") || lowerMessage.includes("running low")) {
        const lowStockItems = items.filter((item) => item.quantity < 10)
        response =
          lowStockItems.length > 0
            ? `You have ${lowStockItems.length} items with low stock: ${lowStockItems.map((item) => item.name).join(", ")}. I recommend restocking these items soon.`
            : "Great news! No items are currently low in stock (below 10 units)."
      } else if (lowerMessage.includes("total") || lowerMessage.includes("how many")) {
        if (lowerMessage.includes("item")) {
          const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
          response = `You currently have ${items.length} different items in your inventory with a total quantity of ${totalQuantity} units across all items.`
        } else {
          response =
            "I can help you calculate totals! Are you asking about total inventory items, quantities, or something else specific?"
        }
      } else if (lowerMessage.includes("restock") || lowerMessage.includes("order")) {
        const lowStockItems = items.filter((item) => item.quantity < 10)
        if (lowStockItems.length > 0) {
          response = `I recommend restocking these ${lowStockItems.length} items: ${lowStockItems.map((item) => `${item.name} (${item.quantity} ${item.unit} remaining)`).join(", ")}. Consider setting up automated reorder points at 15 units.`
        } else {
          response =
            "Your inventory levels look good! No immediate restocking needed. Consider reviewing items with quantities below 20 units for proactive restocking."
        }
      }
      // Business and general questions
      else if (lowerMessage.includes("business") || lowerMessage.includes("strategy")) {
        response =
          "I can help with business strategy! For inventory management, consider implementing just-in-time ordering, ABC analysis for prioritizing items, and automated reorder points. What specific business aspect would you like to discuss?"
      } else if (lowerMessage.includes("profit") || lowerMessage.includes("revenue")) {
        response =
          "To improve profitability in inventory management: 1) Reduce carrying costs by optimizing stock levels, 2) Minimize stockouts to avoid lost sales, 3) Negotiate better supplier terms, 4) Implement demand forecasting. What specific profit aspect interests you?"
      } else if (lowerMessage.includes("cost") || lowerMessage.includes("expense")) {
        response =
          "Inventory costs include: holding costs (storage, insurance, depreciation), ordering costs (processing, shipping), and stockout costs (lost sales, rush orders). I can help analyze your cost structure - what specific costs are you concerned about?"
      } else if (lowerMessage.includes("forecast") || lowerMessage.includes("predict")) {
        response =
          "For demand forecasting, consider: historical sales data, seasonal trends, market conditions, and lead times. I can help analyze your inventory patterns. Would you like me to look at your current stock levels for insights?"
      } else if (lowerMessage.includes("supplier") || lowerMessage.includes("vendor")) {
        response =
          "Supplier management tips: diversify your supplier base, negotiate payment terms, establish clear quality standards, and maintain good relationships. Regular performance reviews help ensure reliability. What supplier challenges are you facing?"
      } else if (lowerMessage.includes("technology") || lowerMessage.includes("software")) {
        response =
          "Modern inventory management benefits from: automated reorder systems, barcode/RFID tracking, real-time analytics, and AI-powered demand forecasting. Integration with ERP systems streamlines operations. What technology aspects interest you?"
      } else if (lowerMessage.includes("market") || lowerMessage.includes("trend")) {
        response =
          "Current inventory trends include: AI-driven optimization, sustainability focus, omnichannel fulfillment, and real-time visibility. Supply chain resilience is increasingly important. What market trends are you curious about?"
      } else if (lowerMessage.includes("calculate") || lowerMessage.includes("math")) {
        response =
          "I can help with calculations! Common inventory formulas include: EOQ (Economic Order Quantity), safety stock calculations, inventory turnover ratios, and carrying cost analysis. What would you like me to calculate?"
      } else if (lowerMessage.includes("optimize") || lowerMessage.includes("improve")) {
        response =
          "Optimization strategies: 1) ABC analysis to prioritize items, 2) Set optimal reorder points, 3) Reduce lead times, 4) Implement cycle counting, 5) Use demand forecasting. What area would you like to optimize first?"
      } else if (lowerMessage.includes("help") || lowerMessage.includes("what can you do")) {
        response = `I'm a comprehensive AI assistant! I can help with:

📦 Inventory Management: stock analysis, reorder recommendations, forecasting
💼 Business Strategy: cost optimization, supplier management, market insights  
📊 Data Analysis: calculations, trends, performance metrics
🔧 Technology: software recommendations, automation ideas
📈 Planning: demand forecasting, capacity planning, growth strategies

You have ${items.length} items in your inventory. What would you like to explore?`
      } else if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
        response = `Hello! I'm your intelligent business assistant. I can help with inventory management, business strategy, calculations, and much more. You currently have ${items.length} items in your system. What can I help you with today?`
      } else if (lowerMessage.includes("what") || lowerMessage.includes("how") || lowerMessage.includes("why")) {
        // Handle question words more intelligently
        if (lowerMessage.includes("what is") || lowerMessage.includes("what are")) {
          response = `I can explain concepts, analyze data, or provide insights! Your question "${trimmedMessage}" is interesting. Could you be more specific? I can help with inventory topics, business concepts, calculations, or general knowledge.`
        } else if (lowerMessage.includes("how to") || lowerMessage.includes("how can")) {
          response = `I love helping with "how-to" questions! Whether it's about inventory optimization, business processes, or problem-solving strategies, I'm here to guide you. What specific process or goal are you trying to achieve?`
        } else if (lowerMessage.includes("why")) {
          response = `Great question! I can help explain the reasoning behind business decisions, inventory strategies, or market dynamics. What specific "why" are you curious about?`
        } else {
          response = `I understand you're asking "${trimmedMessage}". I can provide insights on inventory management, business strategy, market analysis, or general topics. Could you provide a bit more context so I can give you the most helpful answer?`
        }
      } else {
        // Intelligent general response
        response = `That's an interesting question about "${trimmedMessage}". I'm designed to help with a wide range of topics including:

• Inventory and supply chain management
• Business strategy and operations  
• Data analysis and calculations
• Technology and automation
• Market trends and insights

Could you provide more details about what you'd like to know? I'm here to give you comprehensive, helpful answers!`
      }

      return Response.json({ response })
    }
  } catch (error) {
    console.error("Error in POST /api/reports/chat:", error)
    return Response.json(
      {
        error: "I'm sorry, I encountered an error while processing your request. Please try again later.",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
