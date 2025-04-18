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
        res.clearCookie('access_token', { path: '/login/google/auth' });
        res.clearCookie('refreshToken', { path: '/refresh' });
        res.clearCookie('authToken', { path: '/' });
        res.clearCookie('userId', { path: '/socket' });
        res.clearCookie('userName', { path: '/socket' });
        res.send({ message: 'Logged out' });
        fastify.connections.get(req.user)?.close();
    });
}
