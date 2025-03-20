import { LoginLevel } from '@prisma/client';
import { FastifyInstance } from 'fastify';

export function refreshRoutes(fastify: FastifyInstance) {
    fastify.get('/refresh', async (req, reply) => {
        try {
            const { refreshToken } = req.cookies;
            const accessToken = req.headers['authorization']?.replace(
                'Bearer ',
                '',
            );
            let decoded = null;
            if (!refreshToken || !accessToken) {
                return reply.code(401).send({ error: 'Unauthorized' });
            }
            try {
                decoded = fastify.jwt.verify<{ id: string }>(refreshToken, {
                    key: fastify.config.REFRESH_SECRET,
                });
            } catch {
                return reply
                    .code(403)
                    .send({ error: 'Invalid or expired refresh token' });
            }
            const decodedAccessToken = fastify.jwt.decode<{
                id: string;
                loginLevel: LoginLevel;
            }>(accessToken);
            if (decoded.id != decodedAccessToken?.id) throw Error();
            const blacklistedToken = await fastify.cache.get(refreshToken);
            if (blacklistedToken) throw Error();
            const newAuthToken = fastify.jwt.sign(
                {
                    id: decoded.id,
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
