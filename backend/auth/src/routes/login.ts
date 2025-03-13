import { LoginLevel, User } from '@prisma/client';
import { Static, Type } from '@sinclair/typebox';
import axios from 'axios';
import { FastifyInstance, FastifyReply } from 'fastify';
import { FastifyRequest } from 'fastify/types/request';

export const LoginDto = Type.Object({
    email: Type.String({ format: 'email' }),
    password: Type.String(),
});

export const LinkGoogleDto = Type.Object({
    password: Type.String(),
    googleToken: Type.String(),
});

export function loginRoutes(fastify: FastifyInstance) {
    fastify.setErrorHandler(function (error, request, reply) {
        this.log.error(error);
        if (error.statusCode == 400)
            reply.status(error.statusCode).send({
                error: error.message,
            });
        if (!error.statusCode)
            reply.status(500).send({ error: 'Something went wrong' });
        else
            reply.code(403).send({
                error: 'Invalid username or password. Please check your credentials and try again.',
            });
    });

    async function successfulLogin(
        request: FastifyRequest,
        reply: FastifyReply,
        user: User,
    ) {
        const authToken = fastify.jwt.sign(
            {
                id: user.id,
                loginLevel: user.otpMethod
                    ? LoginLevel.CREDENTIALS
                    : LoginLevel.FULL,
            },
            { expiresIn: '10m', key: fastify.config.SECRET },
        );
        const refreshToken = fastify.jwt.sign(
            { id: user.id },
            { expiresIn: '7d', key: fastify.config.REFRESH_SECRET },
        );
        reply.setCookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
        });
        reply.setCookie('userId', user.id, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
        });
        const newTimestamp = new Date().toISOString();
        await fastify.prisma.user.update({
            where: { id: user.id },
            data: {
                lastLogin: newTimestamp,
            },
        });
        if (user.otpMethod)
            reply.send({
                authToken,
                userId: user.id,
                message: '2FA required',
                otpMethod: user.otpMethod,
            });
        else
            return reply.send({
                status: 'success',
                authToken,
                user: {
                    id: user.id,
                    email: user.email,
                    isValidated: user.emailValidated,
                    avatarUrl: user.avatarUrl,
                    name: user.name,
                    otpMethod: user.otpMethod,
                    phoneNumber: user.phoneNumber,
                },
            });
    }

    async function emailFromToken(token: string) {
        const config = {
            url: 'https://www.googleapis.com/oauth2/v2/userinfo',
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + token,
            },
        };
        const response = await axios<{ email: string }>(config);
        return response.data.email;
    }

    fastify.get('/login/google/callback', async function (request, reply) {
        const { token } =
            await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(
                request,
            );
        const email = await emailFromToken(token.access_token);

        const user = await fastify.prisma.user.findFirst({
            where: { email },
        });
        if (!user)
            return reply.code(200).send({
                status: 'redirect_signup',
                error: 'No account found with this Google email. Please sign up first.',
            });
        if (user.googleLinkedAccount)
            return successfulLogin(request, reply, user);
        else
            return reply.send({
                status: 'password_required',
                googleToken: token.access_token,
            });
    });

    fastify.post<{ Body: Static<typeof LoginDto> }>(
        '/login',
        {
            schema: {
                body: LoginDto,
            },
        },
        async (request, reply) => {
            const { email, password } = request.body;
            const user = await fastify.prisma.user.findFirst({
                where: { email },
            });
            if (!user) throw Error('User not found');
            const isCorrect = await fastify.bcrypt.compare(
                password,
                user.password,
            );
            if (!isCorrect) throw Error('Invalid credential combination');
            return successfulLogin(request, reply, user);
        },
    );

    fastify.post<{ Body: Static<typeof LinkGoogleDto> }>(
        '/login/link-google',
        {
            schema: {
                body: LinkGoogleDto,
            },
        },
        async (request, reply) => {
            const { password, googleToken } = request.body;
            const email = await emailFromToken(googleToken);
            console.log(email);
            const user = await fastify.prisma.user.findFirst({
                where: { email },
            });
            if (!user) throw Error('Invalid credential combination');
            const isCorrect = await fastify.bcrypt.compare(
                password,
                user?.password || '',
            );
            if (!isCorrect) throw Error('Invalid credential combination');
            await fastify.prisma.user.update({
                where: { email },
                data: { googleLinkedAccount: 1 },
            });
            return successfulLogin(request, reply, user);
        },
    );
}
