'use client';

import { useState } from 'react';
import { 
  Building2, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  Clock,
  MoreVertical,
  Trash2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { 
  PlaidAccount, 
  PlaidEntity, 
  ENTITY_LABELS, 
  ENTITY_COLORS,
  ACCOUNT_TYPE_ICONS 
} from '@/lib/plaid-types';

interface AccountsListProps {
  accounts: PlaidAccount[];
  selectedEntity: PlaidEntity | 'all';
  onAccountSelect?: (account: PlaidAccount) => void;
  onRefresh?: (accountId: string) => void;
  onDisconnect?: (accountId: string) => void;
  isLoading?: boolean;
}

export function AccountsList({ 
  accounts, 
  selectedEntity,
  onAccountSelect,
  onRefresh,
  onDisconnect,
  isLoading = false
}: AccountsListProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filteredAccounts = selectedEntity === 'all' 
    ? accounts 
    : accounts.filter(a => a.entity === selectedEntity);

  const formatCurrency = (amount: number | null, currency: string = 'USD') => {
    if (amount === null) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    return `${diffDays}d ago`;
  };

  const getAccountIcon = (type: string) => {
    return ACCOUNT_TYPE_ICONS[type] || '🏛️';
  };

  // Group accounts by institution
  const groupedByInstitution = filteredAccounts.reduce((acc, account) => {
    const key = account.institution_name;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(account);
    return acc;
  }, {} as Record<string, PlaidAccount[]>);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div 
            key={i}
            className="p-6 rounded-2xl bg-[#12121A]/80 border border-[#2A2A3E] animate-pulse"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#1A1A2E]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-[#1A1A2E] rounded" />
                <div className="h-3 w-24 bg-[#1A1A2E] rounded" />
              </div>
              <div className="h-6 w-24 bg-[#1A1A2E] rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (filteredAccounts.length === 0) {
    return (
      <div className="text-center py-12 px-6 rounded-2xl bg-[#12121A]/50 border border-[#2A2A3E]">
        <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No accounts connected</h3>
        <p className="text-muted-foreground text-sm">
          Connect a bank account to start tracking your finances
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedByInstitution).map(([institution, institutionAccounts]) => (
        <div 
          key={institution}
          className="rounded-2xl bg-[#12121A]/80 border border-[#2A2A3E] overflow-hidden"
        >
          {/* Institution Header */}
          <div className="p-4 bg-[#1A1A2E]/50 border-b border-[#2A2A3E] flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#E91E8C]/20 to-[#00D9FF]/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-[#00D9FF]" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{institution}</h3>
              <p className="text-xs text-muted-foreground">
                {institutionAccounts.length} account{institutionAccounts.length > 1 ? 's' : ''}
              </p>
            </div>
            <div 
              className="px-2 py-1 rounded-full text-[10px] font-medium"
              style={{ 
                backgroundColor: `${ENTITY_COLORS[institutionAccounts[0].entity]}20`,
                color: ENTITY_COLORS[institutionAccounts[0].entity],
              }}
            >
              {ENTITY_LABELS[institutionAccounts[0].entity]}
            </div>
          </div>

          {/* Accounts List */}
          <div className="divide-y divide-[#2A2A3E]">
            {institutionAccounts.map((account) => (
              <div 
                key={account.id}
                className="p-4 hover:bg-[#1A1A2E]/30 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  {/* Account Icon */}
                  <div className="w-12 h-12 rounded-xl bg-[#1A1A2E] flex items-center justify-center text-2xl">
                    {getAccountIcon(account.account_type)}
                  </div>

                  {/* Account Info */}
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => onAccountSelect?.(account)}
                  >
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium truncate">{account.account_name}</h4>
                      {account.mask && (
                        <span className="text-xs text-muted-foreground">
                          •••• {account.mask}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground capitalize">
                        {account.account_type}
                        {account.account_subtype && ` • ${account.account_subtype}`}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(account.last_synced)}
                      </span>
                    </div>
                  </div>

                  {/* Balance */}
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      account.account_type === 'credit' || account.account_type === 'loan'
                        ? (account.current_balance || 0) > 0 ? 'text-red-400' : 'text-[#34D399]'
                        : 'text-foreground'
                    }`}>
                      {formatCurrency(account.current_balance, account.currency)}
                    </div>
                    {account.available_balance !== null && account.available_balance !== account.current_balance && (
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(account.available_balance, account.currency)} available
                      </div>
                    )}
                  </div>

                  {/* Actions Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === account.id ? null : account.id)}
                      className="p-2 rounded-lg hover:bg-[#1A1A2E] transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </button>
                    
                    {openMenuId === account.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-xl bg-[#1A1A2E] border border-[#2A2A3E] shadow-xl overflow-hidden">
                          <button
                            onClick={() => {
                              onRefresh?.(account.id);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#2A2A3E] transition-colors text-left"
                          >
                            <RefreshCw className="w-4 h-4 text-[#00D9FF]" />
                            <span className="text-sm">Refresh Balance</span>
                          </button>
                          <button
                            onClick={() => {
                              onAccountSelect?.(account);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#2A2A3E] transition-colors text-left"
                          >
                            <ExternalLink className="w-4 h-4 text-[#00D9FF]" />
                            <span className="text-sm">View Transactions</span>
                          </button>
                          <button
                            onClick={() => {
                              onDisconnect?.(account.id);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-500/10 transition-colors text-left text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="text-sm">Disconnect</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Chevron for selection */}
                  <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Summary cards for total balances
export function BalanceSummaryCards({ accounts }: { accounts: PlaidAccount[] }) {
  const totals = accounts.reduce((acc, account) => {
    const balance = account.current_balance || 0;
    if (account.account_type === 'credit' || account.account_type === 'loan') {
      acc.liabilities += balance;
    } else {
      acc.assets += balance;
    }
    return acc;
  }, { assets: 0, liabilities: 0 });

  const netWorth = totals.assets - totals.liabilities;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Assets */}
      <div className="p-5 rounded-2xl bg-[#12121A]/80 border border-[#2A2A3E]">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5 text-[#34D399]" />
          <span className="text-sm text-muted-foreground">Total Assets</span>
        </div>
        <p className="text-2xl font-bold text-[#34D399]">
          {formatCurrency(totals.assets)}
        </p>
      </div>

      {/* Liabilities */}
      <div className="p-5 rounded-2xl bg-[#12121A]/80 border border-[#2A2A3E]">
        <div className="flex items-center gap-2 mb-2">
          <TrendingDown className="w-5 h-5 text-red-400" />
          <span className="text-sm text-muted-foreground">Total Liabilities</span>
        </div>
        <p className="text-2xl font-bold text-red-400">
          {formatCurrency(totals.liabilities)}
        </p>
      </div>

      {/* Net Worth */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-[#E91E8C]/10 to-[#00D9FF]/10 border border-[#2A2A3E]">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-muted-foreground">Net Worth</span>
        </div>
        <p className={`text-2xl font-bold ${netWorth >= 0 ? 'text-[#00D9FF]' : 'text-red-400'}`}>
          {formatCurrency(netWorth)}
        </p>
      </div>
    </div>
  );
}
