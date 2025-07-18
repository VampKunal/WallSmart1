# WALLSMART1- Inventory Management Dashboard

A full-stack inventory management dashboard built with Next.js, featuring AI-powered insights, route optimization, and real-time analytics.

## Features

- 🔐 **Firebase Authentication** - Secure admin login/logout
- 🗄️ **NeonDB Integration** - PostgreSQL database for inventory storage
- 📊 **CRUD Operations** - Complete inventory management
- 🤖 **AI Predictions** - Hugging Face API for restock predictions
- 💬 **Smart Reports** - OpenRouter LLM for inventory insights
- 🗺️ **Route Optimization** - Mapbox integration for delivery routes
- 📱 **Responsive Design** - Mobile-friendly Walmart-style UI
- 🌙 **Dark/Light Mode** - Theme toggle support

## Setup Instructions

### 1. Clone and Install

\`\`\`bash
git clone <repository-url>
cd greenstock-ai-dashboard
npm install
\`\`\`

### 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your API keys:

\`\`\`bash
cp .env.local.example .env.local
\`\`\`

Required API keys:
- Firebase configuration
- NeonDB connection string
- Hugging Face API key
- OpenRouter API key
- Mapbox access token

### 3. Database Setup

Initialize the database with sample data:

\`\`\`bash
npm run init-db
\`\`\`

### 4. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Visit `http://localhost:3000` to access the dashboard.

## Project Structure

\`\`\`
app/
├── api/                 # API routes
│   ├── inventory/       # CRUD operations
│   ├── predict/         # AI predictions
│   ├── reports/         # Smart reports & chat
│   └── routes/          # Route optimization
├── components/          # Reusable components
├── lib/                 # Utilities and database
├── dashboard/           # Dashboard page
├── inventory/           # Inventory management
├── reports/             # Analytics & AI chat
└── routes/              # Delivery routes
\`\`\`

## Key Features Explained

### Authentication
- Firebase email/password authentication
- Protected routes with automatic redirects
- Secure session management

### Database Operations
- NeonDB PostgreSQL integration
- CRUD operations for inventory items
- Optimized queries with connection pooling

### AI Integration
- **Restock Predictions**: Hugging Face API for demand forecasting
- **Smart Reports**: OpenRouter LLM for inventory insights
- **Chat Assistant**: Interactive Q&A about inventory data

### Route Optimization
- Mapbox integration for delivery route planning
- Interactive map with markers and paths
- Distance and time calculations

### Security Best Practices
- API keys stored server-side only
- Environment variable validation
- Input sanitization and validation
- CORS protection

## API Endpoints

- `GET /api/inventory` - Fetch all inventory items
- `POST /api/inventory` - Create new item
- `PUT /api/inventory/[id]` - Update item
- `DELETE /api/inventory/[id]` - Delete item
- `GET /api/inventory/stats` - Get inventory statistics
- `POST /api/predict/restock` - Predict restock timing
- `POST /api/reports/smart-report` - Generate AI report
- `POST /api/reports/chat` - Chat with AI assistant
- `POST /api/routes/optimize` - Optimize delivery routes

## Deployment

1. Build the application:
\`\`\`bash
npm run build
\`\`\`

2. Deploy to Vercel:
\`\`\`bash
vercel deploy
\`\`\`

3. Set environment variables in Vercel dashboard

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details
