import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  let appController: AppController;
  let appService: { getHealth: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    appService = {
      getHealth: vi.fn().mockReturnValue({ data: { status: 'ok' } }),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: AppService, useValue: appService }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('delegates the health response to AppService', () => {
      expect(appController.getHealth()).toEqual({ data: { status: 'ok' } });
      expect(appService.getHealth).toHaveBeenCalledOnce();
    });
  });
});
