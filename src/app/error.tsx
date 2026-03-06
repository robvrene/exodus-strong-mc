'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to the console for debugging
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/20 mb-6">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        
        <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
        
        <p className="text-gray-400 mb-2">
          {error.message || 'An unexpected error occurred'}
        </p>
        
        {error.digest && (
          <p className="text-xs text-gray-600 mb-4 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        <div className="bg-[#111111] rounded-lg border border-gray-800 p-4 mb-6 text-left">
          <p className="text-xs text-gray-500 font-mono break-all">
            {error.stack?.split('\n').slice(0, 5).join('\n') || 'No stack trace available'}
          </p>
        </div>

        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#E91E8C] to-[#00D4FF] hover:opacity-90 text-white rounded-xl font-semibold transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}
