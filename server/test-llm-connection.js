/**
 * Test script to check connection to the LLM server
 * Run with: node test-llm-connection.js
 */

const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const LLM_SERVER_URL = process.env.LLM_SERVER_URL || 'http://localhost:8000';

/**
 * Test connection to the LLM server
 */
async function testConnection() {
  console.log(`Testing connection to LLM server at: ${LLM_SERVER_URL}`);
  
  try {
    // Try to connect to the models endpoint
    console.log('Testing models endpoint...');
    const modelsResponse = await axios.get(`${LLM_SERVER_URL}/v1/models`, {
      timeout: 5000
    });
    
    console.log('✅ Models endpoint available');
    console.log('Available models:', modelsResponse.data);
    
    // Try a simple completion to verify the server works correctly
    console.log('\nTesting completions endpoint with a simple prompt...');
    const completionResponse = await axios.post(`${LLM_SERVER_URL}/v1/chat/completions`, {
      model: "llama-2", // Or whatever model name your server uses
      messages: [
        { role: "user", content: "Say hello in JSON format with a greeting field" }
      ],
      temperature: 0.7,
      max_tokens: 100
    }, {
      timeout: 10000
    });
    
    console.log('✅ Completions endpoint working');
    console.log('Response:', completionResponse.data.choices[0].message.content);
    
    console.log('\n✅ SUCCESS: LLM server is properly configured and responding to requests');
  } catch (error) {
    console.error('❌ ERROR: Failed to connect to LLM server');
    
    if (error.code === 'ECONNREFUSED') {
      console.error(`The connection was refused. Make sure the LLM server is running at ${LLM_SERVER_URL}`);
    } else if (error.code === 'ETIMEDOUT') {
      console.error('The connection timed out. The server might be starting up or overloaded.');
    } else if (error.response) {
      console.error(`Server responded with status ${error.response.status}`);
      console.error('Response data:', error.response.data);
    } else {
      console.error('Error details:', error.message);
    }
    
    console.log('\nTROUBLESHOOTING TIPS:');
    console.log('1. Make sure the llama-cpp server is running');
    console.log('2. Check that the LLM_SERVER_URL in your .env file is correct');
    console.log('3. Verify the server exposes an OpenAI-compatible API at /v1/chat/completions');
    console.log('4. Try accessing the server in a browser or with curl to confirm it\'s working');
  }
}

// Run the test
testConnection(); 