import dotenv from 'dotenv';
import { FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';

const configCallback: FastifyPluginCallback<object> = (fastify, options, done) => {
    dotenv.config();
    fastify.decorate('config', {
        port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
        dbFileName: process.env.DB_PATH || './db/auth.db',
        secret: process.env.SECRET || 'supersecret',
    });
    done();
};

const configEnv = fp(configCallback, '5.x');

declare module 'fastify' {
    interface FastifyInstance {
        config: {
            port: number;
            dbFileName: string;
            secret: string;
        };
    }
}

export { configEnv };
