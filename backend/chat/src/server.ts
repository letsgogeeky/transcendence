import fastifyCors from '@fastify/cors';
import fastifyEnv from '@fastify/env';
import fastifyWebsocket from '@fastify/websocket';
import { PrismaClient } from '@prisma/client';
import fastify from 'fastify';
import { fpSqlitePlugin } from 'fastify-sqlite-typed';
import { options } from './config.js';
import { demoRoutes } from './routes/http/demo.js';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import prismaPlugin from './plugins/prisma.js';

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
    }
}

declare module 'fastify' {
    interface FastifyRequest {
        user?: User;
    }
}

// const keyPath = process.env.SSL_KEY_PATH || 'key.pem';
// const certPath = process.env.SSL_CERT_PATH || 'cert.pem';
const app = fastify({
    logger: true,
    // https: {
    //     key: fs.readFileSync(keyPath),
    //     cert: fs.readFileSync(certPath),
    //     passphrase: process.env.SSL_PASSPHRASE,
    // },
});

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
}

const start = async () => {
    try {
        await app.register(fastifyEnv, options);
        app.register(fastifyCors, {
            origin: [app.config.FRONTEND],
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization'],
        });
        app.register(fastifyWebsocket);
        app.register(prismaPlugin);
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
        
        app.register(fastifySwagger, swaggerOptions);
        app.register(fastifySwaggerUi, swaggerUiOptions);
        app.register(fpSqlitePlugin, {
            dbFilename: app.config.DB_PATH,
            driverSettings: { verbose: true },
        });
        app.register(demoRoutes, { prefix: '/demo' });
        await app.listen({ port: app.config.PORT });
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

void start();
