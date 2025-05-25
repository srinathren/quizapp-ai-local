/**
 * Test script to test quiz generation with the backend
 * Run with: node test-quiz-generation.js
 */

const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const API_URL = `http://localhost:${process.env.PORT || 5000}/api`;

// Test data
const testData = {
  topic: 'Solar System',
  numQuestions: 3,
  difficulty: 'Easy',
  exam: 'General'
};

/**
 * Test quiz generation with the backend
 */
async function testQuizGeneration() {
  console.log('Testing quiz generation with the following data:');
  console.log(testData);
  
  try {
    // First check the LLM server status
    console.log('\nChecking LLM server status...');
    const statusResponse = await axios.get(`${API_URL}/openai-status`);
    console.log('LLM Server Status:', statusResponse.data.status);
    
    if (statusResponse.data.status !== 'ok') {
      console.error('⚠️ WARNING: LLM server is not available. Quiz generation will likely fail.');
      console.error(`LLM server message: ${statusResponse.data.message}`);
      
      const proceed = await promptToContinue();
      if (!proceed) {
        console.log('Test cancelled.');
        return;
      }
    } else {
      console.log('✅ LLM server is available.');
    }
    
    // Test generating a quiz
    console.log('\nGenerating a test quiz...');
    console.log('(This may take a while depending on the LLM model and server load)');
    
    const response = await axios.post(`${API_URL}/generate-quiz`, testData, {
      timeout: 120000 // 2 minutes timeout
    });
    
    // Check the response
    if (response.data.status === 'success') {
      console.log('✅ Quiz generated successfully!');
      console.log(`Quiz ID: ${response.data.quizId}`);
      console.log(`Number of questions: ${response.data.questions.length}`);
      
      // Print the first question as a sample
      if (response.data.questions.length > 0) {
        console.log('\nSample question:');
        console.log('Question:', response.data.questions[0].question);
        console.log('Options:', response.data.questions[0].options);
        console.log('Answer:', response.data.questions[0].answer);
      }
      
      console.log('\n✅ SUCCESS: Quiz generation is working properly');
    } else {
      console.error('❌ ERROR: Failed to generate quiz');
      console.error('Response:', response.data);
    }
  } catch (error) {
    console.error('❌ ERROR: Failed to generate quiz');
    
    if (error.response) {
      console.error(`Server responded with status ${error.response.status}`);
      console.error('Error details:', error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Connection refused. Make sure your backend server is running.');
    } else {
      console.error('Error details:', error.message);
    }
  }
}

/**
 * Simple utility to prompt for yes/no in terminal
 * @returns {Promise<boolean>}
 */
function promptToContinue() {
  return new Promise((resolve) => {
    console.log('\nDo you want to continue anyway? (y/n)');
    process.stdin.once('data', (data) => {
      const input = data.toString().trim().toLowerCase();
      resolve(input === 'y' || input === 'yes');
      
      // If we're continuing, add a separator
      if (input === 'y' || input === 'yes') {
        console.log('\n-----------------------------------\n');
      }
    });
  });
}

// Run the test
testQuizGeneration(); 