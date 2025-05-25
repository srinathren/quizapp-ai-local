// Load environment variables first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const quizRoutes = require('./routes/quizRoutes');
const LlamaService = require('./services/llamaService');

// Initialize Express
const app = express();

// Initialize LLM service based on configuration
const llamaService = new LlamaService(process.env.LLAMA_SERVER_URL || 'http://127.0.0.1:8080');

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({extended: true, limit: '50mb'}));

// Set server timeout to 10 minutes
app.use((req, res, next) => {
  res.setTimeout(600000); // 10 minutes
  next();
});

// Routes
app.use('/api', quizRoutes);

// Health check route
app.get('/health', async (req, res) => {
  try {
    // Check MongoDB connection
    const mongoStatus = mongoose.connection.readyState === 1;
    
    // Check LLama API
    const llamaStatus = await llamaService.checkHealth();
    
    const systemStatus = {
      status: mongoStatus && llamaStatus ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        api: {
          status: 'ok',
          message: 'Server is running'
        },
        database: {
          status: mongoStatus ? 'ok' : 'error',
          message: mongoStatus ? 'Connected' : 'Disconnected'
        },
        llama: {
          status: llamaStatus ? 'ok' : 'error',
          message: llamaStatus ? 'Connected' : 'LLM Server Unavailable'
        }
      }
    };
    
    res.status(systemStatus.status === 'ok' ? 200 : 207).json(systemStatus);
  } catch (error) {
    res.status(500).json({
      status: 'error', 
      message: 'Health check failed',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: err.message || 'An unexpected error occurred'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  // Check LLama API health
  const llamaStatus = await llamaService.checkHealth();
  if (!llamaStatus) {
    console.warn('⚠️ WARNING: LLama API is not available. Quiz generation will not work.');
    console.warn('⚠️ Make sure your LLama server is running at: ' + (process.env.LLAMA_SERVER_URL || 'http://127.0.0.1:8080'));
  } else {
    console.log('✅ Connected to LLama API');
  }
}); 