import fastify from 'fastify';

declare module 'fastify' {
    interface FastifyInstance {
        config: {
            PORT: number;
            DB_PATH: string;
            SECRET: string;
        };
    }
}
