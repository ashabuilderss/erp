"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ErrorFallbackProps {
  error: unknown;
  resetErrorBoundary: () => void;
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  const message = error instanceof Error ? error.message : "An unexpected error occurred.";
  return (
    <Card className="w-full">
      <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium text-foreground">Something went wrong</p>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          {message}
        </p>
        {resetErrorBoundary && (
          <Button variant="outline" onClick={resetErrorBoundary} className="mt-2">
            Try again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
