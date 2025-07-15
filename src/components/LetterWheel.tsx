import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Letter } from '../types/game';

interface LetterWheelProps {
  letters: Letter[];
  selectedLetters: Letter[];
  currentWord: string;
  onLetterSelect: (letter: Letter) => void;
  onLetterDeselect: (letterId: string) => void;
  onWordSubmit: () => void;
  incorrectSelection?: boolean;
  disabled?: boolean;
}

const PuzzlePiece: React.FC<{ 
  letter: string; 
  isSelected: boolean; 
  selectionOrder?: number;
  style: React.CSSProperties;
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
}> = ({ letter, isSelected, selectionOrder, style, onMouseDown, onTouchStart }) => {
  return (
    <div
      className={`absolute cursor-pointer transition-all duration-200 transform select-none ${
        isSelected 
          ? 'scale-110 z-10' 
          : 'hover:scale-105 z-5'
      }`}
      style={style}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      {/* Puzzle Piece SVG */}
      <svg
        width="56"
        height="56"
        viewBox="0 0 56 56"
        className={`drop-shadow-lg transition-all duration-200 ${
          isSelected ? 'drop-shadow-xl' : 'hover:drop-shadow-xl'
        }`}
      >
        <defs>
          <linearGradient id={`puzzleGradient-${letter}-${isSelected}`} x1="0%" y1="0%" x2="100%" y2="100%">
            {isSelected ? (
              <>
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#c084fc" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#faf5ff" />
                <stop offset="100%" stopColor="#f3e8ff" />
              </>
            )}
          </linearGradient>
          <filter id={`shadow-${letter}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.3"/>
          </filter>
        </defs>
        
        {/* Puzzle Piece Shape */}
        <path
          d="M8 8 L24 8 Q28 4 32 8 Q36 12 32 16 L48 16 Q52 12 56 16 L56 32 Q60 36 56 40 Q52 44 56 48 L56 56 L40 56 Q36 60 32 56 Q28 52 32 48 L16 48 Q12 52 8 48 Q4 44 8 40 L8 24 Q4 20 8 16 Q12 12 8 8 Z"
          fill={`url(#puzzleGradient-${letter}-${isSelected})`}
          stroke={isSelected ? "#f97316" : "#e5e7eb"}
          strokeWidth={isSelected ? "2" : "1"}
          filter={`url(#shadow-${letter})`}
        />
      </svg>
      
      {/* Letter */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-xl font-bold pointer-events-none ${
          isSelected ? 'text-white' : 'text-purple-800'
        }`}>
          {letter}
        </span>
      </div>
      
      {/* Selection Order Badge */}
      {isSelected && selectionOrder && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg ring-2 ring-white">
          {selectionOrder}
        </div>
      )}
    </div>
  );
};

const LetterWheel: React.FC<LetterWheelProps> = ({
  letters,
  selectedLetters,
  currentWord,
  onLetterSelect,
  onLetterDeselect,
  incorrectSelection = false,
  disabled = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragPath, setDragPath] = useState<{ x: number; y: number }[]>([]);
  const wheelRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const wheelRadius = 120;
  const centerX = 150;
  const centerY = 150;

  const getLetterPosition = useCallback((index: number, total: number) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    const x = centerX + wheelRadius * Math.cos(angle);
    const y = centerY + wheelRadius * Math.sin(angle);
    return { x, y };
  }, []);

  const getLetterAtPosition = useCallback((x: number, y: number): Letter | null => {
    if (!wheelRef.current) return null;
    
    const rect = wheelRef.current.getBoundingClientRect();
    const relativeX = x - rect.left;
    const relativeY = y - rect.top;
    
    for (let i = 0; i < letters.length; i++) {
      const pos = getLetterPosition(i, letters.length);
      const distance = Math.sqrt(
        Math.pow(relativeX - pos.x, 2) + Math.pow(relativeY - pos.y, 2)
      );
      
      if (distance <= 35) { // Puzzle piece radius
        return letters[i];
      }
    }
    return null;
  }, [letters, getLetterPosition]);

  const handleMouseDown = useCallback((e: React.MouseEvent, letter?: Letter) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
    
    if (letter && !selectedLetters.some(l => l.id === letter.id)) {
      onLetterSelect(letter);
    }
    
    const rect = wheelRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePosition({ x, y });
      setDragPath([{ x, y }]);
    }
  }, [selectedLetters, onLetterSelect, disabled]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !wheelRef.current || disabled) return;
    
    const rect = wheelRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePosition({ x, y });
    setDragPath(prev => [...prev.slice(-10), { x, y }]);
    
    const letterAtPosition = getLetterAtPosition(e.clientX, e.clientY);
    if (letterAtPosition && !selectedLetters.some(l => l.id === letterAtPosition.id)) {
      onLetterSelect(letterAtPosition);
    }
  }, [isDragging, selectedLetters, onLetterSelect, getLetterAtPosition, disabled]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragPath([]);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent, letter?: Letter) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
    
    if (letter && !selectedLetters.some(l => l.id === letter.id)) {
      onLetterSelect(letter);
    }
    
    const touch = e.touches[0];
    const rect = wheelRef.current?.getBoundingClientRect();
    if (rect) {
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      setMousePosition({ x, y });
      setDragPath([{ x, y }]);
    }
  }, [selectedLetters, onLetterSelect, disabled]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || !wheelRef.current || disabled) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const rect = wheelRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    setMousePosition({ x, y });
    setDragPath(prev => [...prev.slice(-10), { x, y }]);
    
    const letterAtPosition = getLetterAtPosition(touch.clientX, touch.clientY);
    if (letterAtPosition && !selectedLetters.some(l => l.id === letterAtPosition.id)) {
      onLetterSelect(letterAtPosition);
    }
  }, [isDragging, selectedLetters, onLetterSelect, getLetterAtPosition, disabled]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setDragPath([]);
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' && currentWord.length >= 3) {
      onWordSubmit();
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Current Word Display */}
      <div className="h-16 flex items-center justify-center">
        {currentWord ? (
          <div className={`current-word text-2xl font-bold px-6 py-3 rounded-xl transition-all duration-200 ${
            incorrectSelection ? 'invalid' : ''
          }`}>
            {currentWord}
          </div>
        ) : (
          <div className="text-gray-300 text-lg">
            {disabled ? 'Game Paused' : 'Drag to connect puzzle pieces'}
          </div>
        )}
      </div>

      {/* Puzzle Wheel */}
      <div 
        ref={wheelRef}
        className={`relative bg-gradient-to-br from-primary-600 via-primary-500 to-primary-400 rounded-full shadow-2xl border-4 border-gold-400 transition-all duration-200 ${
          incorrectSelection ? 'ring-4 ring-rose-500 ring-opacity-50' : ''
        } ${disabled ? 'opacity-50' : ''}`}
        style={{ width: '300px', height: '300px' }}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {/* Connection Lines */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 1 }}
        >
          {/* Static connections between selected letters */}
          {selectedLetters.map((letter, index) => {
            if (index === 0) return null;
            const prevLetter = selectedLetters[index - 1];
            const currentPos = getLetterPosition(
              letters.findIndex(l => l.id === letter.id),
              letters.length
            );
            const prevPos = getLetterPosition(
              letters.findIndex(l => l.id === prevLetter.id),
              letters.length
            );
            
            return (
              <line
                key={`${prevLetter.id}-${letter.id}`}
                x1={prevPos.x}
                y1={prevPos.y}
                x2={currentPos.x}
                y2={currentPos.y}
                stroke="url(#connectionGradient)"
                strokeWidth="4"
                className="drop-shadow-sm"
              />
            );
          })}
          
          {/* Dynamic line from last selected letter to mouse position */}
          {isDragging && selectedLetters.length > 0 && (
            <line
              x1={getLetterPosition(
                letters.findIndex(l => l.id === selectedLetters[selectedLetters.length - 1].id),
                letters.length
              ).x}
              y1={getLetterPosition(
                letters.findIndex(l => l.id === selectedLetters[selectedLetters.length - 1].id),
                letters.length
              ).y}
              x2={mousePosition.x}
              y2={mousePosition.y}
              stroke="url(#activeConnectionGradient)"
              strokeWidth="3"
              strokeDasharray="5,5"
              className="animate-pulse"
            />
          )}
          
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--gold-500)" />
              <stop offset="100%" stopColor="var(--gold-400)" />
            </linearGradient>
            <linearGradient id="activeConnectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--gold-400)" />
              <stop offset="100%" stopColor="var(--gold-300)" />
            </linearGradient>
          </defs>
        </svg>

        {/* Puzzle Pieces */}
        {letters.map((letter, index) => {
          const position = getLetterPosition(index, letters.length);
          const isSelected = selectedLetters.some(l => l.id === letter.id);
          const selectionOrder = selectedLetters.findIndex(l => l.id === letter.id) + 1;

          return (
            <PuzzlePiece
              key={letter.id}
              letter={letter.char}
              isSelected={isSelected}
              selectionOrder={selectionOrder || undefined}
              style={{
                left: `${position.x - 28}px`,
                top: `${position.y - 28}px`,
              }}
              onMouseDown={(e) => handleMouseDown(e, letter)}
              onTouchStart={(e) => handleTouchStart(e, letter)}
            />
          );
        })}

        {/* Center Puzzle Hub */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gradient-to-br from-gold-500 via-gold-400 to-gold-300 rounded-full shadow-xl border-4 border-primary-400 flex items-center justify-center">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full shadow-inner"></div>
        </div>
      </div>
    </div>
  );
};

export default LetterWheel;