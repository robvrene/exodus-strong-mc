'use client';

import { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  Utensils,
  Car,
  Home,
  Briefcase,
  Heart,
  Zap,
  Loader2,
  X,
  ChevronDown,
  Receipt
} from 'lucide-react';
import { PlaidTransaction } from '@/lib/plaid-types';

interface TransactionsListProps {
  transactions: PlaidTransaction[];
  isLoading?: boolean;
  accountName?: string;
  onClose?: () => void;
}

// Category icons mapping
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Food and Drink': <Utensils className="w-4 h-4" />,
  'Shops': <ShoppingBag className="w-4 h-4" />,
  'Travel': <Car className="w-4 h-4" />,
  'Transfer': <ArrowUpRight className="w-4 h-4" />,
  'Payment': <Receipt className="w-4 h-4" />,
  'Recreation': <Heart className="w-4 h-4" />,
  'Service': <Zap className="w-4 h-4" />,
  'Healthcare': <Heart className="w-4 h-4" />,
  'Bank Fees': <Briefcase className="w-4 h-4" />,
  'default': <Receipt className="w-4 h-4" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  'Food and Drink': '#F97316',
  'Shops': '#E91E8C',
  'Travel': '#00D9FF',
  'Transfer': '#8B5CF6',
  'Payment': '#34D399',
  'Recreation': '#EC4899',
  'Service': '#FBBF24',
  'Healthcare': '#EF4444',
  'Bank Fees': '#6B7280',
  'default': '#94A3B8',
};

