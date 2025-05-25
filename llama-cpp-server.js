const { spawn } = require('child_process');
const path = require('path');

// Configuration
const MODEL_PATH = path.join(process.env.USERPROFILE, 'OneDrive', 'Desktop', 'llama-cpp', 'models', 'llama-2-7b-chat.Q4_K_M.gguf');
const SERVER_PORT = 8000;

console.log('Starting llama-cpp server...');
console.log(`Using model: ${MODEL_PATH}`);

// Start the llama-cpp server
const llamaServer = spawn('llama-cpp-server', [
  '--model', MODEL_PATH,
  '--port', SERVER_PORT,
  '--chat-format', 'llama-2',
  '--ctx-size', '4096',
  '--n-gpu-layers', '0',  // Set to the number of layers to offload to GPU, or 0 for CPU only
]);

llamaServer.stdout.on('data', (data) => {
  console.log(`[llama-cpp] ${data}`);
});

llamaServer.stderr.on('data', (data) => {
  console.error(`[llama-cpp] ${data}`);
});

llamaServer.on('close', (code) => {
  console.log(`llama-cpp server exited with code ${code}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down llama-cpp server...');
  llamaServer.kill();
  process.exit();
});

console.log(`llama-cpp server running on http://localhost:${SERVER_PORT}`); 