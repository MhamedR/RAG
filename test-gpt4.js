const { OpenAI } = require('openai');
require('dotenv').config();

async function testOpenAIModel() {
  const apiKey = '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';
  
  const openai = new OpenAI({
    apiKey: apiKey,
  });

  try {
    console.log('Testing GPT-3.5-Turbo model with the new API key...');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "What model are you? Please respond with just the model name." }
      ],
    });

    console.log('Response:', completion.choices[0].message.content);
    console.log('Model used:', completion.model);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testOpenAIModel(); 