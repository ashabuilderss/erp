"use client";

import { useAttendance } from "@/hooks/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { MapPin, RefreshCw } from "lucide-react";
import type { Attendance } from "@/lib/types";

export default function LocationEvidencePage() {
  const { data: attendanceRes, isLoading, refetch, isFetching } = useAttendance();
  const attendanceRecords = attendanceRes?.data ?? [];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Location Evidence Tracker</h1>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Refresh Map Data
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 border rounded-lg h-[600px] bg-slate-100 flex items-center justify-center relative overflow-hidden">
          {/* Placeholder for actual Map component (e.g. Mapbox/Leaflet) */}
          <div className="absolute inset-0 opacity-20 bg-[url('https://maps.wikimedia.org/osm-intl/12/2923/1643.png')] bg-cover bg-center"></div>
          <div className="relative z-10 text-center">
            <h3 className="font-semibold text-lg text-slate-700">Map Integration Pending</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
              This space will host the interactive map displaying real-time employee check-in GPS pins and geofence boundaries for construction sites.
            </p>
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-white shadow-sm flex flex-col h-[600px]">
          <h2 className="font-semibold text-lg border-b pb-3 mb-4">Field Employee Status</h2>
          
          <div className="flex-1 overflow-y-auto space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-3 border rounded-md space-y-2">
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-24" />
                  </div>
                ))}
              </div>
            ) : attendanceRecords.length === 0 ? (
              <EmptyState
                icon={<MapPin className="h-8 w-8" />}
                title="No Attendance Data"
                description="No employee location records found for today."
                className="border-none shadow-none py-8"
              />
            ) : (
              attendanceRecords.map((emp: Attendance) => {
                const name = emp.employee?.user
                  ? `${emp.employee.user.firstName} ${emp.employee.user.lastName}`.trim()
                  : emp.employee?.employeeCode
                  ? `Employee #${emp.employee.employeeCode}`
                  : "Unknown Employee";

                const isPresent = Boolean(emp.checkIn);
                const isOnSite = Boolean(emp.checkIn && !emp.checkOut);
                const status = isOnSite ? "ON_SITE" : isPresent ? "PRESENT" : "ABSENT";
                const hasLocation = emp.latitude !== null && emp.longitude !== null;
                const locationStr = hasLocation
                  ? `${emp.latitude?.toFixed(4)}, ${emp.longitude?.toFixed(4)}`
                  : emp.employee?.department?.name || "No GPS recorded";

                return (
                  <div key={emp.id} className="p-3 border rounded-md flex flex-col gap-1">
                    <div className="flex justify-between items-start">
                      <span className="font-medium">{name}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          isOnSite
                            ? "bg-green-100 text-green-700"
                            : isPresent
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 inline" />
                        {locationStr}
                      </span>
                      {hasLocation && (
                        <span className="text-xs bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200 font-medium">
                          GPS ACTIVE
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
