'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

/**
 * Catches rendering errors thrown inside the Babylon.js canvas subtree and
 * displays a user-friendly fallback instead of a blank screen.
 */
export default class City3DErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : String(error);
    return { hasError: true, message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0a10',
            color: '#f4f4f8',
            fontFamily:
              'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            gap: 12,
            padding: 32,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 36 }}>🏙️</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>City failed to load</div>
          <div style={{ fontSize: 14, opacity: 0.65, maxWidth: 380 }}>
            Your browser may not support WebGL. Try refreshing or switching to a modern desktop
            browser.
          </div>
          {this.state.message && (
            <pre
              style={{
                marginTop: 8,
                fontSize: 11,
                opacity: 0.4,
                fontFamily: 'ui-monospace, monospace',
                maxWidth: '90vw',
                overflowX: 'auto',
              }}
            >
              {this.state.message}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 12,
              padding: '10px 24px',
              background: '#B026FF',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
