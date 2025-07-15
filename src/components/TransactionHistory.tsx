import React, { useState, useEffect } from 'react';
import { X, Coins, TrendingUp, TrendingDown, Calendar, Filter, Award } from 'lucide-react';
import { TokenTransaction } from '../types/game';
import { tokenService } from '../services/tokenService';

interface TransactionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ isOpen, onClose }) => {
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TokenTransaction[]>([]);
  const [filter, setFilter] = useState<'all' | 'earned' | 'spent'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [todayEarnings, setTodayEarnings] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const allTransactions = tokenService.getTransactions();
      setTransactions(allTransactions);
      
      // Calculate stats
      const earned = allTransactions.filter(tx => tx.type === 'earned').reduce((sum, tx) => sum + tx.amount, 0);
      const spent = allTransactions.filter(tx => tx.type === 'spent').reduce((sum, tx) => sum + tx.amount, 0);
      setTotalEarned(earned);
      setTotalSpent(spent);
      setTodayEarnings(tokenService.getTodayEarnings());
    }
  }, [isOpen]);

  useEffect(() => {
    let filtered = transactions;

    // Apply type filter
    if (filter !== 'all') {
      filtered = filtered.filter(tx => tx.type === filter);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(tx => 
        tx.reason.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, filter, searchTerm]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getTransactionIcon = (reason: string) => {
    if (reason.includes('Achievement')) return '🏆';
    if (reason.includes('Level')) return '🎯';
    if (reason.includes('Perfect')) return '💎';
    if (reason.includes('Speed')) return '⚡';
    if (reason.includes('First Word')) return '⭐';
    if (reason.includes('Daily Streak')) return '🔥';
    return '🪙';
  };

  const getRewardColor = (reason: string) => {
    if (reason.includes('Achievement')) return 'text-purple-400';
    if (reason.includes('Perfect')) return 'text-diamond-400';
    if (reason.includes('Speed')) return 'text-yellow-400';
    if (reason.includes('Daily Streak')) return 'text-orange-400';
    return 'text-green-400';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-primary-800 rounded-xl shadow-2xl border border-gold-400/30 w-full max-w-4xl h-[80vh] mx-4 flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gold-400/20">
          <div className="flex items-center space-x-3">
            <Coins className="w-6 h-6 text-yellow-400" />
            <h2 className="text-2xl font-bold text-white">Transaction History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-primary-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Stats Cards */}
        <div className="p-6 border-b border-gold-400/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-primary-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-sm text-gray-300">Total Earned</span>
              </div>
              <div className="text-2xl font-bold text-green-400">
                {totalEarned.toLocaleString()} PUZZ
              </div>
            </div>

            <div className="bg-primary-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingDown className="w-5 h-5 text-red-400" />
                <span className="text-sm text-gray-300">Total Spent</span>
              </div>
              <div className="text-2xl font-bold text-red-400">
                {totalSpent.toLocaleString()} PUZZ
              </div>
            </div>

            <div className="bg-primary-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-gray-300">Today's Earnings</span>
              </div>
              <div className="text-2xl font-bold text-blue-400">
                {todayEarnings.toLocaleString()} PUZZ
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gold-400/20">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">Filter by type:</span>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="bg-primary-700 text-white rounded-lg px-3 py-1 text-sm border border-gold-400/30 focus:outline-none focus:ring-2 focus:ring-gold-400"
              >
                <option value="all">All Transactions</option>
                <option value="earned">Earned Only</option>
                <option value="spent">Spent Only</option>
              </select>
            </div>

            <div className="flex-1">
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-primary-700 text-white rounded-lg px-4 py-2 text-sm border border-gold-400/30 focus:outline-none focus:ring-2 focus:ring-gold-400 placeholder-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Transaction List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Coins className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No transactions found</p>
              <p className="text-gray-500 text-sm">
                {searchTerm || filter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Start playing to earn PUZZ tokens!'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="bg-primary-700 rounded-lg p-4 border border-gold-400/20 hover:border-gold-400/40 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">
                        {getTransactionIcon(transaction.reason)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">
                          {transaction.reason}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {formatDate(transaction.timestamp)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        transaction.type === 'earned' 
                          ? getRewardColor(transaction.reason)
                          : 'text-red-400'
                      }`}>
                        {transaction.type === 'earned' ? '+' : '-'}
                        {transaction.amount.toLocaleString()} PUZZ
                      </div>
                      <div className={`text-xs ${
                        transaction.type === 'earned' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {transaction.type === 'earned' ? 'Earned' : 'Spent'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Current Balance Footer */}
        <div className="p-6 border-t border-gold-400/20 bg-primary-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-yellow-400" />
              <span className="text-lg font-semibold text-white">Current Balance</span>
            </div>
            <div className="text-2xl font-bold text-yellow-400">
              {tokenService.getBalance().toLocaleString()} PUZZ
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;