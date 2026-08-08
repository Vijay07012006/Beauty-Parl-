'use client';

import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4 p-4 bg-background">
      <h2 className="text-2xl font-playfair font-bold text-foreground">Something went wrong</h2>
      <p className="text-muted-foreground text-sm max-w-md text-center">{error.message}</p>
      <button
        onClick={resetErrorBoundary}
        className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary/90 cursor-pointer text-sm font-medium"
      >
        Try again
      </button>
    </div>
  );
}

export function ErrorBoundaryProvider({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      {children}
    </ErrorBoundary>
  );
}
