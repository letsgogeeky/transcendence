import { FastifyPluginCallback } from "fastify";
import fp from "fastify-plugin";
import { GameSession } from "../routes/ws/session";

const gameSessionPlugin: FastifyPluginCallback = fp((server, _options) => {
    const gameSessions = new Map<string, GameSession>();
    server.decorate('gameSessions', gameSessions);
});

export default gameSessionPlugin;