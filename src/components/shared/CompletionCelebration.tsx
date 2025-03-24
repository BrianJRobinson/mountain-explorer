import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import ReactConfetti from 'react-confetti';

interface CompletionCelebrationProps {
  mountainName: string;
  onComplete: () => void;
}

export const CompletionCelebration: React.FC<CompletionCelebrationProps> = ({
  mountainName,
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

      {/* Celebration Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          {/* Outer ring */}
          <div className="absolute inset-0 w-64 h-64 rounded-full border-8 border-orange-500/30 animate-ping" />
          
          {/* Middle ring */}
          <div className="absolute inset-0 w-64 h-64 rounded-full border-8 border-orange-500/50 animate-ping" style={{ animationDelay: '0.2s' }} />
          
          {/* Inner ring */}
          <div className="absolute inset-0 w-64 h-64 rounded-full border-8 border-orange-500/70 animate-ping" style={{ animationDelay: '0.4s' }} />
          
          {/* Center content */}
          <div className="w-64 h-64 rounded-full bg-orange-500/20 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center transform scale-110 animate-bounce">
              <div className="text-4xl font-bold text-orange-500 mb-2">🏔️</div>
              <div className="text-2xl font-bold text-orange-500 mb-1">Congratulations!</div>
              <div className="text-lg text-orange-500 font-medium">{mountainName}</div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}; 