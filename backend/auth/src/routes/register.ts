import { Static, Type } from '@sinclair/typebox';
import { FastifyInstance, FastifyRequest } from 'fastify';
import nodemailer from 'nodemailer';

export const RegisterDto = Type.Object({
    email: Type.String({ format: 'email' }),
    password: Type.String(),
    confirmPassword: Type.String(),
    name: Type.String(),
});

export const RegisterSuccess = Type.Object({
    id: Type.Integer(),
});

export function registerRoutes(fastify: FastifyInstance) {
    fastify.setErrorHandler(function (error, request, reply) {
        this.log.error(error);
        if (error.code == 'P2002') error.statusCode = 409;
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
            const hash = await fastify.bcrypt.hash(password);
            const token = fastify.jwt.sign({ email: email });
            await sendVerificationEmail(email, token, request);
            const result = await fastify.prisma.users.create({
                data: {
                    email,
                    password: hash,
                    name,
                    token,
                    registration_date: new Date().toISOString(),
                },
            });
            reply.status(200).send({ id: result.id });
        },
    );

    fastify.get<{ Querystring: { token: string } }>(
        '/verify-email',
        async (request, reply) => {
            const { token } = request.query;
            const user = await fastify.prisma.users.findFirst({
                where: { token },
            });
            if (!user)
                return reply
                    .code(400)
                    .send({ error: 'Invalid or expired token' });
            const decoded = fastify.jwt.verify<{ email: string }>(token);
            if (decoded?.email != user.email)
                return reply
                    .code(400)
                    .send({ error: 'Invalid or expired token' });

            await fastify.prisma.users.update({
                where: { id: user.id },
                data: {
                    is_validated: 1,
                },
            });
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
