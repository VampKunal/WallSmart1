export async function GET() {
  try {
    const envCheck = {
      // API Keys
      HUGGINGFACE_API_KEY: !!process.env.HUGGINGFACE_API_KEY,
      OPENROUTER_API_KEY: !!process.env.OPENROUTER_API_KEY,
      NEXT_PUBLIC_MAPBOX_TOKEN: !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN,

      // Database
      DATABASE_URL: !!process.env.DATABASE_URL,
    }

    const missingVars = Object.entries(envCheck)
      .filter(([key, exists]) => !exists)
      .map(([key]) => key)

    // Also show actual values for debugging (only first few characters for security)
    const envValues = {
      HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY?.substring(0, 10) + "...",
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY?.substring(0, 10) + "...",
      NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.substring(0, 10) + "...",
      DATABASE_URL: process.env.DATABASE_URL?.substring(0, 20) + "...",
    }

    return Response.json({
      success: missingVars.length === 0,
      environmentVariables: envCheck,
      missingVariables: missingVars,
      sampleValues: envValues,
      message:
        missingVars.length === 0
          ? "All required environment variables are present"
          : `Missing ${missingVars.length} environment variables`,
      note: "Firebase variables removed since authentication was disabled",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Environment check error:", error)
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
