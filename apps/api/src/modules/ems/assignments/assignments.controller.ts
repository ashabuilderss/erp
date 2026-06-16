import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { QueryAssignmentDto } from './dto/query-assignment.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import {
  CurrentCompany,
  CurrentEmployeeId,
  CurrentUser,
} from '../../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Get('me')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async getMyAssignments(
    @CurrentEmployeeId() employeeId: string | null,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.assignmentsService.getAssignmentsByEmployee(
      employeeId!,
      companyId,
    );
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async create(
    @Body() dto: CreateAssignmentDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.assignmentsService.create(dto, companyId);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(
    @Query() query: QueryAssignmentDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.assignmentsService.findAll(query, companyId);
  }

  @Get('employee/:employeeId')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async getByEmployee(
    @Param('employeeId') employeeId: string,
    @CurrentCompany('id') companyId: string,
    @CurrentEmployeeId() currentEmployeeId: string | null,
    @CurrentUser('role') role: string,
  ) {
    const resolvedId = role === 'EMPLOYEE' ? currentEmployeeId! : employeeId;
    return this.assignmentsService.getAssignmentsByEmployee(
      resolvedId,
      companyId,
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  async findOne(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.assignmentsService.findOne(id, companyId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAssignmentDto,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.assignmentsService.update(id, dto, companyId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(
    @Param('id') id: string,
    @CurrentCompany('id') companyId: string,
  ) {
    return this.assignmentsService.remove(id, companyId);
  }
}
