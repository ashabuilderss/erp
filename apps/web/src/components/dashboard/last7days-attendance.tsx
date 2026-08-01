"use client";

import { useLast7DaysAttendance } from "@/hooks/api/useAttendance";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  COMPLETED: "bg-green-100 text-green-800",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
};

function cellDisplay(status: string | null) {
  if (!status) return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <Badge variant="outline" className={`${statusColors[status] ?? "bg-gray-100 text-gray-800"} text-xs px-1.5 py-0`}>
      {status === "COMPLETED" ? "C" : status === "UNDER_REVIEW" ? "UR" : status.slice(0, 2)}
    </Badge>
  );
}

interface AttendanceDay {
  date: string;
  present: number;
  absent: number;
  onLeave: number;
}

interface AttendanceEmployee {
  id: string;
  employeeCode: string;
  users: { firstName: string; lastName: string };
}

interface Last7DaysResponse {
  days: AttendanceDay[];
  employees: AttendanceEmployee[];
}

export function Last7DaysAttendance() {
  const { data, isLoading } = useLast7DaysAttendance();

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Last 7 Days Attendance</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">Loading...</p></CardContent>
      </Card>
    );
  }

  const resp = data as Last7DaysResponse | undefined;
  if (!resp?.days?.length || !resp.employees?.length) {
    return null;
  }

  return (
    <Card>
      <CardHeader><CardTitle>Last 7 Days Attendance</CardTitle></CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 pr-4 font-medium whitespace-nowrap">Employee</th>
              {resp.days.map((day) => {
                const dateObj = new Date(day.date);
                return (
                  <th key={day.date} className="pb-2 px-2 font-medium text-center whitespace-nowrap">
                    {format(dateObj, "EEE")}
                    <br />
                    <span className="text-xs">{format(dateObj, "MMM dd")}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {resp.employees.map((emp) => (
              <tr key={emp.id} className="border-b last:border-0">
                <td className="py-2 pr-4 whitespace-nowrap font-medium">
                  {emp.users.firstName} {emp.users.lastName}
                  <span className="text-xs text-muted-foreground ml-1">({emp.employeeCode})</span>
                </td>
                {resp.days.map((day) => {
                  let status: string | null = null;
                  if (day.present > 0) status = "COMPLETED";
                  else if (day.onLeave > 0) status = "UNDER_REVIEW";
                  else if (day.absent > 0) status = "UNDER_REVIEW";
                  return (
                    <td key={day.date} className="py-2 px-2 text-center">
                      {cellDisplay(status)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
