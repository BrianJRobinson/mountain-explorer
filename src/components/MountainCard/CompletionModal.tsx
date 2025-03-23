import React from 'react';

interface CompletionModalProps {
  isOpen: boolean;
  mountainName: string;
  onConfirm: () => void;
  onSkip: () => void;
  onRateAndComment: () => void;
}

export const CompletionModal: React.FC<CompletionModalProps> = ({
  isOpen,
  mountainName,
  onConfirm,
  onSkip,
  onRateAndComment,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center">
      <div className="bg-gray-800 rounded-xl shadow-xl border border-orange-500/20 w-full max-w-md mx-4">
        <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">Congratulations</h3>
          <button
            onClick={onConfirm}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4">
          <p className="text-gray-300 mb-4">
            Congratulations on your climb up {mountainName}! Would you like to rate and comment on your experience?
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onSkip}
              className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
            >
              Skip
            </button>
            <button
              onClick={onRateAndComment}
              className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Rate & Comment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 