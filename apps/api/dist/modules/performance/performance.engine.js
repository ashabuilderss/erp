"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceEngine = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const WEIGHTS = {
    task: 0.3,
    attendance: 0.25,
    eod: 0.2,
    manager: 0.25,
};
const SCORE_MIN = 0;
const SCORE_MAX = 100;
const TREND_IMPROVING_THRESHOLD = 2;
const TREND_DECLINING_THRESHOLD = -2;
let PerformanceEngine = class PerformanceEngine {
    calculate(input) {
        const taskScore = this.clampScore(input.taskScore);
        const attendanceScore = this.clampScore(input.attendanceScore);
        const eodScore = this.clampScore(input.eodScore);
        const managerScore = this.clampScore(input.managerScore);
        const compositeScore = this.computeWeightedComposite(taskScore, attendanceScore, eodScore, managerScore);
        const previousScore = input.previousCompositeScore ?? null;
        const scoreDelta = previousScore !== null
            ? Math.round((compositeScore - previousScore) * 100) / 100
            : null;
        const trend = this.computeTrend(scoreDelta);
        return {
            taskScore,
            attendanceScore,
            eodScore,
            managerScore,
            compositeScore,
            trend,
            scoreDelta,
        };
    }
    computeWeightedComposite(taskScore, attendanceScore, eodScore, managerScore) {
        const raw = taskScore * WEIGHTS.task +
            attendanceScore * WEIGHTS.attendance +
            eodScore * WEIGHTS.eod +
            managerScore * WEIGHTS.manager;
        return Math.round(raw * 100) / 100;
    }
    computeTrend(scoreDelta) {
        if (scoreDelta === null)
            return client_1.TrendDirection.STABLE;
        if (scoreDelta > TREND_IMPROVING_THRESHOLD)
            return client_1.TrendDirection.IMPROVING;
        if (scoreDelta < TREND_DECLINING_THRESHOLD)
            return client_1.TrendDirection.DECLINING;
        return client_1.TrendDirection.STABLE;
    }
    clampScore(score) {
        if (Number.isNaN(score) || score === null || score === undefined) {
            return SCORE_MIN;
        }
        return Math.max(SCORE_MIN, Math.min(SCORE_MAX, Math.round(score * 100) / 100));
    }
};
exports.PerformanceEngine = PerformanceEngine;
exports.PerformanceEngine = PerformanceEngine = __decorate([
    (0, common_1.Injectable)()
], PerformanceEngine);
//# sourceMappingURL=performance.engine.js.map