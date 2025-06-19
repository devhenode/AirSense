# Deployment Instructions for AirSense

## Prerequisites

1. Google Cloud SDK installed and configured
2. Node.js and npm installed
3. Access to the Google Cloud project

## Environment Setup

### Backend Environment Variables

In `server/app.yaml`, ensure all environment variables are properly set:

```yaml
env_variables:
  NODE_ENV: "production"
  MONGODB_URI: "your_mongodb_connection_string"
  MONGODB_DB: "environmental_data"
  MONGODB_COLLECTION: "datasets"
  OPENWEATHER_API_KEY: "your_openweather_api_key"
  GEMINI_API_KEY: "your_gemini_api_key" 
```

### Frontend Environment Variables

The frontend environment variables are set in `.env.production`:

```
VITE_API_URL=https://mongodb-analyzer.ew.r.appspot.com
VITE_API_BASE_URL=https://mongodb-analyzer.ew.r.appspot.com
```

## Deployment Steps

### Option 1: All-in-One Deployment

Run the deployment script:

```bash
deploy-to-cloud.bat
```

This will:
1. Build the frontend with production settings
2. Deploy the backend service
3. Deploy the frontend service
4. Update the dispatch rules

### Option 2: Manual Deployment

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Deploy the backend:
   ```bash
   cd server
   gcloud app deploy
   cd ..
   ```

3. Deploy the frontend:
   ```bash
   gcloud app deploy
   ```

4. Update dispatch rules:
   ```bash
   gcloud app deploy dispatch.yaml
   ```

## Verifying Deployment

After deployment:

1. Backend should be accessible at:
   ```
   https://mongodb-analyzer.ew.r.appspot.com
   ```

2. Frontend should be accessible at:
   ```
   https://frontend-dot-mongodb-analyzer.ew.r.appspot.com
   ```

3. You can check the health of the backend at:
   ```
   https://mongodb-analyzer.ew.r.appspot.com/health
   ```

## Troubleshooting

If the deployed application is not working:

1. Check the logs:
   ```bash
   gcloud app logs read --service=default
   gcloud app logs read --service=frontend
   ```

2. Check if the environment variables are correctly set in the deployed application.

3. Test the backend API directly using a tool like Postman.

4. Verify that the frontend is making requests to the correct backend URL.
