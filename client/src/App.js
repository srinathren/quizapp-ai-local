import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import Quiz from './components/Quiz';
import Results from './components/Results';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>AI Quiz Generator</h1>
      </header>
      <main>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/quiz/:quizId" element={<Quiz />} />
            <Route path="/results/:quizId" element={<Results />} />
          </Routes>
        </Router>
      </main>
      <footer>
        <p>Built with React, Node.js and OpenAI</p>
      </footer>
    </div>
  );
}

export default App;
