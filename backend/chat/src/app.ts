import fastifyWebsocket from '@fastify/websocket';
import prismaPlugin from './plugins/prisma.js';
import socketConnectionPlugin from './plugins/socketConnection.js';
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { chatRoutes } from './routes/ws/chat.js';
import chatHistoryRoutes from './routes/http/history.js';
import demoRoutes from './routes/http/demo.js';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fastifySwagger from '@fastify/swagger';
import fastifyPlugin from 'fastify-plugin';

const swaggerOptions = {
    routePrefix: '/chat/docs',
    swagger: {
        info: {
            title: 'Chat API',
            description: 'Chat API',
            version: '1.0.0',
        },
        schemas: ['http'],
        consumes: ['application/json'],
        produces: ['application/json'],
    },
    exposeRoute: true,
};

const swaggerUiOptions = {
    routePrefix: '/chat/docs',
    uiConfig: {
        docExpansion: 'full' as const,
        deepLinking: true as const,
    },
    exposeRoute: true,
} as const;

export const app = fastifyPlugin((chatServer: FastifyInstance, _options: FastifyPluginOptions) => {
    chatServer.register(fastifyWebsocket);
    chatServer.register(prismaPlugin);
    chatServer.register(socketConnectionPlugin);
    chatServer.register(fastifySwagger, swaggerOptions);
    chatServer.register(fastifySwaggerUi, swaggerUiOptions);
    chatServer.register(demoRoutes, { prefix: '/chat/demo' });
    chatServer.register(chatHistoryRoutes, { prefix: '/chat/history' });
    chatServer.register(chatRoutes, { prefix: '/chat' });
});