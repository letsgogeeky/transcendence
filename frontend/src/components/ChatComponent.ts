import Component from '../components/Component';
import FormComponent from '../components/Form/Form';
import Input from '../components/Form/Input';
import UserGridComponent from '../components/UserGrid';
import sendRequest, { Services } from '../services/send-request';
import State from '../services/state';
import { endpoints } from '../services/send-request';
// import { createChatRoom } from './../../../backend/chat/src/routes/http/chat';
// import WebSocketService from './sockets';
// import ErrorComponent from './error';
export default class ChatComponent extends Component {
    private chatWindow: HTMLElement;
    private chatMessages: HTMLElement;
    private messageInput: HTMLInputElement;
    private closeButton: HTMLButtonElement;
    private socket: WebSocket | null = null;

    readonly element: HTMLElement;
    private allUsers: any[] = [];
    private filteredUsers: any[] = [];
    private friendList: UserGridComponent | null = null;
    private pendingReceived: UserGridComponent | null = null;
    private pendingSent: UserGridComponent | null = null;
    private strangers: UserGridComponent | null = null;
    private userListsContainer: HTMLElement | null = null;

    constructor(private chatRoomId: string, private friendName: string, private ws: WebSocket | null) {
        super();
        this.chatWindow = document.createElement('div');
        this.chatWindow.className = 'fixed bottom-4 right-4 w-90 h-96 bg-gray-800 text-white rounded-lg shadow-lg flex flex-col';

        this.element = this.chatWindow;

        this.socket = ws;

        // Header
        const header = document.createElement('div');
        header.className = 'p-4 bg-gray-700 flex justify-between items-center';
        const title = document.createElement('h3');
        title.textContent = `Chat with ${friendName}`;
        title.className = 'text-lg font-bold';
        this.closeButton = document.createElement('button');
        this.closeButton.textContent = 'Close';
        this.closeButton.className = 'text-sm text-red-500 hover:underline';
        this.closeButton.onclick = () => this.closeChat();
        header.append(title, this.closeButton);

        // Messages container
        this.chatMessages = document.createElement('div');
        this.chatMessages.className = 'flex-1 overflow-y-auto p-4 space-y-2';

        // Input container
        const inputContainer = document.createElement('div');
        inputContainer.className = 'p-4 bg-gray-700 flex gap-2';
        this.messageInput = document.createElement('input');
        this.messageInput.type = 'text';
        this.messageInput.placeholder = 'Type a message...';
        this.messageInput.className = 'flex-1 p-2 rounded bg-gray-600 text-white';
        const sendButton = document.createElement('button');
        sendButton.textContent = 'Send';
        sendButton.className = 'px-4 py-2 bg-blue-500 rounded hover:bg-blue-600';
        sendButton.onclick = () => this.sendMessage();

        inputContainer.append(this.messageInput, sendButton);

        // Append all elements
        this.chatWindow.append(header, this.chatMessages, inputContainer);
        if (this.socket) {
            this.setupWebSocket();
        }
        
    }

    private setupWebSocket(): void {
        if (!this.socket) {
            console.error('WebSocket not initialized');
            return;
        }
        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type == 'chatMessage') {
                console.log('Received chat message:', data.data);
                // chatComponent.addMessage(data.data);
            }
            if (data.type == 'chatHistory') {
                console.log('Received chat history:', data.data);
                // chatComponent.setMessages(data.data);
            }
        };
    }


    private async sendMessage(): Promise<void> {
        const message = this.messageInput.value.trim();
        console.log('Sending message:', message);
        if (message) {
            try {
                // Send the message via WebSocket
                this.displayMessage(message, 'You');
                this.socket?.send(
                    JSON.stringify({
                        type: 'chatMessage',
                        chatRoomId: this.chatRoomId,
                        userId: this.chatRoomId,
                        content: message,
                        token: localStorage.getItem('authToken'),
                    }),
                );
                // sendMessage(this.chatRoomId, message);
                this.messageInput.value = '';
            } catch (error) {
                console.error('Error sending message:', error);
            }
        }
    }

    
    private displayMessage(message: string, sender: string): void {
        const messageElement = document.createElement('div');
        messageElement.className = 'p-2 bg-gray-700 rounded';
        messageElement.textContent = `${sender}: ${message}`;
        this.chatMessages.appendChild(messageElement);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    private closeChat(): void {
        this.chatWindow.remove();
    }
}

// export async function createChat(chatName: string): Promise<any> {
//     try {
//         const response = await fetch(`${endpoints.chat}/create`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 Authorization: `Bearer ${localStorage.getItem('authToken')}`,
//             },
//             body: JSON.stringify({ name: chatName }),
//         });
//         if (!response.ok) throw new Error('Failed to create chat');
//         return await response.json();
//     } catch (error) {
//         console.error('Error creating chat:', error);
//         throw error;
//     }
// }

// export async function joinChat(chatRoomId: string): Promise<any> {
//     try {
//         const response = await fetch(`${endpoints.chat}/join/${chatRoomId}`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 Authorization: `Bearer ${localStorage.getItem('authToken')}`,
//             },
//         });
//         if (!response.ok) throw new Error('Failed to join chat');
//         return await response.json();
//     } catch (error) {
//         console.error('Error joining chat:', error);
//         throw error;
//     }
// }

// // export function sendMessage(chatRoomId: string, content: string): void {
// //     const socketService = new WebSocketService(`${endpoints.chatSocket}`);
// //     const message = {
// //         type: 'chatMessage',
// //         chatRoomId,
// //         content,
// //         token: localStorage.getItem('authToken'),
// //     };
// //     socketService.sendMessage(JSON.stringify(message));
// // }

// export async function fetchChatMessages(chatRoomId: string): Promise<any> {
//     try {
//         const response = await fetch(`${endpoints.chat}/history/${chatRoomId}`, {
//             method: 'GET',
//             headers: {
//                 Authorization: `Bearer ${localStorage.getItem('authToken')}`,
//             },
//         });
//         if (!response.ok) throw new Error('Failed to fetch chat messages');
//         return await response.json();
//     } catch (error) {
//         console.error('Error fetching chat messages:', error);
//         throw error;
//     }
// }

// export async function exampleUsage(fastify: FastifyInstance) {
//     const chatRoom = await createChatRoom(fastify, '1', '2', 'Chat between User 1 and User 2');
//     console.log('Chat room created:', chatRoom);
// }