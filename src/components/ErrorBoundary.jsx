import { Component } from 'react';
import ErrorState from './ErrorState';

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
        <div className="min-h-screen bg-gray-950 text-white">
          <ErrorState
            title="The movie night hit an unexpected plot twist"
            message="Something in Pop & Chill stopped responding. Try the scene again, or head back home and start fresh."
            onRetry={() => {
              this.setState({ hasError: false });
              window.location.href = '/';
            }}
          />
        </div>
      );
    }
    return this.props.children;
  }
}
