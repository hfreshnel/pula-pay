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
  // Circle Token IDs (UUIDs, not contract addresses)
  // See: https://developers.circle.com/wallets/monitored-tokens
  USDC_TOKEN_ID_POLYGON_AMOY: z.string().default('36b6931a-873a-56a8-8a27-b706b17104ee'),
  USDC_TOKEN_ID_POLYGON: z.string().default('db6905b9-8bcd-5537-8b08-f5548bdf7925'),

  // Exchange Rate
  EXCHANGE_RATE_PROVIDER: z.string().default('coingecko'),
  EXCHANGE_RATE_CACHE_TTL_MINUTES: z.string().default('5').transform(Number),
  COINGECKO_API_KEY: z.string().optional(),
  XOF_EUR_FIXED_RATE: z.string().default('655.957').transform(Number),

  // MoMo
  MTN_MOMO_API_USER: z.string().optional(),
  MTN_MOMO_API_KEY: z.string().optional(),
  MTN_MOMO_COLLECTION_SUBSCRIPTION_KEY: z.string().optional(),
  MTN_MOMO_DISBURSEMENT_SUBSCRIPTION_KEY: z.string().optional(),
  MTN_MOMO_ENVIRONMENT: z.enum(['sandbox', 'production']).default('sandbox'),
  MTN_MOMO_CALLBACK_URL: z.string().optional(),
  MTN_MOMO_POLLING_INTERVAL_MS: z.string().default('5000').transform(Number),
  MTN_MOMO_POLLING_MAX_ATTEMPTS: z.string().default('24').transform(Number), // 2 minutes with 5s interval

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
    xofEurFixedRate: env.XOF_EUR_FIXED_RATE,
  },

  momo: {
    apiUser: env.MTN_MOMO_API_USER,
    apiKey: env.MTN_MOMO_API_KEY,
    collectionSubscriptionKey: env.MTN_MOMO_COLLECTION_SUBSCRIPTION_KEY,
    disbursementSubscriptionKey: env.MTN_MOMO_DISBURSEMENT_SUBSCRIPTION_KEY,
    environment: env.MTN_MOMO_ENVIRONMENT,
    callbackUrl: env.MTN_MOMO_CALLBACK_URL,
    pollingIntervalMs: env.MTN_MOMO_POLLING_INTERVAL_MS,
    pollingMaxAttempts: env.MTN_MOMO_POLLING_MAX_ATTEMPTS,
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
