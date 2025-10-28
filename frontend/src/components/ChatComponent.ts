import Component from '../components/Component';
import FormComponent from '../components/Form/Form';
import Input from '../components/Form/Input';
import UserGridComponent from '../components/UserGrid';
import sendRequest, { Services } from '../services/send-request';
import State from '../services/state';
import { endpoints } from '../services/send-request';
import { showToast, ToastState } from '../components/Toast';
import ChatManager from './ChatManager';
import { getTournament } from '../services/match.request';

import { createPreconfiguredGame } from '../services/match.request';

export default class ChatComponent extends Component {
    public chatWindow: HTMLElement;
    private chatMessages: HTMLElement;
    private messageInput: HTMLInputElement;
    private closeButton: HTMLButtonElement;
    private socket: WebSocket | null = null;
    public blockButton: HTMLButtonElement;
    private groupChat: boolean = false;
    private id: string = '';

    readonly element: HTMLElement;

    constructor(private chatRoomId: string, private friendId: string, private friendName: string, private ws: WebSocket | null) {
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
        this.id = chatRoomId;
        this.socket = ws;

        if (!friendId) {
            this.groupChat = true;
        }

        // Initialize UI components
        this.chatMessages = document.createElement('div');
        this.messageInput = document.createElement('input');
        this.closeButton = document.createElement('button');
        this.blockButton = document.createElement('button');

        this.setupChatUI();
        console.log('constructor chatComponent:');
        // this.getMessages();
        

    }

    private setupChatUI(): void {
        // Header
        const header = document.createElement('div');
        header.className = 'p-4 bg-gray-700 flex flex-col items-start';

        // Chat name
        const title = document.createElement('h3');
        if (this.friendId) {
            title.textContent = `Chat with ${this.friendName}`;
        } else {
            title.textContent = `🏆 ${this.friendName}`;
        }
        title.className = 'text-lg font-bold mb-2';

        console.log('friendId === ', this.friendId);
            
        if (this.friendId) {
            console.log('group chat === ', this.friendId);

            // Buttons container
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'flex gap-4';

            // Close button
            this.closeButton.textContent = 'Close';
            this.closeButton.className = 'text-sm text-[#DE649B] hover:underline';
            this.closeButton.onclick = () => this.closeChat();

            // View Profile button
            const viewProfileButton = document.createElement('button');
            viewProfileButton.textContent = 'View Profile';
            viewProfileButton.className = 'text-sm text-[#05F2FA] hover:underline';
            viewProfileButton.onclick = () => {
                window.history.pushState(
                    {},
                    'view profile',
                    '/profile?userId=' + this.friendId,
                );
            };

            // Block/Unblock button
            this.blockButton.className = 'text-sm text-[#FACD05] hover:underline';
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
            header.append(title, buttonsContainer);
        } else {
            // Buttons container
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'flex gap-4';

            // Close button
            this.closeButton.textContent = 'Close';
            this.closeButton.className = 'text-sm text-[#DE649B] hover:underline';
            this.closeButton.onclick = () => this.closeChat();

            // View button tournament
            const viewProfileButton = document.createElement('button');
            viewProfileButton.textContent = 'View Tournament';
            viewProfileButton.className = 'text-sm text-[#05F2FA] hover:underline';
            viewProfileButton.onclick = () => {
                window.history.pushState(
                    {},
                    'View Tournament',
                    '/tournament?tournamentId=' + this.id,
                );
            };
            buttonsContainer.append(viewProfileButton, this.closeButton);

            header.append(title, buttonsContainer);
        }



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
        sendButton.className = 'px-4 py-2 font-bold bg-[#31AAB0] rounded hover:bg-[#0A8B91]';
        sendButton.style.flexShrink = '0';
        sendButton.onclick = () => this.sendMessage();

        // Append message input and send button to the message container
        messageContainer.append(this.messageInput, sendButton);

        if (this.friendId) {
            // Invite to Play button
            const inviteButton = document.createElement('button');
            inviteButton.textContent = 'Invite to play';
            inviteButton.className = 'px-4 py-2 font-bold bg-[#8A5EC4] rounded hover:bg-[#7D44B2] w-full';
            inviteButton.onclick = () => this.inviteToPlay(); // not implemented yet

            // Append all elements to the input container
            inputContainer.append(messageContainer, inviteButton);
        } else {
            inputContainer.append(messageContainer);
        }
        


        // Append all elements
        this.chatWindow.append(header, this.chatMessages, inputContainer);
        // this.setupWebSocket(this.friendName);
    }

