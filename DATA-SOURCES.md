# Real-time Environmental Data Sources

AirSense is now configured to use multiple data sources for real-time environmental data, enhancing reliability and data availability.

## Supported Data Sources

### Primary Sources
- **OpenWeather API**: Weather data, geocoding, and location information
- **OpenAQ API**: Air quality data from monitoring stations worldwide

### Alternative Sources (Optional)
- **World Air Quality Index (WAQI)**: Alternative source for air quality data
- **Visual Crossing**: Alternative source for weather data
- **BigDataCloud**: Alternative source for geocoding and location information

## Setup Instructions

1. Create a `.env` file in the `server` directory by copying `.env.example`
2. Add your OpenWeather API key (required)
3. Optionally add keys for the alternative data sources:
   ```
   # Required API keys
   OPENWEATHER_API_KEY=your_key_here
   
   # Alternative data source API keys (optional but recommended)
   WAQI_API_KEY=your_key_here
   VISUALCROSSING_API_KEY=your_key_here
   BIGDATACLOUD_API_KEY=your_key_here
   ```

## How to Obtain API Keys

### OpenWeather API
1. Sign up at [OpenWeather](https://openweathermap.org/)
2. Subscribe to the "One Call API" plan (there's a free tier)
3. Create an API key in your account dashboard

### WAQI API (World Air Quality Index)
1. Visit [WAQI API](https://aqicn.org/api/)
2. Register for a token

### Visual Crossing Weather API
1. Sign up at [Visual Crossing](https://www.visualcrossing.com/)
2. Get a free API key (limited daily requests)

### BigDataCloud API
1. Sign up at [BigDataCloud](https://www.bigdatacloud.com/)
2. Register for a free API key

## Testing Data Sources

Run the test script to verify your data sources are working:

```bash
cd server
node test-data-sources.js
```

This will test multiple locations and show which data sources were successfully used for each one.

## Data Quality Information

The application now provides a data quality score with each environmental data result, indicating:

- Which data sources were successfully used
- A quality score (0-1) based on available data
- Whether the data is real-time or fallback data

You can check this in the API responses from `/api/environmental/analyze-location` in the `dataQuality` field.

## Fallback Behavior

If primary data sources fail:
1. The system will try alternative sources if API keys are provided
2. If all real-time sources fail, it will use fallback/dummy data
3. The data quality score will indicate whether real data was used

This ensures the application remains functional even when some data sources are unavailable.
