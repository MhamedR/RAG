// Simple script to test OpenAI API key
const { OpenAI } = require('openai');
const fs = require('fs');
require('dotenv').config();

async function testOpenAI() {
  try {
    // Get API key from .env file
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('OPENAI_API_KEY not found in .env file');
      return;
    }
    
    console.log('Using API key:', apiKey.substring(0, 5) + '...' + apiKey.substring(apiKey.length - 4));
    
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey,
    });
    
    // List available models
    console.log('Fetching available models...');
    const models = await openai.models.list();
    console.log('Available models:');
    models.data.forEach(model => {
      console.log(`- ${model.id}`);
    });
    
    console.log('\nAPI key is valid and can list models!');
    
  } catch (error) {
    console.error('Error testing OpenAI API:');
    console.error(error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testOpenAI(); 