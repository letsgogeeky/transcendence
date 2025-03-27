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

const swaggerOptions = {
    routePrefix: '/docs',
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
    routePrefix: '/docs',
    uiConfig: {
        docExpansion: 'full' as const,
        deepLinking: true as const,
    },
    exposeRoute: true,
} as const;

export const app = fastifyPlugin((server: FastifyInstance, _options: FastifyPluginOptions) => {
    server.register(fastifyWebsocket);
    server.register(socketConnectionPlugin);
    server.register(fastifySwagger, swaggerOptions);
    server.register(fastifySwaggerUi, swaggerUiOptions);
    // TODO: Add routes here
    server.register(demoRoutes, { prefix: '/demo' });
    server.register(historyRoutes, { prefix: '/history' });
    server.register(gameRoutes, { prefix: '/game' });
    server.register(tournamentRoutes, { prefix: '/tournament' });
});