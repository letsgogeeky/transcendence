import { FastifyInstance } from "fastify";
import { Type } from "@sinclair/typebox";
import credentialAuthCheck from "../../plugins/validateToken.js";
export const ChatHistoryResponse = Type.Object({
    chats: Type.Array(Type.Object({
        id: Type.String(),
        name: Type.String(),
    })),
});

const ChatHistoryParams = Type.Object({
    chatRoomId: Type.String(),
});

export default function chatHistoryRoutes(fastify: FastifyInstance) {
    fastify.register(credentialAuthCheck);
    // get all messages for chatroom
    fastify.get<{
        Params: typeof ChatHistoryParams;
    }>('/:chatRoomId', {
        schema: {
            params: ChatHistoryParams,
        },
    }, async (request, reply) => {
        // verify user is in chatroom
        const { chatRoomId } = request.params;
        if (!chatRoomId) {
            return reply.status(400).send({ message: 'Chat room ID is required' });
        }
        const chatParticipant = await fastify.prisma.chatParticipant.findFirst({
            where: {
                userId: request.user,
                chatRoomId: chatRoomId as string,
            },
        });
        if (!chatParticipant) {
            return reply.status(401).send({ message: 'Unauthorized' });
        }
        const messages = await fastify.prisma.message.findMany({
            where: {
                chatRoomId: chatRoomId as string,
            },
            include: {
                attachments: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return reply.status(200).send({ messages });
    });
    fastify.get('/', async (request, reply) => {
        // returns history of all chats per user
        const chats = await fastify.prisma.chatParticipant.findMany({
            where: {    
                userId: request.user,
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
