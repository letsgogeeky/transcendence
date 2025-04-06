import { options } from "./config.js";
import { app } from "./app.js";
import fastifyEnv from '@fastify/env';
import fastify from "fastify";
import { PrismaClient } from '@prisma/client';
import { WebSocket } from 'ws';
import fpSqlitePlugin from "fastify-sqlite-typed";
import fastifyCors from "@fastify/cors";
import prismaPlugin from "./plugins/prisma.js";
import fastifyJwt from "@fastify/jwt";
import fs from 'fs';
declare module '@fastify/jwt' {
    interface FastifyJWT {
        user: string;
    }
}
declare module 'fastify' {
    interface FastifyInstance {
        config: {
            MATCH_PORT: number;
            MATCH_DB_PATH: string;
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
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            credentials: true,
            preflightContinue: true,
            preflight: true,
        });
        server.register(fastifyJwt, {
            secret: server.config.SECRET,
        });
        await server.register(fpSqlitePlugin, {
            dbFilename: server.config.MATCH_DB_PATH,
            driverSettings: { verbose: true },
        });
        server.register(prismaPlugin);
        await server.register(app, options);
        await server.listen({ port: server.config.MATCH_PORT, host: '0.0.0.0' });
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

void start();

export default server;