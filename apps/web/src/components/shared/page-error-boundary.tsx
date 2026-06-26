"use client";

import { ErrorBoundary } from "react-error-boundary";
import { ErrorFallback } from "@/components/shared/error-fallback";

export function PageErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
      {children}
    </ErrorBoundary>
  );
}
