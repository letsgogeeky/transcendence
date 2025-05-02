import Component from '../components/Component';
import State from '../services/state';
import sendRequest, { endpoints, Services } from '../services/send-request';


export default class GroupChatPage extends Component {
    public element: HTMLElement;
    private groupListContainer: HTMLElement;
    private chatContainer: HTMLElement;
    private findGroupsContainer: HTMLElement;
    private chatMessages!: HTMLElement;
    private messageInput!: HTMLInputElement;
    private sendButton!: HTMLButtonElement;
    private socket: WebSocket | null = null;

    constructor() {
        super();
        this.element = document.createElement('div');
        this.element.className = 'flex h-screen bg-gray-900 text-white';

        // Left Section: Group List
        this.groupListContainer = document.createElement('div');
        this.groupListContainer.className = 'w-1/4 p-4 bg-gray-800 overflow-y-auto';
        this.setupGroupListUI();

        // Middle Section: Chat
        this.chatContainer = document.createElement('div');
        this.chatContainer.className = 'flex-1 flex flex-col p-4 bg-gray-900';
        this.setupChatUI();

        // Right Section: Find New Groups
        this.findGroupsContainer = document.createElement('div');
        this.findGroupsContainer.className = 'w-1/4 p-4 bg-gray-800 overflow-y-auto';
        this.setupFindGroupsUI();

        this.element.append(this.groupListContainer, this.chatContainer, this.findGroupsContainer);
        this.socket = this.getChatSocket();
    }

    private setupGroupListUI(): void {
        const title = document.createElement('h2');
        title.textContent = 'Your Groups';
        title.className = 'text-xl font-bold mb-4';

        const groupList = document.createElement('div');
        groupList.className = 'flex flex-col gap-2';

        // test group
        const groupItem = document.createElement('div');
        groupItem.textContent = `test`;
        groupItem.className = 'p-2 bg-gray-700 rounded cursor-pointer hover:bg-gray-600';
        groupList.appendChild(groupItem);

        this.groupListContainer.append(title, groupList);
    }

    private setupChatUI(): void {
        const title = document.createElement('h2');
        title.textContent = 'Group Chat';
        title.className = 'text-xl font-bold mb-4';

        // Chat messages container
        this.chatMessages = document.createElement('div');
        this.chatMessages.className = 'flex-1 p-4 bg-gray-800 rounded-lg overflow-y-auto';
        this.chatMessages.style.height = '400px';

        // Input container
        const inputContainer = document.createElement('div');
        inputContainer.className = 'flex gap-2 mt-4';

        // Message input
        this.messageInput = document.createElement('input');
        this.messageInput.type = 'text';
        this.messageInput.placeholder = 'Type a message...';
        this.messageInput.className = 'flex-1 p-2 rounded bg-gray-700 text-white';

        // Send button
        this.sendButton = document.createElement('button');
        this.sendButton.textContent = 'Send';
        this.sendButton.className = 'px-4 py-2 bg-blue-500 rounded hover:bg-blue-600';
        this.sendButton.onclick = () => this.sendMessage();

        // Append input and button to the input container
        inputContainer.append(this.messageInput, this.sendButton);

        // Append all elements to the chat container
        this.chatContainer.append(title, this.chatMessages, inputContainer);
    }

    private setupFindGroupsUI(): void {
        const title = document.createElement('h2');
        title.textContent = 'Find New Groups';
        title.className = 'text-xl font-bold mb-4';

        // Placeholder for finding groups
        const findGroupsList = document.createElement('div');
        findGroupsList.className = 'flex flex-col gap-2';

        // test
        const groupItem = document.createElement('div');
        groupItem.textContent = `test Item`;
        groupItem.className = 'p-2 bg-gray-700 rounded cursor-pointer hover:bg-gray-600';
        findGroupsList.appendChild(groupItem);

        this.findGroupsContainer.append(title, findGroupsList);
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
                    // this.socket?.send(
                    //     JSON.stringify({
                    //         type: 'chatMessage',
                    //         chatRoomId: this.chatRoomId,
                    //         userId: this.chatRoomId,
                    //         content: message,
                    //         name: myName,
                        // }),
                    // );
                    
                    // sendMessage(this.chatRoomId, message);
                    this.messageInput.value = '';
                } catch (error) {
                    console.error('Error sending message:', error);
                }
            }
        }

    private displayMessage(message: string, sender: string): void {
        const messageElement = document.createElement('div');
        messageElement.className = 'p-2 bg-gray-700 rounded mb-2';
        // messageElement.className = 'p-2 bg-gray-700 rounded break-words max-w-full';

        messageElement.textContent = `${sender}: ${message}`;
        this.chatMessages.appendChild(messageElement);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    private getChatSocket(): WebSocket {
            const token = State.getState().getAuthToken();
            const socket = new WebSocket(`${endpoints.chatSocket}?token=${token}`, 'wss');
    
            socket.onopen = () => {
                console.log('Chat socket connected');
            };
    
            socket.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
    
            socket.onclose = (event) => {
                console.log('Chat socket closed:', event.reason);
            };
    
            return socket;
    }
}