import React, { useState } from 'react';
import { User, Trophy, Zap, Star, Award, TrendingUp, Calendar, Target } from 'lucide-react';
import { PlayerProfile as PlayerProfileType, PlayerTrait, Badge } from '../types/game';

interface PlayerProfileProps {
  profile: PlayerProfileType;
  isVisible: boolean;
  onClose: () => void;
}

const PlayerProfile: React.FC<PlayerProfileProps> = ({ profile, isVisible, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'traits' | 'history' | 'badges'>('overview');

  if (!isVisible) return null;

  const getPuzzTokensForNextLevel = (currentLevel: number): number => {
    return currentLevel * 1000; // 1000 PUZZ tokens per level
  };

  const getCurrentLevelPuzzTokens = (totalPuzzTokens: number, level: number): number => {
    const previousLevelTokens = (level - 1) * 1000;
    return totalPuzzTokens - previousLevelTokens;
  };

  const nextLevelTokens = getPuzzTokensForNextLevel(profile.level);
  const currentLevelTokens = getCurrentLevelPuzzTokens(profile.totalPuzzTokens, profile.level);
  const progressPercentage = (currentLevelTokens / nextLevelTokens) * 100;

  const TraitCard: React.FC<{ trait: PlayerTrait }> = ({ trait }) => (
    <div className="bg-primary-700 rounded-lg p-4 border border-gold-400/30">
      <div className="flex items-center space-x-3 mb-2">
        <span className="text-2xl">{trait.icon}</span>
        <div>
          <h4 className="font-bold text-gold-300">{trait.name}</h4>
          <p className="text-xs text-gray-300">{trait.description}</p>
        </div>
      </div>
      <div className="space-y-1">
        {trait.benefits.map((benefit, index) => (
          <div key={index} className="text-xs text-emerald-400">
            ✓ {benefit.description}
          </div>
        ))}
      </div>
    </div>
  );

  const BadgeCard: React.FC<{ badge: Badge }> = ({ badge }) => (
    <div className={`bg-primary-700 rounded-lg p-3 border text-center ${
      badge.rarity === 'legendary' ? 'border-gold-400 bg-gradient-to-br from-gold-900/20 to-gold-800/20' :
      badge.rarity === 'epic' ? 'border-purple-400 bg-gradient-to-br from-purple-900/20 to-purple-800/20' :
      badge.rarity === 'rare' ? 'border-blue-400 bg-gradient-to-br from-blue-900/20 to-blue-800/20' :
      'border-gray-400'
    }`}>
      <div className="text-3xl mb-2">{badge.icon}</div>
      <h4 className="font-bold text-sm text-white">{badge.name}</h4>
      <p className="text-xs text-gray-300 mt-1">{badge.description}</p>
      <div className={`text-xs mt-2 font-medium ${
        badge.rarity === 'legendary' ? 'text-gold-400' :
        badge.rarity === 'epic' ? 'text-purple-400' :
        badge.rarity === 'rare' ? 'text-blue-400' :
        'text-gray-400'
      }`}>
        {badge.rarity.toUpperCase()}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm p-4">
      <div className="bg-primary-800 rounded-xl shadow-2xl border border-gold-400/30 max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-700 to-primary-600 p-6 border-b border-gold-400/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-gold-500 to-gold-600 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gold-300">{profile.username}</h2>
                <p className="text-gray-300">Level {profile.level} Puzzle Master</p>
                {profile.walletAddress && (
                  <p className="text-xs text-gray-400 font-mono">
                    {profile.walletAddress.slice(0, 6)}...{profile.walletAddress.slice(-4)}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary-600 hover:bg-primary-500 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Level Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-300 mb-2">
              <span>Level {profile.level}</span>
                              <span>{profile.totalPuzzTokens.toLocaleString()} PUZZ</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-gold-500 to-gold-400 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="text-xs text-gray-400 mt-1 text-center">
              {currentLevelTokens} / {nextLevelTokens} PUZZ to next level
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gold-400/20">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'traits', label: 'Traits', icon: Star },
            { id: 'badges', label: 'Badges', icon: Award },
            { id: 'history', label: 'History', icon: Calendar }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 transition-colors ${
                activeTab === tab.id
                  ? 'bg-gold-400/20 text-gold-300 border-b-2 border-gold-400'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-primary-700/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto custom-scrollbar">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-primary-700 rounded-lg p-4 text-center">
                  <Trophy className="w-6 h-6 text-gold-400 mx-auto mb-2" />
                  <div className="text-xl font-bold text-white">{profile.totalPuzzTokens.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">Total PUZZ</div>
                </div>
                <div className="bg-primary-700 rounded-lg p-4 text-center">
                  <Zap className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                  <div className="text-xl font-bold text-white">{profile.streakCount}</div>
                  <div className="text-xs text-gray-400">Current Streak</div>
                </div>
                <div className="bg-primary-700 rounded-lg p-4 text-center">
                  <Target className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                  <div className="text-xl font-bold text-white">{profile.longestStreak}</div>
                  <div className="text-xs text-gray-400">Best Streak</div>
                </div>
                <div className="bg-primary-700 rounded-lg p-4 text-center">
                  <Star className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                  <div className="text-xl font-bold text-white">{profile.reputation}</div>
                  <div className="text-xs text-gray-400">Reputation</div>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-lg font-bold text-gold-300 mb-3">Recent Activity</h3>
                <div className="space-y-2">
                  {profile.puzzleHistory.slice(0, 5).map((attempt, index) => (
                    <div key={index} className="bg-primary-700/50 rounded-lg p-3 flex justify-between items-center">
                      <div>
                        <div className="text-sm text-white">Puzzle #{attempt.puzzleId.slice(-6)}</div>
                        <div className="text-xs text-gray-400">
                          {attempt.wordsFound.length} words • {attempt.accuracy}% accuracy
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-emerald-400">+{attempt.puzzTokensEarned} PUZZ</div>
                        <div className="text-xs text-gray-400">
                          {Math.floor(attempt.completionTime / 60)}:{(attempt.completionTime % 60).toString().padStart(2, '0')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'traits' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gold-300">Unlocked Traits</h3>
              {profile.traits.length > 0 ? (
                <div className="grid gap-4">
                  {profile.traits.map(trait => (
                    <TraitCard key={trait.id} trait={trait} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No traits unlocked yet</p>
                  <p className="text-sm mt-2">Complete puzzles to unlock special abilities!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'badges' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gold-300">Badge Collection</h3>
              {profile.badges.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {profile.badges.map(badge => (
                    <BadgeCard key={badge.id} badge={badge} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No badges earned yet</p>
                  <p className="text-sm mt-2">Complete challenges to earn badges!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gold-300">Puzzle History</h3>
              <div className="space-y-3">
                {profile.puzzleHistory.map((attempt, index) => (
                  <div key={index} className="bg-primary-700/50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium text-white">Puzzle #{attempt.puzzleId.slice(-8)}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(attempt.startTime).toLocaleDateString()} at{' '}
                          {new Date(attempt.startTime).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-emerald-400 font-bold">+{attempt.puzzTokensEarned} PUZZ</div>
                        <div className="text-xs text-gray-400">{attempt.accuracy}% accuracy</div>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">{attempt.wordsFound.length} words found</span>
                      <span className="text-gray-300">
                        {Math.floor(attempt.completionTime / 60)}:{(attempt.completionTime % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerProfile;