import dotenv from 'dotenv';
import { FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';

const configCallback: FastifyPluginCallback<object> = (fastify, options, done) => {
    dotenv.config();
    fastify.decorate('config', {
        port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
    });
    done();
};

const configEnv = fp(configCallback, '5.x');

declare module 'fastify' {
    interface FastifyInstance {
        config: {
            port: number;
        };
    }
}

export { configEnv };
