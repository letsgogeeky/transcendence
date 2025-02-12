import { FastifyInstance } from 'fastify';

import { Static, Type } from '@sinclair/typebox';

export const RegisterDto = Type.Object({
    email: Type.String({ format: 'email' }),
    password: Type.String(),
    confirmPassword: Type.String(),
    name: Type.String(),
});

interface IQuerystring {
    token: string;
}

interface IDecodeToken {
    email: string;
}

// export const ValidateDto = Type.Object({
//     email: Type.String({ format: 'email' }),
//     password: Type.String(),
//     confirmPassword: Type.String(),
//     name: Type.String(),
// });

export const AuthSuccess = Type.Object({
    success: Type.Boolean(),
    id: Type.Integer(),
});

export const AuthError = Type.Object({
    success: Type.Boolean(),
    error: Type.Optional(Type.String()),
});

export type AuthSuccessType = Static<typeof AuthSuccess>;
export type AuthErrorType = Static<typeof AuthError>;
export type RegisterDtoType = Static<typeof RegisterDto>;

export async function authRoutes(fastify: FastifyInstance) {
    fastify.post<{ Body: RegisterDtoType; Reply: AuthSuccessType | AuthErrorType }>(
        '/register',
        {
            schema: {
                body: RegisterDto,
                response: {
                    200: AuthSuccess,
                },
            },
        },

        async (request, reply) => {
            const { email, password, name, confirmPassword } = request.body;
            if (confirmPassword != password) throw Error("Passwords don't match");

            // const match = await fastify.bcrypt.compare('password', hash);
            // console.log(match ? 'Matched!' : 'Not matched!');

            try {
                let query = 'INSERT INTO users (email, password, name, token) VALUES (?, ?, ?, ?)';
                const hash = await fastify.bcrypt.hash(password);
                const token = fastify.jwt.sign({ email: email });
                let result = await fastify.db.run(query, [email, hash, name, token]);
                const response = { id: result.lastID, success: true };
                reply.status(200).send(response);
            } catch (error) {
                if (error instanceof Error)
                    reply.status(500).send({ success: false, error: error.message });
                else reply.status(500).send({ success: false, error: 'Unknown error' });
            }
        },
    );

    fastify.get<{ Querystring: IQuerystring }>('/verify-email', async (request, reply) => {
        try {
            const { token } = request.query;
            let query = 'SELECT * FROM users WHERE token = ?';
            let result = await fastify.db.get(query, [token]);
            console.log(result);
            const decoded: IDecodeToken = await fastify.jwt.verify(token);
            if (decoded?.email != result.email)
                return reply.code(400).send({ error: 'Invalid or expired token' });
            query = 'UPDATE users SET is_validated = 1 WHERE id = ?';
            result = await fastify.db.run(query, [result.id]);
            reply.status(200).send(token);
        } catch (error) {
            if (error instanceof Error)
                reply.status(500).send({ success: false, error: error.message });
            else reply.status(500).send({ success: false, error: 'Unknown error' });
        }
    });
}
