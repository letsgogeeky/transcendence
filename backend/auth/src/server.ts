import fastifyCors from '@fastify/cors';
import fastifyEnv from '@fastify/env';
import fastifyJwt from '@fastify/jwt';
import oauthPlugin, { OAuth2Namespace } from '@fastify/oauth2';
import fastifyStatic from '@fastify/static';
import fastifyWebsocket from '@fastify/websocket';
import { LoginLevel, PrismaClient } from '@prisma/client';
import fastify from 'fastify';
import fastifyBcrypt from 'fastify-bcrypt';
import fastifyCookie from 'fastify-cookie';
import { fpSqlitePlugin } from 'fastify-sqlite-typed';
import * as fs from 'fs';
import NodeCache from 'node-cache';
import { Transporter } from 'nodemailer';
import { WebSocket } from 'ws';
import { options } from './config.js';
import connectionsPlugin from './plugins/connectionMap.js';
import myCachePlugin from './plugins/myCache.js';
import prismaPlugin from './plugins/prisma.js';
import emailPlugin from './plugins/sendEmail.js';
import { otpRoutes } from './routes/2fa.js';
import { loginRoutes } from './routes/login.js';
import { logoutRoutes } from './routes/logout.js';
import { protectedOtpRoutes } from './routes/protected-2fa.js';
import { refreshRoutes } from './routes/refresh.js';
import { registerRoutes } from './routes/register.js';
import { resetPasswordRoutes } from './routes/reset-password.js';
import { SocketRoutes } from './routes/socket.js';
import { userRoutes } from './routes/user.js';
import { usersRoutes } from './routes/users.js';

declare module '@fastify/jwt' {
    interface FastifyJWT {
        user: string;
    }
}

declare module 'fastify' {
    interface FastifyInstance {
        config: {
            GOOGLE_PASS: string;
            PORT: number;
            DB_PATH: string;
            SECRET: string;
            REFRESH_SECRET: string;
            INFOBIP_ID: string;
            INFOBIP_TOKEN: string;
            INFOBIP_SENDER: string;
            UPLOAD_DIR: string;
            COOKIE_SECRET: string;
            GOOGLE_SECRET: string;
            GOOGLE_ID: string;
            FRONTEND: string;
        };
        prisma: PrismaClient;
        transporter: Transporter;
        cache: NodeCache;
        googleOAuth2: OAuth2Namespace;
        connections: Map<string, WebSocket>;
    }
    interface FastifyRequest {
        auth: LoginLevel;
    }
}

const keyPath = process.env.SSL_KEY_PATH || 'key.pem';
const certPath = process.env.SSL_CERT_PATH || 'cert.pem';
const app = fastify({
    logger: true,
    https: {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
    },
});
const start = async () => {
    try {
        await app.register(fastifyEnv, options);
        app.register(fastifyCors, {
            origin: [app.config.FRONTEND],
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            credentials: true,
        });
        app.register(fastifyWebsocket);
        app.register(myCachePlugin);
        app.register(fastifyStatic, {
            root: app.config.UPLOAD_DIR,
            prefix: '/images/',
        });
        app.register(fpSqlitePlugin, {
            dbFilename: app.config.DB_PATH,
            driverSettings: { verbose: true },
        });
        app.register(prismaPlugin);
        app.register(emailPlugin);
        app.register(fastifyJwt, {
            secret: app.config.SECRET,
        });
        app.register(fastifyCookie, {
            secret: process.env.COOKIE_SECRET,
            parseOptions: {
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
            },
        });
        app.register(fastifyBcrypt, { saltWorkFactor: 12 });
        app.register(registerRoutes);
        app.register(resetPasswordRoutes);
        app.register(loginRoutes);
        app.register(oauthPlugin, {
            name: 'googleOAuth2',
            scope: ['email', 'profile'],
            credentials: {
                client: {
                    id: app.config.GOOGLE_ID,
                    secret: app.config.GOOGLE_SECRET,
                },
                auth: oauthPlugin.GOOGLE_CONFIGURATION,
            },
            startRedirectPath: '/login/google',
            callbackUri: (req) =>
                `${req.protocol}://${req.hostname}:${app.config.PORT}/login/google/callback`,
        });
        app.register(connectionsPlugin);
        app.register(SocketRoutes);
        app.register(refreshRoutes);
        app.register(usersRoutes);
        app.register(userRoutes);
        app.register(logoutRoutes);
        app.register(otpRoutes);
        app.register(protectedOtpRoutes);

        await app.listen({ port: app.config.PORT });
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

void start();
