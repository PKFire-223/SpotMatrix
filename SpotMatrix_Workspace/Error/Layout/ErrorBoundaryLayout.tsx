import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasCaughtError: boolean;
  errorSummary: string;
}

export class ErrorBoundaryLayout extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasCaughtError: false, errorSummary: '' };
  }

  static getDerivedStateFromError(errorObj: Error): ErrorBoundaryState {
    return { hasCaughtError: true, errorSummary: errorObj.message };
  }

  componentDidCatch(errorObj: Error, errorInfo: ErrorInfo): void {
    console.error('[FaultPrevention Boundary]:', errorObj, errorInfo);
  }

  handleResetView = (): void => {
    this.setState({ hasCaughtError: false, errorSummary: '' });
  };

  render(): ReactNode {
    if (this.state.hasCaughtError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-slate-900 border border-rose-500/40 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-rose-400 mb-2">
              Chế độ Tự Phục Hồi Giao Diện (Fault-Tolerant Guard)
            </h2>
            <p className="text-sm text-slate-300 mb-4">{this.state.errorSummary}</p>
            <button
              onClick={this.handleResetView}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold"
            >
              Khôi phục Phiên làm việc
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
