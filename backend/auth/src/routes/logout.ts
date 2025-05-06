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
        res.clearCookie('access_token', { path: '/auth/login/google/auth' });
        res.clearCookie('refreshToken', { path: '/auth/refresh' });
        res.clearCookie('authToken', { path: '/' });
        res.clearCookie('userId', { path: '/auth/socket' });
        res.clearCookie('userName', { path: '/auth/socket' });
        res.clearCookie('oauth2-redirect-state', { path: '/' });
        res.send({ message: 'Logged out' });
        const userSockets = fastify.connections.get(req.user);
        userSockets?.forEach((s) => {
            const message = JSON.stringify({
                type: 'TERMINATE',
            });
            s.send(message);
            s.close();
        });
    });
}
