import React from "react";

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[AppErrorBoundary]", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-[#0b1220] text-white px-6 py-10">
        <div className="mx-auto max-w-5xl rounded-2xl border border-red-500/30 bg-black/40 p-6">
          <h1 className="text-2xl font-bold text-red-300">Frontend crashed</h1>
          <p className="mt-3 text-sm text-zinc-300">
            The page hit a runtime error before it could render normally.
          </p>
          <pre className="mt-6 overflow-auto rounded-xl bg-black/60 p-4 text-xs text-red-200 whitespace-pre-wrap">
            {String(this.state.error?.stack || this.state.error?.message || this.state.error)}
          </pre>
          {this.state.errorInfo?.componentStack ? (
            <pre className="mt-4 overflow-auto rounded-xl bg-black/60 p-4 text-xs text-zinc-300 whitespace-pre-wrap">
              {this.state.errorInfo.componentStack}
            </pre>
          ) : null}
        </div>
      </div>
    );
  }
}
