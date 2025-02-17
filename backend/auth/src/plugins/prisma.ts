import { PrismaClient } from '@prisma/client';
import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

const prismaPlugin: FastifyPluginAsync = fp(async (server, _options) => {
    const prisma = new PrismaClient({
        log: ['error', 'warn'],
    });
    await prisma.$connect();
    server.decorate('prisma', prisma);

    console.log('prisma ok');
    server.addHook('onClose', async (server) => {
        server.log.info('disconnecting Prisma from DB');
        await server.prisma.$disconnect();
    });
});

export default prismaPlugin;
