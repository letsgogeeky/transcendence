import { LoginLevel } from '@prisma/client';
import { FastifyInstance } from 'fastify';

export function refreshRoutes(fastify: FastifyInstance) {
    fastify.post('/refresh', async (req, reply) => {
        try {
            const { refreshToken } = req.cookies;
            if (!refreshToken) {
                return reply.code(401).send({ error: 'Unauthorized' });
            }
            const decoded = fastify.jwt.verify<{ id: string }>(refreshToken, {
                key: fastify.config.REFRESH_SECRET,
            });

            const accessToken = req.headers['authorization']?.replace(
                'Bearer ',
                '',
            );
            const decodedAccessToken = fastify.jwt.verify<{
                id: string;
                loginLevel: LoginLevel;
            }>(accessToken || '');
            if (decoded.id != decodedAccessToken.id) throw Error();
            const blacklistedToken = await fastify.cache.get(refreshToken);
            console.log(blacklistedToken ? 'blacklisted' : 'not black');
            if (blacklistedToken) throw Error();
            const newAuthToken = fastify.jwt.sign(
                {
                    id: req.user,
                    loginLevel: LoginLevel.FULL,
                },
                { expiresIn: '10m', key: fastify.config.SECRET },
            );
            return reply.send({ authToken: newAuthToken });
        } catch {
            return reply.code(403).send({ error: 'Invalid refresh token' });
        }
    });
}
