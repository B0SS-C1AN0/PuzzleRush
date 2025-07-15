import { TokenTransaction, BlockchainProfile } from '../types/game';
import { TOKEN_REWARDS } from '../utils/honeycomb';

export interface TokenRewardReason {
  type: 'level_complete' | 'perfect_level' | 'first_word' | 'speed_bonus' | 'daily_streak' | 'achievement_unlock';
  description: string;
  amount: number;
}

export class TokenService {
  private static instance: TokenService;
  private tokenBalance: number = 0;
  private transactions: TokenTransaction[] = [];
  private dailyStreak: number = 0;
  private lastPlayDate: Date | null = null;

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }

  // Get current token balance
  getBalance(): number {
    return this.tokenBalance;
  }

  // Get transaction history
  getTransactions(): TokenTransaction[] {
    return [...this.transactions].reverse(); // Most recent first
  }

  // Award tokens for various game actions
  async awardTokens(reason: TokenRewardReason): Promise<TokenTransaction> {
    const transaction: TokenTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'earned',
      amount: reason.amount,
      reason: reason.description,
      timestamp: new Date()
    };

    this.tokenBalance += reason.amount;
    this.transactions.push(transaction);
    this.saveToStorage();

    console.log(`🪙 PUZZ Awarded: ${reason.amount} tokens for ${reason.description}`);
    return transaction;
  }

  // Spend tokens (for future features like hints, power-ups, etc.)
  async spendTokens(amount: number, reason: string): Promise<TokenTransaction | null> {
    if (this.tokenBalance < amount) {
      console.warn('Insufficient token balance');
      return null;
    }

    const transaction: TokenTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'spent',
      amount: amount,
      reason: reason,
      timestamp: new Date()
    };

    this.tokenBalance -= amount;
    this.transactions.push(transaction);
    this.saveToStorage();

    console.log(`💸 PUZZ Spent: ${amount} tokens for ${reason}`);
    return transaction;
  }

  // Check and award level completion tokens
  async awardLevelCompletion(isFirstWord: boolean = false): Promise<TokenTransaction[]> {
    const rewards: TokenTransaction[] = [];

    // Level completion reward
    const levelReward = await this.awardTokens({
      type: 'level_complete',
      description: 'Level Completed',
      amount: TOKEN_REWARDS.LEVEL_COMPLETE
    });
    rewards.push(levelReward);

    // First word bonus
    if (isFirstWord) {
      const firstWordReward = await this.awardTokens({
        type: 'first_word',
        description: 'First Word Found',
        amount: TOKEN_REWARDS.FIRST_WORD
      });
      rewards.push(firstWordReward);
    }

    return rewards;
  }

  // Check and award perfect level bonus
  async awardPerfectLevel(): Promise<TokenTransaction> {
    return await this.awardTokens({
      type: 'perfect_level',
      description: 'Perfect Level - 100% Words Found',
      amount: TOKEN_REWARDS.PERFECT_LEVEL
    });
  }

  // Check and award speed bonus
  async awardSpeedBonus(completionTime: number): Promise<TokenTransaction | null> {
    if (completionTime < 60) { // Under 1 minute
      return await this.awardTokens({
        type: 'speed_bonus',
        description: 'Speed Bonus - Under 1 Minute',
        amount: TOKEN_REWARDS.SPEED_BONUS
      });
    }
    return null;
  }

  // Check and award daily streak
  async checkAndAwardDailyStreak(): Promise<TokenTransaction | null> {
    const today = new Date();
    const todayStr = today.toDateString();
    
    if (this.lastPlayDate) {
      const lastPlayStr = this.lastPlayDate.toDateString();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();

      if (lastPlayStr === todayStr) {
        // Already played today, no additional streak
        return null;
      } else if (lastPlayStr === yesterdayStr) {
        // Played yesterday, continue streak
        this.dailyStreak += 1;
      } else {
        // Streak broken, reset
        this.dailyStreak = 1;
      }
    } else {
      // First time playing
      this.dailyStreak = 1;
    }

    this.lastPlayDate = today;
    this.saveToStorage();

    // Award daily streak bonus
    return await this.awardTokens({
      type: 'daily_streak',
      description: `Daily Streak Day ${this.dailyStreak}`,
      amount: TOKEN_REWARDS.DAILY_STREAK
    });
  }

  // Award achievement unlock tokens
  async awardAchievementUnlock(achievementName: string): Promise<TokenTransaction> {
    return await this.awardTokens({
      type: 'achievement_unlock',
      description: `Achievement Unlocked: ${achievementName}`,
      amount: TOKEN_REWARDS.ACHIEVEMENT_UNLOCK
    });
  }

  // Get daily streak count
  getDailyStreak(): number {
    return this.dailyStreak;
  }

  // Update blockchain profile with current token data
  updateBlockchainProfile(profile: BlockchainProfile): BlockchainProfile {
    return {
      ...profile,
      tokenBalance: this.tokenBalance,
      onChainStats: {
        ...profile.onChainStats,
        dailyStreak: this.dailyStreak,
        lastPlayedDate: this.lastPlayDate || new Date()
      }
    };
  }

  // Export transaction history for display
  getTransactionHistory(limit?: number): TokenTransaction[] {
    const sorted = [...this.transactions].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return limit ? sorted.slice(0, limit) : sorted;
  }

  // Get today's earnings
  getTodayEarnings(): number {
    const today = new Date().toDateString();
    return this.transactions
      .filter(tx => tx.type === 'earned' && tx.timestamp.toDateString() === today)
      .reduce((sum, tx) => sum + tx.amount, 0);
  }

  // Get total earnings
  getTotalEarnings(): number {
    return this.transactions
      .filter(tx => tx.type === 'earned')
      .reduce((sum, tx) => sum + tx.amount, 0);
  }

  // Save to localStorage
  private saveToStorage(): void {
    const data = {
      tokenBalance: this.tokenBalance,
      transactions: this.transactions,
      dailyStreak: this.dailyStreak,
      lastPlayDate: this.lastPlayDate?.toISOString()
    };
    localStorage.setItem('tokenService', JSON.stringify(data));
  }

  // Load from localStorage
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem('tokenService');
      if (data) {
        const parsed = JSON.parse(data);
        this.tokenBalance = parsed.tokenBalance || 0;
        this.transactions = (parsed.transactions || []).map((tx: any) => ({
          ...tx,
          timestamp: new Date(tx.timestamp)
        }));
        this.dailyStreak = parsed.dailyStreak || 0;
        this.lastPlayDate = parsed.lastPlayDate ? new Date(parsed.lastPlayDate) : null;
      }
    } catch (error) {
      console.error('Error loading token service data:', error);
    }
  }

  // Reset all data (for testing purposes)
  reset(): void {
    this.tokenBalance = 0;
    this.transactions = [];
    this.dailyStreak = 0;
    this.lastPlayDate = null;
    this.saveToStorage();
  }
}

export const tokenService = TokenService.getInstance();