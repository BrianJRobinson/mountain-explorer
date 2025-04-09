'use client';

import { useState, useRef, useEffect } from 'react';
import { Filter, Check } from 'lucide-react';

interface SitesFilterProps {
  allTypes: string[];
  selectedTypes: string[];
  onTypeChange: (types: string[]) => void;
  siteCounts: Record<string, number>;
}

export const SitesFilter: React.FC<SitesFilterProps> = ({
  allTypes,
  selectedTypes,
  onTypeChange,
  siteCounts
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTypeToggle = (type: string) => {
    const newSelectedTypes = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type];
    onTypeChange(newSelectedTypes);
  };

  const handleSelectAll = () => {
    onTypeChange(selectedTypes.length === allTypes.length ? [] : allTypes);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
      >
        <Filter className="w-5 h-5" />
        <span>Filter by Type</span>
        <span className="bg-blue-500 px-2 py-0.5 rounded-full text-sm">
          {selectedTypes.length || 'All'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-72 max-h-96 overflow-y-auto bg-gray-800 rounded-lg shadow-lg">
          <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-2">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-700 rounded-md text-white"
            >
              <div className="w-5 h-5 border-2 border-gray-400 rounded flex items-center justify-center">
                {selectedTypes.length === allTypes.length && (
                  <Check className="w-4 h-4 text-blue-500" />
                )}
              </div>
              <span>Select All</span>
            </button>
          </div>
          
          <div className="p-2">
            {allTypes.map(type => (
              <button
                key={type}
                onClick={() => handleTypeToggle(type)}
                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-700 rounded-md text-white"
              >
                <div className="w-5 h-5 border-2 border-gray-400 rounded flex items-center justify-center">
                  {selectedTypes.includes(type) && (
                    <Check className="w-4 h-4 text-blue-500" />
                  )}
                </div>
                <span className="flex-1 text-left">{type.replace(/_/g, ' ')}</span>
                <span className="text-sm text-gray-400">({siteCounts[type]})</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 