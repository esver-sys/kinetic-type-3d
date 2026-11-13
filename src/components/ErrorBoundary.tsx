import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
}

export class WebGLErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-x-0 bottom-8 z-0 flex justify-center pointer-events-none">
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-2 text-xs text-slate-400 backdrop-blur-md">
            3D WebGL hardware acceleration unavailable — typing practice remains active.
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
