export async function POST(request) {
  try {
    const body = await request.json()
    const { itemId, currentQuantity, avgRestockTime } = body

    // Actual Hugging Face API call
    try {
      const response = await fetch("https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: `Predict restock timing for item with current quantity: ${currentQuantity}, average restock time: ${avgRestockTime} days. Provide recommendation.`,
          parameters: {
            max_length: 100,
            temperature: 0.7,
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Hugging Face API error")
      }

      const data = await response.json()

      const prediction = {
        prediction:
          data[0]?.generated_text ||
          `Based on current quantity (${currentQuantity}) and average restock time (${avgRestockTime} days), recommend restocking in ${Math.max(1, avgRestockTime - Math.floor(currentQuantity / 5))} days.`,
        confidence: 0.85,
        suggestedQuantity: Math.max(50, currentQuantity * 2),
      }

      return Response.json(prediction)
    } catch (apiError) {
      console.log("Using fallback prediction due to API error:", apiError)

      // Fallback prediction logic
      const prediction = {
        prediction: `Based on current quantity (${currentQuantity}) and average restock time (${avgRestockTime} days), recommend restocking in ${Math.max(1, avgRestockTime - Math.floor(currentQuantity / 5))} days.`,
        confidence: 0.75,
        suggestedQuantity: Math.max(50, currentQuantity * 2),
      }

      return Response.json(prediction)
    }
  } catch (error) {
    console.error("Error in POST /api/predict/restock:", error)
    return Response.json({ error: "Failed to predict restock" }, { status: 500 })
  }
}
