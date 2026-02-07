import React from 'react';
import ErrorDisplay from './ErrorDisplay';

export default class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Route error boundary caught error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    const { hasError, error } = this.state;
    if (hasError) {
      return (
        <ErrorDisplay
          title="Something went wrong"
          error={error?.message || 'Unexpected error occurred'}
          onRetry={this.handleRetry}
        />
      );
    }
    return this.props.children;
  }
}
