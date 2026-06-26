"use client";

import { useEffect, useCallback, useState } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { ProgressPhoto } from "@/lib/types";

interface PhotoLightboxProps {
  photos: ProgressPhoto[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onDelete?: (photoId: string) => void;
}

export function PhotoLightbox({
  photos,
  currentIndex,
  onClose,
  onNavigate,
  onDelete,
}: PhotoLightboxProps) {
  const [zoomed, setZoomed] = useState(false);
  const photo = photos[currentIndex];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          if (currentIndex > 0) onNavigate(currentIndex - 1);
          break;
        case "ArrowRight":
          if (currentIndex < photos.length - 1) onNavigate(currentIndex + 1);
          break;
      }
    },
    [currentIndex, photos.length, onClose, onNavigate]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  if (!photo) return null;

  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;

  const formattedDate = (() => {
    const date = new Date(photo.takenAt || photo.createdAt);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const photoDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (photoDate.getTime() === today.getTime()) return "Today";
    if (photoDate.getTime() === yesterday.getTime()) return "Yesterday";
    return format(date, "MMMM dd, yyyy");
  })();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Previous button */}
      {hasPrevious && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(currentIndex - 1);
          }}
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>
      )}

      {/* Next button */}
      {hasNext && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(currentIndex + 1);
          }}
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      )}

      {/* Image */}
      <div
        className="flex items-center justify-center max-h-[85vh] max-w-[90vw] cursor-pointer"
        onClick={() => setZoomed(!zoomed)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.photoUrl}
          alt={photo.caption || "Progress photo"}
          className={`transition-transform duration-200 ${
            zoomed
              ? "max-h-none max-w-none cursor-zoom-out"
              : "max-h-[85vh] max-w-[90vw] cursor-zoom-in"
          }`}
          style={zoomed ? { maxHeight: "none", maxWidth: "none" } : undefined}
        />
      </div>

      {/* Bottom info bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pt-12">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="space-y-1 text-white">
            {photo.caption && (
              <p className="text-sm font-medium">{photo.caption}</p>
            )}
            <div className="flex items-center gap-2 text-xs text-white/70">
              <span>{formattedDate}</span>
              {photo.phase?.name && (
                <>
                  <span>&middot;</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {photo.phase.name}
                  </Badge>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/70">
              {currentIndex + 1} of {photos.length}
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-white/70 hover:text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                setZoomed(!zoomed);
              }}
              title={zoomed ? "Zoom out" : "Zoom in"}
            >
              {zoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
            </Button>
            {onDelete && (
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-white/70 hover:text-red-400 hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(photo.id);
                }}
                title="Delete photo"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
