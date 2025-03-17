// test for the chat websocket route
import fastify, { FastifyInstance } from 'fastify';
import { AddressInfo } from 'net';
import WebSocket from 'ws';
import {app} from '../../../app.js';   
import { PrismaClient } from '@prisma/client';

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
        chatConnections: Map<string, WebSocket>;
    }
}

declare module 'fastify' {
    interface FastifyRequest {
        user?: User;
    }
}

describe('Chat WebSocket Route', () => {
    let server: FastifyInstance;
    let address: AddressInfo;

    beforeAll(async () => {
        try {
            server = fastify({
                logger: true,
            });
            server.register(app, {
                config: {
                    FRONTEND: '',
                    DB_PATH: ':memory:',
                },
            });
            await server.listen({ port: 0 });
            address = server.server.address() as AddressInfo;
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    });

    afterAll(async () => {
        await server.close();
    });

    test('a sample test', () => {
        return;
    });
});

