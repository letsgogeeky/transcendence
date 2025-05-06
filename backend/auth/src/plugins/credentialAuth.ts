import { LoginLevel } from '@prisma/client';
import { FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';
import validateToken from './validateToken.js';

const credentialAuthCheck: FastifyPluginCallback = fp(
    (server, _options, done) => {
        server.register(validateToken);
        server.addHook('onRequest', async (request, reply) => {
            try {
                const token = request.headers['authorization']?.replace(
                    'Bearer ',
                    '',
                );
                const decoded = server.jwt.verify<{
                    id: string;
                    loginLevel: LoginLevel;
                }>(token!);
                if (
                    !(
                        decoded.id &&
                        (decoded.loginLevel == LoginLevel.CREDENTIALS ||
                            decoded.loginLevel == LoginLevel.FULL)
                    )
                )
                    throw Error();
                request.user = decoded.id;
            } catch (error) {
                if (!(error instanceof Error)) {
                    return reply
                        .status(400)
                        .send({ error: 'Something went wrong' });
                }
                if (error.name === 'TokenExpiredError') {
                    reply.status(401).send({ error: 'Token expired' });
                } else {
                    reply.status(401).send({ error: 'Invalid token' });
                }
            }
        });
        done();
    },
);

export default credentialAuthCheck;
