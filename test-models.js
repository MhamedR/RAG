const { OpenAI } = require('openai');
require('dotenv').config();

async function listModels() {
  const apiKey = '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';
  
  const openai = new OpenAI({
    apiKey: apiKey,
  });

  try {
    console.log('Listing available models...');
    
    const models = await openai.models.list();
    
    console.log('Available models:');
    models.data.forEach(model => {
      console.log(`- ${model.id}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

listModels(); 