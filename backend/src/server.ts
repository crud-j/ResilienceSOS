import 'dotenv/config';
import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'ResilienceSOS backend started');
});

async function shutdown(): Promise<void> {
  logger.info('Shutting down...');
  await prisma.$disconnect();
  server.close(() => process.exit(0));
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
