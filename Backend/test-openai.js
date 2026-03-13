// backend/test-openai.js
require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function testAPI() {
  try {
    console.log('Testing OpenAI API...');
    console.log('API Key:', process.env.OPENAI_API_KEY ? 'Found' : 'NOT FOUND');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: "Say hello" }
      ],
      max_tokens: 50
    });

    console.log('✅ SUCCESS! API is working!');
    console.log('Response:', response.choices[0].message.content);
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('Error details:', error);
  }
}

testAPI();