import fp from 'fastify-plugin'
import dotenv from 'dotenv'

dotenv.config()

export default fp(async (fastify) => {
    fastify.decorate("config", {
        port: process.env.PORT? parseInt(process.env.PORT, 10): 3000
    });
});

declare module "fastify" {
    interface FastifyInstance {
        config: {
            port: number;
        }
    }
}
