import fastifyWebsocket from '@fastify/websocket';
import prismaPlugin from './plugins/prisma.js';
import socketConnectionPlugin from './plugins/socketConnection.js';
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fastifySwagger from '@fastify/swagger';
import fastifyPlugin from 'fastify-plugin';

const swaggerOptions = {
    routePrefix: '/docs',
    swagger: {
        info: {
            title: 'Core API',
            description: 'Core API',
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
    server.register(prismaPlugin);
    server.register(socketConnectionPlugin);
    server.register(fastifySwagger, swaggerOptions);
    server.register(fastifySwaggerUi, swaggerUiOptions);
    // TODO: Add routes here
});