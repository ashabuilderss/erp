const DEFAULT_TZ = 'UTC';

export function getCompanyTz(settings: Record<string, unknown> | null): string {
  return (settings?.timezone as string) || DEFAULT_TZ;
}

export function getTodayInTz(tz: string): Date {
  const now = new Date();
  const tzNow = new Date(now.toLocaleString('en-US', { timeZone: tz }));
  return new Date(
    Date.UTC(tzNow.getFullYear(), tzNow.getMonth(), tzNow.getDate()),
  );
}

export function getNowInTz(tz: string): Date {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: tz }));
}

export function getTimeInTz(tz: string): { hours: number; minutes: number } {
  const d = getNowInTz(tz);
  return { hours: d.getHours(), minutes: d.getMinutes() };
}

export function getDateStringInTz(tz: string): string {
  const d = getNowInTz(tz);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
