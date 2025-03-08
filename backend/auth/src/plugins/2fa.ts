import { LoginLevel } from '@prisma/client';
import { FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';
import credentialAuthCheck from './credentialAuth.js';

const twoFAuthCheck: FastifyPluginCallback = fp((server, _options, done) => {
    server.register(credentialAuthCheck);
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
            if (decoded.loginLevel != LoginLevel.FULL) throw Error();
            request.user = decoded.id;
        } catch (error) {
            console.log(error);
            reply.status(401).send({ error: '2FA incomplete' });
        }
    });
    done();
});

export default twoFAuthCheck;
