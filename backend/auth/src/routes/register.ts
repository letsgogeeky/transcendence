import { Static, Type } from '@sinclair/typebox';
import { FastifyInstance, FastifyRequest } from 'fastify';

export const RegisterDto = Type.Object({
    email: Type.String({ format: 'email' }),
    password: Type.String(),
    name: Type.String(),
    phoneNumber: Type.Optional(Type.String()),
});

export const RegisterSuccess = Type.Object({
    id: Type.String(),
});

function assignAvatarRandomly(): string {
	const randomIndex = Math.floor(Math.random() * 10) + 1; // 1 to 10
	return `assets/avatars/${randomIndex}.gif`;
}

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
            const { email, password, name, phoneNumber } = request.body;
            const existingUser = await fastify.prisma.user.findUnique({
                where: { email },
            });
            if (existingUser)
                return reply
                    .status(409)
                    .send({ error: 'Account already exists for email.' });
            const hash = await fastify.bcrypt.hash(password);
            const token = fastify.jwt.sign({ email: email });
            await sendVerificationEmail(email, token, request);
            const result = await fastify.prisma.user.create({
                data: {
                    email,
                    password: hash,
                    name,
                    emailVerificationToken: token,
                    registrationDate: new Date().toISOString(),
                    phoneNumber: phoneNumber,
                    avatarUrl: assignAvatarRandomly(),
                },
            });
            reply.status(200).send({ id: result.id });
        },
    );

    fastify.get<{ Querystring: { token: string } }>(
        '/verify-email',
        async (request, reply) => {
            const { token } = request.query;
            const user = await fastify.prisma.user.findFirst({
                where: { emailVerificationToken: token },
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

            await fastify.prisma.user.update({
                where: { id: user.id },
                data: {
                    emailValidated: 1,
                },
            });
            reply.status(200).send({ message: 'Email verified' });
        },
    );

    async function sendVerificationEmail(
        email: string,
        token: string,
        _req: FastifyRequest,
    ) {
        try {
            const tokenLink = `<a href = "${fastify.config.FRONTEND}/verify-email?token=${token}&email=${email}"> Email verification </a>`;
            await fastify.transporter.sendMail({
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
