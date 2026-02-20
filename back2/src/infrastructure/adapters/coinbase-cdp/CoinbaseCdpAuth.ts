import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../../../shared/config';
import { logger } from '../../../shared/utils/logger';

/**
 * Generates ES256 JWTs for authenticating with the Coinbase CDP API.
 *
 * The CDP API requires a JWT signed with the EC private key from the
 * downloaded cdp_api_key.json. Each JWT includes the target request
 * URI to prevent replay attacks.
 */
export class CoinbaseCdpAuth {
  private readonly apiKeyName: string;
  private readonly privateKey: string;

  constructor() {
    this.apiKeyName = config.coinbase.apiKeyName ?? '';
    this.privateKey = this.normalizePrivateKey(config.coinbase.apiKeyPrivateKey ?? '');
  }

  /**
   * Generate a short-lived JWT for a specific API request.
   * @param requestMethod - HTTP method (GET, POST, etc.)
   * @param requestPath - API path (e.g., /onramp/v1/token)
   */
  generateJwt(requestMethod: string, requestPath: string): string {
    const now = Math.floor(Date.now() / 1000);
    const uri = `${requestMethod.toUpperCase()} api.developer.coinbase.com${requestPath}`;

    const payload = {
      sub: this.apiKeyName,
      iss: 'cdp',
      aud: ['cdp_service'],
      nbf: now,
      exp: now + 120, // 2 minute expiry
      uris: [uri],
    };

    const header = {
      alg: 'ES256' as const,
      kid: this.apiKeyName,
      nonce: crypto.randomBytes(16).toString('hex'),
      typ: 'JWT',
    };

    try {
      return jwt.sign(payload, this.privateKey, {
        algorithm: 'ES256',
        header,
      });
    } catch (error) {
      logger.error({ error }, 'Failed to generate Coinbase CDP JWT');
      throw new Error('Failed to generate Coinbase CDP authentication token');
    }
  }

  /**
   * Normalize the private key format. CDP keys may have escaped newlines
   * from environment variables that need to be converted to real newlines.
   */
  private normalizePrivateKey(key: string): string {
    return key.replace(/\\n/g, '\n');
  }
}
