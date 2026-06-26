"use client";

import { useLast7DaysAttendance } from "@/hooks/api/useAttendance";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  PRESENT: "bg-green-100 text-green-800",
  ABSENT: "bg-red-100 text-red-800",
  HALF_DAY: "bg-yellow-100 text-yellow-800",
  LEAVE: "bg-blue-100 text-blue-800",
  PARTIAL: "bg-orange-100 text-orange-800",
};

function cellDisplay(status: string | null) {
  if (!status) return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <Badge variant="outline" className={`${statusColors[status] ?? "bg-gray-100 text-gray-800"} text-xs px-1.5 py-0`}>
      {status === "PRESENT" ? "P" : status === "ABSENT" ? "A" : status === "HALF_DAY" ? "HD" : status === "LEAVE" ? "L" : status === "PARTIAL" ? "PA" : status.slice(0, 2)}
    </Badge>
  );
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

  if (!data || !data.employees || data.employees.length === 0) {
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
              {data.days.map((day) => (
                <th key={day} className="pb-2 px-2 font-medium text-center whitespace-nowrap">
                  {format(new Date(day), "EEE")}
                  <br />
                  <span className="text-xs">{format(new Date(day), "MMM dd")}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.employees.map((emp) => (
              <tr key={emp.employee.id} className="border-b last:border-0">
                <td className="py-2 pr-4 whitespace-nowrap font-medium">
                  {emp.employee.user.firstName} {emp.employee.user.lastName}
                  <span className="text-xs text-muted-foreground ml-1">({emp.employee.employeeCode})</span>
                </td>
                {data.days.map((day) => (
                  <td key={day} className="py-2 px-2 text-center">
                    {cellDisplay(emp.days[day] ?? null)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
