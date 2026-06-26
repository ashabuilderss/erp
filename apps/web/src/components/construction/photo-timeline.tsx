"use client";

import { useState, useMemo } from "react";
import { ArrowUpDown, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import type { ProgressPhoto } from "@/lib/types";

interface PhotoTimelineProps {
  photos: ProgressPhoto[];
  onPhotoClick: (index: number) => void;
}

function formatDateLabel(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM dd, yyyy");
}

export function PhotoTimeline({ photos, onPhotoClick }: PhotoTimelineProps) {
  const [sortNewestFirst, setSortNewestFirst] = useState(true);
  const [phaseFilter, setPhaseFilter] = useState<string>("all");

  const phases = useMemo(() => {
    const phaseSet = new Set<string>();
    photos.forEach((p) => {
      if (p.phase?.name) phaseSet.add(p.phase.name);
    });
    return Array.from(phaseSet).sort();
  }, [photos]);

  const filteredPhotos = useMemo(() => {
    let result = [...photos];
    if (phaseFilter !== "all") {
      result = result.filter((p) => p.phase?.name === phaseFilter);
    }
    result.sort((a, b) => {
      const dateA = new Date(a.takenAt || a.createdAt).getTime();
      const dateB = new Date(b.takenAt || b.createdAt).getTime();
      return sortNewestFirst ? dateB - dateA : dateA - dateB;
    });
    return result;
  }, [photos, phaseFilter, sortNewestFirst]);

  // Group photos by date
  const groupedByDate = useMemo(() => {
    const groups: { dateKey: string; photos: ProgressPhoto[] }[] = [];
    const map = new Map<string, ProgressPhoto[]>();

    filteredPhotos.forEach((photo) => {
      const dateKey = (photo.takenAt || photo.createdAt).split("T")[0];
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(photo);
    });

    const entries = Array.from(map.entries());
    entries.sort((a, b) => {
      return sortNewestFirst
        ? new Date(b[0]).getTime() - new Date(a[0]).getTime()
        : new Date(a[0]).getTime() - new Date(b[0]).getTime();
    });

    for (const [dateKey, datePhotos] of entries) {
      groups.push({ dateKey, photos: datePhotos });
    }
    return groups;
  }, [filteredPhotos, sortNewestFirst]);

  if (photos.length === 0) {
    return (
      <div className="text-center py-12">
        <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">No photos to show in timeline</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {phases.length > 1 && (
          <Select value={phaseFilter} onValueChange={(value) => { if (value) setPhaseFilter(value); }}>
            <SelectTrigger className="w-[160px]">
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSortNewestFirst(!sortNewestFirst)}
          className="gap-1"
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          {sortNewestFirst ? "Newest first" : "Oldest first"}
        </Button>
      </div>

      {/* Timeline */}
      <div className="space-y-8">
        {groupedByDate.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No photos match the selected filter
          </p>
        ) : (
          groupedByDate.map((group) => (
            <div key={group.dateKey}>
              {/* Date separator */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
                  {formatDateLabel(group.dateKey)}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Photos for this date */}
              <div className="space-y-3">
                {group.photos.map((photo) => {
                  const globalIndex = filteredPhotos.indexOf(photo);
                  return (
                    <div
                      key={photo.id}
                      className="flex gap-3 rounded-lg border p-2 cursor-pointer hover:bg-muted/50 transition-colors group"
                      onClick={() => onPhotoClick(globalIndex)}
                    >
                      {/* Thumbnail */}
                      <div className="shrink-0 w-20 h-20 rounded-md overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.photoUrl}
                          alt={photo.caption || "Progress photo"}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                        {photo.caption && (
                          <p className="text-sm font-medium truncate">
                            {photo.caption}
                          </p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(photo.takenAt || photo.createdAt), "hh:mm a")}
                          </span>
                          {photo.phase?.name && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {photo.phase.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
