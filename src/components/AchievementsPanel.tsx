import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Trophy, Star, Coins, Medal, Crown, Gift, Lock, CheckCircle } from 'lucide-react';
import { Achievement, BlockchainProfile, TokenTransaction, AchievementType } from '../types/game';
import { honeycombClient, TOKEN_REWARDS } from '../utils/honeycomb';
import { WalletButton } from './wallet';

interface AchievementsPanelProps {
  isVisible: boolean;
  onClose: () => void;
  blockchainProfile?: BlockchainProfile;
  achievements: Achievement[];
  onAchievementClick?: (achievement: Achievement) => void;
}

const AchievementsPanel: React.FC<AchievementsPanelProps> = ({
  isVisible,
  onClose,
  blockchainProfile,
  achievements,
  onAchievementClick
}) => {
  const wallet = useWallet();
  const [activeTab, setActiveTab] = useState<'achievements' | 'nfts' | 'tokens'>('achievements');
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  if (!isVisible) return null;

  const unlockedAchievements = achievements.filter(a => a.isUnlocked);
  const lockedAchievements = achievements.filter(a => !a.isUnlocked);

  const rarityColors = {
    common: 'from-gray-400 to-gray-600',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-yellow-400 to-yellow-600'
  };

  const achievementIcons: Record<AchievementType, JSX.Element> = {
    first_word: <Star className="w-6 h-6" />,
    speed_demon: <Trophy className="w-6 h-6" />,
    word_master: <Crown className="w-6 h-6" />,
    perfect_level: <Medal className="w-6 h-6" />,
    daily_warrior: <CheckCircle className="w-6 h-6" />,
    puzzle_pioneer: <Gift className="w-6 h-6" />,
    vocabulary_virtuoso: <Star className="w-6 h-6" />,
    letter_legend: <Crown className="w-6 h-6" />
  };

  const createBlockchainProfile = async () => {
    if (!wallet.publicKey) return;
    
    setIsCreatingProfile(true);
    try {
      // This would typically create a Honeycomb profile
      // For demo purposes, we'll simulate this
      console.log('Creating blockchain profile for:', wallet.publicKey.toBase58());
      // In production, you'd call honeycombClient.createCreateUserTransaction
    } catch (error) {
      console.error('Error creating blockchain profile:', error);
    } finally {
      setIsCreatingProfile(false);
    }
  };

  const AchievementCard: React.FC<{ achievement: Achievement }> = ({ achievement }) => (
    <div
      className={`relative p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-105 ${
        achievement.isUnlocked
          ? `bg-gradient-to-br ${rarityColors[achievement.rarity]} text-white border-transparent`
          : 'bg-gray-700 border-gray-600 text-gray-400'
      }`}
      onClick={() => onAchievementClick?.(achievement)}
    >
      <div className="flex items-center space-x-3 mb-2">
        <div className={`p-2 rounded ${achievement.isUnlocked ? 'bg-white/20' : 'bg-gray-600'}`}>
          {achievement.isUnlocked ? achievementIcons[achievement.type] : <Lock className="w-6 h-6" />}
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-sm">{achievement.name}</h4>
          <p className="text-xs opacity-80">{achievement.description}</p>
        </div>
        {achievement.isNFT && achievement.isUnlocked && (
          <div className="bg-gradient-to-r from-pink-500 to-violet-500 text-white text-xs px-2 py-1 rounded">
            NFT
          </div>
        )}
      </div>
      
      {!achievement.isUnlocked && (
        <div className="mt-2">
          <div className="flex justify-between text-xs mb-1">
            <span>Progress</span>
            <span>{achievement.progress}/{achievement.maxProgress}</span>
          </div>
          <div className="w-full bg-gray-600 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
            />
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center mt-3 text-xs">
        <span className="capitalize">{achievement.rarity}</span>
        <div className="flex items-center space-x-1">
          <Coins className="w-3 h-3" />
          <span>{achievement.tokenReward}</span>
        </div>
      </div>
    </div>
  );

  const TokensTab = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Token Balance</h3>
            <p className="text-2xl font-bold">
              {blockchainProfile?.tokenBalance || 0} WCOOKIE
            </p>
          </div>
          <Coins className="w-12 h-12" />
        </div>
      </div>

      <div className="bg-primary-700 p-4 rounded-lg">
        <h4 className="font-bold mb-3 text-gold-300">Earning Opportunities</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Complete Level</span>
            <span className="text-green-400">+{TOKEN_REWARDS.LEVEL_COMPLETE} WCOOKIE</span>
          </div>
          <div className="flex justify-between">
            <span>Perfect Level</span>
            <span className="text-green-400">+{TOKEN_REWARDS.PERFECT_LEVEL} WCOOKIE</span>
          </div>
          <div className="flex justify-between">
            <span>Daily Streak</span>
            <span className="text-green-400">+{TOKEN_REWARDS.DAILY_STREAK} WCOOKIE</span>
          </div>
          <div className="flex justify-between">
            <span>Unlock Achievement</span>
            <span className="text-green-400">+{TOKEN_REWARDS.ACHIEVEMENT_UNLOCK} WCOOKIE</span>
          </div>
        </div>
      </div>
    </div>
  );

  const NFTsTab = () => {
    const nftAchievements = achievements.filter(a => a.isNFT && a.isUnlocked);
    
    return (
      <div className="space-y-4">
        {nftAchievements.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {nftAchievements.map(achievement => (
              <div key={achievement.id} className="bg-primary-700 p-4 rounded-lg border border-gold-400/30">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${rarityColors[achievement.rarity]} text-white mb-3`}>
                  {achievementIcons[achievement.type]}
                </div>
                <h4 className="font-bold text-sm text-gold-300">{achievement.name}</h4>
                <p className="text-xs text-gray-300 mt-1">{achievement.description}</p>
                <div className="mt-2 text-xs">
                  <span className="bg-gradient-to-r from-pink-500 to-violet-500 text-white px-2 py-1 rounded">
                    NFT Achievement
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No NFT achievements unlocked yet!</p>
            <p className="text-sm mt-2">Complete challenges to earn NFT achievements</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-primary-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gold-600 to-gold-500 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Trophy className="w-8 h-8 text-primary-900" />
              <div>
                <h2 className="text-2xl font-bold text-primary-900">Achievements & Rewards</h2>
                <p className="text-primary-800">Your blockchain progress and NFT collection</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-primary-900 hover:text-primary-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Wallet Connection Status */}
        {!wallet.connected ? (
          <div className="p-6 text-center border-b border-gray-700">
            <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4 mb-4">
              <p className="text-yellow-400 mb-3">Connect your wallet to access blockchain features</p>
              <WalletButton />
            </div>
          </div>
        ) : !blockchainProfile?.honeycombProfileId ? (
          <div className="p-6 text-center border-b border-gray-700">
            <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4 mb-4">
              <p className="text-blue-400 mb-3">Create your on-chain profile to start earning rewards</p>
              <button
                onClick={createBlockchainProfile}
                disabled={isCreatingProfile}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
              >
                {isCreatingProfile ? 'Creating Profile...' : 'Create Blockchain Profile'}
              </button>
            </div>
          </div>
        ) : null}

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {['achievements', 'nfts', 'tokens'].map((tab) => (
            <button
              key={tab}
              className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${
                activeTab === tab
                  ? 'bg-primary-700 text-gold-400 border-b-2 border-gold-400'
                  : 'text-gray-400 hover:text-white hover:bg-primary-700/50'
              }`}
              onClick={() => setActiveTab(tab as any)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'achievements' && (
            <div className="space-y-6">
              {unlockedAchievements.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gold-300 mb-4">Unlocked Achievements</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {unlockedAchievements.map(achievement => (
                      <AchievementCard key={achievement.id} achievement={achievement} />
                    ))}
                  </div>
                </div>
              )}
              
              {lockedAchievements.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-400 mb-4">Locked Achievements</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lockedAchievements.map(achievement => (
                      <AchievementCard key={achievement.id} achievement={achievement} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'nfts' && <NFTsTab />}
          {activeTab === 'tokens' && <TokensTab />}
        </div>
      </div>
    </div>
  );
};

export default AchievementsPanel;