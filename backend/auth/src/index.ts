import fastify from 'fastify';
import { configEnv } from './plugins/config-env.js';

const app = fastify({ logger: true });

const start = async () => {
    try {
        await app.register(configEnv);
        await app.listen({ port: app.config.port });
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

app.get('/ping', async (_request, _reply) => {
    return 'pong\n';
});

void start();
