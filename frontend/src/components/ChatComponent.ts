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
    private chatRoomMessages: any[] = [];

    readonly element: HTMLElement;
    // private allUsers: any[] = [];
    // private filteredUsers: any[] = [];
    // private friendList: UserGridComponent | null = null;
    // private pendingReceived: UserGridComponent | null = null;
    // private pendingSent: UserGridComponent | null = null;
    // private strangers: UserGridComponent | null = null;
    // private userListsContainer: HTMLElement | null = null;

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

        this.setupWebSocket(friendName);
    }

    private async setupWebSocket(friendName: string): Promise<void> {
        if (!this.socket) {
            console.error('WebSocket not initialized');
            return;
        }
        this.socket.onopen = () => {
            console.log('Chat socket connected');
            // wait for the socket to be open before sending messages
            
            this.getMessages();
        };


        console.log('Chat socket connected');

        // Wait for 1 second before calling getMessages


        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'chatMessage') {
                console.log('Received chat message:', data.data);
                this.displayMessage(data.data.content, data.data.name);
            }

            if (data.type === 'chatHistory') {
                console.log('Received chat history:', data.data);

                // Display the chat history in the chat window
                data.data.forEach((message: any) => {
                    this.displayMessage(message.content, message.name);
                });
            }
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        this.socket.onclose = () => {
            console.log('WebSocket connection closed');
        };
    }

    private async sendMessage(): Promise<void> {
        // this.getMessages();
        const message = this.messageInput.value.trim();
        const myName = State.getState().getCurrentUser()?.name || 'Unknown';
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
                        name: myName,
                    }),
                );
                // sendMessage(this.chatRoomId, message);
                this.messageInput.value = '';
            } catch (error) {
                console.error('Error sending message:', error);
            }
        }
    }

    private async getMessages(): Promise<void> {
        const myName = State.getState().getCurrentUser()?.name || 'Unknown';
        console.log('getHistory:');
            try {
                // Send the message via WebSocket
                // this.displayMessage(message, 'You');
                this.socket?.send(
                    JSON.stringify({
                        type: 'chatHistory',
                        chatRoomId: this.chatRoomId,
                        userId: this.chatRoomId,
                    }),
                );
                // sendMessage(this.chatRoomId, message);
                this.messageInput.value = '';
            } catch (error) {
                console.error('Error sending message:', error);
        }
    }

    private async waitForSocketConnection(socket: WebSocket): Promise<void> {
        return new Promise((resolve) => {
            if (socket.readyState === WebSocket.OPEN) {
                resolve();
            } else {
                socket.onopen = () => {
                    resolve();
                };
            }
        });
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

