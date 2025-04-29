import Component from '../components/Component';
import FormComponent from '../components/Form/Form';
import Input from '../components/Form/Input';
import UserGridComponent from '../components/UserGrid';
import sendRequest, { Services } from '../services/send-request';
import State from '../services/state';
import { endpoints } from '../services/send-request';

export default class ChatComponent extends Component {
    private chatWindow: HTMLElement;
    private chatMessages: HTMLElement;
    private messageInput: HTMLInputElement;
    private closeButton: HTMLButtonElement;
    private socket: WebSocket | null = null;

    readonly element: HTMLElement;


    constructor(private chatRoomId: string, private friendName: string, private ws: WebSocket | null) {
        super();
        this.chatWindow = document.createElement('div');
        this.chatWindow.className = 'fixed bottom-4 right-4 bg-gray-800 text-white rounded-lg shadow-lg flex flex-col';
        this.chatWindow.style.width = '400px';
        this.chatWindow.style.height = '500px';
        this.chatWindow.style.overflow = 'hidden';

        this.element = this.chatWindow;

        this.socket = ws;

        // Header
        const header = document.createElement('div');
        header.className = 'p-4 bg-gray-700 flex flex-col items-start';

        // Chat name
        const title = document.createElement('h3');
        title.textContent = `Chat with ${friendName}`;
        title.className = 'text-lg font-bold mb-2';

        // Buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'flex gap-4';

        // Close button
        this.closeButton = document.createElement('button');
        this.closeButton.textContent = 'Close';
        this.closeButton.className = 'text-sm text-red-500 hover:underline';
        this.closeButton.onclick = () => this.closeChat();

        // View Profile button
        const viewProfileButton = document.createElement('button');
        viewProfileButton.textContent = 'View Profile';
        viewProfileButton.className = 'text-sm text-blue-500 hover:underline';
        viewProfileButton.onclick = () => {
            window.location.href = `/profile?userId=${this.chatRoomId}`;
        };

        // Block/Unblock button
        const blockButton = document.createElement('button');
        blockButton.className = 'text-sm text-yellow-500 hover:underline';
        blockButton.textContent = 'Block'; // Default text has to change later
        // Check if the user is blocked



        
        blockButton.onclick = async () => {
            if (blockButton.textContent === 'Block') {
                await this.blockUser();
                blockButton.textContent = 'Unblock';
            } else {
                await this.unblockUser();
                blockButton.textContent = 'Block';
            }
        };

        // Append buttons to the container
        buttonsContainer.append(viewProfileButton, blockButton, this.closeButton);

        // Append title and buttons container to the header
        header.append(title, buttonsContainer);

        // Messages container
        this.chatMessages = document.createElement('div');
        this.chatMessages.className = 'overflow-y-auto p-4 space-y-2';
        this.chatMessages.style.position = 'absolute'; // Position it relative to the chat window
        this.chatMessages.style.top = '90px'; // Start below the header (adjust height as needed)
        this.chatMessages.style.bottom = '120px'; // Leave space for the input container (adjust height as needed)
        this.chatMessages.style.width = '100%'; // Full width
        this.chatMessages.style.boxSizing = 'border-box'; // Include padding in width calculation
        this.chatMessages.style.overflowY = 'auto'; // Enable scrolling for messages

        // Input container
        const inputContainer = document.createElement('div');
        inputContainer.className = 'p-4 bg-gray-700 flex flex-col gap-2 items-center';
        inputContainer.style.position = 'absolute'; // Ensure it stays at the bottom
        inputContainer.style.bottom = '0'; // Align to the bottom of the chat window
        inputContainer.style.width = '100%'; // Take full width of the chat window
        inputContainer.style.boxSizing = 'border-box'; // Include padding in width calculation

        // Message input and send button container
        const messageContainer = document.createElement('div');
        messageContainer.className = 'flex gap-2 items-center w-full';

        // Message input
        this.messageInput = document.createElement('input');
        this.messageInput.type = 'text';
        this.messageInput.placeholder = 'Type a message...';
        this.messageInput.className = 'flex-1 p-2 rounded bg-gray-600 text-white';
        this.messageInput.style.minWidth = '0'; // Prevent overflow issues

        // Send button
        const sendButton = document.createElement('button');
        sendButton.textContent = 'Send';
        sendButton.className = 'px-4 py-2 bg-blue-500 rounded hover:bg-blue-600';
        sendButton.style.flexShrink = '0'; // Prevent shrinking
        sendButton.onclick = () => this.sendMessage();

        // Append message input and send button to the message container
        messageContainer.append(this.messageInput, sendButton);

        // Invite to Game button
        const inviteButton = document.createElement('button');
        inviteButton.textContent = 'Invite to Game';
        inviteButton.className = 'px-4 py-2 bg-green-500 rounded hover:bg-green-600 w-full';
        inviteButton.onclick = () => this.inviteToGame();

        // Append all elements to the input container
        inputContainer.append(messageContainer, inviteButton);

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
            
            this.getMessages();
        };


        console.log('Chat socket connected');



        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'chatMessage') {
                console.log('Received chat message:', data.data);
                this.displayMessage(data.data.content, data.data.name);
            }

            if (data.type === 'chatHistory') {
                console.log('Received chat history:', data.data);
                const myId = State.getState().getCurrentUser()?.id || 'Unknown';
                // Display the chat history in the chat window
                data.data.forEach((message: any) => {
                    const senderName = message.userId === myId ? 'You' : message.name;
                    console.log('senderName: message.id: myId:', senderName, message.id, myId);

                    this.displayMessage(message.content, senderName);
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
        messageElement.className = 'p-2 bg-gray-700 rounded break-words max-w-full';
        messageElement.textContent = `${sender}: ${message}`;
        this.chatMessages.appendChild(messageElement);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    private closeChat(): void {
        this.chatWindow.remove();
    }

    private async blockUser(): Promise<void> {
        console.log('Blocking user:', this.chatRoomId);
        try {
            this.socket?.send(
                JSON.stringify({
                    type: 'block',
                    userId: this.chatRoomId,
                }),
            );
            console.log(`User ${this.chatRoomId} blocked successfully.`);
        } catch (error) {
            console.error('Error blocking user:', error);
        }
    }

    private async unblockUser(): Promise<void> {
        console.log('Unblocking user:', this.chatRoomId);
        try {
            this.socket?.send(
                JSON.stringify({
                    type: 'unblock',
                    userId: this.chatRoomId,
                }),
            );
            console.log(`User ${this.chatRoomId} unblocked successfully.`);
        } catch (error) {
            console.error('Error unblocking user:', error);
        }
    }

    private inviteToGame(): void {
        console.log('Inviting to game:', this.chatRoomId);
        // Implement the logic to invite the user to a game
    }
}
