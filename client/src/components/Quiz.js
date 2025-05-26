import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ThemeContext from '../context/ThemeContext';

const Quiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);
  
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  
  // Format time function
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  // Fetch quiz data
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await axios.get(`/api/quiz/${quizId}`);
        setQuiz(response.data);
        
        // Initialize selected answers object
        const answers = {};
        response.data.questions.forEach((_, index) => {
          answers[index] = '';
        });
        setSelectedAnswers(answers);
        
        // Set timer from session storage - now in minutes for the entire quiz
        const totalMinutes = parseInt(sessionStorage.getItem('quizTotalTime') || '5');
        setTimeLeft(totalMinutes * 60); // Convert to seconds
      } catch (error) {
        console.error('Error fetching quiz:', error);
        setError('Failed to load quiz. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuiz();
  }, [quizId]);
  
  // Global timer effect for the entire quiz
  useEffect(() => {
    if (!loading && quiz && !quizCompleted && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            // Time's up for the entire quiz
            clearInterval(timer);
            handleQuizSubmit();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [loading, quiz, quizCompleted, timeLeft]);
  
  const handleOptionSelect = (option) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion]: option
    });
  };
  
  const handleNextQuestion = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleQuizSubmit();
    }
  };
  
  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };
  
  const handleQuizSubmit = () => {
    setQuizCompleted(true);
    
    // Calculate results
    let correctAnswers = 0;
    quiz.questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.answer) {
        correctAnswers++;
      }
    });
    
    // Store results in session storage
    sessionStorage.setItem('quizResults', JSON.stringify({
      totalQuestions: quiz.questions.length,
      correctAnswers,
      selectedAnswers,
      questions: quiz.questions,
      timeRemaining: timeLeft
    }));
    
    // Navigate to results page
    navigate(`/results/${quizId}`);
  };
  
  if (loading) {
    return <div className="loading">Loading quiz...</div>;
  }
  
  if (error) {
    return <div className="error-message">{error}</div>;
  }
  
  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return <div className="error-message">No questions available for this quiz.</div>;
  }
  
  const question = quiz.questions[currentQuestion];
  const progressPercent = (currentQuestion / quiz.questions.length) * 100;
  
  return (
    <div className="quiz-page">
      <h2>Quiz: {quiz.topic}</h2>
      <div className="quiz-info">
        <p>Difficulty: <span className="quiz-difficulty">{quiz.difficulty}</span></p>
        {quiz.exam && <p>Exam: <span className="quiz-exam">{quiz.exam}</span></p>}
        <p className="timer">Time Remaining: {formatTime(timeLeft)}</p>
      </div>
      
      <div className="progress-container">
        <div className="progress-bar" style={{ width: `${progressPercent}%` }}></div>
      </div>
      
      <div className="quiz-container">
        <div className="question-progress">
          Question {currentQuestion + 1} of {quiz.questions.length}
        </div>
        
        <div className="question">
          <div className="question-text">
            {question.question}
          </div>
          
          <div className="options">
            {Object.entries(question.options).map(([key, value]) => (
              <div
                key={key}
                className={`option ${selectedAnswers[currentQuestion] === key ? 'selected' : ''}`}
                onClick={() => handleOptionSelect(key)}
              >
                <span className="option-key">{key}:</span> {value}
              </div>
            ))}
          </div>
        </div>
        
        <div className="navigation-buttons">
          <button 
            onClick={handlePrevQuestion} 
            disabled={currentQuestion === 0}
            className="nav-button prev-button"
          >
            Previous
          </button>
          
          {currentQuestion < quiz.questions.length - 1 ? (
            <button onClick={handleNextQuestion} className="nav-button next-button">Next</button>
          ) : (
            <button onClick={handleQuizSubmit} className="nav-button submit-button">Submit Quiz</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quiz; 