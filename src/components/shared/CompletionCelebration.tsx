import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import ReactConfetti from 'react-confetti';

interface CompletionCelebrationProps {
  onComplete: () => void;
}

export const CompletionCelebration: React.FC<CompletionCelebrationProps> = ({
  onComplete,
}) => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Auto-remove after animation completes
    const timer = setTimeout(() => {
      onComplete();
    }, 5000); // Increased duration to 5 seconds

    return () => clearTimeout(timer);
  }, [onComplete]);

  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-[1000]">
      {/* Confetti */}
      <ReactConfetti
        width={windowSize.width}
        height={windowSize.height}
        recycle={false}
        numberOfPieces={200}
        gravity={0.3}
        wind={0.05}
        colors={['#f97316', '#fb923c', '#fed7aa', '#ffedd5']} // Orange theme colors
        onConfettiComplete={() => onComplete()}
      />
    </div>,
    document.body
  );
}; 