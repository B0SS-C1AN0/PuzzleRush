import { PublicKey } from '@solana/web3.js';
import { sendClientTransactions } from '@honeycomb-protocol/edge-client/client/walletHelpers';
import { honeycombClient, HONEYCOMB_CONFIG, TOKEN_REWARDS } from '../utils/honeycomb';
import { 
  Achievement, 
  BlockchainProfile, 
  OnChainStats, 
  BlockchainReward,
  AchievementType,
  TokenTransaction 
} from '../types/game';

export class BlockchainService {
  private static instance: BlockchainService;
  private projectAddress: string | null = null;

  private constructor() {}

  static getInstance(): BlockchainService {
    if (!BlockchainService.instance) {
      BlockchainService.instance = new BlockchainService();
    }
    return BlockchainService.instance;
  }

  // Initialize Honeycomb project (call once during app setup)
  async initializeProject(authorityWallet: any): Promise<string> {
    try {
      if (this.projectAddress) return this.projectAddress;

      const {
        createCreateProjectTransaction: {
          project: projectAddress,
          tx: txResponse,
        },
      } = await honeycombClient.createCreateProjectTransaction({
        name: "Word Cookie Blockchain Game",
        authority: authorityWallet.publicKey.toBase58(),
        payer: authorityWallet.publicKey.toBase58(),
        profileDataConfig: {
          achievements: HONEYCOMB_CONFIG.achievements,
          customDataFields: HONEYCOMB_CONFIG.customDataFields
        }
      });

      await sendClientTransactions(honeycombClient, authorityWallet, txResponse);
      
      this.projectAddress = projectAddress;
      return projectAddress;
    } catch (error) {
      console.error('Error initializing Honeycomb project:', error);
      throw error;
    }
  }

