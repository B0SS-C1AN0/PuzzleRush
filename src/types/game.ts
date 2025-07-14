export interface Letter {
  id: string;
  char: string;
  index: number;
}

export interface WordData {
  word: string;
  score: number;
  found: boolean;
}

export interface GameState {
  level: number;
  letters: Letter[];
  discoveredWords: WordData[];
  availableWords: WordData[];
  currentWord: string;
  selectedLetters: Letter[];
  score: number;
  totalScore: number;
  hintsUsed: number;
  soundEnabled: boolean;
  isComplete: boolean;
}

export interface GameProgress {
  level: number;
  totalScore: number;
  soundEnabled: boolean;
}

export interface LetterSet {
  letters: Letter[];
  centerLetter: string;
}

// New interfaces for hourly puzzle system
export interface HourlyPuzzle {
  id: string;
  releaseTime: Date;
  expiryTime: Date;
  category: PuzzleCategory;
  difficulty: PuzzleDifficulty;
  letters: Letter[];
  targetWords: string[];
  xpReward: number;
  isActive: boolean;
  isRare?: boolean;
}

// Blockchain-related types for Honeycomb Protocol integration
export interface BlockchainProfile {
  walletAddress: string;
  honeycombProfileId?: string;
  tokenBalance: number;
  nftCount: number;
  onChainStats: OnChainStats;
  isWalletConnected: boolean;
}

export interface OnChainStats {
  totalWordsFound: number;
  dailyStreak: number;
  perfectLevels: number;
  averageTimePerWord: number;
  favoriteLetterCombination: string;
  lastPlayedDate: Date;
  achievementsUnlocked: string[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: AchievementType;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: Date;
  isNFT: boolean;
  nftMint?: string;
  tokenReward: number;
  progress: number;
  maxProgress: number;
  isUnlocked: boolean;
}

export type AchievementType = 
  | 'first_word'
  | 'speed_demon'
  | 'word_master'
  | 'perfect_level'
  | 'daily_warrior'
  | 'puzzle_pioneer'
  | 'vocabulary_virtuoso'
  | 'letter_legend';

export interface TokenTransaction {
  id: string;
  type: 'earned' | 'spent';
  amount: number;
  reason: string;
  timestamp: Date;
  transactionHash?: string;
}

export interface BlockchainReward {
  type: 'token' | 'nft' | 'achievement';
  amount?: number;
  achievementId?: string;
  nftMetadata?: NFTMetadata;
  message: string;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: NFTAttribute[];
  mint: string;
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
}

// Enhanced PlayerProfile to include blockchain features
export interface PlayerProfile {
  id: string;
  name: string;
  level: number;
  totalXP: number;
  currentStreak: number;
  bestStreak: number;
  gamesPlayed: number;
  wordsFound: number;
  averageScore: number;
  achievements: Badge[];
  traits: PlayerTrait[];
  createdAt: Date;
  lastPlayed: Date;
  preferences: PlayerPreferences;
  
  // Blockchain features
  blockchain?: BlockchainProfile;
  blockchainAchievements: Achievement[];
  tokenTransactions: TokenTransaction[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt: Date;
  category: BadgeCategory;
}

export interface PlayerTrait {
  id: string;
  name: string;
  description: string;
  icon: string;
  level: number;
  benefits: TraitBenefit[];
  category: TraitCategory;
}

export interface TraitBenefit {
  type: 'score_multiplier' | 'hint_discount' | 'time_bonus' | 'xp_bonus';
  value: number;
  description: string;
}

export interface PlayerPreferences {
  soundEnabled: boolean;
  musicEnabled: boolean;
  hintsEnabled: boolean;
  showAnimations: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  colorTheme: 'default' | 'dark' | 'colorful';
}

export type BadgeCategory = 'achievement' | 'milestone' | 'special' | 'seasonal';
export type TraitCategory = 'cognitive' | 'strategic' | 'social' | 'creative';
export type PuzzleCategory = 'daily' | 'weekly' | 'special' | 'community';
export type PuzzleDifficulty = 'easy' | 'medium' | 'hard' | 'expert';
export type MissionType = 'hourly_puzzle' | 'streak_challenge' | 'rare_puzzle_drop' | 'daily_quest';

// Honeycomb integration types
export interface HoneycombMission {
  id: string;
  puzzleId: string;
  releaseTime: string;
  category: string;
  metadata: Record<string, any>;
}

export interface OnChainIdentity {
  walletAddress: string;
  traits: PlayerTrait[];
  verifiedPuzzles: string[];
  reputation: number;
  lastUpdated: Date;
}