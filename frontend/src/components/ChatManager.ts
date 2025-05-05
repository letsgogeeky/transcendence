import ChatComponent from './ChatComponent';
import State from '../services/state';
import { showToast, ToastState } from '../components/Toast';
import UsersPageComponent from '../pages/users';
import TournamentComponent from '../pages/tournament';

import { endpoints } from '../services/send-request';
import { createPreconfiguredGame } from '../services/match.request';


export class ChatManager {
    private static instance: ChatManager | null = null;
    private activeChats: Map<string, ChatComponent> = new Map();
    private tabContainer: HTMLElement;
    private chatSocket: WebSocket | null = null;

    private constructor() {
        this.tabContainer = document.createElement('div');
        this.tabContainer.className = 'fixed bottom-0 left-0 w-full bg-gray-800 text-white flex flex-row-reverse space-x-2 p-2 overflow-x-auto';
        document.body.appendChild(this.tabContainer);
        // this.initializeChatSocket();
        // console.log('constructor chatManager:');
    }

    public initializeChatSocket(): void {
        if (this.chatSocket && this.chatSocket.readyState === WebSocket.OPEN) {
            console.log('WebSocket connection is already open.');
            return;
        }
    
        const token = State.getState().getAuthToken();
        if (!token) {
            console.log('No authentication token found. Cannot initialize WebSocket.');
            return;
        }
        this.chatSocket = new WebSocket(`${endpoints.chatSocket}?token=${token}`, 'wss');

        this.chatSocket.onopen = () => {
            console.log('Global chat socket connected');
        };

        this.chatSocket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        this.chatSocket.onclose = (event) => {
            console.log('Global chat socket closed:', event.reason);

        };

        this.chatSocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Global WebSocket message received:', data.data);
            this.handleIncomingMessage(data);
        };
    }

    public closeChatSocket(): void {
        if (this.chatSocket) {
            this.chatSocket.close();
            this.chatSocket = null;
            console.log('Chat socket closed manually');
        }
    }

    private handleIncomingMessage(data: any): void {
        const showChat = () => {

            const chatManager = ChatManager.getInstance();

            chatManager.openChat(data.data.chatRoomId, data.data.name, data.data.senderId);

        };
        const showChatRoom = () => {

            const chatManager = ChatManager.getInstance();
            const chatComponent = chatManager.openChat(data.data.chatRoomId, data.data.groupName, '');

        };
        // check which chat room the message is for
        console.log('Incoming message:', data);
        console.log('data.data:', data.data);

        const chatRoomId = data.data.chatRoomId;
        console.log('Target chatRoomId:', chatRoomId);
        // check if the chat room is open
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
        } else if (this.activeChats.has(chatRoomId)) {
            const chatComponent = this.activeChats.get(chatRoomId);
            console.log('Target chatRoomId: open');


            if (chatComponent) {
                if (data.type === 'isBlocked') {
                    chatComponent.blockUserCheck(data);
                } else if (data.type === 'chatMessage' || data.type === 'groupChatMessage') {
                    chatComponent.displayMessage(data.data.content, data.data.name, data.data.senderId);
                } else if (data.type === 'chatHistory') {
                    console.log('Received chat history:', data.data);
                    const myId = State.getState().getCurrentUser()?.id || 'Unknown';
                    // Display the chat history in the chat window
                    data.messages.forEach((message: any) => {
                        const senderName = message.userId === myId ? 'You' : message.name;
                        console.log('senderName: message.id: myId:', senderName, message.id, myId);

                        chatComponent.displayMessage(message.content, senderName, message.userId);
                    });
                }
            }
        } else if (data.type === 'block' || data.type === 'unblock') {
            console.log(`blocked or unblocked: ${chatRoomId}`);
        } else if (data.type === 'groupChatMessage'){
            console.log(`No active chat found for chatRoomId: ${chatRoomId}`);
            showToast(
                ToastState.NOTIFICATION,
                `You receved a message from ${data.data.name}"`,
                5000,
                [
                    { text: 'view', action: showChatRoom },
                ]
            );
        } else {
            console.log(`No active chat found for chatRoomId: ${chatRoomId}`);
            showToast(
                ToastState.NOTIFICATION,
                `You receved a message from ${data.data.name}"`,
                5000,
                [
                    { text: 'view', action: showChat },
                ]
            );
        }
    }

    public static getInstance(): ChatManager {
        if (!ChatManager.instance) {
            ChatManager.instance = new ChatManager();
        }
        return ChatManager.instance;
    }
    

    public openChat(chatRoomId: string, friendName: string, friendId: string): ChatComponent {
        if (this.activeChats.has(chatRoomId)) {
            const chatComponent = this.activeChats.get(chatRoomId); 
            if (chatComponent) {
                this.focusChat(chatRoomId);
                return chatComponent;
            }
        }

        // console.log('friendId is empty ', friendId);
        
        if (friendId === '') {
            // create group chat
            const chatComponent = new ChatComponent(chatRoomId, friendId, friendName, this.chatSocket);
            this.activeChats.set(chatRoomId, chatComponent);
    
            this.createTab(chatRoomId, friendName);
    
            chatComponent.render(document.body);
            chatComponent.getMessages();
            chatComponent.isUserBlocked();
            this.updateChatPositions();
            return chatComponent;

        } else {
            const chatComponent = new ChatComponent(chatRoomId, friendId, friendName, this.chatSocket);
            this.activeChats.set(chatRoomId, chatComponent);
    
            this.createTab(chatRoomId, friendName);
    
            chatComponent.render(document.body);
            chatComponent.getMessages();
            chatComponent.isUserBlocked();
            this.updateChatPositions();
            return chatComponent;
        }

    }

    private createTab(chatRoomId: string, friendName: string): void {
        const tab = document.createElement('button');
        tab.textContent = friendName; // name of the ChatTab
        tab.className = 'px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 text-left';
        tab.onclick = () => this.toggleChat(chatRoomId);
        tab.dataset.chatRoomId = chatRoomId;
        this.tabContainer.appendChild(tab);
    }

    private focusChat(chatRoomId: string): void {
        this.activeChats.forEach((chat, id) => {
            if (id === chatRoomId) {
                chat.chatWindow.style.zIndex = '1000';
            } else {
                chat.chatWindow.style.zIndex = '999';
            }
        });
    }

    public closeChat(chatRoomId: string): void {
        const chat = this.activeChats.get(chatRoomId);
        if (chat) {
            this.activeChats.delete(chatRoomId);

            const tab = this.tabContainer.querySelector(`button[data-chat-room-id="${chatRoomId}"]`);
            if (tab) {
                tab.remove();
            }

            this.updateChatPositions();
        }
    }

    public closeAllChats(): void {
        this.activeChats.forEach((chat, chatRoomId) => {
            chat.chatWindow.remove();
        });
        this.activeChats.clear();
    
        this.tabContainer.innerHTML = '';
    }

    public cleanup(): void {
        this.closeAllChats();
        if (this.tabContainer.parentElement) {
            this.tabContainer.remove();
        }
        ChatManager.instance = null;
    }

    private updateChatPositions(): void {
        const chatWidth = 400;
        let rightOffset = 16;

        Array.from(this.activeChats.values())
            .filter((chat) => chat.chatWindow.style.display !== 'none')
            .reverse()
            .forEach((chat) => {
                chat.chatWindow.style.right = `${rightOffset}px`;
                chat.chatWindow.style.bottom = '60px';
                rightOffset += chatWidth + 16;
            });
    }

    private toggleChat(chatRoomId: string): void {
        const chat = this.activeChats.get(chatRoomId);
        if (chat) {
            if (chat.chatWindow.style.display === 'none') {
                chat.chatWindow.style.display = 'block';
            } else {
                chat.chatWindow.style.display = 'none';
            }
            this.updateChatPositions();
        }
    }

    public getChatComponent(chatRoomId: string): ChatComponent | undefined {
        return this.activeChats.get(chatRoomId);
    }
}

export default ChatManager;