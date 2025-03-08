import { LoginLevel } from '@prisma/client';
import { FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';

const validateToken: FastifyPluginCallback = fp((server, _options, done) => {
    server.addHook('onRequest', async (request, reply) => {
        try {
            const token = request.headers['authorization']?.replace(
                'Bearer ',
                '',
            );
            if (!token) reply.status(401).send({ error: 'Unauthorized' });
            const blacklistedToken = await server.cache.get(token!);
            if (blacklistedToken) throw Error();
            const decoded = server.jwt.verify<{
                id: string;
                loginLevel: LoginLevel;
            }>(token!);
            if (!(decoded.id && decoded.loginLevel)) throw Error();
            request.user = decoded.id;
        } catch (error) {
            console.log(error);
            reply.status(401).send({ error: 'Invalid or expired token' });
        }
    });
    done();
});

export default validateToken;
