import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create system accounts
  const systemAccounts = [
    { accountType: 'ESCROW' as const, name: 'Escrow Account', description: 'Transit account for on/off-ramp' },
    { accountType: 'FEES' as const, name: 'Fees Account', description: 'Collected platform fees' },
    { accountType: 'LIQUIDITY' as const, name: 'Liquidity Pool', description: 'Crypto liquidity for conversions' },
  ];

  for (const account of systemAccounts) {
    await prisma.systemAccount.upsert({
      where: { accountType: account.accountType },
      update: {},
      create: account,
    });
  }

  console.log('System accounts created');

  // Create initial exchange rates (for testing)
  const now = new Date();
  const validUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

  const rates = [
    { quoteCurrency: 'EUR' as const, rate: 0.92, source: 'seed' },
    { quoteCurrency: 'XOF' as const, rate: 603.5, source: 'seed' },
    { quoteCurrency: 'USD' as const, rate: 1.0, source: 'seed' },
  ];

  for (const rate of rates) {
    await prisma.exchangeRate.upsert({
      where: {
        baseCurrency_quoteCurrency_validFrom: {
          baseCurrency: 'USDC',
          quoteCurrency: rate.quoteCurrency,
          validFrom: now,
        },
      },
      update: {},
      create: {
        baseCurrency: 'USDC',
        quoteCurrency: rate.quoteCurrency,
        rate: rate.rate,
        source: rate.source,
        validFrom: now,
        validUntil,
      },
    });
  }

  console.log('Exchange rates seeded');

  console.log('Database seeding completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
