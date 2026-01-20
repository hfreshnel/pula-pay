import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform(Number),
  API_URL: z.string().default('http://localhost:3000'),

  // Database
  DATABASE_URL: z.string(),

  // Circle
  CIRCLE_API_KEY: z.string(),
  CIRCLE_ENTITY_SECRET: z.string(),
  CIRCLE_WALLET_SET_ID: z.string(),
  CIRCLE_ENVIRONMENT: z.enum(['sandbox', 'production']).default('sandbox'),
  CIRCLE_RSA_PUBLIC_KEY: z.string(),

  // Blockchain
  DEFAULT_BLOCKCHAIN: z.string().default('POLYGON_AMOY'),
  USDC_TOKEN_ID_POLYGON_AMOY: z.string().default('0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582'),
  USDC_TOKEN_ID_POLYGON: z.string().default('0x3c499c542cef5e3811e1192ce70d8cc03d5c3359'),

  // Exchange Rate
  EXCHANGE_RATE_PROVIDER: z.string().default('coingecko'),
  EXCHANGE_RATE_CACHE_TTL_MINUTES: z.string().default('5').transform(Number),
  COINGECKO_API_KEY: z.string().optional(),

  // MoMo
  MTN_MOMO_API_KEY: z.string().optional(),
  MTN_MOMO_API_SECRET: z.string().optional(),
  MTN_MOMO_SUBSCRIPTION_KEY: z.string().optional(),
  MTN_MOMO_ENVIRONMENT: z.enum(['sandbox', 'production']).default('sandbox'),
  MTN_MOMO_CALLBACK_URL: z.string().optional(),

  // JWT
  JWT_SECRET: z.string().default('change-me-in-production'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('60000').transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),
});

const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.errors.map((e) => e.path.join('.')).join(', ');
      throw new Error(`Missing or invalid environment variables: ${missing}`);
    }
    throw error;
  }
};

const env = parseEnv();

export const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  apiUrl: env.API_URL,

  database: {
    url: env.DATABASE_URL,
  },

  circle: {
    apiKey: env.CIRCLE_API_KEY,
    entitySecret: env.CIRCLE_ENTITY_SECRET,
    walletSetId: env.CIRCLE_WALLET_SET_ID,
    environment: env.CIRCLE_ENVIRONMENT,
    rsaPublicKey: env.CIRCLE_RSA_PUBLIC_KEY,
  },

  blockchain: {
    default: env.DEFAULT_BLOCKCHAIN,
  },

  usdc: {
    tokenIds: {
      POLYGON_AMOY: env.USDC_TOKEN_ID_POLYGON_AMOY,
      POLYGON: env.USDC_TOKEN_ID_POLYGON,
    } as Record<string, string>,
  },

  exchangeRate: {
    provider: env.EXCHANGE_RATE_PROVIDER,
    cacheTtlMinutes: env.EXCHANGE_RATE_CACHE_TTL_MINUTES,
    coingeckoApiKey: env.COINGECKO_API_KEY,
  },

  momo: {
    apiKey: env.MTN_MOMO_API_KEY,
    apiSecret: env.MTN_MOMO_API_SECRET,
    subscriptionKey: env.MTN_MOMO_SUBSCRIPTION_KEY,
    environment: env.MTN_MOMO_ENVIRONMENT,
    callbackUrl: env.MTN_MOMO_CALLBACK_URL,
  },

  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
  },

  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },
} as const;

export type Config = typeof config;
