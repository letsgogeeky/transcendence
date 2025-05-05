import { ExtendedWebSocket, FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';

const connectionsPlugin: FastifyPluginCallback = fp((server, _options) => {
    const myMap = new Map<string, ExtendedWebSocket[]>();
    server.decorate('connections', myMap);
});

export default connectionsPlugin;
