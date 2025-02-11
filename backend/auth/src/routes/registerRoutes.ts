import { FastifyInstance } from 'fastify';

import { Static, Type } from '@sinclair/typebox';

export const User = Type.Object({
    name: Type.String(),
    mail: Type.Optional(Type.String({ format: 'email' })),
});

export type UserType = Static<typeof User>;

export async function authRoutes(fastify: FastifyInstance) {
    fastify.post<{ Body: UserType; Reply: UserType }>(
        '/',
        {
            schema: {
                body: User,
                response: {
                    200: User,
                },
            },
        },
        (request, reply) => {
            // The `name` and `mail` types are automatically inferred
            const { name, mail } = request.body;
            reply.status(200).send({ name, mail });
        },
    );
}
