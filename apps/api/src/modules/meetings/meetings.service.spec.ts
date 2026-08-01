import { Test, TestingModule } from '@nestjs/testing';
import { MeetingsService } from './meetings.service';
import { PrismaService } from '../../config/prisma.service';
import { TransitionService } from '../../common/services/transition.service';

describe('MeetingsService', () => {
  let service: MeetingsService;

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
        MeetingsService,
        { provide: PrismaService, useValue: {} },
        { provide: TransitionService, useValue: mockTransitionService },
      ],
    }).compile();

    service = module.get<MeetingsService>(MeetingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
