import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../../../shared/types';
import { ConfirmDepositHandler } from '../../../application/commands/ConfirmDepositHandler';
import { ActivateWalletHandler } from '../../../application/commands/ActivateWalletHandler';
import { OnRampProvider } from '../../../domain/ports/OnRampProvider';
import { logger } from '../../../shared/utils/logger';

interface MomoWebhookPayload {
  referenceId: string;
  status: 'SUCCESSFUL' | 'FAILED' | 'PENDING';
  financialTransactionId?: string;
  reason?: string;
}

interface CircleWebhookPayload {
  subscriptionId: string;
  notificationId: string;
  notificationType: string;
  notification: {
    id: string;
    walletId: string;
    state: string;
    txHash?: string;
    amounts?: string[];
    transactionType?: string;
  };
}

export class WebhookController {
  constructor(
    private readonly confirmDepositHandler: ConfirmDepositHandler,
    private readonly activateWalletHandler: ActivateWalletHandler,
    private readonly momoProvider: OnRampProvider
  ) {}

  handleMomoWebhook = async (
    req: Request,
    res: Response<ApiResponse>,
    _next: NextFunction
  ): Promise<void> => {
    try {
      // Validate webhook
      const isValid = this.momoProvider.validateWebhook(
        req.headers as Record<string, string>,
        req.body
      );

      if (!isValid) {
        logger.warn({ headers: req.headers }, 'Invalid MoMo webhook signature');
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_SIGNATURE',
            message: 'Invalid webhook signature',
          },
          meta: {
            requestId: req.headers['x-request-id'] as string,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const payload = req.body as MomoWebhookPayload;

      logger.info(
        { referenceId: payload.referenceId, status: payload.status },
        'MoMo webhook received'
      );

      // Process based on status
      if (payload.status === 'SUCCESSFUL' || payload.status === 'FAILED') {
        await this.confirmDepositHandler.execute({
          providerRef: payload.referenceId,
          providerStatus: payload.status === 'SUCCESSFUL' ? 'success' : 'failed',
          metadata: {
            financialTransactionId: payload.financialTransactionId,
            reason: payload.reason,
          },
        });
      }

      // Always acknowledge receipt
      res.status(200).json({
        success: true,
        meta: {
          requestId: req.headers['x-request-id'] as string,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error({ error }, 'Error processing MoMo webhook');
      // Still return 200 to prevent retries for unrecoverable errors
      res.status(200).json({
        success: true,
        meta: {
          requestId: req.headers['x-request-id'] as string,
          timestamp: new Date().toISOString(),
        },
      });
    }
  };

  handleCircleWebhook = async (
    req: Request,
    res: Response<ApiResponse>,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const payload = req.body as CircleWebhookPayload;

      logger.info(
        {
          notificationType: payload.notificationType,
          transactionId: payload.notification?.id,
          state: payload.notification?.state,
        },
        'Circle webhook received'
      );

      // Handle different notification types
      switch (payload.notificationType) {
        case 'transactions.outbound':
        case 'transactions.inbound':
          // Handle transaction state changes
          // TODO: Implement transaction confirmation logic
          break;

        case 'wallets':
          // Handle wallet state changes
          await this.handleWalletStateChange(payload);
          break;

        default:
          logger.debug(
            { notificationType: payload.notificationType },
            'Unhandled Circle notification type'
          );
      }

      res.status(200).json({
        success: true,
        meta: {
          requestId: req.headers['x-request-id'] as string,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error({ error }, 'Error processing Circle webhook');
      res.status(200).json({
        success: true,
        meta: {
          requestId: req.headers['x-request-id'] as string,
          timestamp: new Date().toISOString(),
        },
      });
    }
  };

  private async handleWalletStateChange(payload: CircleWebhookPayload): Promise<void> {
    const { walletId, state } = payload.notification;

    logger.info(
      { circleWalletId: walletId, state },
      'Processing wallet state change'
    );

    // Only activate if state is LIVE
    if (state === 'LIVE') {
      try {
        await this.activateWalletHandler.execute({
          circleWalletId: walletId,
        });
        logger.info({ circleWalletId: walletId }, 'Wallet activated via webhook');
      } catch (error) {
        logger.error(
          { error, circleWalletId: walletId },
          'Failed to activate wallet from webhook'
        );
        // Don't throw - we've logged the error and will return 200
      }
    } else {
      logger.debug(
        { circleWalletId: walletId, state },
        'Wallet state change not actionable'
      );
    }
  }
}
