import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../../shared/utils/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  // Generate request ID
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();
  req.headers['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);

  const startTime = Date.now();

  // Log request
  logger.info(
    {
      requestId,
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip,
    },
    'Incoming request'
  );

  // Log response on finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info(
      {
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
      },
      'Request completed'
    );
  });

  next();
}
