const { OpenAI } = require('openai');
const dotenv = require('dotenv');

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testAPIKey() {
  try {
    console.log('Testing OpenAI API key...');
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: "Hello, this is a test message. Please respond with a simple 'Hello World'."
        }
      ],
      max_tokens: 20
    });
    
    console.log('API key is valid. Response:', response.choices[0].message.content);
  } catch (error) {
    console.error('Error testing OpenAI API key:', error.message);
  }
}

testAPIKey();
