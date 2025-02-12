import fastifyJwt from '@fastify/jwt';
import fastify from 'fastify';
import fastifyBcrypt from 'fastify-bcrypt';
import { fpSqlitePlugin } from 'fastify-sqlite-typed';
import { configEnv } from './plugins/config-env.js';
import { authRoutes } from './routes/register.js';
import { usersRoutes } from './routes/users.js';

const app = fastify({ logger: true });

const start = async () => {
    try {
        await app.register(configEnv);
        await app.register(fpSqlitePlugin, {
            dbFilename: app.config.dbFileName,
            driverSettings: { verbose: true },
        });
        app.register(fastifyJwt, {
            secret: app.config.secret,
        });
        app.register(fastifyBcrypt, { saltWorkFactor: 12 });
        await app.register(authRoutes);
        await app.register(usersRoutes);
        await app.listen({ port: app.config.port });
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

void start();
