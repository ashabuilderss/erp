"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Clock } from "lucide-react";

export function DashboardClock() {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = format(now, "yyyy-MM-dd");
      const timeStr = format(now, "HH:mm:ss");
      setTime(`${dateStr} ${timeStr}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Clock className="h-4 w-4" />
      <span className="font-mono">{time || "Loading..."}</span>
    </div>
  );
}
