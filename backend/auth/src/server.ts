import fastifyEnv from '@fastify/env';
import fastifyJwt from '@fastify/jwt';
import { LoginLevel, PrismaClient } from '@prisma/client';
import fastify from 'fastify';
import fastifyBcrypt from 'fastify-bcrypt';
import { fpSqlitePlugin } from 'fastify-sqlite-typed';
import { Transporter } from 'nodemailer';
import { options } from './config.js';
import prismaPlugin from './plugins/prisma.js';
import emailPlugin from './plugins/sendEmail.js';
import { otpRoutes } from './routes/2fa.js';
import { loginRoutes } from './routes/login.js';
import { logoutRoutes } from './routes/logout.js';
import { protectedOtpRoutes } from './routes/protected-2fa.js';
import { registerRoutes } from './routes/register.js';
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
        };
        prisma: PrismaClient;
        transporter: Transporter;
    }
    interface FastifyRequest {
        auth: LoginLevel;
    }
}

const app = fastify({ logger: true });
const start = async () => {
    try {
        await app.register(fastifyEnv, options);
        app.register(fpSqlitePlugin, {
            dbFilename: app.config.DB_PATH,
            driverSettings: { verbose: true },
        });
        app.register(prismaPlugin);
        app.register(emailPlugin);

        app.register(fastifyJwt, {
            secret: app.config.SECRET,
        });
        app.register(fastifyBcrypt, { saltWorkFactor: 12 });
        app.register(registerRoutes);
        app.register(usersRoutes);
        app.register(loginRoutes);
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
