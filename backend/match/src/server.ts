import { options } from "./config.js";
import { app } from "./app.js";
import fastifyEnv from '@fastify/env';
import fastify from "fastify";
import { PrismaClient } from '@prisma/client';
import { WebSocket } from 'ws';
import fpSqlitePlugin from "fastify-sqlite-typed";
import fastifyCors from "@fastify/cors";
import prismaPlugin from "./plugins/prisma.js";

interface User {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
}

declare module 'fastify' {
    interface FastifyInstance {
        config: {
            PORT: number;
            DB_PATH: string;
            DATABASE_URL: string;
            UPLOAD_DIR: string;
            FRONTEND: string;
            SSL_KEY_PATH: string;
            SSL_CERT_PATH: string;
            SSL_PASSPHRASE: string;
        };
        prisma: PrismaClient;
        connections: Map<string, WebSocket>;
    }
}

declare module 'fastify' {
    interface FastifyRequest {
        user?: User;
    }
}

// const keyPath = process.env.SSL_KEY_PATH || 'key.pem';
// const certPath = process.env.SSL_CERT_PATH || 'cert.pem';
const server = fastify({
    logger: true,
    // https: {
    //     key: fs.readFileSync(keyPath),
    //     cert: fs.readFileSync(certPath),
    //     passphrase: process.env.SSL_PASSPHRASE,
    // },
});


const start = async () => {
    try {
        await server.register(fastifyEnv, options);
        server.register(fastifyCors, {
            origin: [server.config.FRONTEND],
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization'],
        });
        await server.register(fpSqlitePlugin, {
            dbFilename: server.config.DB_PATH,
            driverSettings: { verbose: true },
        });
        server.register(prismaPlugin);
        await server.register(app, options);
        await server.listen({ port: server.config.PORT });
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

void start();

export default server;