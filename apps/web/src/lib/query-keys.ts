import type {
  QueryPerformanceScoresDto,
  QueryAnnouncementsDto,
  QueryDocumentsDto,
  QueryDocumentAccessLogsDto,
  QueryReportExportsDto,
} from "./types";

export const queryKeys = {
  performanceScores: {
    all: ["performance-scores"] as const,
    list: (query: QueryPerformanceScoresDto) =>
      ["performance-scores", query] as const,
    detail: (id: string) => ["performance-scores", id] as const,
    trends: (params: {
      employeeId?: string;
      periodType?: string;
      limit?: number;
    }) => ["performance-scores", "trends", params] as const,
    leaderboard: (params: {
      period: string;
      periodType: string;
      limit?: number;
    }) => ["performance-scores", "leaderboard", params] as const,
  },

  announcements: {
    all: ["announcements"] as const,
    list: (query: QueryAnnouncementsDto) =>
      ["announcements", query] as const,
    my: ["announcements", "my"] as const,
    detail: (id: string) => ["announcements", id] as const,
    receipts: (id: string) => ["announcements", id, "receipts"] as const,
  },

  documents: {
    all: ["documents"] as const,
    list: (query: QueryDocumentsDto) => ["documents", query] as const,
    detail: (id: string) => ["documents", id] as const,
    accessLogs: (id: string, query: QueryDocumentAccessLogsDto) =>
      ["documents", id, "access-logs", query] as const,
    accessStats: (id: string) => ["documents", id, "access-stats"] as const,
  },

  exportConfigs: {
    all: ["export-configs"] as const,
    detail: (id: string) => ["export-configs", id] as const,
  },

  exportHistory: {
    all: ["export-history"] as const,
    list: (query: QueryReportExportsDto) =>
      ["export-history", query] as const,
  },

  reportExports: {
    all: ["report-exports"] as const,
  },

  owner: {
    metrics: (date?: string) => ["owner", "metrics", date] as const,
    kpi: (date?: string) => ["owner", "kpi", date] as const,
    alerts: (limit?: number) => ["owner", "alerts", limit] as const,
    history: (days?: number) => ["owner", "history", days] as const,
  },

  security: {
    events: ["security-events"] as const,
  },
} as const;
