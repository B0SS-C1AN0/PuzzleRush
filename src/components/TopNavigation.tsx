import React, { useState, useRef, useEffect } from 'react';
import { Settings, Volume2, VolumeX, RotateCcw, Wallet, Wifi, WifiOff, User, Target, Trophy, Coins } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PlayerProfile, BlockchainProfile } from '../types/game';
import { WalletButton } from './wallet';

interface TopNavigationProps {
  level: number;
  soundEnabled: boolean;
  volume: number;
  isWalletConnected: boolean;
  onVolumeChange: (volume: number) => void;
  onSoundToggle: () => void;
  onRestart: () => void;
  onWalletConnect: () => void;
  onShowProfile: () => void;
  onShowMissions: () => void;
  onShowAchievements: () => void; // New prop for achievements
  playerProfile: PlayerProfile | null;
  blockchainProfile?: BlockchainProfile;
}

const TopNavigation: React.FC<TopNavigationProps> = ({
  level,
  soundEnabled,
  volume,
  isWalletConnected,
  onVolumeChange,
  onSoundToggle,
  onRestart,
  onWalletConnect,
  onShowProfile,
  onShowMissions,
  onShowAchievements,
  playerProfile,
  blockchainProfile
}) => {
  const wallet = useWallet();
  const [showSettings, setShowSettings] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const walletRef = useRef<HTMLDivElement>(null);

  // Close settings dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
      if (walletRef.current && !walletRef.current.contains(event.target as Node)) {
        setShowWalletMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRestart = () => {
    setShowRestartConfirm(true);
    setShowSettings(false);
  };

  const confirmRestart = () => {
    onRestart();
    setShowRestartConfirm(false);
  };

  const cancelRestart = () => {
    setShowRestartConfirm(false);
  };

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-[60px] bg-gradient-to-r from-primary-900 via-primary-800 to-primary-900 border-b border-gold-400/30 shadow-lg">
        <div className="flex items-center justify-between h-full px-4 max-w-7xl mx-auto">
          {/* Left Section - Settings */}
          <div className="flex items-center space-x-4 min-w-[120px]">
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary-700 hover:bg-primary-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 focus:ring-offset-primary-900 neon-purple"
                aria-label="Settings"
                aria-expanded={showSettings}
                aria-haspopup="true"
              >
                <Settings className="w-4 h-4 text-gold-300 hover:text-gold-200 transition-colors duration-200" />
              </button>

              {/* Settings Dropdown */}
              {showSettings && (
                <div className="absolute top-12 left-0 w-64 bg-primary-800 rounded-xl shadow-xl border border-gold-400/30 p-4 z-50 animate-in slide-in-from-top-2 duration-200">
                  {/* Volume Control */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-200" htmlFor="volume-slider">
                        Volume
                      </label>
                      <button
                        onClick={onSoundToggle}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-primary-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gold-400"
                        aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
                      >
                        {soundEnabled ? (
                          <Volume2 className="w-4 h-4 text-gold-300" />
                        ) : (
                          <VolumeX className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        id="volume-slider"
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => onVolumeChange(Number(e.target.value))}
                        disabled={!soundEnabled}
                        className="w-full h-2 bg-primary-700 rounded-lg appearance-none cursor-pointer slider focus:outline-none focus:ring-2 focus:ring-gold-400"
                        aria-label="Volume level"
                      />
                      <div 
                        className="absolute top-0 left-0 h-2 bg-gradient-to-r from-gold-500 to-gold-400 rounded-lg pointer-events-none transition-all duration-200"
                        style={{ width: `${soundEnabled ? volume : 0}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-300 mt-1">{volume}%</div>
                  </div>

                  {/* Restart Button */}
                  <button
                    onClick={handleRestart}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 rose-accent hover:scale-105 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 focus:ring-offset-primary-800 neon-rose"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span className="text-sm font-medium">Restart Game</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Center Section - Title and Level */}
          <div className="flex flex-col items-center justify-center flex-1">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text text-transparent leading-tight">
              Word Cookie Blockchain
            </h1>
            <div className="flex items-center space-x-4 text-lg font-semibold text-gray-200 leading-tight">
              <span>Level {level}</span>
              <span>•</span>
              <span>{playerProfile?.totalXP.toLocaleString() || 0} XP</span>
              {blockchainProfile && (
                <>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <Coins className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400">{blockchainProfile.tokenBalance.toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Section - Action Buttons and Wallet */}
          <div className="flex items-center space-x-2 min-w-[300px] justify-end">
            {/* Achievements Button */}
            <button
              onClick={onShowAchievements}
              className="h-8 px-3 flex items-center space-x-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-primary-900"
              title="View Achievements & NFTs"
            >
              <Trophy className="w-4 h-4 text-white" />
              <span className="text-xs font-medium text-white hidden sm:inline">Achievements</span>
            </button>

            {/* Profile Button */}
            <button
              onClick={onShowProfile}
              className="h-8 px-3 flex items-center space-x-2 rounded-lg bg-primary-700 hover:bg-primary-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 focus:ring-offset-primary-900 neon-purple"
              title="View Profile"
            >
              <User className="w-4 h-4 text-gold-300" />
              <span className="text-xs font-medium text-gold-300 hidden sm:inline">Profile</span>
            </button>

            {/* Missions Button */}
            <button
              onClick={onShowMissions}
              className="h-8 px-3 flex items-center space-x-2 rounded-lg bg-primary-700 hover:bg-primary-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 focus:ring-offset-primary-900 neon-purple"
              title="View Missions"
            >
              <Target className="w-4 h-4 text-gold-300" />
              <span className="text-xs font-medium text-gold-300 hidden sm:inline">Missions</span>
            </button>

            {/* Wallet Section */}
            <div className="relative" ref={walletRef}>
              {wallet.connected ? (
                <button
                  onClick={() => setShowWalletMenu(!showWalletMenu)}
                  className="h-8 px-3 flex items-center space-x-2 rounded-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-primary-900"
                  title="Wallet Connected"
                >
                  <Wifi className="w-4 h-4 text-white" />
                  <span className="text-xs font-medium text-white hidden md:inline">
                    {formatWalletAddress(wallet.publicKey?.toBase58() || '')}
                  </span>
                </button>
              ) : (
                <div className="scale-75 origin-right">
                  <WalletButton />
                </div>
              )}

              {/* Wallet Dropdown */}
              {showWalletMenu && wallet.connected && (
                <div className="absolute top-12 right-0 w-64 bg-primary-800 rounded-xl shadow-xl border border-gold-400/30 p-4 z-50 animate-in slide-in-from-top-2 duration-200">
                  <div className="text-center mb-4">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Wifi className="w-5 h-5 text-green-400" />
                      <span className="text-green-400 font-medium">Connected</span>
                    </div>
                    <div className="text-xs text-gray-300 break-all">
                      {wallet.publicKey?.toBase58()}
                    </div>
                  </div>

                  {blockchainProfile && (
                    <div className="mb-4 p-3 bg-primary-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-300">Token Balance</span>
                        <div className="flex items-center space-x-1">
                          <Coins className="w-4 h-4 text-yellow-400" />
                          <span className="text-yellow-400 font-bold">
                            {blockchainProfile.tokenBalance.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">NFTs Owned</span>
                        <span className="text-purple-400 font-bold">
                          {blockchainProfile.nftCount}
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      wallet.disconnect();
                      setShowWalletMenu(false);
                    }}
                    className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400"
                  >
                    Disconnect Wallet
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Restart Confirmation Dialog */}
      {showRestartConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-primary-800 rounded-xl shadow-2xl border border-gold-400/30 p-6 max-w-sm mx-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2">Restart Game?</h3>
            <p className="text-gray-200 mb-6">
              This will reset your current progress and start from Level 1. Are you sure?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={cancelRestart}
                className="flex-1 px-4 py-2 bg-primary-700 hover:bg-primary-600 text-white rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                Cancel
              </button>
              <button
                onClick={confirmRestart}
                className="flex-1 px-4 py-2 rose-accent text-white rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-rose-400 neon-rose"
              >
                Restart
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TopNavigation;