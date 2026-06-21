import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

// Catches render-time errors anywhere below it and shows a readable message
// instead of a blank page. (Without this, today's crash was just a dark screen.)
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Caught by ErrorBoundary:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-neutral-950 p-6 text-center text-neutral-200">
          <h1 className="text-xl font-semibold text-red-400">Something went wrong</h1>
          <p className="max-w-md text-sm text-neutral-400">{this.state.error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
