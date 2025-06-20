// server/gemini-service.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Get Gemini API key from environment variables
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('GEMINI_API_KEY not found in environment variables. Gemini AI services will not function.');
}

// Initialize the Generative AI SDK
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/** * List available Gemini models
 * @returns {Promise<Array<string>>} Array of available model names
 */
async function listAvailableModels() {
  if (!genAI) {
    console.error('Gemini AI service is not initialized. Missing API key.');
    return [];
  }
  try {
    // Most likely one of these models will be available
    const potentialModels = ['gemini-2.0-flash', 'gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'];
    console.log('Attempting to identify available Gemini models...');
    return potentialModels;
  } catch (error) {
    console.error('Error listing Gemini models:', error);
    return [];
  }
}

/**
 * Generate a text response using Gemini for environmental data analysis
 * @param {Object} params - Parameters for text generation
 * @param {string} params.prompt - The prompt text for Gemini
 * @param {string} [params.model='gemini-pro'] - The model to use
 * @returns {Promise<string>} The generated text response
 */
async function generateTextResponse(params) {
  if (!genAI) {
    console.error('Gemini AI service is not initialized. Missing API key.');
    return 'Unable to generate AI analysis. Please check the server configuration.';
  }
  // Default to gemini-2.0-flash, but try alternatives if that fails
  const modelOptions = ['gemini-2.0-flash', 'gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'];
  let modelToUse = params.model || modelOptions[0];
  
  try {
    console.log(`Attempting to use Gemini model: ${modelToUse}`);
    const model = genAI.getGenerativeModel({ model: modelToUse });
    const result = await model.generateContent(params.prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating text with Gemini:', error);
    
    // If we got a 404 error and we're not using the last model option, try the next one
    if (error.status === 404 && modelOptions.indexOf(modelToUse) < modelOptions.length - 1) {
      const nextModelIndex = modelOptions.indexOf(modelToUse) + 1;
      const nextModel = modelOptions[nextModelIndex];
      console.log(`Model ${modelToUse} not found. Trying next model: ${nextModel}`);
      
      try {
        const fallbackModel = genAI.getGenerativeModel({ model: nextModel });
        const fallbackResult = await fallbackModel.generateContent(params.prompt);
        const fallbackResponse = fallbackResult.response;
        return fallbackResponse.text();
      } catch (fallbackError) {
        console.error('Error with fallback Gemini model:', fallbackError);
        throw new Error(`Gemini API error: ${fallbackError.message || 'Unknown error'}`);
      }
    }
    
    throw new Error(`Gemini API error: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Analyze environmental data and provide insights using Gemini
 * @param {Object} data - Environmental data to analyze
 * @returns {Promise<Object>} Analysis results
 */
async function analyzeEnvironmentalDataWithGemini(data) {
  const prompt = `
    Analyze the following environmental data and provide insights, health implications, and recommendations:
    
    PM2.5: ${data.pm25} μg/m³
    PM10: ${data.pm10} μg/m³
    Temperature: ${data.temperature}°C
    Location: ${data.location || 'Unknown'}
    Time: ${data.timestamp || new Date().toISOString()}
    
    Please provide:
    1. A brief summary of air quality conditions
    2. Potential health impacts based on these readings
    3. Recommendations for residents in this area
    4. Any notable patterns or concerns
    
    Format the response in clear, concise paragraphs suitable for display in an environmental monitoring dashboard.
  `;

  try {
    const analysis = await generateTextResponse({ prompt });
    
    return {
      timestamp: new Date(),
      data: {
        pm25: data.pm25,
        pm10: data.pm10,
        temperature: data.temperature,
        location: data.location
      },
      analysis,
      source: 'Gemini AI'
    };
  } catch (error) {
    console.error('Error analyzing environmental data with Gemini:', error);
    throw error;
  }
}

/**
 * Process a natural language query about environmental data
 * @param {string} query - The natural language query
 * @param {Object} contextData - Additional context data
 * @returns {Promise<Object>} Query results
 */
async function processNaturalLanguageQuery(query, contextData = {}) {
  let contextString = '';
  
  if (contextData.datasets) {
    contextString += `\nAvailable datasets: ${contextData.datasets.map(d => d.name).join(', ')}\n`;
  }
  
  if (contextData.recentReadings) {
    contextString += `\nRecent environmental readings:\n`;
    contextData.recentReadings.forEach(reading => {
      contextString += `- Location: ${reading.location}, PM2.5: ${reading.pm25}μg/m³, PM10: ${reading.pm10}μg/m³, Temperature: ${reading.temperature}°C\n`;
    });
  }

  const prompt = `
    You are AirSense AI, an assistant specialized in environmental data analysis and air quality monitoring.
    
    User query: "${query}"
    
    ${contextString}
    
    Please provide a helpful, informative response to the user's query about environmental data.
    If the query requires analysis of specific data that wasn't provided, explain what data would be needed.
    Include relevant facts about air quality standards and health implications where appropriate.
  `;

  try {
    const response = await generateTextResponse({ prompt });
    
    return {
      query,
      response,
      timestamp: new Date(),
      source: 'Gemini AI'
    };
  } catch (error) {
    console.error('Error processing natural language query with Gemini:', error);
    throw error;
  }
}

/**
 * Generate embeddings for vector search using Gemini
 * @param {Object} data - Data to generate embeddings for
 * @returns {Promise<Array<number>>} Vector embeddings
 */
async function generateGeminiEmbeddings(data) {
  // For now, we'll use the simple embeddings from the original code
  // In the future, this could be replaced with actual embeddings from Gemini API
  return [
    data.pm25 / 100,
    data.pm10 / 200,
    (data.temperature + 20) / 60
  ];
}

/**
 * Search for environmental data about a specific location using Gemini
 * @param {string} locationQuery - The location to search information for
 * @param {Object} environmentalData - Optional environmental data if available
 * @returns {Promise<Object>} Location analysis results
 */
async function analyzeLocationWithGemini(locationQuery, environmentalData = null) {
  let locationContext = '';
  
  if (environmentalData) {
    // If we have environmental data, include it in the prompt
    locationContext = `
      Environmental data for ${environmentalData.location}:
      Temperature: ${environmentalData.temperature}°C
      Humidity: ${environmentalData.humidity}%
      Wind speed: ${environmentalData.wind_speed} m/s
      Air quality:
        PM2.5: ${environmentalData.pm25} μg/m³
        PM10: ${environmentalData.pm10} μg/m³
      Weather conditions: ${environmentalData.conditions}
    `;
  }

  const prompt = `
    You are AirSense AI, an environmental monitoring system assistant. A user is asking about environmental conditions in ${locationQuery}.
    
    ${locationContext}
    
    Please provide:
    1. A brief overview of the typical environmental challenges in this location
    2. Common air quality concerns in this region
    3. Factors that might influence air quality (geographical, industrial, climate-related)
    4. General recommendations for residents in this area regarding air quality management
    
    Format your response in clear, concise paragraphs. If you don't have specific data for this location, provide general information based on the region's climate and typical environmental patterns.
    
    Make your response focused, factual, and educational.
  `;

  try {
    const analysis = await generateTextResponse({ prompt });
    
    return {
      location: locationQuery,
      timestamp: new Date(),
      analysis,
      source: 'Gemini AI',
      hasRealData: !!environmentalData
    };
  } catch (error) {
    console.error('Error analyzing location with Gemini:', error);
    throw error;
  }
}

module.exports = {
  generateTextResponse,
  analyzeEnvironmentalDataWithGemini,
  processNaturalLanguageQuery,
  generateGeminiEmbeddings,
  analyzeLocationWithGemini,
  listAvailableModels
};

// If this file is run directly, try to list available models and test with a simple prompt
if (require.main === module) {
  console.log('Testing Gemini API...');
  
  if (!apiKey) {
    console.error('GEMINI_API_KEY not found in environment. Please set it before testing.');
    process.exit(1);
  }
  
  (async () => {
    try {
      console.log('Attempting to list available models...');
      const models = await listAvailableModels();
      console.log('Potential models:', models);
      
      console.log('\nTesting with a simple prompt...');
      const response = await generateTextResponse({ prompt: 'Hello! What is the current date?' });
      console.log('Gemini response:', response);
    } catch (error) {
      console.error('Test failed:', error);
    }
  })();
}
