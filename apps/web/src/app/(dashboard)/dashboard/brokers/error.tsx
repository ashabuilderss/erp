"use client";

export default function BrokersError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <h2 className="text-xl font-semibold text-destructive">Something went wrong</h2>
      <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
      <button onClick={reset} className="mt-4 text-sm underline">Try again</button>
    </div>
  );
}
