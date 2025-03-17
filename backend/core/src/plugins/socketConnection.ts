// a plugin to handle socket connections

import { FastifyPluginCallback } from "fastify";
import fp from "fastify-plugin";
import { WebSocket } from "ws";
const socketConnectionPlugin: FastifyPluginCallback = fp((server, _options) => {
    const chatConnections = new Map<string, WebSocket>();
    server.decorate('chatConnections', chatConnections);
});

export default socketConnectionPlugin;