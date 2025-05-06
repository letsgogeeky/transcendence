import { Static, Type } from '@sinclair/typebox';
import { FastifyInstance } from 'fastify';

export const ForgotPasswordDto = Type.Object({
    user: Type.String(),
});

export const ResetPasswordDto = Type.Object({
    newPassword: Type.String(),
});

export function resetPasswordRoutes(fastify: FastifyInstance) {
    fastify.setErrorHandler(function (error, request, reply) {
        this.log.error(error);
        if (error.code == 'P2002') error.statusCode = 409;
        if (!error.statusCode || error.statusCode == 500)
            reply.status(400).send({ error: 'Something went wrong.' });
        else reply.status(error.statusCode).send({ error: error.message });
    });

    async function sendVerificationEmail(email: string, token: string) {
        try {
            const tokenLink = `<a href = "${fastify.config.FRONTEND}/reset-password?token=${token}&email=${email}"> Email verification </a>`;
            await fastify.transporter.sendMail({
                from: '"noreply transcendence" <noreply.transcendence2025@gmail.com>',
                to: email,
                subject: 'Reset your password',
                html:
                    '<b>Click the link to reset your password</b>' + tokenLink, // html body
            });
        } catch (error) {
            throw Error('Error sending email:' + (error as Error).message);
        }
    }

    fastify.post<{ Body: Static<typeof ForgotPasswordDto> }>(
        '/forgot-password',
        {
            schema: {
                body: ForgotPasswordDto,
            },
        },
        async (request, reply) => {
            const { user } = request.body;
            const existingUser = await fastify.prisma.user.findFirst({
                where: { OR: [{ email: user }, { name: user }] },
            });
            if (!existingUser)
                return reply.status(409).send({ error: "User doesn't exist" });
            const token = fastify.jwt.sign({ id: existingUser.id });
            await sendVerificationEmail(existingUser.email, token);
            reply.status(200).send({ message: 'We sent you an email' });
        },
    );

    fastify.post<{ Body: Static<typeof ResetPasswordDto> }>(
        '/reset-password',
        {
            schema: {
                body: ResetPasswordDto,
            },
        },
        async (request, reply) => {
            try {
                const token = request.headers['authorization']?.replace(
                    'Bearer ',
                    '',
                );
                const { newPassword } = request.body;
                const decoded = fastify.jwt.verify<{
                    id: string;
                }>(token!);
                const hash = await fastify.bcrypt.hash(newPassword);
                await fastify.prisma.user.update({
                    where: { id: decoded.id },
                    data: {
                        password: hash,
                    },
                });
                reply
                    .status(200)
                    .send({ message: 'Password changed successfully' });
            } catch {
                reply.code(403).send({ error: 'Invalid password reset token' });
            }
        },
    );
}
