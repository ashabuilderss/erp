import { Test, TestingModule } from '@nestjs/testing';
import { AgreementsController } from './agreements.controller';
import { AgreementsService } from './agreements.service';

describe('AgreementsController', () => {
  let controller: AgreementsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgreementsController],
      providers: [{ provide: AgreementsService, useValue: {} }],
    }).compile();

    controller = module.get<AgreementsController>(AgreementsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
