import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const Results = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  const [results, setResults] = useState(null);
  
  // Format time function
  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  useEffect(() => {
    // Get results from session storage
    const storedResults = sessionStorage.getItem('quizResults');
    
    if (!storedResults) {
      // If no results found, redirect to home
      navigate('/');
      return;
    }
    
    setResults(JSON.parse(storedResults));
  }, [navigate]);
  
  const getScoreClass = (score, total) => {
    const percentage = (score / total) * 100;
    if (percentage < 40) return 'low';
    if (percentage < 70) return 'medium';
    return '';
  };
  
  const calculatePercentage = (score, total) => {
    return Math.round((score / total) * 100);
  };
  
  const handleRetry = () => {
    navigate('/');
  };
  
  if (!results) {
    return <div className="loading">Loading results...</div>;
  }
  
  const { totalQuestions, correctAnswers, selectedAnswers, questions, timeRemaining } = results;
  const scoreClass = getScoreClass(correctAnswers, totalQuestions);
  const scorePercentage = calculatePercentage(correctAnswers, totalQuestions);
  
  return (
    <div>
      <h2>Quiz Results</h2>
      
      <div className="results-container">
        <div className="result-summary">
          <h3>Your Score</h3>
          <div className={`score ${scoreClass}`}>
            {correctAnswers} / {totalQuestions}
            <span className="score-percentage">({scorePercentage}%)</span>
          </div>
          
          <div className="time-info">
            {timeRemaining > 0 ? (
              <p>You finished with {formatTime(timeRemaining)} remaining</p>
            ) : (
              <p>You used all the allocated time</p>
            )}
          </div>
          
          <p className="score-message">
            {correctAnswers === totalQuestions
              ? 'Perfect! You got all questions correct!'
              : correctAnswers === 0
              ? 'Better luck next time!'
              : scorePercentage >= 70
              ? 'Great job! You did well on this quiz!'
              : scorePercentage >= 40
              ? 'Good effort! Keep studying to improve.'
              : 'Keep practicing to improve your score.'}
          </p>
        </div>
        
        <div className="result-details">
          <h3>Question Review</h3>
          
          {questions.map((question, index) => (
            <div key={index} className="question review">
              <div className="question-text">
                <span>{index + 1}. </span>
                {question.question}
              </div>
              
              <div className="options review">
                {Object.entries(question.options).map(([key, value]) => (
                  <div
                    key={key}
                    className={`option ${
                      key === selectedAnswers[index]
                        ? key === question.answer
                          ? 'correct'
                          : 'incorrect'
                        : key === question.answer
                        ? 'correct'
                        : ''
                    }`}
                  >
                    <span className="option-key">{key}:</span> {value}
                    {key === question.answer && (
                      <span className="answer-correct"> (Correct Answer)</span>
                    )}
                    {key === selectedAnswers[index] && key !== question.answer && (
                      <span className="answer-incorrect"> (Your Answer)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="action-buttons">
          <button onClick={handleRetry}>Try Another Quiz</button>
        </div>
      </div>
    </div>
  );
};

export default Results; 