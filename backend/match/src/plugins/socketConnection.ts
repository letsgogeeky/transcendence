// a plugin to handle socket connections

import { FastifyPluginCallback } from "fastify";
import fp from "fastify-plugin";
import { WebSocket } from "ws";
const socketConnectionPlugin: FastifyPluginCallback = fp((server, _options) => {
    const connections = new Map<string, WebSocket>();
    const gameConnections = new Map<string, WebSocket>();
    server.decorate('connections', connections);
    server.decorate('gameConnections', gameConnections);
});

export default socketConnectionPlugin;