const express = require('express');
const Quiz = require('../models/Quiz');
const LlamaService = require('../services/llamaService');
const router = express.Router();

// Check if Llama server URL exists in environment variables
const LLAMA_SERVER_URL = process.env.LLAMA_SERVER_URL || 'http://127.0.0.1:8080';

// Initialize LLM service
const llamaService = new LlamaService(LLAMA_SERVER_URL);

/**
 * @route   POST /api/generate-quiz
 * @desc    Generate a new quiz using llama-cpp
 * @access  Public
 */
router.post('/generate-quiz', (req, res, next) => {
  // Set a long timeout for this specific route
  req.setTimeout(600000); // 10 minutes
  res.setTimeout(600000); // 10 minutes
  next();
}, async (req, res) => {
  try {
    const { topic, numQuestions, difficulty, exam } = req.body;
    
    // Validate request
    if (!topic) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Topic is required' 
      });
    }
    
    if (!numQuestions || isNaN(parseInt(numQuestions)) || parseInt(numQuestions) < 1) {
      return res.status(400).json({ 
        status: 'error',
        message: 'A valid number of questions (minimum 1) is required' 
      });
    }
    
    // Check LLM server health before attempting to generate
    const apiHealth = await llamaService.checkHealth();
    if (!apiHealth) {
      return res.status(503).json({
        status: 'error',
        message: 'LLM server is not available. Please check if the server is running.',
        detail: 'Could not connect to LLM server'
      });
    }
    
    // Call LLM service
    const questionsData = await llamaService.generateQuiz(
      topic, 
      parseInt(numQuestions), 
      difficulty, 
      exam
    );
    
    // Save to MongoDB
    const quiz = new Quiz({
      topic,
      numQuestions: parseInt(numQuestions),
      difficulty: difficulty || 'Medium',
      exam: exam || 'General',
      questions: questionsData
    });
    
    await quiz.save();
    
    // Return the quiz data
    res.json({
      status: 'success',
      quizId: quiz._id,
      topic,
      numQuestions: parseInt(numQuestions),
      difficulty: difficulty || 'Medium',
      exam: exam || 'General',
      questions: questionsData
    });
    
  } catch (error) {
    console.error('Error generating quiz:', error.message);
    
    // Attempt to create a simpler quiz with fewer questions if we hit a timeout
    if (error.message.includes('timeout') && req.body.numQuestions && parseInt(req.body.numQuestions) > 2) {
      const originalCount = parseInt(req.body.numQuestions);
      const topic = req.body.topic;
      const difficulty = req.body.difficulty;
      const exam = req.body.exam;
      
      console.warn(`Timeout occurred with ${originalCount} questions. Attempting with 1 question instead.`);
      try {
        // Try with just 1 question as absolute simplest case
        const reducedSize = 1;
        const partialQuestionsData = await llamaService.generateQuiz(
          topic, 
          reducedSize, 
          difficulty, 
          exam
        );
        
        // Return partial results with a warning
        const quiz = new Quiz({
          topic,
          numQuestions: partialQuestionsData.length,
          difficulty: difficulty || 'Medium',
          exam: exam || 'General',
          questions: partialQuestionsData
        });
        
        await quiz.save();
        
        return res.status(206).json({
          status: 'partial',
          quizId: quiz._id,
          topic,
          numQuestions: partialQuestionsData.length,
          requestedQuestions: originalCount,
          difficulty: difficulty || 'Medium',
          exam: exam || 'General',
          questions: partialQuestionsData,
          message: `We encountered a timeout generating ${originalCount} questions. We've provided ${partialQuestionsData.length} questions instead. Try requesting fewer questions in the future.`
        });
      } catch (fallbackError) {
        console.error('Fallback quiz generation failed too:', fallbackError);
        // Continue to regular error handling
      }
    }

    // Send appropriate error message based on error type
    if (error.message.includes('LLM')) {
      return res.status(503).json({ 
        status: 'error',
        message: error.message,
        detail: 'There was an issue with the LLM server. Please check if the server is running.'
      });
    }
    
    if (error.message.includes('parse')) {
      return res.status(500).json({ 
        status: 'error',
        message: 'The AI model generated an invalid response. Please try again with a different topic or fewer questions.',
        detail: error.message
      });
    }
    
    if (error.message.includes('timeout')) {
      return res.status(504).json({ 
        status: 'error',
        message: 'The request timed out. Try requesting fewer questions (5 or less is recommended).',
        detail: error.message
      });
    }
    
    res.status(500).json({ 
      status: 'error',
      message: error.message || 'Failed to generate quiz' 
    });
  }
});

/**
 * @route   GET /api/quiz/:id
 * @desc    Get a quiz by ID
 * @access  Public
 */
router.get('/quiz/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Quiz not found' 
      });
    }
    res.json(quiz);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to fetch quiz' 
    });
  }
});

/**
 * @route   GET /api/llm-status
 * @desc    Check LLM server status
 * @access  Public
 */
router.get('/llm-status', async (req, res) => {
  try {
    const isAvailable = await llamaService.checkHealth();
    res.json({
      status: isAvailable ? 'ok' : 'error',
      message: isAvailable 
        ? 'LLM server is available' 
        : 'LLM server is not responding or URL is invalid',
      service: 'LLM'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to check LLM server status',
      error: error.message
    });
  }
});

module.exports = router; 