# AI Quiz Generator with Llama Integration

This application generates custom quizzes on any topic using a local Llama model.

## Prerequisites

1. Node.js and npm installed
2. MongoDB installed and running
3. llama-cpp-server installed

## Setup Instructions

### 1. Install llama-cpp-server

Follow the instructions at https://github.com/ggerganov/llama.cpp to install llama.cpp and its Python bindings.

```bash
# Example installation (may vary based on your system)
pip install llama-cpp-python[server]
```

### 2. Download a compatible model

Download a model compatible with llama.cpp. For example, Llama 2 7B Chat quantized model:
- Save it to a folder (e.g., `models`)
- Update the model path in `llama-cpp-server.js` if different from the default

### 3. Install dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
cd ..
```

### 4. Configure environment variables

Create a `.env` file in the server directory:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/aiquiz
LLAMA_SERVER_URL=http://127.0.0.1:8080
```

## Running the Application

### 1. Start the llama-cpp server

```bash
# Start the llama-cpp server using our wrapper
node llama-cpp-server.js

# Alternatively, run directly with llama-cpp-server
llama-cpp-server --model /path/to/your/model.gguf --port 8080
```

### 2. Start the application

In a new terminal:

```bash
# Run both server and client
npm run dev

# Or run them separately
npm run server
npm run client
```

## Usage

1. Open your browser to http://localhost:3000
2. Enter a topic, select the number of questions, difficulty, and time limit
3. Click "Generate Quiz" to create your custom quiz
4. Complete the quiz and review your results

## Features

- Custom quiz generation on any topic
- Multiple difficulty levels
- Time-limited quizzes
- Detailed score analysis and review
- Support for exam-specific questions
- Robust question generation with fallback mechanisms

## Technical Stack

- Frontend: React
- Backend: Express.js, Node.js
- Database: MongoDB
- LLM: Llama with local model

## Project Structure

```
server/
  ├── config/        # Configuration files
  │   └── db.js      # Database connection
  ├── models/        # Database models
  │   └── Quiz.js    # Quiz schema
  ├── routes/        # API routes
  │   └── quizRoutes.js # Quiz routes
  ├── services/      # Service layer
  │   └── llamaService.js # Llama integration
  ├── test-llm-connection.js # Script to test Llama API connection
  ├── test-quiz-generation.js # Script to test quiz generation
  ├── .env           # Environment variables (not in repo)
  ├── index.js       # Server entry point
  └── package.json   # Dependencies

client/
  ├── public/        # Static files
  ├── src/           # React source files
  │   ├── components/# React components
  │   ├── App.js     # Main app component
  │   └── index.js   # React entry point
  └── package.json   # Dependencies

llama-cpp-server.js  # Helper script to start Llama server
model-setup.js       # Helper script for model setup
```

## License

MIT 