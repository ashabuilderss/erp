import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { CalculateScoreDto } from './dto/calculate-score.dto';
import { RateEmployeeDto } from './dto/rate-employee.dto';
import { GetTrendsDto } from './dto/get-trends.dto';
import { GetLeaderboardDto } from './dto/get-leaderboard.dto';
import { ListScoresDto } from './dto/list-scores.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permissions } from '../../common/auth/permissions';
import {
  CurrentUser,
  CurrentCompany,
} from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('performance-scores')
export class PerformanceScoreController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Post('calculate')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.PERFORMANCE_CALCULATE)
  async calculateScore(
    @Body() dto: CalculateScoreDto,
    @CurrentCompany('id') companyId: string,
    @CurrentUser('id') userId: string,
  ) {
    const scoreId = await this.performanceService.calculateScore({
      companyId,
      employeeId: dto.employeeId,
      period: dto.period,
      periodType: dto.periodType,
      calculatedById: dto.calculatedById ?? userId,
    });
    return this.performanceService.getScore(scoreId, companyId);
  }

  @Post('rate')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.PERFORMANCE_RATE)
  async rateEmployee(
    @Body() dto: RateEmployeeDto,
    @CurrentCompany('id') companyId: string,
    @CurrentUser('id') userId: string,
  ) {
    const ratingId = await this.performanceService.rateEmployee({
      companyId,
      performanceScoreId: dto.performanceScoreId,
      ratedById: dto.ratedById ?? userId,
      score: dto.score,
      comment: dto.comment,
    });
    return { id: ratingId };
  }

  @Get('trends')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.PERFORMANCE_TREND)
  async getTrends(
    @Query() query: GetTrendsDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.performanceService.getTrends({
      companyId,
      employeeId: query.employeeId,
      periodType: query.periodType,
      limit: query.limit,
    });
  }

  @Get('leaderboard')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE)
  @RequirePermissions(Permissions.PERFORMANCE_LEADERBOARD)
  async getLeaderboard(
    @Query() query: GetLeaderboardDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.performanceService.getLeaderboard({
      companyId,
      period: query.period,
      periodType: query.periodType,
      limit: query.limit,
    });
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.PERFORMANCE_READ)
  async listScores(
    @Query() query: ListScoresDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.performanceService.listScores(companyId, {
      page: query.page,
      limit: query.limit,
      employeeId: query.employeeId,
      periodType: query.periodType,
      period: query.period,
    });
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER)
  @RequirePermissions(Permissions.PERFORMANCE_READ)
  async getScore(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.performanceService.getScore(id, companyId);
  }

  @Post('recalculate')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @RequirePermissions(Permissions.PERFORMANCE_CALCULATE)
  async recalculateScore(
    @Body() dto: CalculateScoreDto,
    @CurrentCompany('id') companyId: string,
    @CurrentUser('id') userId: string,
  ) {
    const scoreId = await this.performanceService.recalculateScore(
      companyId,
      dto.employeeId,
      dto.period,
      dto.periodType,
      dto.calculatedById ?? userId,
    );
    return this.performanceService.getScore(scoreId, companyId);
  }
}
