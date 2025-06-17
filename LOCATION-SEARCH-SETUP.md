# Setting Up Location Search and AI Analysis

This guide will help you configure and run the location search and AI-powered analysis features in the AirSense application.

## Prerequisites

1. **OpenWeather API Key** - For location search and weather data
2. **Google Gemini API Key** - For AI-powered environmental analysis

## Setup Instructions

### 1. Get Required API Keys

- **OpenWeather API Key**: 
  - Sign up at [OpenWeather](https://openweathermap.org/api)
  - Create an API key with access to:
    - Current Weather Data API
    - Geocoding API

- **Google Gemini API Key**:
  - Visit [Google AI Studio](https://ai.google.dev/)
  - Create a new API key for the Gemini API

### 2. Configure Environment Variables

In the `server` directory, create or edit the `.env` file:

```
# MongoDB Configuration (if using MongoDB)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=environmental_data
MONGODB_COLLECTION=datasets

# API Keys
OPENWEATHER_API_KEY=your_openweather_api_key
GEMINI_API_KEY=your_gemini_api_key

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 3. Test the Gemini API Configuration

Run the test script to verify your Gemini API key works:

```bash
cd server
node test-gemini.js
```

If you see errors, the script will provide guidance on what might be wrong.

### 4. Start the Application

Run the development server:

```bash
cd ..
npm run dev
```

Or, use the provided batch files:

```
start-dev.bat
```

## Troubleshooting

### Gemini API Not Working

If you see "AI service unavailable" errors:

1. Check that your Gemini API key is valid and properly set in `.env`
2. Run the test script to diagnose issues: `node server/test-gemini.js`
3. The application has a fallback mode that will still work without AI analysis

### Location Search Not Working

1. Verify your OpenWeather API key is valid and properly set in `.env`
2. Check the server logs for any API-related errors
3. Ensure the server is running and accessible from the frontend

## Using the Location Search Feature

1. Navigate to the Location Search page
2. Enter a location name (city, region, etc.)
3. Click on a search result to view environmental data and analysis
4. The analysis will show real-time data when available, along with AI-powered insights

## Notes

- The AI analysis depends on the Gemini API availability
- If AI analysis fails, the application will still show environmental data
- Real-time data is fetched from OpenWeather and OpenAQ APIs when available
