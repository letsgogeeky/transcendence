// endpoints to get match history and match details for a user or a list of users

import { FastifyInstance } from "fastify";
import credentialAuthCheck from "../../plugins/validateToken.js";
interface HistoryRequestParams {
    userId: string;
    matchId: string;
}

export default function historyRoutes(app: FastifyInstance) {
    app.register(credentialAuthCheck);
    app.get<{ Params: HistoryRequestParams }>("/user/:userId", async (request, reply) => {
        const { userId } = request.params;
        const matches = await app.prisma.match.findMany({
            where: {
                userId: userId,
            },
            include: {
                scores: true,
                participants: true,
            },
        });
        return reply.status(200).send({
            matches,
        });
    });
    // get match details for a match
    app.get<{ Params: HistoryRequestParams }>("/match/:matchId", async (request, reply) => {
        const { matchId } = request.params;
        const match = await app.prisma.match.findUnique({
            where: {
                id: matchId,
            },
        });
        return reply.status(200).send({
            match,
        });
    });
}

