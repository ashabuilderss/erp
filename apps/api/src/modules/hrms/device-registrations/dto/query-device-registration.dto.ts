import { IsOptional, IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';

export class QueryDeviceRegistrationDto extends BaseQueryDto {}
