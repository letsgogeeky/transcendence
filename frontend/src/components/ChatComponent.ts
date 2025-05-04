import Component from '../components/Component';
import FormComponent from '../components/Form/Form';
import Input from '../components/Form/Input';
import UserGridComponent from '../components/UserGrid';
import sendRequest, { Services } from '../services/send-request';
import State from '../services/state';
import { endpoints } from '../services/send-request';
import { showToast, ToastState } from '../components/Toast';

// import ChatManager from '../pages/users'; 
import { ChatManager } from '../pages/users'; // Adjust the path based on your project structure
import { createPreconfiguredGame } from '../services/match.request';

export default class ChatComponent extends Component {
    public chatWindow: HTMLElement;
    private chatMessages: HTMLElement;
    private messageInput: HTMLInputElement;
    private closeButton: HTMLButtonElement;
    private socket: WebSocket | null = null;
    private blockButton: HTMLButtonElement;

    readonly element: HTMLElement;

    constructor(private chatRoomId: string, private friendName: string, private ws: WebSocket | null) {
        super();
        this.chatWindow = document.createElement('div');
        this.chatWindow.className = 'fixed bg-gray-800 text-white rounded-lg shadow-lg flex flex-col z-50';
        this.chatWindow.style.width = '400px';
        this.chatWindow.style.height = '500px';
        this.chatWindow.style.overflow = 'hidden';
        this.chatWindow.style.position = 'fixed';
        this.chatWindow.style.bottom = '60px';
        this.chatWindow.style.right = '16px';
        this.chatWindow.style.display = 'block';

        this.element = this.chatWindow;

        this.socket = ws;

        // Initialize UI components
        this.chatMessages = document.createElement('div');
        this.messageInput = document.createElement('input');
        this.closeButton = document.createElement('button');
        this.blockButton = document.createElement('button');

        this.setupChatUI();
    }

