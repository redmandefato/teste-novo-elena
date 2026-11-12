import { Component, type ReactNode } from 'react';

export default class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidUpdate(prev: { resetKey?: string }) { if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null }); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="h-full grid place-items-center p-8 text-center">
        <div>
          <p className="text-lg font-semibold text-slate-800">Ops! Algo deu errado nesta tela.</p>
          <p className="text-sm text-slate-500 mt-1 max-w-md">{this.state.error.message}</p>
          <button className="mt-4 h-9 px-4 rounded-lg bg-brand-600 text-white text-sm" onClick={() => this.setState({ error: null })}>Tentar novamente</button>
        </div>
      </div>
    );
  }
}
