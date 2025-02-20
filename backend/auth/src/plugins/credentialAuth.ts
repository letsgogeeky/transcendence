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
                console.log(error);
                reply.status(401).send({ message: 'Invalid or expired token' });
            }
        });
        done();
    },
);

export default credentialAuthCheck;
