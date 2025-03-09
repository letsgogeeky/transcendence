import { FastifyInstance } from "fastify";
import { Type } from "@sinclair/typebox";

export const ChatHistoryResponse = Type.Object({
    chats: Type.Array(Type.Object({
        id: Type.String(),
        name: Type.String(),
    })),
});

export function chatRoutes(fastify: FastifyInstance) {
    // validate token

    fastify.get('/', async (request, reply) => {
        // returns history of all chats per user
        const chats = await fastify.prisma.chatParticipant.findMany({
            where: {    
                userId: request.user?.id,
            },
            include: {
                chatRoom: true,
            },
        });
        console.log(chats);
        const response = {
            chats: chats.map((chat) => ({
                id: chat.chatRoom.id,
                name: chat.chatRoom.name,
            })),
        };
        return reply.status(200).send(response);
    });
}

export default chatRoutes;