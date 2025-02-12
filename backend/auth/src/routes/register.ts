import { FastifyInstance } from 'fastify';

import { Static, Type } from '@sinclair/typebox';
import { UserType } from './users';

export const RegisterDto = Type.Object({
    email: Type.String({ format: 'email' }),
    password: Type.String(),
    confirmPassword: Type.String(),
    name: Type.String(),
});

export const RegisterSuccess = Type.Object({
    success: Type.Boolean(),
    id: Type.Integer(),
});

export function authRoutes(fastify: FastifyInstance) {
    fastify.post<{ Body: Static<typeof RegisterDto> }>(
        '/register',
        {
            schema: {
                body: RegisterDto,
                response: {
                    200: RegisterSuccess,
                },
            },
        },

        async (request, reply) => {
            try {
                const { email, password, name, confirmPassword } = request.body;
                if (confirmPassword != password) throw Error("Passwords don't match");
                const query =
                    'INSERT INTO users (email, password, name, token) VALUES (?, ?, ?, ?)';
                const hash = await fastify.bcrypt.hash(password);
                const token = fastify.jwt.sign({ email: email });
                const result = await fastify.db.run(query, [email, hash, name, token]);
                const response = { id: result.lastID, success: true };
                reply.status(200).send(response);
            } catch (error) {
                if (error instanceof Error)
                    reply.status(500).send({ success: false, error: error.message });
                else reply.status(500).send({ success: false, error: 'Unknown error' });
            }
        },
    );

    fastify.get<{ Querystring: { token: string } }>('/verify-email', async (request, reply) => {
        try {
            const { token } = request.query;
            let query = 'SELECT * FROM users WHERE token = ?';
            const user: UserType | undefined = await fastify.db.get(query, [token]);
            if (!user)
                return reply.code(400).send({ success: false, error: 'Invalid or expired token' });
            const decoded = fastify.jwt.verify<{ email: string }>(token);
            if (decoded?.email != user.email)
                return reply.code(400).send({ error: 'Invalid or expired token' });
            query = 'UPDATE users SET is_validated = 1 WHERE id = ?';
            await fastify.db.run(query, [user.id]);
            reply.status(200).send({ success: true, message: 'Email verified' });
        } catch (error) {
            if (error instanceof Error)
                reply.status(500).send({ success: false, error: error.message });
            else reply.status(500).send({ success: false, error: 'Unknown error' });
        }
    });
}
