import createEdgeClient from "@honeycomb-protocol/edge-client";

// Using Honeycomb's test network (Honeynet) for development
const API_URL = "https://edge.test.honeycombprotocol.com/";
const RPC_URL = "https://rpc.test.honeycombprotocol.com";

export const honeycombClient = createEdgeClient(API_URL, true);

// Project configuration - in production, these would be loaded from environment variables
export const HONEYCOMB_CONFIG = {
  network: RPC_URL,
  projectId: null, // Will be set after project creation
  achievements: [
    "First Word",
    "Speed Demon", 
    "Word Master",
    "Perfect Level",
    "Daily Warrior",
    "Puzzle Pioneer",
    "Vocabulary Virtuoso",
    "Letter Legend"
  ],
  customDataFields: [
    "totalWordsFound",
    "dailyStreak", 
    "perfectLevels",
    "averageTimePerWord",
    "favoriteLetterCombination"
  ]
};

// Token reward amounts for different achievements
export const TOKEN_REWARDS = {
  LEVEL_COMPLETE: 100,
  PERFECT_LEVEL: 200,
  FIRST_WORD: 50,
  SPEED_BONUS: 25,
  DAILY_STREAK: 150,
  ACHIEVEMENT_UNLOCK: 300
};

export { RPC_URL };