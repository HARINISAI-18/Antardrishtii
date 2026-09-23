import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="glass-panel p-8 rounded-3xl border border-rose-500/30 max-w-lg space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto text-xl font-bold">
              !
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Application Interface Error</h2>
            <p className="text-xs text-slate-400 font-mono bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-left overflow-x-auto">
              {this.state.error?.message || 'Unknown runtime error'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-brand-500 text-slate-950 font-bold text-xs hover:bg-brand-400 transition-all shadow-lg shadow-brand-500/25"
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
