import { options } from "./config.js";
import { app } from "./app.js";
import fastifyEnv from '@fastify/env';
import fastify from "fastify";
import { PrismaClient } from '@prisma/client';
import { WebSocket } from 'ws';
import fpSqlitePlugin from "fastify-sqlite-typed";
import fastifyCors from "@fastify/cors";
import fs from 'fs';
import fastifyJwt from '@fastify/jwt';
declare module '@fastify/jwt' {
    interface FastifyJWT {
        user: string;
    }
}
declare module 'fastify' {
    interface FastifyInstance {
        config: {
            CHAT_PORT: number;
            CHAT_DB_PATH: string;
            UPLOAD_DIR: string;
            FRONTEND: string;
            SSL_KEY_PATH: string;
            SSL_CERT_PATH: string;
            SECRET: string;
        };
        prisma: PrismaClient;
        connections: Map<string, WebSocket>;
    }
}

const keyPath = process.env.SSL_KEY_PATH || 'key.pem';
const certPath = process.env.SSL_CERT_PATH || 'cert.pem';

const server = fastify({
    logger: true,
    https: {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
    },
});


const start = async () => {
    try {
        await server.register(fastifyEnv, options);
        server.register(fastifyCors, {
            origin: [server.config.FRONTEND],
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization'],
        });
        server.register(fastifyJwt, {
            secret: server.config.SECRET,
        });
        server.register(fpSqlitePlugin, {
            dbFilename: server.config.CHAT_DB_PATH,
            driverSettings: { verbose: true },
        });
        await server.register(app, options);
        await server.listen({ port: server.config.CHAT_PORT, host: '0.0.0.0' });
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

void start();

export default server;