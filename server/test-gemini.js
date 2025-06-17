// test-gemini.js
// A simple script to test the Gemini API configuration

const { generateTextResponse, listAvailableModels } = require('./gemini-service');
require('dotenv').config();

async function testGeminiAPI() {
  console.log('----- Testing Gemini AI API Configuration -----');
  
  // Check if API key is set
  if (!process.env.GEMINI_API_KEY) {
    console.error('\nERROR: GEMINI_API_KEY not found in environment variables!');
    console.log('\nPlease set up your Gemini API key in the server/.env file:');
    console.log('GEMINI_API_KEY=your_api_key_here');
    console.log('\nYou can get an API key from https://ai.google.dev/');
    return;
  }
  
  console.log('Gemini API key found in environment variables.');
  
  try {
    console.log('\nListing potential available models...');
    const models = await listAvailableModels();
    console.log('Potential models that might be available:', models.join(', '));
    
    console.log('\nTesting Gemini API with a simple prompt...');
    const response = await generateTextResponse({ 
      prompt: 'Hello! Please generate a short paragraph about environmental monitoring.' 
    });
    
    console.log('\nSuccess! Received response from Gemini:');
    console.log('---------------------------------------------');
    console.log(response);
    console.log('---------------------------------------------');
    console.log('\nThe Gemini API is working correctly!');
  } catch (error) {
    console.error('\nError testing Gemini API:', error);
    
    if (error.message.includes('404 Not Found')) {
      console.log('\nThe error suggests that the model name is not valid for your API version.');
      console.log('Please check the following:');
      console.log('1. Make sure your Gemini API key is valid and active');
      console.log('2. You might need to update the @google/generative-ai package:');
      console.log('   Run: npm update @google/generative-ai');      console.log('3. You can try using a different model by modifying server/gemini-service.js');
      console.log('   Current models attempted: gemini-2.0-flash, gemini-pro, gemini-1.5-pro, gemini-1.5-flash');
    } else if (error.message.includes('401 Unauthorized')) {
      console.log('\nYour API key appears to be invalid or unauthorized.');
      console.log('Please check that you have entered the correct API key in server/.env file.');
    } else {
      console.log('\nPlease check your internet connection and API key configuration.');
    }
  }
}

testGeminiAPI();
