'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body style={{ 
        backgroundColor: '#0A0A0F', 
        color: 'white', 
        fontFamily: 'system-ui, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        margin: 0,
        padding: '20px'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '500px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Something went wrong!</h2>
          <p style={{ color: '#9CA3AF', marginBottom: '8px' }}>{error.message}</p>
          {error.digest && (
            <p style={{ color: '#6B7280', fontSize: '12px', marginBottom: '16px' }}>
              Error ID: {error.digest}
            </p>
          )}
          <pre style={{ 
            backgroundColor: '#111', 
            padding: '16px', 
            borderRadius: '8px', 
            fontSize: '11px',
            overflow: 'auto',
            textAlign: 'left',
            marginBottom: '16px',
            color: '#9CA3AF'
          }}>
            {error.stack?.split('\n').slice(0, 8).join('\n')}
          </pre>
          <button
            onClick={() => reset()}
            style={{
              backgroundColor: '#E91E8C',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
