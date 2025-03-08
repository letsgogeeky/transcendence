import { FastifyInstance } from 'fastify';
import twoFAuthCheck from '../plugins/2fa.js';

export function SocketRoutes(fastify: FastifyInstance) {
    fastify.register(twoFAuthCheck);

    fastify.route({
        method: 'GET',
        url: '/socket/',
        handler: (req, reply) => {
            reply.send({ message: 'WebSocket endpoint' });
        },
        wsHandler: (socket, req) => {
            console.log('WebSocket Connected!');
            fastify.connections.set(req.user, socket);
            // socket.on('message', (message: string) => {
            //     console.log('Received:', message);
            //     socket.send('Hello from server!');
            // });
            socket.on('open', () => {
                const message = JSON.stringify({
                    type: 'STATUS_CHANGE',
                    data: {
                        message: 'User is online',
                        id: req.user,
                        value: 'LOGIN',
                    },
                });
                fastify.websocketServer.clients.forEach((client) => {
                    if (client.readyState === client.OPEN) {
                        client.send(message);
                    }
                });
                console.log('close');
            });
            socket.on('close', () => {
                const message = JSON.stringify({
                    type: 'STATUS_CHANGE',
                    data: {
                        message: 'User logged out',
                        id: req.user,
                        value: 'LOGOUT',
                    },
                });
                fastify.connections.delete(req.user);
                fastify.websocketServer.clients.forEach((client) => {
                    if (client.readyState === client.OPEN) {
                        client.send(message);
                    }
                });
            });
            socket.on('error', (err) => {
                console.error('WebSocket Error:', err);
            });
        },
    });
}
