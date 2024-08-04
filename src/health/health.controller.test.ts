import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import {
  HealthCheckService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from 'src/prisma/prisma.service';

describe('HealthController', () => {
  let healthController: HealthController;
  let healthCheckService: HealthCheckService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: {
            check: vi.fn(),
          },
        },
        {
          provide: HttpHealthIndicator,
          useValue: {
            pingCheck: vi.fn(),
          },
        },
        {
          provide: PrismaHealthIndicator,
          useValue: {
            pingCheck: vi.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: MemoryHealthIndicator,
          useValue: {
            checkHeap: vi.fn(),
          },
        },
      ],
    }).compile();

    healthController = module.get<HealthController>(HealthController);
    healthCheckService = module.get<HealthCheckService>(HealthCheckService);
  });

  it('should be defined', () => {
    expect(healthController).toBeDefined();
  });

  it('should call health check services', async () => {
    const result = { status: 'ok' };

    (healthCheckService.check as Mock).mockResolvedValue(result);

    const response = await healthController.check();

    expect(response).toBe(result);
    expect(healthCheckService.check).toHaveBeenCalledWith([
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
    ]);
  });
});
