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
import metrics from 'fastify-metrics';
import { GameSession } from "./routes/ws/session.js";
import { deleteMatch, proceedAllTournaments } from "./services/match.service.js";

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
        gameConnections: Map<string, WebSocket>;
        gameSessions: Map<string, GameSession>;
    }
    interface FastifyRequest {
        user: string;
        token: string;
        userName: string;
        matchId: string | null;
        tournamentId: string | null;
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
        await server.register(metrics, {
            endpoint: '/metrics',
            name: 'match_service_metrics',
        });
        await server.register(app, options);
        await server.listen({ port: server.config.MATCH_PORT, host: '0.0.0.0' });

        // Set up periodic cleanup of stale matches every 15 seconds
        setInterval(() => {
            server.log.info('Cleaning up stale matches');
            server.prisma.match.findMany({
                where: {
                    status: 'pending',
					tournamentId: null,
                    createdAt: {
                        lt: new Date(Date.now() - 7 * 60 * 1000),
                    },
                },
            }).then(async (matches) => {
                for (const match of matches) {
                    server.log.info(`Deleting match ${match.id}`);
                    await deleteMatch(server, match.id, match.userId);
                }
            }).catch((err) => {
                server.log.error(err);
            });

            // tournament processing
            proceedAllTournaments(server).then((result) => {
                server.log.info(`Tournament processing result: ${result}`);
            }).catch((err) => {
                server.log.error(err);
            });
        }, 15 * 1000); // 15 seconds
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

void start();

export default server;