import React, { useState, useEffect } from 'react';

// Function to get a random item from an array
const getRandomItem = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

// Celebration filenames - these will be replaced with actual files when you add them
const CELEBRATION_IMAGES = [
  'celebration1.gif',
  'celebration2.gif',
  'celebration3.gif',
  'celebration4.gif',
  'celebration5.gif'
];

// Wrong feedback filenames - these will be replaced with actual files when you add them
const WRONG_FEEDBACK_IMAGES = [
  'wrong1.gif',
  'wrong2.gif',
  'wrong3.gif',
  'wrong4.gif',
  'wrong5.gif'
];

// Audio filenames - these will be replaced with actual files when you add them
const CELEBRATION_SOUNDS = [
  'success1.mp3',
  'success2.mp3',
  'success3.mp3'
];

const WRONG_SOUNDS = [
  'wrong1.mp3',
  'wrong2.mp3',
  'wrong3.mp3'
];

/**
 * Component to display animations for correct/wrong answers streak
 */
const FeedbackAnimations = ({ 
  correctStreak, 
  wrongStreak, 
  resetStreaks, 
  animationDuration = 8000 // Default to 5 seconds as requested
}) => {
  const [showCelebration, setShowCelebration] = useState(false);
  const [showWrongFeedback, setShowWrongFeedback] = useState(false);
  const [celebrationImage, setCelebrationImage] = useState('');
  const [wrongImage, setWrongImage] = useState('');
  const [audioElement, setAudioElement] = useState(null);
  
  // Handle correct streak
  useEffect(() => {
    if (correctStreak >= 3) {
      // Choose random image and sound
      const randomImage = getRandomItem(CELEBRATION_IMAGES);
      const randomSound = getRandomItem(CELEBRATION_SOUNDS);
      
      setCelebrationImage(randomImage);
      setShowCelebration(true);
      
      // Play sound
      const audio = new Audio(`/assets/celebrations/${randomSound}`);
      audio.volume = 0.7; // Set volume to 70%
      audio.play().catch(err => console.error('Error playing audio:', err));
      setAudioElement(audio);
      
      // Hide after duration
      const timer = setTimeout(() => {
        setShowCelebration(false);
        resetStreaks();
      }, animationDuration);
      
      return () => {
        clearTimeout(timer);
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      };
    }
  }, [correctStreak, animationDuration, resetStreaks]);
  
  // Handle wrong streak
  useEffect(() => {
    if (wrongStreak >= 3) {
      // Choose random image and sound
      const randomImage = getRandomItem(WRONG_FEEDBACK_IMAGES);
      const randomSound = getRandomItem(WRONG_SOUNDS);
      
      setWrongImage(randomImage);
      setShowWrongFeedback(true);
      
      // Play sound
      const audio = new Audio(`/assets/wrong-feedback/${randomSound}`);
      audio.volume = 0.7; // Set volume to 70%
      audio.play().catch(err => console.error('Error playing audio:', err));
      setAudioElement(audio);
      
      // Hide after duration
      const timer = setTimeout(() => {
        setShowWrongFeedback(false);
        resetStreaks();
      }, animationDuration);
      
      return () => {
        clearTimeout(timer);
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      };
    }
  }, [wrongStreak, animationDuration, resetStreaks]);
  
  // Clean up audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
    };
  }, [audioElement]);
  
  if (!showCelebration && !showWrongFeedback) return null;
  
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      {showCelebration && (
        <div className="celebration-container animate-bounce-in animate-fade-out">
          <img 
            src={`/assets/celebrations/${celebrationImage}`} 
            alt="Celebration"
            className="rounded-lg"
            style={{ 
              width: '400px',
              height: '300px',
              objectFit: 'cover',
              filter: 'drop-shadow(0 0 10px rgba(0, 0, 0, 0.5))'
            }}
          />
        </div>
      )}
      
      {showWrongFeedback && (
        <div className="wrong-feedback-container animate-shake animate-fade-out">
          <img 
            src={`/assets/wrong-feedback/${wrongImage}`} 
            alt="Try Again"
            className="rounded-lg"
            style={{ 
              width: '400px',
              height: '300px',
              objectFit: 'cover',
              filter: 'drop-shadow(0 0 10px rgba(0, 0, 0, 0.5))'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default FeedbackAnimations; 