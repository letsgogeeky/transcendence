import ChatComponent from './ChatComponent';
import State from '../services/state';

import { endpoints } from '../services/send-request';

export class ChatManager {
    private static instance: ChatManager | null = null;
    private activeChats: Map<string, ChatComponent> = new Map();
    private tabContainer: HTMLElement;
    private chatSocket: WebSocket | null = null;

    private constructor() {
        this.tabContainer = document.createElement('div');
        this.tabContainer.className = 'fixed bottom-0 left-0 w-full bg-gray-800 text-white flex flex-row-reverse space-x-2 p-2 overflow-x-auto';
        document.body.appendChild(this.tabContainer);
        this.initializeChatSocket();
        console.log('constructor chatManager:');
    }

    private initializeChatSocket(): void {
        const token = State.getState().getAuthToken();
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

    private handleIncomingMessage(data: any): void {
        // check which chat room the message is for
        console.log('Incoming message:', data);
        const chatRoomId = data.data.chatRoomId;
        console.log('Target chatRoomId:', chatRoomId);
        // check if the chat room is open
        if (this.activeChats.has(chatRoomId)) {
            const chatComponent = this.activeChats.get(chatRoomId);
            console.log('Target chatRoomId: open');

            if (chatComponent) {
                if (data.type === 'chatMessage') {
                    chatComponent.displayMessage(data.content, data.name);
                } else if (data.type === 'chatHistory') {
                    data.data.forEach((message: any) => {
                        const senderName =
                            message.userId === State.getState().getCurrentUser()?.id
                                ? 'You'
                                : message.name;
                        chatComponent.displayMessage(message.content, senderName);
                    });
                }
            }
        }
   
   
   
   
   
   
   
   
        //     const { chatRoomId, type, content, name } = data;

    //     // Find the relevant chat component
    //     const chatComponent = this.activeChats.get(chatRoomId);
    //     if (chatComponent) {
    //         if (type === 'chatMessage') {
    //             chatComponent.displayMessage(content, name);
    //         } else if (type === 'chatHistory') {
    //             data.data.forEach((message: any) => {
    //                 const senderName =
    //                     message.userId === State.getState().getCurrentUser()?.id
    //                         ? 'You'
    //                         : message.name;
    //                 chatComponent.displayMessage(message.content, senderName);
    //             });
    //         }
    //         // Handle other message types if needed
    //     } else {
    //         console.warn(`No active chat found for chatRoomId: ${chatRoomId}`);
    //     }
    }

    public static getInstance(): ChatManager {
        if (!ChatManager.instance) {
            ChatManager.instance = new ChatManager();
        }
        return ChatManager.instance;
    }

    public openChat(chatRoomId: string, friendName: string, friendId: string): void {
        if (this.activeChats.has(chatRoomId)) {
            this.focusChat(chatRoomId);
            return;
        }

        const chatComponent = new ChatComponent(chatRoomId, friendName, this.chatSocket);
        this.activeChats.set(chatRoomId, chatComponent);

        this.createTab(chatRoomId, friendName);

        chatComponent.render(document.body);

        this.updateChatPositions();
    }

    private createTab(chatRoomId: string, friendName: string): void {
        const tab = document.createElement('button');
        tab.textContent = friendName;
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
}

export default ChatManager;