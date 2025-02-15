import { Static, Type } from '@sinclair/typebox';
import { FastifyInstance, FastifyRequest } from 'fastify';
import nodemailer from 'nodemailer';
import { UserType } from './users';

export const RegisterDto = Type.Object({
    email: Type.String({ format: 'email' }),
    password: Type.String(),
    confirmPassword: Type.String(),
    name: Type.String(),
});

export const RegisterSuccess = Type.Object({
    id: Type.Integer(),
});

export function authRoutes(fastify: FastifyInstance) {
    fastify.setErrorHandler(function (error, request, reply) {
        this.log.error(error);
        if (error.message.includes('SQLITE_CONSTRAINT: UNIQUE constraint'))
            error.statusCode = 409;
        reply.status(error.statusCode || 500).send({ error: error.message });
    });

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
            const { email, password, name, confirmPassword } = request.body;
            if (confirmPassword != password)
                reply.status(400).send({ error: "Passwords don't match" });
            const query =
                'INSERT INTO users (email, password, name, token, registration_date) VALUES (?, ?, ?, ?, ?)';
            const hash = await fastify.bcrypt.hash(password);
            const token = fastify.jwt.sign({ email: email });
            await sendVerificationEmail(email, token, request);
            const result = await fastify.db.run(query, [
                email,
                hash,
                name,
                token,
                new Date().toISOString(),
            ]);
            reply.status(200).send({ id: result.lastID });
        },
    );

    fastify.get<{ Querystring: { token: string } }>(
        '/verify-email',
        async (request, reply) => {
            const { token } = request.query;
            let query = 'SELECT * FROM users WHERE token = ?';
            const user: UserType | undefined = await fastify.db.get(query, [
                token,
            ]);
            if (!user)
                return reply
                    .code(400)
                    .send({ error: 'Invalid or expired token' });
            const decoded = fastify.jwt.verify<{ email: string }>(token);
            if (decoded?.email != user.email)
                return reply
                    .code(400)
                    .send({ error: 'Invalid or expired token' });
            query = 'UPDATE users SET is_validated = 1 WHERE id = ?';
            await fastify.db.run(query, [user.id]);
            reply.status(200).send({ message: 'Email verified' });
        },
    );

    async function sendVerificationEmail(
        email: string,
        token: string,
        req: FastifyRequest,
    ) {
        try {
            const transporter: nodemailer.Transporter =
                nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: 'noreply.transcendence2025@gmail.com',
                        pass: fastify.config.GOOGLE_PASS,
                    },
                });
            const tokenLink = `<a href = "${req.protocol}://${req.hostname}:${req.port}/verify-email?token=${token}&email=${email}"> Email verification </a>`;
            await transporter.sendMail({
                from: '"noreply transcendence" <noreply.transcendence2025@gmail.com>',
                to: email,
                subject: 'Verify your email',
                html: '<b>Click the link to verify your email?</b>' + tokenLink, // html body
            });
        } catch (error) {
            throw Error('Error sending email:' + (error as Error).message);
        }
    }
}