    private setupChatUI(): void {
        // Header
        const header = document.createElement('div');
        header.className = 'p-4 bg-gray-700 flex flex-col items-start';

        // Chat name
        const title = document.createElement('h3');
        title.textContent = `Chat with ${this.friendName}`;
        title.className = 'text-lg font-bold mb-2';

        // Buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'flex gap-4';

        // Close button
        this.closeButton.textContent = 'Close';
        this.closeButton.className = 'text-sm text-red-500 hover:underline';
        this.closeButton.onclick = () => this.closeChat();

        // View Profile button
        const viewProfileButton = document.createElement('button');
        viewProfileButton.textContent = 'View Profile';
        viewProfileButton.className = 'text-sm text-blue-500 hover:underline';
        viewProfileButton.onclick = () => {
            window.history.pushState(
                {},
                'view profile',
                '/profile?userId=' + this.chatRoomId,
            );
        };

        // Block/Unblock button
        this.blockButton.className = 'text-sm text-yellow-500 hover:underline';
        this.blockButton.textContent = 'Block'; // Default text

        // Add click event for the Block/Unblock button
        this.blockButton.onclick = async () => {
            if (this.blockButton.textContent === 'Block') {
                await this.blockUser();
                this.blockButton.textContent = 'Unblock';
            } else {
                await this.unblockUser();
                this.blockButton.textContent = 'Block';
            }
        };

        // Append buttons to the container
        buttonsContainer.append(viewProfileButton, this.blockButton, this.closeButton);

        // Append title and buttons container to the header
        header.append(title, buttonsContainer);

        // Messages container
        this.chatMessages.className = 'overflow-y-auto p-4 space-y-2';
        this.chatMessages.style.position = 'absolute';
        this.chatMessages.style.top = '90px';
        this.chatMessages.style.bottom = '120px';
        this.chatMessages.style.width = '100%';
        this.chatMessages.style.boxSizing = 'border-box';
        this.chatMessages.style.overflowY = 'auto';

        // Input container
        const inputContainer = document.createElement('div');
        inputContainer.className = 'p-4 bg-gray-700 flex flex-col gap-2 items-center';
        inputContainer.style.position = 'absolute';
        inputContainer.style.bottom = '0';
        inputContainer.style.width = '100%';
        inputContainer.style.boxSizing = 'border-box';

        // Message input and send button container
        const messageContainer = document.createElement('div');
        messageContainer.className = 'flex gap-2 items-center w-full';

        // Message input
        this.messageInput.type = 'text';
        this.messageInput.placeholder = 'Type a message...';
        this.messageInput.className = 'flex-1 p-2 rounded bg-gray-600 text-white';
        this.messageInput.style.minWidth = '0';

        // Send button
        const sendButton = document.createElement('button');
        sendButton.textContent = 'Send';
        sendButton.className = 'px-4 py-2 bg-blue-500 rounded hover:bg-blue-600';
        sendButton.style.flexShrink = '0';
        sendButton.onclick = () => this.sendMessage();

        // Append message input and send button to the message container
        messageContainer.append(this.messageInput, sendButton);

        // Invite to Play button
        const inviteButton = document.createElement('button');
        inviteButton.textContent = 'Invite to Play';
        inviteButton.className = 'px-4 py-2 bg-green-500 rounded hover:bg-green-600 w-full';
        inviteButton.onclick = () => this.inviteToPlay(); // not implemented yet

        // Append all elements to the input container
        inputContainer.append(messageContainer, inviteButton);

        // Append all elements
        this.chatWindow.append(header, this.chatMessages, inputContainer);

        this.setupWebSocket(this.friendName);
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

            if (data.type === 'inviteToPlay') {
                const myId = State.getState().getCurrentUser()?.id || 'Unknown';

                const acceptGame = async () => {
                    // start a game with data.data.userId vs data.id
                    const match = await createPreconfiguredGame("1v1", [data.data.userId, data.id]);
                    if (match) {
                    console.log('Start match:', data.data.userId, data.id);

                    showToast(
                        ToastState.SUCCESS,
                        `Your game will start soon against "${data.data.name}"`,
                            3000
                        );
                        return;
                    }
                    showToast(
                        ToastState.ERROR,
                        `Failed to create game. Please try again.`,
                        3000
                    );
                };
                const rejectGame = () => {

                    showToast(
                        ToastState.NOTIFICATION,
                        `You have declined the invitation`,
                        3000
                    );
                };
                showToast(
                    ToastState.NOTIFICATION,
                    `You've been invited to play vs: "${data.data.name}"`,
                    0,
                    [
                        { text: 'Accept', action: acceptGame },
                        { text: 'Reject', action: rejectGame }
                    ]
                );
                    console.log('inviteToPlay x:', data.data);
                    this.displayMessage(data.data.content, data.data.name);
            }

            if (data.type === 'block') {
                console.log('User blocked:', data.data);
            }
            if (data.type === 'unblock') {
                console.log('User unblocked:', data.data);
            }
            if (data.type === 'isBlocked') {
                console.log('User block status:', data.data);
                if (data.data.name === 'true') {
                    console.log('User is blocked');
                    this.blockButton.textContent = 'Unblock';
                } else {
                    console.log('User is not blocked', data.name, data.data.name);

                    this.blockButton.textContent = 'Block';
                }
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

    public closeChat(): void {
        this.chatWindow.remove(); // Remove the chat window from the DOM
        ChatManager.getInstance().closeChat(this.chatRoomId); // Notify the ChatManager to remove the tab
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

    private inviteToPlay(): void {
        console.log('Inviting to game:', this.chatRoomId);
        const myName = State.getState().getCurrentUser()?.name || 'Unknown';
        // const participantSocket = app.connections.get(playerId);
        try {
            this.socket?.send(
                JSON.stringify({
                    type: 'inviteToPlay',
                    chatRoomId: this.chatRoomId,
                    userId: this.chatRoomId,
                    content: "Invite to play",
                    name: myName,
                }),
            );
            console.log(`User ${this.chatRoomId} InviteToPlay successfully ...`);
        } catch (error) {
            console.error('Error InviteToPlay user:', error);
        }
    }

    private async isUserBlocked(): Promise<boolean> {
        return new Promise(async (resolve) => {
            // Wait for the WebSocket connection to be open
            await this.waitForSocketConnection(this.socket!);

            // Send a WebSocket message to check block status
            this.socket?.send(
                JSON.stringify({
                    type: 'isBlocked',
                    userId: this.chatRoomId,
                }),
            );
        });
    }
}
