import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
        {icon && <div className="text-muted-foreground">{icon}</div>}
        <p className="text-lg font-medium text-foreground">{title}</p>
        {description && <p className="text-sm text-muted-foreground text-center max-w-md">{description}</p>}
        {action && <div className="mt-2">{action}</div>}
      </CardContent>
    </Card>
  );
}
