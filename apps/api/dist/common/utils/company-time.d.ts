export declare function getCompanyTz(settings: Record<string, unknown> | null): string;
export declare function getTodayInTz(tz: string): Date;
export declare function getNowInTz(tz: string): Date;
export declare function getTimeInTz(tz: string): {
    hours: number;
    minutes: number;
};
export declare function getDateStringInTz(tz: string): string;
