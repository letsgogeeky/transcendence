import fastifyEnv from '@fastify/env';
import fastifyJwt from '@fastify/jwt';
import { PrismaClient } from '@prisma/client';
import fastify from 'fastify';
import fastifyBcrypt from 'fastify-bcrypt';
import { fpSqlitePlugin } from 'fastify-sqlite-typed';
import { options } from './config.js';
import prismaPlugin from './plugins/prisma.js';
import { loginRoutes } from './routes/login.js';
import { registerRoutes } from './routes/register.js';
import { usersRoutes } from './routes/users.js';

declare module 'fastify' {
    interface FastifyInstance {
        config: {
            GOOGLE_PASS: string;
            PORT: number;
            DB_PATH: string;
            SECRET: string;
            REFRESH_SECRET: string;
        };
        prisma: PrismaClient;
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
        app.register(fastifyJwt, {
            secret: app.config.SECRET,
        });
        app.register(fastifyBcrypt, { saltWorkFactor: 12 });
        app.register(registerRoutes);
        app.register(usersRoutes);
        app.register(loginRoutes);
        await app.listen({ port: app.config.PORT });
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

void start();
