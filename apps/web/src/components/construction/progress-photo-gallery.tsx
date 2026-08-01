"use client";

import { useState, useMemo, useCallback } from "react";
import { LayoutGrid, LayoutList, Trash2, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { format } from "date-fns";
import type { ProgressPhoto } from "@/lib/types";
import { PhotoLightbox } from "./photo-lightbox";
import { PhotoTimeline } from "./photo-timeline";

type ViewMode = "grid" | "timeline";

interface ProgressPhotoGalleryProps {
  photos: ProgressPhoto[];
  onDelete?: (photoId: string) => void;
}

export function ProgressPhotoGallery({
  photos,
  onDelete,
}: ProgressPhotoGalleryProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [phaseFilter, setPhaseFilter] = useState<string>("all");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const phases = useMemo(() => {
    const phaseSet = new Set<string>();
    photos.forEach((p) => {
      if (p.phase?.name) phaseSet.add(p.phase.name);
    });
    return Array.from(phaseSet).sort();
  }, [photos]);

  const displayPhotos = useMemo(() => {
    let result = [...photos];
    if (phaseFilter !== "all") {
      result = result.filter((p) => p.phase?.name === phaseFilter);
    }
    result.sort((a, b) => {
      const dateA = new Date(a.takenAt || a.createdAt).getTime();
      const dateB = new Date(b.takenAt || b.createdAt).getTime();
      return dateB - dateA;
    });
    return result;
  }, [photos, phaseFilter]);

  const handlePhotoClick = useCallback((index: number) => {
    setLightboxIndex(index);
  }, []);

  const handleLightboxNavigate = useCallback((index: number) => {
    setLightboxIndex(index);
  }, []);

  const handleLightboxClose = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  const handleDeleteInLightbox = useCallback(
    (photoId: string) => {
      if (onDelete) {
        onDelete(photoId);
        setLightboxIndex(null);
      }
    },
    [onDelete]
  );

  if (photos.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No progress photos yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {phases.length > 1 && (
            <Select value={phaseFilter} onValueChange={(value) => { if (value) setPhaseFilter(value); }}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-3.5 w-3.5 mr-1" />
                <SelectValue placeholder="All phases" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All phases</SelectItem>
                {phases.map((phase) => (
                  <SelectItem key={phase} value={phase}>
                    {phase}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <span className="text-xs text-muted-foreground">
            {displayPhotos.length} photo{displayPhotos.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border overflow-hidden">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "timeline" ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setViewMode("timeline")}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {phaseFilter !== "all" && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            Phase: {phaseFilter}
            <button
              onClick={() => setPhaseFilter("all")}
              className="ml-1 hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        </div>
      )}

      {viewMode === "grid" ? (
        displayPhotos.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            <p>No photos match the selected filter</p>
            <Button
              variant="link"
              size="sm"
              className="mt-1"
              onClick={() => setPhaseFilter("all")}
            >
              Clear filter
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {displayPhotos.map((photo, index) => (
              <div
                key={photo.id}
                className="relative rounded-lg border overflow-hidden group cursor-pointer"
                onMouseEnter={() => setHoveredId(photo.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => handlePhotoClick(index)}
              >
                <div className="h-40 overflow-hidden">
                  <img
                    src={photo.photoUrl}
                    alt={photo.caption || "Progress photo"}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                </div>
                <div
                  className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent flex flex-col justify-end p-2 transition-opacity duration-200 ${
                    hoveredId === photo.id ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {photo.caption && (
                    <p className="text-xs text-white font-medium truncate">
                      {photo.caption}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-white/70">
                      {format(
                        new Date(photo.takenAt || photo.createdAt),
                        "MMM dd"
                      )}
                    </span>
                    {photo.phase?.name && (
                      <Badge
                        variant="secondary"
                        className="text-[9px] px-1 py-0 leading-none"
                      >
                        {photo.phase.name}
                      </Badge>
                    )}
                  </div>
                </div>
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className={`absolute top-1.5 right-1.5 bg-black/30 hover:bg-black/60 text-white transition-opacity duration-200 ${
                      hoveredId === photo.id ? "opacity-100" : "opacity-0"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(photo.id);
                    }}
                    title="Delete photo"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        <PhotoTimeline
          photos={displayPhotos}
          onPhotoClick={(index) => setLightboxIndex(index)}
        />
      )}

      {lightboxIndex !== null && displayPhotos.length > 0 && (
        <PhotoLightbox
          photos={displayPhotos}
          currentIndex={lightboxIndex}
          onClose={handleLightboxClose}
          onNavigate={handleLightboxNavigate}
          onDelete={onDelete ? handleDeleteInLightbox : undefined}
        />
      )}
    </div>
  );
}
