import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Currency } from '@prisma/client';
import { ApiResponse } from '../../../shared/types';
import { GetExchangeRateHandler, GetExchangeRateResult } from '../../../application/queries/GetExchangeRateHandler';
import { CurrencyConversionService } from '../../../application/services/CurrencyConversionService';

const currenciesSchema = z.object({
  currencies: z
    .string()
    .transform((val) => val.split(',') as Currency[])
    .pipe(z.array(z.nativeEnum(Currency))),
});

const previewSchema = z.object({
  amount: z.coerce.number().positive(),
  from: z.union([z.nativeEnum(Currency), z.literal('USDC')]),
  to: z.union([z.nativeEnum(Currency), z.literal('USDC')]),
});

export class ExchangeRateController {
  constructor(
    private readonly rateHandler: GetExchangeRateHandler,
    private readonly conversionService: CurrencyConversionService
  ) {}

  getRates = async (
    req: Request,
    res: Response<ApiResponse<GetExchangeRateResult>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Default to all supported currencies
      const currenciesParam = (req.query.currencies as string) || 'EUR,XOF,USD';
      const { currencies } = currenciesSchema.parse({ currencies: currenciesParam });

      const result = await this.rateHandler.execute({ currencies });

      res.json({
        success: true,
        data: result,
        meta: {
          requestId: req.headers['x-request-id'] as string,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getConversionPreview = async (
    req: Request,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { amount, from, to } = previewSchema.parse(req.query);

      const result = await this.conversionService.getConversionPreview(
        amount,
        from,
        to
      );

      res.json({
        success: true,
        data: result,
        meta: {
          requestId: req.headers['x-request-id'] as string,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
