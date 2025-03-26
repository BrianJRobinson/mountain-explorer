import React from 'react';
import { StarRating } from '../shared/StarRating';

interface RatingPanelProps {
  selectedRating?: number;
  comment: string;
  isSubmitting: boolean;
  readOnly?: boolean;
  onClose: () => void;
  onRatingChange: (rating: number) => void;
  onCommentChange: (comment: string) => void;
  onSubmit: () => void;
}

export const RatingPanel: React.FC<RatingPanelProps> = ({
  selectedRating,
  comment,
  isSubmitting,
  readOnly = false,
  onClose,
  onRatingChange,
  onCommentChange,
  onSubmit,
}) => {
  return (
    <div className="h-full p-4 flex flex-col">
      {/* Rating Panel Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-medium text-white">
          {readOnly ? "Your Rating" : "Rate & Comment"}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Star Rating */}
      <div className="flex items-center justify-center mb-3">
        <StarRating
          rating={selectedRating}
          interactive={!readOnly}
          editable={true}
          disabled={readOnly}
          size="lg"
          onChange={readOnly ? undefined : onRatingChange}
        />
      </div>
      
      {/* Comment Textarea */}
      <textarea
        placeholder={readOnly ? '' : "Share your experience with this mountain (optional)"}
        value={comment}
        onChange={(e) => onCommentChange(e.target.value)}
        disabled={readOnly}
        className={`flex-1 w-full px-3 py-1.5 bg-gray-700 text-sm text-white rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 ${
          readOnly ? 'opacity-75 cursor-not-allowed' : ''
        }`}
      />
      
      {/* Submit Button */}
      {!readOnly && (
        <button 
          onClick={onSubmit}
          disabled={!selectedRating || isSubmitting}
          className={`w-full py-1.5 mt-2 text-sm rounded-lg transition-colors ${
            !selectedRating || isSubmitting
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-orange-500 text-white hover:bg-orange-600'
          }`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      )}
    </div>
  );
}; 