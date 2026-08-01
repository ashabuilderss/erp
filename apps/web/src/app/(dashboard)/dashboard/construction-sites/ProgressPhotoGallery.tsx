'use client';

import { useState, useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import type { ProgressPhoto } from '@/lib/types';

interface ProgressPhotoGalleryProps {
  photos: ProgressPhoto[];
  onDelete?: (photoId: string) => void;
}

export function ProgressPhotoGallery({ photos, onDelete }: ProgressPhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const sortedPhotos = useMemo(() => {
    return [...photos].sort((a, b) => {
      const dateA = new Date(a.takenAt || a.createdAt).getTime();
      const dateB = new Date(b.takenAt || b.createdAt).getTime();
      return dateB - dateA;
    });
  }, [photos]);

  if (photos.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No progress photos yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {sortedPhotos.map((photo) => (
          <div
            key={photo.id}
            className="relative rounded-lg border overflow-hidden group cursor-pointer"
            onMouseEnter={() => setHoveredId(photo.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => setLightboxIndex(sortedPhotos.indexOf(photo))}
          >
            <div className="h-40 overflow-hidden">
              <img
                src={photo.photoUrl}
                alt={photo.caption || 'Progress photo'}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
            </div>
            <div
              className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent flex flex-col justify-end p-2 transition-opacity duration-200 ${
                hoveredId === photo.id ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {photo.caption && (
                <p className="text-xs text-white font-medium truncate">{photo.caption}</p>
              )}
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-white/70">
                  {format(new Date(photo.takenAt || photo.createdAt), 'MMM dd')}
                </span>
                {photo.phase?.name && (
                  <Badge variant="secondary" className="text-[9px] px-1 py-0 leading-none">
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
                  hoveredId === photo.id ? 'opacity-100' : 'opacity-0'
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

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={sortedPhotos[lightboxIndex].photoUrl}
              alt={sortedPhotos[lightboxIndex].caption || 'Progress photo'}
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-lg">
              {sortedPhotos[lightboxIndex].caption && (
                <p className="text-white font-medium">{sortedPhotos[lightboxIndex].caption}</p>
              )}
              <p className="text-white/70 text-sm">
                {format(new Date(sortedPhotos[lightboxIndex].takenAt || sortedPhotos[lightboxIndex].createdAt), 'MMM dd, yyyy')}
              </p>
            </div>
            <button
              className="absolute top-2 right-2 text-white/70 hover:text-white text-xl"
              onClick={() => setLightboxIndex(null)}
            >
              ×
            </button>
            {lightboxIndex > 0 && (
              <button
                className="absolute left-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-3xl"
                onClick={() => setLightboxIndex(lightboxIndex - 1)}
              >
                ‹
              </button>
            )}
            {lightboxIndex < sortedPhotos.length - 1 && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-3xl"
                onClick={() => setLightboxIndex(lightboxIndex + 1)}
              >
                ›
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
