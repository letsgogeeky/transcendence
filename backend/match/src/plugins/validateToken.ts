import { FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';

enum LoginLevel {
    NONE = 'NONE',
    CREDENTIALS = 'CREDENTIALS',
    FULL = 'FULL',
}

class AuthError extends Error {
    constructor(message: string) {
        super(message);
    }
}

const credentialAuthCheck: FastifyPluginCallback = fp(
    (server, _options, done) => {
        server.addHook('onRequest', async (request, reply) => {
            try {
                let token = request.headers['authorization']?.replace(
                    'Bearer ',
                    '',
                );
                if (!token) {
                    token = (request.query as { token?: string }).token;
                }
                if (!token) throw new AuthError('Unauthorized!');
                const decoded = server.jwt.verify<{
                    id: string;
                    loginLevel: LoginLevel;
                }>(token);
                if (
                    !(
                        decoded.id &&
                        (decoded.loginLevel == LoginLevel.CREDENTIALS ||
                            decoded.loginLevel == LoginLevel.FULL)
                    )
                )
                    throw new AuthError('Invalid token!');
                request.user = decoded.id;
                request.token = token;
                request.userName = (request.query as { userName?: string }).userName || decoded.id.substring(0, 8);
                request.matchId = (request.query as { matchId?: string }).matchId || null;
                request.tournamentId = (request.query as { tournamentId?: string }).tournamentId || null;
            } catch (error) {
                reply.status(401).send({ error: error });
            }
        });
        done();
    },
);

export default credentialAuthCheck;
