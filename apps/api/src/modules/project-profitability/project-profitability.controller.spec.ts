import { Test, TestingModule } from '@nestjs/testing';
import { ProjectProfitabilityController } from './project-profitability.controller';
import { ProjectProfitabilityService } from './project-profitability.service';

describe('ProjectProfitabilityController', () => {
  let controller: ProjectProfitabilityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectProfitabilityController],
      providers: [{ provide: ProjectProfitabilityService, useValue: {} }],
    }).compile();

    controller = module.get<ProjectProfitabilityController>(ProjectProfitabilityController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
