'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Zap,
  RefreshCw,
  Wallet,
  Building2,
  User,
  Briefcase,
  ChevronLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { PlaidLinkButton, AddAccountCard } from '@/components/finances/PlaidLinkButton';
import { AccountsList, BalanceSummaryCards } from '@/components/finances/AccountsList';
import { TransactionsList } from '@/components/finances/TransactionsList';
import { PlaidAccount, PlaidTransaction, PlaidEntity, ENTITY_LABELS, ENTITY_COLORS } from '@/lib/plaid-types';

type EntityFilter = PlaidEntity | 'all';

const ENTITY_FILTERS: { value: EntityFilter; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All Accounts', icon: <Wallet className="w-4 h-4" /> },
  { value: 'personal', label: 'Personal', icon: <User className="w-4 h-4" /> },
  { value: 'multiply_inc', label: 'Multiply Inc', icon: <Briefcase className="w-4 h-4" /> },
  { value: 'cashflow_empire', label: 'CashFlow Empire', icon: <Building2 className="w-4 h-4" /> },
];

interface Toast {
  id: string;
  type: 'success' | 'error' | 'loading';
  message: string;
}

export default function FinancesPage() {
  const [accounts, setAccounts] = useState<PlaidAccount[]>([]);
  const [transactions, setTransactions] = useState<PlaidTransaction[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<EntityFilter>('all');
  const [selectedAccount, setSelectedAccount] = useState<PlaidAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [connectEntity, setConnectEntity] = useState<PlaidEntity>('personal');
  const [showConnectModal, setShowConnectModal] = useState(false);

  // Toast helpers
  const addToast = (type: Toast['type'], message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    if (type !== 'loading') {
      setTimeout(() => removeToast(id), 5000);
    }
    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const updateToast = (id: string, type: Toast['type'], message: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, type, message } : t));
    if (type !== 'loading') {
      setTimeout(() => removeToast(id), 5000);
    }
  };

  // Fetch accounts
  const fetchAccounts = useCallback(async () => {
    try {
      const response = await fetch('/api/plaid/accounts');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch transactions for selected account
  const fetchTransactions = useCallback(async (accountId: string) => {
    try {
      const response = await fetch(`/api/plaid/transactions?account_id=${accountId}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  }, []);

  // Handle Plaid Link success
  const handlePlaidSuccess = useCallback(async (publicToken: string, metadata: unknown) => {
    const toastId = addToast('loading', 'Connecting your account...');
    
    try {
      const response = await fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          public_token: publicToken, 
          metadata,
          entity: connectEntity 
        }),
      });

      if (response.ok) {
        updateToast(toastId, 'success', 'Account connected successfully!');
        fetchAccounts(); // Refresh accounts list
      } else {
        const data = await response.json();
        updateToast(toastId, 'error', data.error || 'Failed to connect account');
      }
    } catch (error) {
      updateToast(toastId, 'error', 'Failed to connect account');
    }
    
    setShowConnectModal(false);
  }, [connectEntity, fetchAccounts]);

  // Handle account selection
  const handleAccountSelect = useCallback((account: PlaidAccount) => {
    setSelectedAccount(account);
    fetchTransactions(account.id);
  }, [fetchTransactions]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchAccounts();
    if (selectedAccount) {
      await fetchTransactions(selectedAccount.id);
    }
    setIsRefreshing(false);
  }, [fetchAccounts, fetchTransactions, selectedAccount]);

  // Handle disconnect
  const handleDisconnect = useCallback(async (accountId: string) => {
    const confirmed = window.confirm('Are you sure you want to disconnect this account?');
    if (!confirmed) return;

    const toastId = addToast('loading', 'Disconnecting account...');
    
    try {
      const response = await fetch(`/api/plaid/accounts/${accountId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        updateToast(toastId, 'success', 'Account disconnected');
        setAccounts(prev => prev.filter(a => a.id !== accountId));
        if (selectedAccount?.id === accountId) {
          setSelectedAccount(null);
          setTransactions([]);
        }
      } else {
        updateToast(toastId, 'error', 'Failed to disconnect account');
      }
    } catch (error) {
      updateToast(toastId, 'error', 'Failed to disconnect account');
    }
  }, [selectedAccount]);

  // Initial fetch
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Filter accounts by entity for display
  const filteredAccounts = selectedEntity === 'all' 
    ? accounts 
    : accounts.filter(a => a.entity === selectedEntity);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-foreground">
      {/* Header */}
      <header className="border-b border-[#2A2A3E] bg-[#0E0E14]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link 
                href="/dashboard"
                className="p-2 rounded-lg hover:bg-[#1A1A2E] transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E91E8C] to-[#00D9FF] flex items-center justify-center shadow-lg shadow-[#E91E8C]/20">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-[#E91E8C] to-[#00D9FF] bg-clip-text text-transparent">
                    Finances
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Bank accounts & transactions
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="px-4 py-2 rounded-lg bg-[#1A1A2E] border border-[#2A2A3E] hover:border-[#00D9FF]/50 hover:bg-[#00D9FF]/10 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                onClick={() => setShowConnectModal(true)}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#E91E8C] to-[#00D9FF] hover:shadow-lg hover:shadow-[#E91E8C]/30 transition-all duration-200 flex items-center gap-2 font-medium text-white"
              >
                <Wallet className="w-4 h-4" />
                <span>Connect Account</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-6 py-6">
        {/* Entity Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 p-1 rounded-xl bg-[#12121A]/80 border border-[#2A2A3E] w-fit">
          {ENTITY_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setSelectedEntity(filter.value)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                selectedEntity === filter.value
                  ? 'bg-[#E91E8C] text-white shadow-lg shadow-[#E91E8C]/30'
                  : 'text-muted-foreground hover:text-white hover:bg-[#1A1A2E]'
              }`}
            >
              {filter.icon}
              {filter.label}
              {filter.value !== 'all' && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  selectedEntity === filter.value
                    ? 'bg-white/20'
                    : 'bg-[#2A2A3E]'
                }`}>
                  {accounts.filter(a => a.entity === filter.value).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Accounts */}
          <div className={`${selectedAccount ? 'col-span-5' : 'col-span-12'} space-y-6 transition-all duration-300`}>
            {/* Balance Summary */}
            {!isLoading && accounts.length > 0 && (
              <BalanceSummaryCards accounts={filteredAccounts} />
            )}

            {/* Accounts List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Connected Accounts</h2>
                <span className="text-sm text-muted-foreground">
                  {filteredAccounts.length} account{filteredAccounts.length !== 1 ? 's' : ''}
                </span>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-[#E91E8C] animate-spin" />
                </div>
              ) : accounts.length === 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {(['personal', 'multiply_inc', 'cashflow_empire'] as PlaidEntity[]).map((entity) => (
                    <AddAccountCard 
                      key={entity}
                      entity={entity}
                      onSuccess={(publicToken, metadata) => {
                        setConnectEntity(entity);
                        handlePlaidSuccess(publicToken, metadata);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <AccountsList
                  accounts={accounts}
                  selectedEntity={selectedEntity}
                  onAccountSelect={handleAccountSelect}
                  onRefresh={handleRefresh}
                  onDisconnect={handleDisconnect}
                />
              )}
            </div>
          </div>

          {/* Right Column - Transactions */}
          {selectedAccount && (
            <div className="col-span-7">
              <div className="sticky top-24 p-6 rounded-2xl bg-[#12121A]/80 border border-[#2A2A3E] max-h-[calc(100vh-140px)] overflow-hidden flex flex-col">
                <TransactionsList
                  transactions={transactions}
                  accountName={`${selectedAccount.institution_name} - ${selectedAccount.account_name}`}
                  onClose={() => {
                    setSelectedAccount(null);
                    setTransactions([]);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Connect Account Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowConnectModal(false)}
          />
          <div className="relative z-10 w-full max-w-md p-6 rounded-2xl bg-[#12121A] border border-[#2A2A3E] shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Connect Bank Account</h2>
              <button
                onClick={() => setShowConnectModal(false)}
                className="p-2 rounded-lg hover:bg-[#1A1A2E] transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <p className="text-muted-foreground text-sm mb-6">
              Select which entity this account belongs to:
            </p>

            <div className="space-y-3 mb-6">
              {(['personal', 'multiply_inc', 'cashflow_empire'] as PlaidEntity[]).map((entity) => (
                <button
                  key={entity}
                  onClick={() => setConnectEntity(entity)}
                  className={`w-full p-4 rounded-xl border transition-all duration-200 flex items-center gap-4 ${
                    connectEntity === entity
                      ? 'border-[#E91E8C] bg-[#E91E8C]/10'
                      : 'border-[#2A2A3E] hover:border-[#3A3A5E] bg-[#1A1A2E]/50'
                  }`}
                >
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${ENTITY_COLORS[entity]}20` }}
                  >
                    {entity === 'personal' && <User className="w-5 h-5" style={{ color: ENTITY_COLORS[entity] }} />}
                    {entity === 'multiply_inc' && <Briefcase className="w-5 h-5" style={{ color: ENTITY_COLORS[entity] }} />}
                    {entity === 'cashflow_empire' && <Building2 className="w-5 h-5" style={{ color: ENTITY_COLORS[entity] }} />}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{ENTITY_LABELS[entity]}</p>
                    <p className="text-xs text-muted-foreground">
                      {accounts.filter(a => a.entity === entity).length} accounts connected
                    </p>
                  </div>
                  {connectEntity === entity && (
                    <CheckCircle2 className="w-5 h-5 text-[#E91E8C]" />
                  )}
                </button>
              ))}
            </div>

            <PlaidLinkButton
              entity={connectEntity}
              onSuccess={handlePlaidSuccess}
              onExit={() => setShowConnectModal(false)}
              className="w-full justify-center"
            />
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-50 space-y-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border backdrop-blur-sm animate-in slide-in-from-right ${
              toast.type === 'success' 
                ? 'bg-[#34D399]/10 border-[#34D399]/30 text-[#34D399]'
                : toast.type === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : 'bg-[#1A1A2E] border-[#2A2A3E] text-foreground'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
            {toast.type === 'loading' && <Loader2 className="w-5 h-5 animate-spin" />}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
