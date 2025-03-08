import { FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';
import { WebSocket } from 'ws';

const connectionsPlugin: FastifyPluginCallback = fp((server, _options) => {
    const myMap = new Map<string, WebSocket>();
    server.decorate('connections', myMap);
});

export default connectionsPlugin;
