"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white border shadow-lg rounded-xl p-4 flex items-center justify-between z-50">
      <div className="flex flex-col">
        <h3 className="font-semibold text-sm">Install Asha Builders App</h3>
        <p className="text-xs text-muted-foreground">Add to home screen for offline access</p>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleInstallClick} className="gap-2">
          <Download className="w-4 h-4" />
          Install
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setShowPrompt(false)}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
