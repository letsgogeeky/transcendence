import fastifyWebsocket from '@fastify/websocket';
import socketConnectionPlugin from './plugins/socketConnection.js';
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fastifySwagger from '@fastify/swagger';
import fastifyPlugin from 'fastify-plugin';
import demoRoutes from './routes/http/demo.js';
import historyRoutes from './routes/http/history.js';
import { gameRoutes } from './routes/ws/game.js';
import { tournamentRoutes } from './routes/http/tournament.js';
import { matchmakingRoutes } from './routes/ws/matchmaking.js';

const prefix = '/match';

const swaggerOptions = {
    routePrefix: prefix + '/docs',
    swagger: {
        info: {
            title: 'Match API',
            description: 'Match API',
            version: '1.0.0',
        },
        schemas: ['http'],
        consumes: ['application/json'],
        produces: ['application/json'],
    },
    exposeRoute: true,
};

const swaggerUiOptions = {
    routePrefix: prefix + '/docs',
    uiConfig: {
        docExpansion: 'full' as const,
        deepLinking: true as const,
    },
    exposeRoute: true,
} as const;

export const app = fastifyPlugin((server: FastifyInstance, _options: FastifyPluginOptions) => {
    server.register(fastifyWebsocket, { prefix });
    server.register(socketConnectionPlugin, { prefix });
    server.register(fastifySwagger, swaggerOptions);
    server.register(fastifySwaggerUi, swaggerUiOptions);
    // TODO: Add routes here
    server.register(demoRoutes, { prefix: prefix + '/demo' });
    server.register(historyRoutes, { prefix: prefix + '/history' });
    server.register(gameRoutes, { prefix: prefix + '/game' });
    server.register(matchmakingRoutes, { prefix: prefix + '/matchmaking' });
    server.register(tournamentRoutes, { prefix: prefix + '/tournament' });
});