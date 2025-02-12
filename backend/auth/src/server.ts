import fastifyEnv from '@fastify/env';
import fastifyJwt from '@fastify/jwt';
import fastify from 'fastify';
import fastifyBcrypt from 'fastify-bcrypt';
import { fpSqlitePlugin } from 'fastify-sqlite-typed';
import { options } from './config.js';
import { authRoutes } from './routes/register.js';
import { usersRoutes } from './routes/users.js';

const app = fastify({ logger: true });
const start = async () => {
    try {
        await app.register(fastifyEnv, options);
        app.register(fpSqlitePlugin, {
            dbFilename: app.config.DB_PATH,
            driverSettings: { verbose: true },
        });
        app.register(fastifyJwt, {
            secret: app.config.SECRET,
        });
        app.register(fastifyBcrypt, { saltWorkFactor: 12 });
        app.register(authRoutes);
        app.register(usersRoutes);
        app.listen({ port: app.config.PORT });
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

void start();
