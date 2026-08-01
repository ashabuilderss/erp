import { Test, TestingModule } from '@nestjs/testing';
import { TrendDirection } from '@prisma/client';
import { PerformanceEngine } from './performance.engine';

describe('PerformanceEngine', () => {
  let engine: PerformanceEngine;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PerformanceEngine],
    }).compile();

    engine = module.get<PerformanceEngine>(PerformanceEngine);
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  describe('calculate', () => {
    it('should compute weighted composite score correctly', () => {
      const result = engine.calculate({
        taskScore: 80,
        attendanceScore: 90,
        eodScore: 70,
        managerScore: 85,
      });

      // 80*0.30 + 90*0.25 + 70*0.20 + 85*0.25 = 24 + 22.5 + 14 + 21.25 = 81.75
      expect(result.compositeScore).toBe(81.75);
    });

    it('should clamp scores to 0-100 range', () => {
      const result = engine.calculate({
        taskScore: 150,
        attendanceScore: -10,
        eodScore: 200,
        managerScore: -50,
      });

      expect(result.taskScore).toBe(100);
      expect(result.attendanceScore).toBe(0);
      expect(result.eodScore).toBe(100);
      expect(result.managerScore).toBe(0);
    });

    it('should handle NaN scores gracefully', () => {
      const result = engine.calculate({
        taskScore: NaN,
        attendanceScore: undefined as any,
        eodScore: null as any,
        managerScore: 50,
      });

      expect(result.taskScore).toBe(0);
      expect(result.attendanceScore).toBe(0);
      expect(result.eodScore).toBe(0);
      expect(result.managerScore).toBe(50);
    });

    it('should return STABLE trend when no previous score', () => {
      const result = engine.calculate({
        taskScore: 80,
        attendanceScore: 90,
        eodScore: 70,
        managerScore: 85,
      });

      expect(result.trend).toBe(TrendDirection.STABLE);
      expect(result.scoreDelta).toBeNull();
    });

    it('should return IMPROVING trend when score increases significantly', () => {
      const result = engine.calculate({
        taskScore: 90,
        attendanceScore: 90,
        eodScore: 90,
        managerScore: 90,
        previousCompositeScore: 70,
      });

      expect(result.trend).toBe(TrendDirection.IMPROVING);
      expect(result.scoreDelta).toBeGreaterThan(0);
    });

    it('should return DECLINING trend when score decreases significantly', () => {
      const result = engine.calculate({
        taskScore: 50,
        attendanceScore: 50,
        eodScore: 50,
        managerScore: 50,
        previousCompositeScore: 80,
      });

      expect(result.trend).toBe(TrendDirection.DECLINING);
      expect(result.scoreDelta).toBeLessThan(0);
    });

    it('should return STABLE trend for small changes', () => {
      const result = engine.calculate({
        taskScore: 80,
        attendanceScore: 80,
        eodScore: 80,
        managerScore: 80,
        previousCompositeScore: 79,
      });

      expect(result.trend).toBe(TrendDirection.STABLE);
    });

    it('should be deterministic - same input produces same output', () => {
      const input = {
        taskScore: 75,
        attendanceScore: 85,
        eodScore: 65,
        managerScore: 90,
        previousCompositeScore: 70,
      };

      const result1 = engine.calculate(input);
      const result2 = engine.calculate(input);

      expect(result1).toEqual(result2);
    });

    it('should enforce score range 0-100 for composite', () => {
      const result = engine.calculate({
        taskScore: 100,
        attendanceScore: 100,
        eodScore: 100,
        managerScore: 100,
      });

      expect(result.compositeScore).toBe(100);
      expect(result.compositeScore).toBeGreaterThanOrEqual(0);
      expect(result.compositeScore).toBeLessThanOrEqual(100);
    });
  });
});
