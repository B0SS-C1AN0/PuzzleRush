import React, { useState, useEffect, useCallback } from 'react';
import { Lightbulb, User, Target } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import LetterWheel from './LetterWheel';
import WordList from './WordList';
import GameStats from './GameStats';
import TopNavigation from './TopNavigation';
import HourlyPuzzleTimer from './HourlyPuzzleTimer';
import CongratulationsPage from './CongratulationsPage';
import PlayerProfile from './PlayerProfile';
import MissionPanel from './MissionPanel';
import AchievementsPanel from './AchievementsPanel';
import { 
  GameState, 
  WordData, 
  Letter, 
  HourlyPuzzle, 
  PlayerProfile as PlayerProfileType, 
  Mission, 
  PuzzleAttempt,
  Achievement,
  BlockchainProfile,
  BlockchainReward,
  TokenTransaction
} from '../types/game';
import { generateLetterSet, validateWord, getWordScore, playSound, wordDictionary } from '../utils/gameUtils';
import { getStoredProgress, saveProgress, getPlayerProfile, savePlayerProfile } from '../utils/storage';
import { PuzzleService, TraitService } from '../services/puzzleService';
import { blockchainService } from '../services/blockchainService';

const WordPuzzleGame: React.FC = () => {
  const wallet = useWallet();
  const [gameStarted, setGameStarted] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    level: 1,
    letters: [],
    discoveredWords: [],
    availableWords: [],
    currentWord: '',
    selectedLetters: [],
    score: 0,
    totalScore: 0,
    hintsUsed: 0,
    soundEnabled: true,
    isComplete: false
  });

  const [showHint, setShowHint] = useState(false);
  const [gameMessage, setGameMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [volume, setVolume] = useState(75);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [incorrectSelection, setIncorrectSelection] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);
  
  // New state for hourly puzzle system
  const [currentPuzzle, setCurrentPuzzle] = useState<HourlyPuzzle | null>(null);
  const [playerProfile, setPlayerProfile] = useState<PlayerProfileType | null>(null);
  const [activeMissions, setActiveMissions] = useState<Mission[]>([]);
  const [showProfile, setShowProfile] = useState(false);
  const [showMissions, setShowMissions] = useState(false);
  const [puzzleStartTime, setPuzzleStartTime] = useState<Date | null>(null);

  // Blockchain state
  const [blockchainProfile, setBlockchainProfile] = useState<BlockchainProfile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showAchievements, setShowAchievements] = useState(false);
  const [pendingRewards, setPendingRewards] = useState<BlockchainReward[]>([]);
  const [tokenTransactions, setTokenTransactions] = useState<TokenTransaction[]>([]);
  const [levelStartTime, setLevelStartTime] = useState<Date | null>(null);
  const [isFirstWord, setIsFirstWord] = useState(false);
  
  // Services
  const puzzleService = PuzzleService.getInstance();
  const traitService = TraitService.getInstance();
  const honeycombService = new HoneycombService(process.env.REACT_APP_HONEYCOMB_API_KEY || '');

  const handleStartGame = () => {
    setGameStarted(true);
    initializeGame();
  };

  // Initialize game
  useEffect(() => {
    initializeHourlyPuzzleSystem();
  }, []);

  // Load saved progress
  useEffect(() => {
    const savedProgress = getStoredProgress();
    const savedProfile = getPlayerProfile();
    
    if (savedProgress) {
      setGameState(prev => ({
        ...prev,
        level: savedProgress.level,
        totalScore: savedProgress.totalScore,
        soundEnabled: savedProgress.soundEnabled ?? true
      }));
    }
    
    if (savedProfile) {
      setPlayerProfile(savedProfile);
    } else {
      // Create new player profile
      const newProfile: PlayerProfileType = {
        id: `player_${Date.now()}`,
        username: 'Puzzle Master',
        totalXP: 0,
        level: 1,
        traits: [],
        puzzleHistory: [],
        streakCount: 0,
        longestStreak: 0,
        badges: [],
        reputation: 0
      };
      setPlayerProfile(newProfile);
      savePlayerProfile(newProfile);
    }
  }, []);

  // Save progress when game state changes
  useEffect(() => {
    if (!isLoading) {
      saveProgress({
        level: gameState.level,
        totalScore: gameState.totalScore,
        soundEnabled: gameState.soundEnabled
      });
    }
  }, [gameState.level, gameState.totalScore, gameState.soundEnabled, isLoading]);

  // Save player profile when it changes
  useEffect(() => {
    if (playerProfile) {
      savePlayerProfile(playerProfile);
    }
  }, [playerProfile]);

  // Initialize blockchain profile when wallet connects
  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      setIsWalletConnected(true);
      initializeBlockchainProfile();
    } else {
      setIsWalletConnected(false);
      setBlockchainProfile(null);
    }
  }, [wallet.connected, wallet.publicKey]);

  // Initialize achievements
  useEffect(() => {
    const sampleAchievements = blockchainService.createSampleAchievements();
    setAchievements(sampleAchievements);
  }, []);

  const initializeHourlyPuzzleSystem = useCallback(async () => {
    setIsLoading(true);
    
    // Get current hourly puzzle
    const puzzle = puzzleService.getCurrentPuzzle();
    setCurrentPuzzle(puzzle);
    
    if (puzzle) {
      const availableWords = await getAvailableWords(puzzle.letters);
      
      setGameState(prev => ({
        ...prev,
        letters: puzzle.letters,
        availableWords,
        discoveredWords: [],
        currentWord: '',
        selectedLetters: [],
        score: 0,
        hintsUsed: 0,
        isComplete: false
      }));
      
      setPuzzleStartTime(new Date());
      
      // Create Honeycomb mission
      try {
        await honeycombService.createMission(puzzle.id, {
          category: puzzle.category,
          difficulty: puzzle.difficulty,
          xpReward: puzzle.xpReward
        });
      } catch (error) {
        console.warn('Failed to create Honeycomb mission:', error);
      }
    }
    
    // Initialize missions
    initializeMissions();
    
    setShowHint(false);
    setGameMessage(puzzle?.isRare ? '🎁 Rare Puzzle Drop! Triple XP! 🎁' : 'Find all the words in this hourly puzzle!');
    setIsLoading(false);
  }, []);

  const initializeMissions = () => {
    const missions: Mission[] = [
      {
        id: 'hourly_puzzle',
        type: 'hourly_puzzle',
        title: 'Hourly Challenge',
        description: 'Complete the current hourly puzzle',
        requirements: [
          { type: 'solve_puzzles', target: 1, current: 0 }
        ],
        rewards: [
          { type: 'xp', value: 100, description: '100 XP' }
        ],
        progress: 0,
        maxProgress: 1,
        isCompleted: false,
        expiryTime: currentPuzzle?.expiryTime
      },
      {
        id: 'streak_challenge',
        type: 'streak_challenge',
        title: 'Streak Master',
        description: 'Solve 5 hourly puzzles in a row',
        requirements: [
          { type: 'maintain_streak', target: 5, current: playerProfile?.streakCount || 0 }
        ],
        rewards: [
          { type: 'trait', value: 'streak_master', description: 'Streak Master Trait' },
          { type: 'xp', value: 500, description: '500 Bonus XP' }
        ],
        progress: playerProfile?.streakCount || 0,
        maxProgress: 5,
        isCompleted: (playerProfile?.streakCount || 0) >= 5
      }
    ];
    
    setActiveMissions(missions);
  };

  const initializeBlockchainProfile = async () => {
    if (!wallet.publicKey) return;

    try {
      // Try to get existing profile
      let profile = await blockchainService.getPlayerProfile(wallet.publicKey.toBase58());
      
      if (!profile) {
        // Create mock profile for demo
        profile = {
          walletAddress: wallet.publicKey.toBase58(),
          honeycombProfileId: undefined,
          tokenBalance: 0,
          nftCount: 0,
          isWalletConnected: true,
          onChainStats: {
            totalWordsFound: 0,
            dailyStreak: 0,
            perfectLevels: 0,
            averageTimePerWord: 0,
            favoriteLetterCombination: '',
            lastPlayedDate: new Date(),
            achievementsUnlocked: []
          }
        };
      }
      
      setBlockchainProfile(profile);
    } catch (error) {
      console.error('Error initializing blockchain profile:', error);
    }
  };

  const getAvailableWords = async (letters: Letter[]): Promise<WordData[]> => {
    const letterCounts = letters.reduce((acc, letter) => {
      acc[letter.char] = (acc[letter.char] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const availableWords: WordData[] = [];
    const minLength = 3;
    const maxLength = Math.min(8, 5 + gameState.level);

    // Get all words from our dictionary that can be formed with available letters
    for (let length = minLength; length <= maxLength; length++) {
      const wordsOfLength = wordDictionary[length] || [];
      
      for (const word of wordsOfLength) {
        const wordCounts = word.split('').reduce((acc, char) => {
          acc[char] = (acc[char] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const canForm = Object.entries(wordCounts).every(([char, count]) => 
          letterCounts[char] >= count
        );

        if (canForm) {
          availableWords.push({
            word: word,
            score: getWordScore(word, gameState.level),
            found: false
          });
        }
      }
    }
    
    return availableWords.sort((a, b) => a.word.length - b.word.length);
  };

  // Auto-submit and auto-clear system
  useEffect(() => {
    const checkAndSubmitWord = async () => {
      if (gameState.currentWord.length >= 3 && currentPuzzle?.isActive) {
        const isValid = await validateWord(gameState.currentWord);
        const wordData = gameState.availableWords.find(w => w.word === gameState.currentWord);
        const alreadyFound = gameState.discoveredWords.some(w => w.word === gameState.currentWord);
        
        if (isValid && wordData && !alreadyFound) {
          // Auto-submit valid word
          setTimeout(() => {
            handleWordSubmit();
          }, 500); // Small delay for better UX
        } else if (gameState.currentWord.length >= 3) {
          // Auto-clear invalid words after 0.5s
          setTimeout(() => {
            showIncorrectFeedback('Invalid word - auto clearing!');
          }, 500);
        }
      }
    };

    checkAndSubmitWord();
  }, [gameState.currentWord, currentPuzzle?.isActive]);

  const handleLetterSelect = (letter: Letter) => {
    if (gameState.selectedLetters.some(l => l.id === letter.id)) {
      return; // Already selected
    }

    const newSelectedLetters = [...gameState.selectedLetters, letter];
    const newCurrentWord = newSelectedLetters.map(l => l.char).join('');

    setGameState(prev => ({
      ...prev,
      selectedLetters: newSelectedLetters,
      currentWord: newCurrentWord
    }));

    if (gameState.soundEnabled) {
      playSound('select');
    }
  };

  const handleLetterDeselect = (letterId: string) => {
    const letterIndex = gameState.selectedLetters.findIndex(l => l.id === letterId);
    if (letterIndex === -1) return;

    const newSelectedLetters = gameState.selectedLetters.slice(0, letterIndex);
    const newCurrentWord = newSelectedLetters.map(l => l.char).join('');

    setGameState(prev => ({
      ...prev,
      selectedLetters: newSelectedLetters,
      currentWord: newCurrentWord
    }));
  };

  const handleWordSubmit = useCallback(async () => {
    if (gameState.currentWord.length < 3 || !currentPuzzle?.isActive) {
      showIncorrectFeedback('Words must be at least 3 letters long!');
      return;
    }

    const wordData = gameState.availableWords.find(w => w.word === gameState.currentWord);
    
    if (!wordData) {
      showIncorrectFeedback('Not a valid word!');
      return;
    }

    if (gameState.discoveredWords.some(w => w.word === gameState.currentWord)) {
      showIncorrectFeedback('Already found this word!');
      return;
    }

    // Valid new word found
    const baseXP = wordData.score;
    const traitMultipliedXP = playerProfile ? 
      traitService.calculateXPWithTraits(baseXP, playerProfile.traits, { isStreak: playerProfile.streakCount > 0 }) : 
      baseXP;
    const finalXP = currentPuzzle?.isRare ? traitMultipliedXP * 3 : traitMultipliedXP;
    
    const newDiscoveredWords = [...gameState.discoveredWords, { ...wordData, found: true }];
    const newScore = gameState.score + finalXP;
    const newTotalScore = gameState.totalScore + finalXP;

    setGameState(prev => ({
      ...prev,
      discoveredWords: newDiscoveredWords,
      score: newScore,
      totalScore: newTotalScore,
      currentWord: '',
      selectedLetters: [],
      isComplete: newDiscoveredWords.length === prev.availableWords.length
    }));

    setGameMessage(`Excellent! +${finalXP} XP! ${currentPuzzle?.isRare ? '🎁' : '🎉'}`);
    
    if (gameState.soundEnabled) {
      playSound('success');
    }

    // Check if level is complete
    if (newDiscoveredWords.length === gameState.availableWords.length) {
      await handlePuzzleCompletion();
    }
  }, [gameState, currentPuzzle, playerProfile, traitService]);

  const handlePuzzleCompletion = async () => {
    if (!currentPuzzle || !playerProfile || !puzzleStartTime) return;
    
    const completionTime = Math.floor((new Date().getTime() - puzzleStartTime.getTime()) / 1000);
    const accuracy = Math.floor((gameState.discoveredWords.length / gameState.availableWords.length) * 100);
    
    // Create puzzle attempt record
    const puzzleAttempt: PuzzleAttempt = {
      puzzleId: currentPuzzle.id,
      playerId: playerProfile.id,
      startTime: puzzleStartTime,
      endTime: new Date(),
      wordsFound: gameState.discoveredWords.map(w => w.word),
      accuracy,
      completionTime,
      xpEarned: gameState.score,
      traits: []
    };
    
    // Check for new traits
    const newTraits = traitService.checkAndAwardTraits(playerProfile, {
      ...puzzleAttempt,
      puzzleReleaseTime: currentPuzzle.releaseTime
    });
    
    // Update player profile
    const updatedProfile: PlayerProfileType = {
      ...playerProfile,
      totalXP: playerProfile.totalXP + gameState.score,
      level: Math.floor((playerProfile.totalXP + gameState.score) / 1000) + 1,
      traits: [...playerProfile.traits, ...newTraits],
      puzzleHistory: [...playerProfile.puzzleHistory, puzzleAttempt],
      streakCount: accuracy === 100 ? playerProfile.streakCount + 1 : 0,
      longestStreak: Math.max(playerProfile.longestStreak, accuracy === 100 ? playerProfile.streakCount + 1 : 0),
      reputation: playerProfile.reputation + Math.floor(gameState.score / 10)
    };
    
    setPlayerProfile(updatedProfile);
    
    // Update Honeycomb
    try {
      if (playerProfile.walletAddress) {
        await honeycombService.completeMission(currentPuzzle.id, playerProfile.walletAddress, {
          completionTime,
          accuracy,
          wordsFound: gameState.discoveredWords.map(w => w.word),
          xpEarned: gameState.score
        });
        
        if (newTraits.length > 0) {
          await honeycombService.updatePlayerTraits(playerProfile.walletAddress, updatedProfile.traits);
        }
      }
    } catch (error) {
      console.warn('Failed to update Honeycomb:', error);
    }
    
    setGameMessage('🎊 Puzzle Complete! Amazing work! 🎊');
    if (gameState.soundEnabled) {
      playSound('levelComplete');
    }
    
    // Show congratulations page
    setTimeout(() => {
      setShowCongratulations(true);
    }, 1000);
  };

  const showIncorrectFeedback = (message: string) => {
    setGameMessage(message);
    setIncorrectSelection(true);
    
    if (gameState.soundEnabled) {
      playSound('error');
    }
    
    // Haptic feedback for mobile devices
    if ('vibrate' in navigator) {
      navigator.vibrate(100);
    }
    
    // Auto-clear selection after 0.5s
    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        currentWord: '',
        selectedLetters: []
      }));
      setIncorrectSelection(false);
    }, 500);
  };

  const handleHint = () => {
    if (gameState.hintsUsed >= 3) {
      setGameMessage('No more hints available this level!');
      return;
    }

    const unFoundWords = gameState.availableWords.filter(w => !gameState.discoveredWords.some(d => d.word === w.word));
    if (unFoundWords.length === 0) return;

    const randomWord = unFoundWords[Math.floor(Math.random() * unFoundWords.length)];
    setShowHint(true);
    setGameMessage(`💡 Hint: ${randomWord.word.slice(0, 2)}${'*'.repeat(randomWord.word.length - 2)}`);
    
    setGameState(prev => ({
      ...prev,
      hintsUsed: prev.hintsUsed + 1
    }));

    setTimeout(() => setShowHint(false), 3000);
  };

  const handleNextPuzzle = () => {
    setShowCongratulations(false);
    initializeHourlyPuzzleSystem();
  };

  const toggleSound = () => {
    setGameState(prev => ({
      ...prev,
      soundEnabled: !prev.soundEnabled
    }));
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
  };

  const handleWalletConnect = () => {
    setIsWalletConnected(!isWalletConnected);
  };

  const handleRestart = () => {
    setShowCongratulations(false);
    initializeHourlyPuzzleSystem();
  };

  const handlePuzzleExpired = () => {
    setGameMessage('⏰ Puzzle expired! New puzzle available!');
    initializeHourlyPuzzleSystem();
  };

  const progressPercentage = gameState.availableWords.length > 0 
    ? (gameState.discoveredWords.length / gameState.availableWords.length) * 100 
    : 0;

  // Check achievements and award rewards when level completes
  const checkAndAwardRewards = async (levelCompleted: boolean = false) => {
    if (!wallet.connected || !blockchainProfile?.honeycombProfileId) return;

    const completionTime = levelStartTime ? (Date.now() - levelStartTime.getTime()) / 1000 : 0;
    const isPerfectLevel = levelCompleted && gameState.discoveredWords.length === gameState.availableWords.length;
    
    const gameStats = {
      wordsFound: gameState.discoveredWords.length,
      levelCompleted,
      isPerfectLevel,
      completionTime,
      isFirstWord: isFirstWord && gameState.discoveredWords.length === 1,
      dailyStreak: blockchainProfile.onChainStats.dailyStreak
    };

    try {
      const rewards = await blockchainService.checkAchievements(
        wallet,
        blockchainProfile.honeycombProfileId,
        gameStats
      );

      if (rewards.length > 0) {
        setPendingRewards(prev => [...prev, ...rewards]);
        
        // Update token balance
        const tokenRewards = rewards.filter(r => r.type === 'token');
        const totalTokens = tokenRewards.reduce((sum, r) => sum + (r.amount || 0), 0);
        
        if (totalTokens > 0) {
          setBlockchainProfile(prev => prev ? {
            ...prev,
            tokenBalance: prev.tokenBalance + totalTokens
          } : null);
        }

        // Update achievements
        const achievementRewards = rewards.filter(r => r.type === 'achievement' || r.type === 'nft');
        achievementRewards.forEach(reward => {
          setAchievements(prev => prev.map(achievement => 
            achievement.id === reward.achievementId 
              ? { ...achievement, isUnlocked: true, unlockedAt: new Date() }
              : achievement
          ));
        });

        // Show reward notifications
        rewards.forEach(reward => {
          setGameMessage(reward.message);
          setTimeout(() => setGameMessage(''), 3000);
        });
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  // Reset level start time when starting new level
  const startNewLevel = useCallback(() => {
    setLevelStartTime(new Date());
    setIsFirstWord(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-400 mx-auto"></div>
          <p className="mt-4 text-lg font-medium text-purple-200">Loading game...</p>
        </div>
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mb-8">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent mb-4">
              Puzzle Rush: Hourly Drops
            </h1>
            <p className="text-purple-200 text-lg mb-2">
              New puzzles drop every hour - race for XP and traits!
            </p>
            <p className="text-purple-300 text-sm mb-4">
              Build your on-chain identity through verifiable puzzle mastery
            </p>
          </div>
          
          <div className="mb-8">
            <div className="grid grid-cols-3 gap-4 mb-6">
              {/* Sample puzzle pieces for decoration */}
              {['P', 'U', 'Z', 'Z', 'L', 'E'].map((letter, index) => (
                <div key={index} className="relative">
                  <svg width="48" height="48" viewBox="0 0 56 56" className="mx-auto">
                    <defs>
                      <linearGradient id={`previewGradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f97316" />
                        <stop offset="50%" stopColor="#fb923c" />
                        <stop offset="100%" stopColor="#fdba74" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M8 8 L24 8 Q28 4 32 8 Q36 12 32 16 L48 16 Q52 12 56 16 L56 32 Q60 36 56 40 Q52 44 56 48 L56 56 L40 56 Q36 60 32 56 Q28 52 32 48 L16 48 Q12 52 8 48 Q4 44 8 40 L8 24 Q4 20 8 16 Q12 12 8 8 Z"
                      fill={`url(#previewGradient-${index})`}
                      stroke="#a855f7"
                      strokeWidth="1"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{letter}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleStartGame}
            className="px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xl font-bold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105 border-2 border-orange-400 hover:border-orange-300 neon-glow"
          >
            Start Game
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="game-background text-white">
      {/* Top Navigation */}
      <TopNavigation
        level={playerProfile?.level || 1}
        soundEnabled={gameState.soundEnabled}
        volume={volume}
        isWalletConnected={isWalletConnected}
        onVolumeChange={handleVolumeChange}
        onSoundToggle={toggleSound}
        onRestart={handleRestart}
        onWalletConnect={handleWalletConnect}
        onShowProfile={() => setShowProfile(true)}
        onShowMissions={() => setShowMissions(true)}
        playerProfile={playerProfile}
      />

      {/* Main Game Area */}
      <div className="pt-[60px] p-4 max-w-4xl mx-auto">
        {/* Hourly Puzzle Timer */}
        {currentPuzzle && (
          <div className="mb-6">
            <HourlyPuzzleTimer
              nextPuzzleTime={new Date(currentPuzzle.expiryTime.getTime())}
              currentPuzzleExpiry={currentPuzzle.expiryTime}
              isRarePuzzle={currentPuzzle.isRare}
              onPuzzleExpired={handlePuzzleExpired}
            />
          </div>
        )}

        {/* Game Stats */}
        <div className="stats-card mb-6">
          <GameStats
          score={gameState.score}
          totalScore={playerProfile?.totalXP || 0}
          level={playerProfile?.level || 1}
          foundWords={gameState.discoveredWords.length}
          totalWords={gameState.availableWords.length}
          progressPercentage={progressPercentage}
          />
        </div>

        {/* Game Message */}
        {gameMessage && (
          <div className="text-center mb-4">
            <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              gameMessage.includes('Excellent!') || gameMessage.includes('Complete') ? 'emerald-accent neon-emerald' :
              gameMessage.includes('Not a valid') || gameMessage.includes('Already found') || gameMessage.includes('must be at least') || gameMessage.includes('Time\'s up') ? 'rose-accent neon-rose animate-pulse' :
              'gold-accent neon-gold'
            }`}>
              {gameMessage}
            </div>
          </div>
        )}

        {/* Main Game Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Letter Wheel */}
          <div className="flex flex-col items-center">
            <div className={`transition-all duration-200 ${incorrectSelection ? 'animate-pulse' : ''} ${!currentPuzzle?.isActive ? 'opacity-50 pointer-events-none' : ''}`}>
              <LetterWheel
                letters={gameState.letters}
                selectedLetters={gameState.selectedLetters}
                currentWord={gameState.currentWord}
                onLetterSelect={handleLetterSelect}
                onLetterDeselect={handleLetterDeselect}
                onWordSubmit={handleWordSubmit}
                incorrectSelection={incorrectSelection}
                disabled={!currentPuzzle?.isActive}
              />
            </div>
            
            {/* Controls */}
            <div className="flex space-x-4 mt-6">
              <button
                onClick={handleHint}
                disabled={gameState.hintsUsed >= 3 || !currentPuzzle?.isActive}
                className="flex items-center space-x-2 px-4 py-2 gold-accent rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl neon-gold focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 focus:ring-offset-primary-900"
              >
                <Lightbulb className="h-4 w-4" />
                <span>Hint ({3 - gameState.hintsUsed})</span>
              </button>
            </div>
          </div>

          {/* Word List */}
          <div>
            <WordList
              availableWords={gameState.availableWords}
              discoveredWords={gameState.discoveredWords}
              currentWord={gameState.currentWord}
            />
          </div>
        </div>
      </div>

      {/* Congratulations Page */}
      <CongratulationsPage
        level={playerProfile?.level || 1}
        score={gameState.score}
        timeBonus={0}
        wordsFound={gameState.discoveredWords.length}
        totalWords={gameState.availableWords.length}
        onContinue={handleNextPuzzle}
        isVisible={showCongratulations}
      />

      {/* Player Profile Modal */}
      {playerProfile && (
        <PlayerProfile
          profile={playerProfile}
          isVisible={showProfile}
          onClose={() => setShowProfile(false)}
        />
      )}

      {/* Mission Panel */}
      <MissionPanel
        missions={activeMissions}
        isVisible={showMissions}
        onClose={() => setShowMissions(false)}
      />

      {/* Achievements Panel */}
      <AchievementsPanel
        isVisible={showAchievements}
        onClose={() => setShowAchievements(false)}
        blockchainProfile={blockchainProfile}
        achievements={achievements}
        onAchievementClick={(achievement) => {
          console.log('Achievement clicked:', achievement);
        }}
      />
    </div>
  );
};

export default WordPuzzleGame;