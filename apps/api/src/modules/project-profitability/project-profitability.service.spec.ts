import { Test, TestingModule } from '@nestjs/testing';
import { ProjectProfitabilityService } from './project-profitability.service';
import { PrismaService } from '../../config/prisma.service';

describe('ProjectProfitabilityService', () => {
  let service: ProjectProfitabilityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectProfitabilityService, { provide: PrismaService, useValue: {} }],
    }).compile();

    service = module.get<ProjectProfitabilityService>(ProjectProfitabilityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
