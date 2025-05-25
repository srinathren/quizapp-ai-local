const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');

// Create the readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Define the default model directory
const defaultModelDir = path.join(process.env.USERPROFILE || process.env.HOME, 'OneDrive', 'Desktop', 'llama-cpp', 'models');

// Function to create model directory if it doesn't exist
const createModelDirectory = (dir) => {
  if (!fs.existsSync(dir)) {
    console.log(`Creating model directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
    return true;
  }
  return false;
};

// Function to update the server file with the correct model path
const updateServerFile = (modelPath) => {
  const serverFile = path.join(__dirname, 'llama-cpp-server.js');
  if (!fs.existsSync(serverFile)) {
    console.error('Error: llama-cpp-server.js file not found.');
    return false;
  }
  
  try {
    let content = fs.readFileSync(serverFile, 'utf8');
    
    // Replace the model path
    content = content.replace(
      /const MODEL_PATH = .*/,
      `const MODEL_PATH = '${modelPath.replace(/\\/g, '\\\\')}';`
    );
    
    fs.writeFileSync(serverFile, content);
    console.log('Successfully updated llama-cpp-server.js with the new model path.');
    return true;
  } catch (error) {
    console.error('Error updating server file:', error);
    return false;
  }
};

// Main function
const main = async () => {
  console.log('Welcome to the llama-cpp model setup utility');
  console.log('===========================================');
  
  // Check if model directory exists
  console.log(`Checking for model directory at: ${defaultModelDir}`);
  const dirCreated = createModelDirectory(defaultModelDir);
  
  if (dirCreated) {
    console.log('Model directory created successfully.');
  } else {
    console.log('Model directory already exists.');
  }
  
  rl.question(`\nEnter the full path to your model file, or press Enter to specify manually:\n`, (modelPath) => {
    if (!modelPath) {
      rl.question(`Enter the complete filename of the model within ${defaultModelDir}:\n`, (modelFilename) => {
        const fullModelPath = path.join(defaultModelDir, modelFilename);
        
        // Check if model file exists
        if (fs.existsSync(fullModelPath)) {
          console.log(`Found model at: ${fullModelPath}`);
          updateServerFile(fullModelPath);
        } else {
          console.log(`\nModel file not found at: ${fullModelPath}`);
          console.log('You need to download a model first. Here are some options:');
          console.log('1. Llama 2 7B Chat: https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF');
          console.log('2. Mistral 7B: https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF');
          console.log('\nDownload a .gguf file (like q4_K_M.gguf for good balance of quality and speed)');
          console.log(`and place it in: ${defaultModelDir}`);
        }
        rl.close();
      });
    } else {
      // Check if provided model path exists
      if (fs.existsSync(modelPath)) {
        console.log(`Found model at: ${modelPath}`);
        updateServerFile(modelPath);
      } else {
        console.log(`\nModel file not found at: ${modelPath}`);
        console.log('Please download a model and try again.');
      }
      rl.close();
    }
  });
};

main(); 