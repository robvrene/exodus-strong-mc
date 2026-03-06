'use client';

import { useCallback, useState } from 'react';
import { usePlaidLink, PlaidLinkOnSuccess, PlaidLinkOnExit } from 'react-plaid-link';
import { Loader2, Plus, Landmark } from 'lucide-react';
import { PlaidEntity, ENTITY_LABELS } from '@/lib/plaid-types';

interface PlaidLinkButtonProps {
  entity: PlaidEntity;
  onSuccess: (publicToken: string, metadata: unknown) => void;
  onExit?: () => void;
  className?: string;
}

export function PlaidLinkButton({ entity, onSuccess, onExit, className = '' }: PlaidLinkButtonProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createLinkToken = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/plaid/create-link-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create link token');
      }
      
      const data = await response.json();
      setLinkToken(data.link_token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize Plaid');
      setIsLoading(false);
    }
  }, [entity]);

  const handleSuccess: PlaidLinkOnSuccess = useCallback((publicToken, metadata) => {
    setLinkToken(null);
    setIsLoading(false);
    onSuccess(publicToken, metadata);
  }, [onSuccess]);

  const handleExit: PlaidLinkOnExit = useCallback(() => {
    setLinkToken(null);
    setIsLoading(false);
    onExit?.();
  }, [onExit]);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: handleSuccess,
    onExit: handleExit,
  });

  // Open Plaid Link when token is ready
  const handleClick = useCallback(async () => {
    if (linkToken && ready) {
      open();
    } else {
      await createLinkToken();
    }
  }, [linkToken, ready, open, createLinkToken]);

  // Auto-open when link token is created
  if (linkToken && ready && isLoading) {
    setIsLoading(false);
    open();
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`
          flex items-center gap-3 px-5 py-3 rounded-xl font-medium
          bg-gradient-to-r from-[#E91E8C] to-[#00D9FF]
          hover:shadow-lg hover:shadow-[#E91E8C]/30
          transition-all duration-300 hover:scale-[1.02]
          disabled:opacity-50 disabled:cursor-not-allowed
          text-white
          ${className}
        `}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Plus className="w-5 h-5" />
        )}
        <span>Connect {ENTITY_LABELS[entity]} Account</span>
      </button>
      
      {error && (
        <p className="absolute -bottom-6 left-0 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}

// Simpler version for the "Add Account" card
export function AddAccountCard({ entity, onSuccess }: { entity: PlaidEntity; onSuccess: (publicToken: string, metadata: unknown) => void }) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const createLinkToken = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/plaid/create-link-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity }),
      });
      
      if (!response.ok) throw new Error('Failed');
      const data = await response.json();
      setLinkToken(data.link_token);
    } catch {
      setIsLoading(false);
    }
  }, [entity]);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: (publicToken, metadata) => {
      setLinkToken(null);
      setIsLoading(false);
      onSuccess(publicToken, metadata);
    },
    onExit: () => {
      setLinkToken(null);
      setIsLoading(false);
    },
  });

  const handleClick = useCallback(async () => {
    if (linkToken && ready) {
      open();
    } else {
      await createLinkToken();
    }
  }, [linkToken, ready, open, createLinkToken]);

  // Auto-open when token is ready
  if (linkToken && ready && isLoading) {
    setTimeout(() => {
      setIsLoading(false);
      open();
    }, 100);
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="
        p-6 rounded-2xl border-2 border-dashed border-[#2A2A3E]
        hover:border-[#E91E8C]/50 hover:bg-[#E91E8C]/5
        transition-all duration-300 group
        flex flex-col items-center justify-center gap-3
        min-h-[180px]
      "
    >
      {isLoading ? (
        <Loader2 className="w-10 h-10 text-[#E91E8C] animate-spin" />
      ) : (
        <div className="w-14 h-14 rounded-xl bg-[#1A1A2E] flex items-center justify-center group-hover:bg-[#E91E8C]/20 transition-colors">
          <Landmark className="w-7 h-7 text-[#E91E8C]" />
        </div>
      )}
      <div className="text-center">
        <p className="font-medium text-foreground">Add Bank Account</p>
        <p className="text-xs text-muted-foreground mt-1">Connect via Plaid</p>
      </div>
    </button>
  );
}
