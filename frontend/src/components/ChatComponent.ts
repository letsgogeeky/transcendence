import Component from './Component';
import State from '../services/state';
import { endpoints } from '../services/send-request';

export default class ChatComponent extends Component {
    private socket: WebSocket | null = null;
    private chatWindow: HTMLElement;
    private chatMessages: HTMLElement;
    private messageInput: HTMLInputElement;
    private closeButton: HTMLButtonElement;

    public element: HTMLElement;

    constructor(private chatRoomId: string, private friendName: string) {
        super();
        this.chatWindow = document.createElement('div');
        this.chatWindow.className = 'fixed bottom-4 right-4 w-90 h-96 bg-gray-800 text-white rounded-lg shadow-lg flex flex-col';

        this.element = this.chatWindow;

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
    }

    public render(parent: HTMLElement): void {
        parent.appendChild(this.chatWindow);
        this.connectToChat();
    }

    private connectToChat(): void {
        const authToken = State.getState().getAuthToken();
        this.socket = new WebSocket(`${endpoints.chat}/ws?token=${authToken}&roomId=${this.chatRoomId}`);

        this.socket.onopen = () => {
            console.log('WebSocket connected');
        };

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'CHAT_MESSAGE') {
                this.displayMessage(data.content, data.sender === State.getState().getCurrentUser()?.id ? 'You' : this.friendName);
            }
        };

        this.socket.onclose = () => {
            console.log('WebSocket disconnected');
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    private async sendMessage(): Promise<void> {
        const message = this.messageInput.value.trim();
        if (message && this.socket) {
            try {
                // Send the message via WebSocket
                this.socket.send(JSON.stringify({ type: 'CHAT_MESSAGE', content: message, chatRoomId: this.chatRoomId }));
                this.displayMessage(message, 'You');

                // Optionally, save the message to the backend
                await fetch(`${endpoints.chat}/messages`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${State.getState().getAuthToken()}`,
                    },
                    body: JSON.stringify({
                        content: message,
                        chatRoomId: this.chatRoomId,
                    }),
                });

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
        this.socket?.close();
        this.chatWindow.remove();
    }
}