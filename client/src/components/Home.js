import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Home = () => {
  const [formData, setFormData] = useState({
    topic: '',
    numQuestions: 5,
    difficulty: 'Medium',
    exam: '',
    timer: 5 // minutes for entire quiz
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'numQuestions' || name === 'timer' ? parseInt(value) : value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('/api/generate-quiz', {
        topic: formData.topic,
        numQuestions: formData.numQuestions,
        difficulty: formData.difficulty,
        exam: formData.exam
      });
      
      // Store the timer in sessionStorage as total minutes for the quiz
      sessionStorage.setItem('quizTotalTime', formData.timer);
      
      navigate(`/quiz/${response.data.quizId}`);
    } catch (error) {
      console.error('Error generating quiz:', error);
      
      // Extract error message from response if available
      let errorMessage = 'Failed to generate quiz. Please try again.';
      
      if (error.response && error.response.data) {
        const { message, detail } = error.response.data;
        errorMessage = message || errorMessage;
        
        // If the error is related to the API, show a more specific message
        if (detail) {
          errorMessage = `${message} (${detail})`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <h2>Generate Your AI Quiz</h2>
      <div className="form-container">
        {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="topic">Topic:</label>
            <input
              type="text"
              id="topic"
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              required
              placeholder="Enter the topic for your quiz"
              className="light-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="numQuestions">Number of Questions:</label>
            <input
              type="number"
              id="numQuestions"
              name="numQuestions"
              value={formData.numQuestions}
              onChange={handleChange}
              min="1"
              max="20"
              required
              placeholder="5"
            />
            <small className="form-help">Choose between 1-20 questions</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="difficulty">Difficulty Level:</label>
            <select
              id="difficulty"
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="exam">Exam Type (Optional):</label>
            <input
              type="text"
              id="exam"
              name="exam"
              value={formData.exam}
              onChange={handleChange}
              placeholder="e.g., NEET, UPSC, GRE, etc."
            />
            <small className="form-help">Leave blank for general knowledge</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="timer">Quiz Time Limit (minutes):</label>
            <input
              type="number"
              id="timer"
              name="timer"
              value={formData.timer}
              onChange={handleChange}
              min="1"
              max="60"
              required
              placeholder="5"
            />
            <small className="form-help">Total time to complete all questions</small>
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Generating Quiz...' : 'Generate Quiz'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Home; 