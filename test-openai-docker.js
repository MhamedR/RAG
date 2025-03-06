// Simple script to test OpenAI API key in Docker container
const { OpenAI } = require('openai');
require('dotenv').config();

async function testOpenAI() {
  try {
    // Get API key from environment variable
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('OPENAI_API_KEY not found in environment');
      return;
    }
    
    console.log('Using API key:', apiKey.substring(0, 5) + '...' + apiKey.substring(apiKey.length - 4));
    
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey,
    });
    
    // Try to get embeddings
    console.log('\nTesting embeddings with text-embedding-3-small...');
    const embeddingResponse = await openai.embeddings.create({
      model: 'gpt-3.5-turbo',
      input: 'Hello, this is a test',
    });
    
    console.log('Embedding response:');
    console.log('Dimensions:', embeddingResponse.data[0].embedding.length);
    console.log('First 5 values:', embeddingResponse.data[0].embedding.slice(0, 5));
    console.log('\nEmbedding API is working correctly!');
    
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