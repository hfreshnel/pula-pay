import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiResponse } from '../../../shared/types';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  version: string;
  uptime: number;
  checks: {
    database: 'ok' | 'error';
  };
}

export class HealthController {
  private readonly startTime = Date.now();

  constructor(private readonly prisma: PrismaClient) {}

  getHealth = async (
    req: Request,
    res: Response<ApiResponse<HealthStatus>>
  ): Promise<void> => {
    let dbStatus: 'ok' | 'error' = 'error';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'ok';
    } catch {
      dbStatus = 'error';
    }

    const isHealthy = dbStatus === 'ok';

    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      data: {
        status: isHealthy ? 'healthy' : 'unhealthy',
        version: process.env.npm_package_version || '2.0.0',
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        checks: {
          database: dbStatus,
        },
      },
      meta: {
        requestId: req.headers['x-request-id'] as string,
        timestamp: new Date().toISOString(),
      },
    });
  };

  getReady = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    // Readiness check - can accept traffic
    res.json({
      success: true,
      data: { ready: true },
      meta: {
        requestId: req.headers['x-request-id'] as string,
        timestamp: new Date().toISOString(),
      },
    });
  };

  getLive = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    // Liveness check - process is alive
    res.json({
      success: true,
      data: { alive: true },
      meta: {
        requestId: req.headers['x-request-id'] as string,
        timestamp: new Date().toISOString(),
      },
    });
  };
}
