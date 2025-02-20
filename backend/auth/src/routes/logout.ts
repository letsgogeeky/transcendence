import { FastifyInstance } from 'fastify';
import twoFAuthCheck from '../plugins/2fa.js';

export function logoutRoutes(fastify: FastifyInstance) {
    fastify.register(twoFAuthCheck);
    fastify.post('/logout', async (req, res) => {
        await fastify.prisma.blacklistToken.create({
            data: {
                token: req.headers['authorization']!.replace('Bearer ', ''),
            },
        });
        res.send({ message: 'Logged out' });
    });
}
