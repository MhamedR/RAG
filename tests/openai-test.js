const { OpenAI } = require('openai');

// Get API key from environment variables
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error('❌ No OpenAI API key provided. Please set the OPENAI_API_KEY environment variable.');
  process.exit(1);
}

// Create an OpenAI client
const openai = new OpenAI({
  apiKey: apiKey,
});

// Test the OpenAI API
async function testOpenAIConnection() {
  try {
    console.log('Testing OpenAI API connection...');
    console.log('Sending a simple request to GPT model...');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello, please respond with a simple greeting.' }],
      max_tokens: 50,
    });
    
    const responseContent = response.choices[0]?.message?.content.trim();
    
    console.log('\nResponse from OpenAI API:');
    console.log('------------------------');
    console.log(responseContent);
    console.log('------------------------\n');
    
    console.log('✅ OpenAI API connection test successful!');
    console.log('Your API key is valid and working correctly.');
  } catch (error) {
    console.error('❌ OpenAI API test failed:', error.message);
    
    if (error.message.includes('401')) {
      console.error('This usually means your API key is invalid or has expired.');
    } else if (error.message.includes('429')) {
      console.error('You have hit rate limits or your account has insufficient quota.');
    }
    
    console.error('Please check your API key and try again.');
  }
}

// Run the test
testOpenAIConnection(); 