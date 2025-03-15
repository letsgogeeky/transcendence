import { options } from "./config.ts";
import { app } from "./app.ts";
import fastifyEnv from '@fastify/env';
import fastify from "fastify";
import { PrismaClient } from '@prisma/client';
import { WebSocket } from 'ws';

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
            UPLOAD_DIR: string;
            FRONTEND: string;
            SSL_KEY_PATH: string;
            SSL_CERT_PATH: string;
            SSL_PASSPHRASE: string;
        };
        prisma: PrismaClient;
        chatConnections: Map<string, WebSocket>;
    }
}

declare module 'fastify' {
    interface FastifyRequest {
        user?: User;
    }
}

// const keyPath = process.env.SSL_KEY_PATH || 'key.pem';
// const certPath = process.env.SSL_CERT_PATH || 'cert.pem';
const chatServer = fastify({
    logger: true,
    // https: {
    //     key: fs.readFileSync(keyPath),
    //     cert: fs.readFileSync(certPath),
    //     passphrase: process.env.SSL_PASSPHRASE,
    // },
});


const start = async () => {
    try {
        await chatServer.register(fastifyEnv, options);
        await chatServer.register(app, {
            config: {
                FRONTEND: chatServer.config.FRONTEND,
                DB_PATH: chatServer.config.DB_PATH,
            },
        });
        await chatServer.listen({ port: chatServer.config.PORT });
    } catch (err) {
        chatServer.log.error(err);
        process.exit(1);
    }
};

void start();

export default chatServer;