  // Create user profile on Honeycomb
  async createUserProfile(wallet: any): Promise<BlockchainProfile> {
    try {
      if (!this.projectAddress) {
        throw new Error('Project not initialized');
      }

      const {
        createCreateUserTransaction: {
          user: userAddress,
          tx: txResponse,
        },
      } = await honeycombClient.createCreateUserTransaction({
        project: this.projectAddress,
        authority: wallet.publicKey.toBase58(),
        payer: wallet.publicKey.toBase58(),
        profileDataConfig: {
          achievements: [],
          customDataFields: {}
        }
      });

      await sendClientTransactions(honeycombClient, wallet, txResponse);

      return {
        walletAddress: wallet.publicKey.toBase58(),
        honeycombProfileId: userAddress,
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
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  // Update on-chain player stats
  async updatePlayerStats(
    wallet: any, 
    profileId: string, 
    stats: Partial<OnChainStats>
  ): Promise<void> {
    try {
      // In a real implementation, you would use Honeycomb's resource system
      // to update player stats on-chain
      console.log('Updating player stats:', { profileId, stats });
      
      // For demo purposes, we'll simulate this
      // In production, you'd call honeycombClient methods to update resources
    } catch (error) {
      console.error('Error updating player stats:', error);
      throw error;
    }
  }

  // Award tokens for game actions
  async awardTokens(
    wallet: any,
    profileId: string,
    reason: string,
    amount: number
  ): Promise<TokenTransaction> {
    try {
      console.log(`Awarding ${amount} tokens for: ${reason}`);
      
      // In a real implementation, you would mint tokens using Honeycomb's resource system
      // For demo purposes, we'll return a mock transaction
      
      const transaction: TokenTransaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'earned',
        amount,
        reason,
        timestamp: new Date(),
        transactionHash: `mock_hash_${Date.now()}`
      };

      return transaction;
    } catch (error) {
      console.error('Error awarding tokens:', error);
      throw error;
    }
  }

  // Check and unlock achievements
  async checkAchievements(
    wallet: any,
    profileId: string,
    gameStats: {
      wordsFound: number;
      levelCompleted: boolean;
      isPerfectLevel: boolean;
      completionTime: number;
      isFirstWord: boolean;
      dailyStreak: number;
    }
  ): Promise<BlockchainReward[]> {
    const rewards: BlockchainReward[] = [];

    try {
      // Check various achievement conditions
      if (gameStats.isFirstWord) {
        const reward = await this.unlockAchievement(wallet, profileId, 'first_word');
        if (reward) rewards.push(reward);
      }

      if (gameStats.isPerfectLevel) {
        const reward = await this.unlockAchievement(wallet, profileId, 'perfect_level');
        if (reward) rewards.push(reward);
        
        // Award bonus tokens for perfect level
        const tokenReward = await this.awardTokens(
          wallet, 
          profileId, 
          'Perfect Level Bonus', 
          TOKEN_REWARDS.PERFECT_LEVEL
        );
        rewards.push({
          type: 'token',
          amount: TOKEN_REWARDS.PERFECT_LEVEL,
          message: 'Perfect Level Bonus!'
        });
      }

      if (gameStats.levelCompleted) {
        // Award tokens for level completion
        const tokenReward = await this.awardTokens(
          wallet, 
          profileId, 
          'Level Completed', 
          TOKEN_REWARDS.LEVEL_COMPLETE
        );
        rewards.push({
          type: 'token',
          amount: TOKEN_REWARDS.LEVEL_COMPLETE,
          message: 'Level Completed!'
        });
      }

      if (gameStats.completionTime < 60) { // Less than 1 minute
        const reward = await this.unlockAchievement(wallet, profileId, 'speed_demon');
        if (reward) rewards.push(reward);
      }

      if (gameStats.dailyStreak >= 7) {
        const reward = await this.unlockAchievement(wallet, profileId, 'daily_warrior');
        if (reward) rewards.push(reward);
      }

      return rewards;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return rewards;
    }
  }

  // Unlock a specific achievement
  private async unlockAchievement(
    wallet: any,
    profileId: string,
    achievementType: AchievementType
  ): Promise<BlockchainReward | null> {
    try {
      // Check if achievement is already unlocked (you'd query this from your state)
      // For demo purposes, we'll assume it's new
      
      console.log(`Unlocking achievement: ${achievementType}`);
      
      // In a real implementation, you might mint an NFT for certain achievements
      // using Honeycomb's character or resource system
      
      const isNFTAchievement = ['word_master', 'letter_legend', 'vocabulary_virtuoso'].includes(achievementType);
      
      if (isNFTAchievement) {
        // Create NFT achievement
        return {
          type: 'nft',
          achievementId: achievementType,
          message: `NFT Achievement Unlocked: ${achievementType.replace('_', ' ').toUpperCase()}!`,
          nftMetadata: {
            name: `${achievementType.replace('_', ' ').toUpperCase()} Achievement`,
            description: `Awarded for exceptional performance in Word Cookie`,
            image: `https://placeholder.com/achievement-${achievementType}.png`,
            attributes: [
              { trait_type: 'Achievement Type', value: achievementType },
              { trait_type: 'Game', value: 'Word Cookie' },
              { trait_type: 'Rarity', value: 'Epic' }
            ],
            mint: `mock_nft_${achievementType}_${Date.now()}`
          }
        };
      } else {
        // Regular achievement with token reward
        await this.awardTokens(wallet, profileId, `Achievement: ${achievementType}`, TOKEN_REWARDS.ACHIEVEMENT_UNLOCK);
        
        return {
          type: 'achievement',
          achievementId: achievementType,
          amount: TOKEN_REWARDS.ACHIEVEMENT_UNLOCK,
          message: `Achievement Unlocked: ${achievementType.replace('_', ' ').toUpperCase()}!`
        };
      }
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      return null;
    }
  }

  // Get player's blockchain profile
  async getPlayerProfile(walletAddress: string): Promise<BlockchainProfile | null> {
    try {
      // In a real implementation, you would query Honeycomb for the user's profile
      // For demo purposes, we'll return mock data or null
      
      console.log('Fetching player profile for:', walletAddress);
      
      // This would typically query the blockchain for actual data
      return null;
    } catch (error) {
      console.error('Error getting player profile:', error);
      return null;
    }
  }

  // Create sample achievements for the game
  createSampleAchievements(): Achievement[] {
    return [
      {
        id: 'first_word',
        name: 'First Word',
        description: 'Find your first word in any level',
        icon: '⭐',
        type: 'first_word',
        rarity: 'common',
        isNFT: false,
        tokenReward: TOKEN_REWARDS.FIRST_WORD,
        progress: 0,
        maxProgress: 1,
        isUnlocked: false
      },
      {
        id: 'speed_demon',
        name: 'Speed Demon',
        description: 'Complete a level in under 1 minute',
        icon: '⚡',
        type: 'speed_demon',
        rarity: 'rare',
        isNFT: false,
        tokenReward: TOKEN_REWARDS.ACHIEVEMENT_UNLOCK,
        progress: 0,
        maxProgress: 1,
        isUnlocked: false
      },
      {
        id: 'word_master',
        name: 'Word Master',
        description: 'Find 1000 words across all levels',
        icon: '👑',
        type: 'word_master',
        rarity: 'epic',
        isNFT: true,
        tokenReward: TOKEN_REWARDS.ACHIEVEMENT_UNLOCK,
        progress: 0,
        maxProgress: 1000,
        isUnlocked: false
      },
      {
        id: 'perfect_level',
        name: 'Perfect Level',
        description: 'Complete a level with 100% words found',
        icon: '💎',
        type: 'perfect_level',
        rarity: 'rare',
        isNFT: false,
        tokenReward: TOKEN_REWARDS.ACHIEVEMENT_UNLOCK,
        progress: 0,
        maxProgress: 1,
        isUnlocked: false
      },
      {
        id: 'daily_warrior',
        name: 'Daily Warrior',
        description: 'Play for 7 consecutive days',
        icon: '🗡️',
        type: 'daily_warrior',
        rarity: 'rare',
        isNFT: false,
        tokenReward: TOKEN_REWARDS.ACHIEVEMENT_UNLOCK,
        progress: 0,
        maxProgress: 7,
        isUnlocked: false
      },
      {
        id: 'letter_legend',
        name: 'Letter Legend',
        description: 'Reach level 50',
        icon: '🏆',
        type: 'letter_legend',
        rarity: 'legendary',
        isNFT: true,
        tokenReward: TOKEN_REWARDS.ACHIEVEMENT_UNLOCK,
        progress: 0,
        maxProgress: 50,
        isUnlocked: false
      }
    ];
  }
}

export const blockchainService = BlockchainService.getInstance();