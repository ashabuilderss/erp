import { Test, TestingModule } from '@nestjs/testing';
import { AgreementsService } from './agreements.service';
import { PrismaService } from '../../config/prisma.service';
import { TransitionService } from '../../common/services/transition.service';

describe('AgreementsService', () => {
  let service: AgreementsService;

  const mockTransitionService = {
    validate: jest.fn(),
    canTransition: jest.fn().mockReturnValue(true),
    execute: jest.fn(),
    getRule: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockTransitionService.validate.mockReset();
    mockTransitionService.validate.mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgreementsService,
        { provide: PrismaService, useValue: {} },
        { provide: TransitionService, useValue: mockTransitionService },
      ],
    }).compile();

    service = module.get<AgreementsService>(AgreementsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
