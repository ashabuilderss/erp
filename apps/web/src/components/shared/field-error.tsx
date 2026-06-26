import { cn } from "@/lib/utils";

interface FieldErrorProps {
  error?: string;
  className?: string;
}

export function FieldError({ error, className }: FieldErrorProps) {
  if (!error) return null;
  return (
    <p className={cn("text-xs text-red-500 mt-0.5", className)}>{error}</p>
  );
}
