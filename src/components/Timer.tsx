import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface TimerProps {
  level: number;
  isActive: boolean;
  onTimeUp: () => void;
  onReset?: number;
}

const Timer: React.FC<TimerProps> = ({ level, isActive, onTimeUp, onReset }) => {
  // Calculate time based on level difficulty
  const getTimeForLevel = (level: number): number => {
    if (level <= 3) return 180; // 3 minutes for beginner levels
    if (level <= 6) return 150; // 2.5 minutes for intermediate
    if (level <= 10) return 120; // 2 minutes for advanced
    if (level <= 15) return 90;  // 1.5 minutes for expert
    return 60; // 1 minute for master levels
  };

  const totalTime = getTimeForLevel(level);
  const [timeLeft, setTimeLeft] = useState(totalTime);

  useEffect(() => {
    setTimeLeft(totalTime);
  }, [level, totalTime, onReset]);

  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, timeLeft, onTimeUp]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (timeLeft / totalTime) * 100;
  const isWarning = timeLeft <= 30;
  const isCritical = timeLeft <= 10;

  const getDifficultyLabel = (level: number): string => {
    if (level <= 3) return 'Beginner';
    if (level <= 6) return 'Intermediate';
    if (level <= 10) return 'Advanced';
    if (level <= 15) return 'Expert';
    return 'Master';
  };

  const getDifficultyColor = (level: number): string => {
    if (level <= 3) return 'text-emerald-400';
    if (level <= 6) return 'text-blue-400';
    if (level <= 10) return 'text-yellow-400';
    if (level <= 15) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="timer-container">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Clock className={`w-5 h-5 ${isWarning ? 'text-rose-400' : 'text-gold-400'}`} />
          <span className="text-sm font-medium text-gray-200">
            {getDifficultyLabel(level)} Level
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {isWarning && (
            <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
          )}
          <span className={`text-lg font-bold ${
            isCritical ? 'text-rose-400 animate-pulse' : 
            isWarning ? 'text-orange-400' : 'text-gold-400'
          }`}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>
      
      <div className="relative">
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className={`timer-bar ${isWarning ? 'warning' : ''}`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>0:00</span>
          <span className={getDifficultyColor(level)}>
            {getDifficultyLabel(level)}
          </span>
          <span>{formatTime(totalTime)}</span>
        </div>
      </div>
    </div>
  );
};

export default Timer;