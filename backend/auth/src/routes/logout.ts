import { FastifyInstance } from 'fastify';
import twoFAuthCheck from '../plugins/2fa.js';

export function logoutRoutes(fastify: FastifyInstance) {
    fastify.register(twoFAuthCheck);
    fastify.post('/logout', async (req, res) => {
        fastify.cache.set(
            req.headers['authorization']!.replace('Bearer ', ''),
            1,
            600,
        );
        res.send({ message: 'Logged out' });
        fastify.connections.get(req.user)?.terminate();
    });
}
