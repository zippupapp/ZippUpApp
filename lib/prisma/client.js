// Lazy Prisma client initialization to avoid build-time errors when the client isn't generated
let prismaClientInstance = null;

function getPrismaClient() {
  if (prismaClientInstance) return prismaClientInstance;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PrismaClient } = require('@prisma/client');
    prismaClientInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
    return prismaClientInstance;
  } catch (e) {
    // @prisma/client not generated or not installed
    return null;
  }
}

export const prisma = new Proxy({}, {
  get(_target, prop) {
    const client = getPrismaClient();
    if (!client) {
      throw new Error('Prisma client is not available. Run `npm run prisma:generate` to generate it.');
    }
    // @ts-ignore
    return client[prop];
  },
});

export default prisma;