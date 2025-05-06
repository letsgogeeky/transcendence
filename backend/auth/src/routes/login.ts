import { LoginLevel, User } from '@prisma/client';
import { Static, Type } from '@sinclair/typebox';
import axios from 'axios';
import { FastifyInstance, FastifyReply } from 'fastify';

export const LoginDto = Type.Object({
    email: Type.String({ format: 'email' }),
    password: Type.String(),
});

export async function successfulLogin(
    fastify: FastifyInstance,
    reply: FastifyReply,
    user: User,
    complete: boolean | null = false,
) {
    const authToken = fastify.jwt.sign(
        {
            id: user.id,
            loginLevel:
                user.otpMethod && !complete
                    ? LoginLevel.CREDENTIALS
                    : LoginLevel.FULL,
        },
        { expiresIn: '30m', key: fastify.config.SECRET },
    );
    const refreshToken = fastify.jwt.sign(
        { id: user.id },
        { expiresIn: '7d', key: fastify.config.REFRESH_SECRET },
    );
    reply.setCookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/auth/refresh',
        maxAge: 7 * 24 * 60 * 60, // 7 days
    });
    reply.setCookie('userId', user.id, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/auth/socket',
        maxAge: 7 * 24 * 60 * 60, // 7 days
    });
    reply.setCookie('userName', user.name, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/auth/socket',
        maxAge: 7 * 24 * 60 * 60, // 7 days
    });
    const newTimestamp = new Date().toISOString();
    await fastify.prisma.user.update({
        where: { id: user.id },
        data: {
            lastLogin: newTimestamp,
        },
    });
    if (user.otpMethod && !complete)
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

export function loginRoutes(fastify: FastifyInstance) {
    fastify.setErrorHandler(function (error, request, reply) {
        this.log.error(error);
        if (error.statusCode == 400)
            reply.status(error.statusCode).send({
                error: error.message,
            });
        if (!error.statusCode)
            reply.status(400).send({ error: 'Something went wrong' });
        else
            reply.code(403).send({
                error: 'Invalid username or password. Please check your credentials and try again.',
            });
    });

    async function emailFromToken(token: string) {
        const config = {
            url: 'https://www.googleapis.com/oauth2/v2/userinfo',
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + token,
            },
        };
        const response = await axios<{
            email: string;
            name: string;
        }>(config);
        console.log(response.data);
        return {
            email: response.data.email,
            name: response.data.name,
        };
    }

    fastify.get('/login/google/auth', async function (request, reply) {
        try {
            const { access_token } = request.cookies;
            if (!access_token) {
                return reply.code(401).send({ error: 'Unauthorized' });
            }
            reply.clearCookie('oauth2-redirect-state', { path: '/login' });
            const { email } = await emailFromToken(access_token);
            const user = await fastify.prisma.user.findFirst({
                where: { email },
            });
            if (!email || !user)
                return reply.code(403).send({ error: 'Invalid google token' });
            return successfulLogin(fastify, reply, user, !user.otpMethod);
        } catch {
            return reply.code(403).send({ error: 'Invalid google token' });
        }
    });

    function incrementLastDigit(str: string): number {
        const match = str.match(/\d(?=\D*$)/); // Find the last digit before non-digits or end of string
        const lastDigit = match ? parseInt(match[0], 10) : 0;
        return lastDigit + 1;
    }

    function assignAvatarRandomly(): string {
        const randomIndex = Math.floor(Math.random() * 10) + 1; // 1 to 10
        return `assets/avatars/${randomIndex}.gif`;
    }

    async function registerGoogleUser(email: string, name: string) {
        try {
            await fastify.prisma.user.create({
                data: {
                    email,
                    password: '',
                    emailVerificationToken: '',
                    name,
                    registrationDate: new Date().toISOString(),
                    emailValidated: 1,
                    googleLinkedAccount: 1,
                    avatarUrl: assignAvatarRandomly(),
                },
            });
        } catch (error) {
            console.error(error);
            await fastify.prisma.user.create({
                data: {
                    email,
                    password: '',
                    emailVerificationToken: '',
                    name: name + incrementLastDigit(name),
                    registrationDate: new Date().toISOString(),
                    emailValidated: 1,
                    googleLinkedAccount: 1,
                    avatarUrl: assignAvatarRandomly(),
                },
            });
        }

        console.log(email);
    }

    fastify.get('/login/google/callback', async function (request, reply) {
        const { token } =
            await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(
                request,
            );
        console.log(token);
        const { email, name } = await emailFromToken(token.access_token);

        const user = await fastify.prisma.user.findFirst({
            where: { email },
        });
        if (!user) await registerGoogleUser(email, name);
        reply.setCookie('access_token', token.access_token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path: '/auth/login/google/auth',
        });
        reply.redirect(`${fastify.config.FRONTEND}/login/google`);
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
            const isCorrect =
                password &&
                (await fastify.bcrypt.compare(password, user.password));
            if (!isCorrect) throw Error('Invalid credential combination');
            return successfulLogin(fastify, reply, user);
        },
    );
}