    public blockUserCheck(data: any): void {
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

    private async sendMessage(): Promise<void> {
        // this.getMessages();
        if (this.groupChat) {
            console.log('tournament chat');
            const message = this.messageInput.value.trim();
            const myName = State.getState().getCurrentUser()?.name || 'Unknown';
            console.log('Sending message:', message);
            if (message) {
                try {
                    // Send the message via WebSocket
                    this.displayMessage(message, 'You', '');
                    await this.waitForSocketConnection(this.socket!);
                    this.socket?.send(
                        JSON.stringify({
                            type: 'groupChatMessage',
                            chatRoomId: this.id,
                            userId: this.friendId,
                            content: message,
                            name: myName,
                            groupName: this.friendName,
                            senderId: State.getState().getCurrentUser()?.id,
                        }),
                    );
                    // sendMessage(this.chatRoomId, message);
                    this.messageInput.value = '';
                } catch (error) {
                    console.error('Error sending message:', error);
                }
            }
        } else {
            console.log('fried chat');
            const message = this.messageInput.value.trim();
            const myName = State.getState().getCurrentUser()?.name || 'Unknown';
            console.log('Sending message:', message);
            if (message) {
                try {
                    // Send the message via WebSocket
                    this.displayMessage(message, 'You', '');
                    await this.waitForSocketConnection(this.socket!);
                    this.socket?.send(
                        JSON.stringify({
                            type: 'chatMessage',
                            chatRoomId: this.id,
                            userId: this.friendId,
                            content: message,
                            name: myName,
                            senderId: State.getState().getCurrentUser()?.id,
                        }),
                    );
                    // sendMessage(this.chatRoomId, message);
                    this.messageInput.value = '';
                } catch (error) {
                    console.error('Error sending message:', error);
                }
            }
        }
    }
    

    public async getMessages(): Promise<void> {
        const myName = State.getState().getCurrentUser()?.name || 'Unknown';
        console.log('getHistory:');
        try {
            if (!this.socket) {
            throw new Error('WebSocket is not initialized.');
        }
            // Wait for the WebSocket connection
            //  to be open
            await this.waitForSocketConnection(this.socket!);

            // Send the message via WebSocket
            this.socket?.send(
                JSON.stringify({
                    type: 'chatHistory',
                    chatRoomId: this.id,
                    userId: this.friendId,
                    senderId: State.getState().getCurrentUser()?.id,
                }),
            );
            this.messageInput.value = '';
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }

    private async waitForSocketConnection(socket: WebSocket): Promise<void> {
        return new Promise((resolve, reject) => {
            const maxAttempts = 10;
            let attempts = 0;
    
            const interval = setInterval(() => {
                if (socket.readyState === WebSocket.OPEN) {
                    clearInterval(interval);
                    resolve();
                } else if (attempts >= maxAttempts) {
                    clearInterval(interval);
                    reject(new Error('WebSocket connection timed out.'));
                }
                attempts++;
            }, 100); // Check every 100ms
        });
    }

    public displayMessage(message: string, sender: string, senderId: string): void {
        const messageElement = document.createElement('div');
        messageElement.className = 'p-2 bg-gray-700 rounded break-words max-w-full flex items-start gap-2';
    
        // Create a clickable sender element
        const senderElement = document.createElement('span');
        senderElement.className = "font-extrabold text-[#5C139C] cursor-pointer hover:underline [text-shadow:_0_0_5px_rgba(255,255,255,1),_0_0_15px_rgba(255,255,255,0.9),_0_0_30px_rgba(255,255,255,0.8)]";
        // senderElement.className = "font-bold text-[#520FB8] cursor-pointer hover:underline [-webkit-text-stroke:1px_white]";
        senderElement.textContent = sender;
        senderElement.onclick = () => {
            // Action when clicking on the sender's name
            console.log(`Sender clicked: ${sender}`);
            console.log(`Sender clicked: `, senderId);
            if (!senderId) {
                senderId = State.getState().getCurrentUser()?.id || '';
            }
            window.history.pushState(
                {},
                'view profile',
                '/profile?userId=' + senderId,
            );
            // window.history.pushState({}, 'View Profile', `/profile?userName=${encodeURIComponent(sender)}`);
        };
    
        // Create a message content element
        const messageContent = document.createElement('span');
        messageContent.textContent = message;
    
        // Append sender and message content to the message element
        messageElement.appendChild(senderElement);
        messageElement.appendChild(messageContent);
    
        // Append the message element to the chat messages container
        this.chatMessages.appendChild(messageElement);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    private async getUser(id: string) {
        const userResponse = await sendRequest(
            `/users/${id}`,
            'GET',
            null,
            Services.AUTH,
        );
        return await userResponse.json();
    }
    
    public async  showInfo(tournamentResults: string): Promise<void> {
        try {
            const tournamentData = await getTournament(this.id); // Fetch tournament data using the chat room ID
            if (tournamentData) {
                const infoElement = document.createElement('div');
                infoElement.className = 'p-2 bg-gray-700 rounded break-words max-w-full flex flex items-start gap-2 text-green-400 hover:underline hover:bg-green-600';
                
                const user = await this.getUser(tournamentData.tournament.winner.winnerId);
                infoElement.textContent = `Tournament Winner: ${user.name}`;
                


                // Create a clickable link for the tournament

                infoElement.onclick = () => {
                    window.history.pushState(
                        {},
                        'View Tournament',
                        '/tournament?tournamentId=' + this.id,
                    );
                }

    
                // Append the info element to the chat messages container
                this.chatMessages.appendChild(infoElement);
                this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
            } else {
                console.error('Failed to fetch tournament data.');
            }
        } catch (error) {
            console.error('Error fetching tournament data:', error);
        }
    }

    public closeChat(): void {
        this.chatWindow.remove(); // Remove the chat window from the DOM
        ChatManager.getInstance().closeChat(this.id); // Notify the ChatManager to remove the tab
    }

    private async blockUser(): Promise<void> {
        console.log('Blocking user:', this.friendName);
        try {
            this.socket?.send(
                JSON.stringify({
                    type: 'block',
                    userId: this.friendId,
                    senderId: State.getState().getCurrentUser()?.id,
                }),
            );
            console.log(`User ${this.friendName} blocked successfully.`);
        } catch (error) {
            console.error('Error blocking user:', error);
        }
    }

    private async unblockUser(): Promise<void> {
        console.log('Unblocking user:', this.friendName);
        try {
            this.socket?.send(
                JSON.stringify({
                    type: 'unblock',
                    userId: this.friendId,
                    senderId: State.getState().getCurrentUser()?.id,
                }),
            );
            console.log(`User ${this.friendName} unblocked successfully.`);
        } catch (error) {
            console.error('Error unblocking user:', error);
        }
    }

    public addParticipantToChat(participantId: string): void {
        const myName = State.getState().getCurrentUser()?.name || 'Unknown';

        const sendMessage = () => {
            try {
                this.socket?.send(
                    JSON.stringify({
                        type: 'addParticipant',
                        chatRoomId: this.id,
                        userId: participantId,
                        content: "addParticipant",
                        name: myName,
                        senderId: State.getState().getCurrentUser()?.id,
                    }),
                );
            } catch (error) {
                console.error('Error sending addParticipant message:', error);
            }
        };
    
        if (this.socket) {
            this.waitForSocketConnection(this.socket)
                .then(sendMessage)
                .catch((error) => {
                    console.error('Failed to send addParticipant message:', error);
                });
        } else {
            console.error('WebSocket is not initialized.');
        }
    }

    public removeParticipantFromChat(participantId: string): void {
        const myName = State.getState().getCurrentUser()?.name || 'Unknown';

        const sendMessage = () => {
            try {
                this.socket?.send(
                    JSON.stringify({
                        type: 'removeParticipant',
                        chatRoomId: this.id,
                        userId: participantId,
                        content: "removeParticipant",
                        name: myName,
                        senderId: State.getState().getCurrentUser()?.id,
                    }),
                );
            } catch (error) {
                console.error('Error sending addParticipant message:', error);
            }
        };
    
        if (this.socket) {
            this.waitForSocketConnection(this.socket)
                .then(sendMessage)
                .catch((error) => {
                    console.error('Failed to send addParticipant message:', error);
                });
        } else {
            console.error('WebSocket is not initialized.');
        }
    }


    
    private inviteToPlay(): void {
        console.log('Inviting to game:', this.friendName);
        const myName = State.getState().getCurrentUser()?.name || 'Unknown';
        // const participantSocket = app.connections.get(playerId);
        try {
            this.socket?.send(
                JSON.stringify({
                    type: 'inviteToPlay',
                    chatRoomId: this.id,
                    userId: this.friendId,
                    content: "Invite to play",
                    name: myName,
                    senderId: State.getState().getCurrentUser()?.id,
                }),
            );
            console.log(`User ${this.friendName} InviteToPlay successfully ...`);
        } catch (error) {
            console.error('Error InviteToPlay user:', error);
        }
    }

    public async isUserBlocked(): Promise<void> {
        try {
            if (!this.socket) {
                throw new Error('WebSocket is not initialized.');
            }
            // Wait for the WebSocket connection to be open
            await this.waitForSocketConnection(this.socket!);

            // Send a WebSocket message to check block status
            this.socket?.send(
                JSON.stringify({
                    type: 'isBlocked',
                    userId: this.friendId,
                    senderId: State.getState().getCurrentUser()?.id,
                }),
            );
        
            
        } catch (error) {
            console.error('Error isBlocked user:', error);
        }
    }
}
