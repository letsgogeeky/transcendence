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
    routePrefix: '/docs',
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
    routePrefix: '/docs',
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
    // Add a hook to add the user to the request from auth service
        // app.addHook('preHandler', async (request, reply) => {
        //     const user = await fetch(`${process.env.AUTH_SERVICE_URL}/user`, {
        //         headers: {
        //             Authorization: request.headers.authorization || '',
        //         },
        //     });
        //     if (!user.ok) {
        //         return await reply.status(401).send({ message: 'Unauthorized' });
        //     }
        //     const userJson = await user.json();
        //     if (userJson) {
        //         request.user = userJson as User;
        //     }
        // });
            
    chatServer.register(fastifySwagger, swaggerOptions);
    chatServer.register(fastifySwaggerUi, swaggerUiOptions);
    chatServer.register(demoRoutes, { prefix: '/demo' });
    chatServer.register(chatHistoryRoutes, { prefix: '/history' });
    chatServer.register(chatRoutes, { prefix: '/chat' });
});