export function TransactionsList({ 
  transactions, 
  isLoading = false,
  accountName,
  onClose
}: TransactionsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'all' | '7d' | '30d' | '90d'>('30d');
  const [showFilters, setShowFilters] = useState(false);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach(t => {
      if (t.category && t.category[0]) {
        cats.add(t.category[0]);
      }
    });
    return Array.from(cats).sort();
  }, [transactions]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(query) ||
        t.merchant_name?.toLowerCase().includes(query) ||
        t.category?.some(c => c.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(t => t.category?.includes(selectedCategory));
    }

    // Date range filter
    if (dateRange !== 'all') {
      const days = parseInt(dateRange);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      filtered = filtered.filter(t => new Date(t.date) >= cutoff);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return filtered;
  }, [transactions, searchQuery, selectedCategory, dateRange]);

  // Group by date
  const groupedByDate = useMemo(() => {
    const groups: Record<string, PlaidTransaction[]> = {};
    filteredTransactions.forEach(t => {
      const dateKey = t.date;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(t);
    });
    return groups;
  }, [filteredTransactions]);

  const formatCurrency = (amount: number) => {
    const isNegative = amount < 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(Math.abs(amount));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getCategoryIcon = (category: string[]) => {
    const mainCategory = category?.[0] || 'default';
    return CATEGORY_ICONS[mainCategory] || CATEGORY_ICONS['default'];
  };

  const getCategoryColor = (category: string[]) => {
    const mainCategory = category?.[0] || 'default';
    return CATEGORY_COLORS[mainCategory] || CATEGORY_COLORS['default'];
  };

  // Calculate totals
  const totals = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
      if (t.amount > 0) {
        acc.expenses += t.amount;
      } else {
        acc.income += Math.abs(t.amount);
      }
      return acc;
    }, { income: 0, expenses: 0 });
  }, [filteredTransactions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-[#E91E8C] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Transactions</h2>
          {accountName && (
            <p className="text-sm text-muted-foreground">{accountName}</p>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#1A1A2E] transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-[#1A1A2E]/50 border border-[#2A2A3E]">
          <p className="text-xs text-muted-foreground mb-1">Income</p>
          <p className="text-lg font-bold text-[#34D399]">+{formatCurrency(totals.income)}</p>
        </div>
        <div className="p-4 rounded-xl bg-[#1A1A2E]/50 border border-[#2A2A3E]">
          <p className="text-xs text-muted-foreground mb-1">Expenses</p>
          <p className="text-lg font-bold text-red-400">-{formatCurrency(totals.expenses)}</p>
        </div>
        <div className="p-4 rounded-xl bg-[#1A1A2E]/50 border border-[#2A2A3E]">
          <p className="text-xs text-muted-foreground mb-1">Net</p>
          <p className={`text-lg font-bold ${totals.income - totals.expenses >= 0 ? 'text-[#00D9FF]' : 'text-red-400'}`}>
            {totals.income - totals.expenses >= 0 ? '+' : '-'}
            {formatCurrency(Math.abs(totals.income - totals.expenses))}
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1A1A2E] border border-[#2A2A3E] focus:border-[#E91E8C]/50 focus:outline-none transition-colors"
          />
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2.5 rounded-xl border transition-colors flex items-center gap-2 ${
            showFilters || selectedCategory
              ? 'bg-[#E91E8C]/10 border-[#E91E8C]/50 text-[#E91E8C]'
              : 'bg-[#1A1A2E] border-[#2A2A3E] hover:border-[#3A3A5E]'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          {selectedCategory && (
            <span className="px-1.5 py-0.5 rounded-full bg-[#E91E8C] text-white text-[10px]">1</span>
          )}
        </button>

        {/* Date Range Dropdown */}
        <div className="relative">
          <button
            className="px-4 py-2.5 rounded-xl bg-[#1A1A2E] border border-[#2A2A3E] hover:border-[#3A3A5E] transition-colors flex items-center gap-2"
          >
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">
              {dateRange === 'all' ? 'All Time' : 
               dateRange === '7d' ? 'Last 7 Days' :
               dateRange === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
            </span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="p-4 rounded-xl bg-[#1A1A2E]/50 border border-[#2A2A3E] mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Filter by Category</span>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-xs text-[#E91E8C] hover:underline"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[#E91E8C] text-white'
                    : 'bg-[#2A2A3E] hover:bg-[#3A3A5E] text-muted-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#2A2A3E]">
            <span className="text-sm font-medium mr-2">Date Range:</span>
            {(['7d', '30d', '90d', 'all'] as const).map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-[#00D9FF] text-[#0A0A0F]'
                    : 'bg-[#2A2A3E] hover:bg-[#3A3A5E] text-muted-foreground'
                }`}
              >
                {range === 'all' ? 'All' : range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Transactions List */}
      <div className="flex-1 overflow-y-auto space-y-6">
        {Object.keys(groupedByDate).length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No transactions found</h3>
            <p className="text-muted-foreground text-sm">
              {searchQuery || selectedCategory 
                ? 'Try adjusting your filters'
                : 'Transactions will appear here once synced'}
            </p>
          </div>
        ) : (
          Object.entries(groupedByDate).map(([date, dayTransactions]) => (
            <div key={date}>
              {/* Date Header */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm font-medium text-muted-foreground">
                  {formatDate(date)}
                </span>
                <div className="flex-1 h-px bg-[#2A2A3E]" />
                <span className="text-xs text-muted-foreground">
                  {dayTransactions.length} transaction{dayTransactions.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Day's Transactions */}
              <div className="space-y-2">
                {dayTransactions.map(transaction => (
                  <div
                    key={transaction.id}
                    className="p-4 rounded-xl bg-[#12121A]/80 border border-[#2A2A3E] hover:border-[#3A3A5E] transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      {/* Category Icon */}
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ 
                          backgroundColor: `${getCategoryColor(transaction.category)}20`,
                          color: getCategoryColor(transaction.category)
                        }}
                      >
                        {getCategoryIcon(transaction.category)}
                      </div>

                      {/* Transaction Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium truncate">
                            {transaction.merchant_name || transaction.name}
                          </h4>
                          {transaction.pending && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#FBBF24]/20 text-[#FBBF24]">
                              Pending
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {transaction.category?.join(' • ') || 'Uncategorized'}
                        </p>
                      </div>

                      {/* Amount */}
                      <div className="text-right">
                        <p className={`font-bold ${
                          transaction.amount > 0 
                            ? 'text-red-400' 
                            : 'text-[#34D399]'
                        }`}>
                          {transaction.amount > 0 ? '-' : '+'}
                          {formatCurrency(transaction.amount)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
