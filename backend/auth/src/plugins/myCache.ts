import { FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';
import NodeCache from 'node-cache';

const myCachePlugin: FastifyPluginCallback = fp((server, _options) => {
    const myCache = new NodeCache();
    server.decorate('cache', myCache);
});

export default myCachePlugin;
