import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Pop & Chill crashed:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 text-white grid place-items-center px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-3">Something went wrong.</h1>
            <p className="text-neutral-400 mb-6">Give it another try.</p>
            <button
              className="btn btn-primary"
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = '/';
              }}
            >
              Back to Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
