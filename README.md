# Airsense

**Environmental Monitoring Platform**

Airsense is a comprehensive environmental monitoring application that provides real-time air quality data, weather information, and environmental risk assessments for locations around the world.

## Features

- **Real-time Environmental Data**: Monitor air quality, weather conditions, and environmental metrics for any location
- **Location Search**: Search for any city worldwide and get immediate environmental insights
- **Interactive Dashboard**: Visualize data through interactive charts and detailed metrics
- **Environmental Risk Assessment**: AI-powered risk assessment based on air quality and weather conditions
- **Custom Dataset Analysis**: Upload and analyze your own environmental datasets
- **Forecast View**: Access daily and hourly weather and air quality forecasts
- **Responsive Design**: Seamless experience across desktop and mobile devices

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Chart.js
- **Backend**: Node.js, Express
- **Database**: MongoDB Atlas with file-based fallback storage
- **APIs**: OpenWeatherMap, OpenAQ

## Getting Started

### Prerequisites
- Node.js (v14+)
- NPM or Yarn
- MongoDB account (optional)

### Installation

1. Clone the repository:
```
git clone https://github.com/your-username/airsense.git
cd airsense
```

2. Install dependencies for both frontend and backend:
```
npm install
cd server
npm install
cd ..
```

3. Set up environment variables:
   - Create a `.env` file in the server directory
   - Add your MongoDB URI and OpenWeatherMap API keys

4. Start the development servers:
```
# Start backend server
npm run start-server

# In a new terminal, start frontend
npm run dev
```

## Deployment

The application can be deployed to platforms like Vercel, Netlify, or GitHub Pages for the frontend, with the backend deployed to services like Heroku or Google Cloud Run.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
