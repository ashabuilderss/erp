import { Test, TestingModule } from '@nestjs/testing';
import { TrainingService } from './training.service';
import { PrismaService } from '../../config/prisma.service';

describe('TrainingService', () => {
  let service: TrainingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TrainingService, { provide: PrismaService, useValue: {} }],
    }).compile();

    service = module.get<TrainingService>(TrainingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
