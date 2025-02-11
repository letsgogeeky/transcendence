import fastify from 'fastify';
import { fpSqlitePlugin } from 'fastify-sqlite-typed';
import { configEnv } from './plugins/config-env.js';
import { authRoutes } from './routes/registerRoutes.js';

const app = fastify({ logger: true });

const start = async () => {
    try {
        await app.register(configEnv);
        await app.register(fpSqlitePlugin, {
            dbFilename: app.config.dbFileName,
            driverSettings: { verbose: true },
        });
        await app.register(authRoutes);
        await app.listen({ port: app.config.port });
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

void start();
