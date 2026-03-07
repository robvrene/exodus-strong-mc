"use client";

import React from "react";

// ---------------------------------------------------------------------------
// Error Boundary — catches React errors so the demo never shows a white screen
// ---------------------------------------------------------------------------

interface Props {
  children: React.ReactNode;
  fallbackLabel?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary] ${this.props.fallbackLabel || "Component"} crashed:`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 200,
            background: "rgba(239,68,68,0.04)",
            border: "1px solid rgba(239,68,68,0.15)",
            borderRadius: 10,
            margin: 16,
            padding: 24,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#EF4444",
                fontFamily: "'Space Grotesk', sans-serif",
                marginBottom: 4,
              }}
            >
              {this.props.fallbackLabel || "Component"} encountered an error
            </div>
            <div style={{ fontSize: 12, color: "#8A8F98", marginBottom: 12 }}>
              {this.state.error?.message || "Unknown error"}
            </div>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{
                padding: "6px 16px",
                borderRadius: 6,
                border: "1px solid rgba(47,128,255,0.3)",
                background: "rgba(47,128,255,0.1)",
                color: "#2F80FF",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
