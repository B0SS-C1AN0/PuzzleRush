import React, { useState, useEffect, useCallback, useMemo} from 'react';
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
import { HoneycombService } from '../services/honeycomb';
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
import { tokenService } from '../services/tokenService';

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
  const [isLoading, setIsLoading] = useState(false);
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
  const honeycombService = useMemo(() => new HoneycombService(import.meta.env.VITE_HONEYCOMB_API_KEY || ''), []);

  // Loading timeout to prevent infinite loading
  useEffect(() => {
    let loadingTimeout: NodeJS.Timeout;
    
    if (isLoading) {
      loadingTimeout = setTimeout(() => {
        console.warn('Loading timeout reached, clearing loading state');
        setIsLoading(false);
        setGameMessage('Loading timed out. Please try again.');
      }, 10000); // 10 second timeout
    }
    
    return () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };
  }, [isLoading]);

  const handleStartGame = () => {
    setGameStarted(true);
    initializeGame();
  };

  // Simple game initialization without complex hourly puzzle system
  const initializeGame = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Generate simple letter set for the current level
      const letterSet = generateLetterSet(gameState.level);
      const availableWords = await getAvailableWords(letterSet.letters);
      
      setGameState(prev => ({
        ...prev,
        letters: letterSet.letters,
        availableWords,
        discoveredWords: [],
        currentWord: '',
        selectedLetters: [],
        score: 0,
        hintsUsed: 0,
        isComplete: false
      }));
      
      setLevelStartTime(new Date());
      setIsFirstWord(false);
      setGameMessage('Find all the words to complete the level!');
    } catch (error) {
      console.error('Error initializing game:', error);
      setGameMessage('Error loading game. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [gameState.level]);

  // Initialize game
  useEffect(() => {
    if (gameStarted) {
      initializeGame();
    }
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
        name: 'Puzzle Master',
        totalPuzzTokens: 0,
        level: 1,
        currentStreak: 0,
        bestStreak: 0,
        gamesPlayed: 0,
        wordsFound: 0,
        averageScore: 0,
        achievements: [],
        traits: [],
        createdAt: new Date(),
        lastPlayed: new Date(),
        preferences: {
          soundEnabled: true,
          musicEnabled: true,
          hintsEnabled: true,
          showAnimations: true,
          difficulty: 'medium',
          colorTheme: 'default'
        },
        blockchainAchievements: [],
        tokenTransactions: []
      };
      setPlayerProfile(newProfile);
      savePlayerProfile(newProfile);
    }
    setIsLoading(false);
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
      // initializeBlockchainProfile(); // Commented out for now
    } else {
      setIsWalletConnected(false);
      setBlockchainProfile(null);
    }
  }, [wallet.connected, wallet.publicKey]);

  // Initialize achievements
  useEffect(() => {
    // const sampleAchievements = blockchainService.createSampleAchievements();
    // setAchievements(sampleAchievements);
  }, []);

  const getAvailableWords = async (letters: Letter[]): Promise<WordData[]> => {
    const letterCounts = letters.reduce((acc, letter) => {
      acc[letter.char] = (acc[letter.char] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const availableWords: WordData[] = [];
    const minLength = 3;
    const maxLength = Math.min(8, 5 + gameState.level);

    // Process words in chunks to avoid blocking the main thread
    const processWordsInChunks = async (words: string[], chunkSize = 50) => {
      for (let i = 0; i < words.length; i += chunkSize) {
        const chunk = words.slice(i, i + chunkSize);
        
        for (const word of chunk) {
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
        
        // Yield control back to the browser every chunk
        if (i + chunkSize < words.length) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    };

    // Process each word length
    for (let length = minLength; length <= maxLength; length++) {
      const wordsOfLength = wordDictionary[length] || [];
      await processWordsInChunks(wordsOfLength);
    }
    
    return availableWords.sort((a, b) => a.word.length - b.word.length);
  };

  // Auto-submit and auto-clear system
  useEffect(() => {
    const checkAndSubmitWord = async () => {
      if (gameState.currentWord.length >= 3) {
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
  }, [gameState.currentWord]);

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
    if (gameState.currentWord.length < 3) {
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
    const baseScore = wordData.score;
    const finalScore = baseScore;
    
    const newDiscoveredWords = [...gameState.discoveredWords, { ...wordData, found: true }];
    const newScore = gameState.score + finalScore;
    const newTotalScore = gameState.totalScore + finalScore;

    // Check if this is the first word and award PUZZ tokens
    let firstWordMessage = '';
    if (newDiscoveredWords.length === 1) {
      setIsFirstWord(true);
      const firstWordReward = await tokenService.awardTokens({
        type: 'first_word',
        description: 'First Word Found',
        amount: 50
      });
      firstWordMessage = ` +${firstWordReward.amount} PUZZ bonus! 🪙`;
    }

    setGameState(prev => ({
      ...prev,
      discoveredWords: newDiscoveredWords,
      score: newScore,
      totalScore: newTotalScore,
      currentWord: '',
      selectedLetters: [],
      isComplete: newDiscoveredWords.length === prev.availableWords.length
    }));

    setGameMessage(`Excellent! +${finalScore} points! 🎉${firstWordMessage}`);
    
    if (gameState.soundEnabled) {
      playSound('success');
    }

    // Check if level is complete
    const isLevelComplete = newDiscoveredWords.length === gameState.availableWords.length;
    if (isLevelComplete) {
      await handlePuzzleCompletion();
    }
  }, [gameState, playerProfile, isFirstWord]);

  const handlePuzzleCompletion = async () => {
    if (!playerProfile || !levelStartTime) return;
    
    const completionTime = Math.floor((new Date().getTime() - levelStartTime.getTime()) / 1000);
    const accuracy = Math.floor((gameState.discoveredWords.length / gameState.availableWords.length) * 100);
    const isPerfectLevel = accuracy === 100;
    
    // Award PUZZ tokens for level completion
    const levelRewards = await tokenService.awardLevelCompletion(isFirstWord);
    
    // Award perfect level bonus
    let perfectLevelReward = null;
    if (isPerfectLevel) {
      perfectLevelReward = await tokenService.awardPerfectLevel();
    }
    
    // Award speed bonus
    let speedReward = null;
    if (completionTime < 60) {
      speedReward = await tokenService.awardSpeedBonus(completionTime);
    }
    
    // Award daily streak
    const streakReward = await tokenService.checkAndAwardDailyStreak();
    
    // Calculate total PUZZ tokens earned
    const currentTokenBalance = tokenService.getBalance();
    
    // Update player profile
    const updatedProfile: PlayerProfileType = {
      ...playerProfile,
      totalPuzzTokens: currentTokenBalance,
      level: Math.floor(currentTokenBalance / 1000) + 1,
      gamesPlayed: playerProfile.gamesPlayed + 1,
      wordsFound: playerProfile.wordsFound + gameState.discoveredWords.length,
      averageScore: Math.floor((playerProfile.averageScore * playerProfile.gamesPlayed + gameState.score) / (playerProfile.gamesPlayed + 1)),
      currentStreak: isPerfectLevel ? playerProfile.currentStreak + 1 : 0,
      bestStreak: Math.max(playerProfile.bestStreak, isPerfectLevel ? playerProfile.currentStreak + 1 : 0),
      lastPlayed: new Date()
    };
    
    setPlayerProfile(updatedProfile);
    
    // Create reward message
    let rewardMessage = '🎊 Puzzle Complete! ';
    const totalEarned = levelRewards.reduce((sum, reward) => sum + reward.amount, 0) + 
                       (perfectLevelReward?.amount || 0) + 
                       (speedReward?.amount || 0) + 
                       (streakReward?.amount || 0);
    
    rewardMessage += `+${totalEarned} PUZZ tokens! 🪙`;
    
    if (isPerfectLevel) rewardMessage += ' ✨ Perfect Level!';
    if (speedReward) rewardMessage += ' ⚡ Speed Bonus!';
    if (streakReward) rewardMessage += ` 🔥 Day ${tokenService.getDailyStreak()} Streak!`;
    
    setGameMessage(rewardMessage);
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
    setGameState(prev => ({ ...prev, level: prev.level + 1 }));
    initializeGame();
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
    setGameState(prev => ({ ...prev, level: 1, totalScore: 0 }));
    initializeGame();
  };

  const handleTimeUp = () => {
    setGameMessage('⏰ Time\'s up! Try again!');
    setTimeout(() => {
      initializeGame();
    }, 2000);
  };

  const progressPercentage = gameState.availableWords.length > 0 
    ? (gameState.discoveredWords.length / gameState.availableWords.length) * 100 
    : 0;

  // Reset level start time when starting new level
  const startNewLevel = useCallback(() => {
    setLevelStartTime(new Date());
    setIsFirstWord(false);
  }, []);

  useEffect(() => {
    if (gameStarted && !isLoading) {
      startNewLevel();
    }
  }, [gameState.level, gameStarted, isLoading, startNewLevel]);

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
              Puzzle Rush
            </h1>
            <p className="text-purple-200 text-lg mb-2">
              Connect letters to form words and advance through levels!
            </p>
            <p className="text-purple-300 text-sm mb-4">
              Find all words to complete each level and earn XP
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
        blockchainProfile={blockchainProfile}
        onVolumeChange={handleVolumeChange}
        onSoundToggle={toggleSound}
        onRestart={handleRestart}
        onWalletConnect={handleWalletConnect}
        onShowProfile={() => setShowProfile(true)}
        onShowMissions={() => setShowMissions(true)}
        onShowAchievements={() => {}} // Disabled for now
        playerProfile={playerProfile}
      />

      {/* Main Game Area */}
      <div className="pt-[60px] p-4 max-w-4xl mx-auto">
        {/* Level Timer */}
        <div className="mb-6">
          <Timer
            level={gameState.level}
            isActive={!gameState.isComplete && !showCongratulations}
            onTimeUp={handleTimeUp}
            onReset={gameState.level}
          />
        </div>

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
            <div className={`transition-all duration-200 ${incorrectSelection ? 'animate-pulse' : ''} ${gameState.isComplete ? 'opacity-50 pointer-events-none' : ''}`}>
              <LetterWheel
                letters={gameState.letters}
                selectedLetters={gameState.selectedLetters}
                currentWord={gameState.currentWord}
                onLetterSelect={handleLetterSelect}
                onLetterDeselect={handleLetterDeselect}
                onWordSubmit={handleWordSubmit}
                incorrectSelection={incorrectSelection}
                disabled={gameState.isComplete}
              />
            </div>
            
            {/* Controls */}
            <div className="flex space-x-4 mt-6">
              <button
                onClick={handleHint}
                disabled={gameState.hintsUsed >= 3 || gameState.isComplete}
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

    </div>
  );
};

export default WordPuzzleGame;