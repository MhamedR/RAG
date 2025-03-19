const axios = require('axios');

const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const model = process.env.OLLAMA_MODEL || 'llama3:latest';

console.log(`Testing Ollama connection to ${baseUrl} with model ${model}`);

async function testOllama() {
  try {
    // Test the list models endpoint
    console.log('Testing list models endpoint...');
    const modelsResponse = await axios.get(`${baseUrl}/api/tags`);
    
    console.log('Available models:');
    console.log(modelsResponse.data.models.map(m => m.name).join(', '));
    
    const modelExists = modelsResponse.data.models.some(m => m.name === model);
    
    if (!modelExists) {
      console.error(`\n❌ Error: Model '${model}' not found in available models.`);
      console.log(`You may need to pull the model first with: curl -X POST ${baseUrl}/api/pull -d '{"name": "${model}"}'`);
      process.exit(1);
    }
    
    // Test embedding generation
    console.log('\nTesting embedding generation...');
    const embeddingResponse = await axios.post(`${baseUrl}/api/embeddings`, {
      model,
      prompt: 'This is a test of the embedding functionality.'
    });
    
    if (embeddingResponse.data.embedding && embeddingResponse.data.embedding.length > 0) {
      console.log(`✅ Successfully generated embedding with ${embeddingResponse.data.embedding.length} dimensions.`);
    } else {
      console.error('❌ Error: Failed to generate embedding.');
      process.exit(1);
    }
    
    // Test chat completion
    console.log('\nTesting chat completion...');
    const chatResponse = await axios.post(`${baseUrl}/api/chat`, {
      model,
      messages: [
        { role: 'user', content: 'Hello, are you working properly? Please respond in one short sentence.' }
      ],
      stream: false
    });
    
    if (chatResponse.data.message && chatResponse.data.message.content) {
      console.log(`✅ Chat response: "${chatResponse.data.message.content}"`);
    } else {
      console.error('❌ Error: Failed to get chat response.');
      console.error('Response data:', JSON.stringify(chatResponse.data, null, 2));
      process.exit(1);
    }
    
    console.log('\n✅ All tests passed! Ollama is configured correctly.');
    
  } catch (error) {
    console.error('\n❌ Error testing Ollama:');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received from Ollama. Is the server running?');
    } else {
      console.error('Error message:', error.message);
    }
    
    console.error('\nMake sure Ollama is running and accessible at', baseUrl);
    process.exit(1);
  }
}

testOllama(); 