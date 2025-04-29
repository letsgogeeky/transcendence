import Component from '../components/Component';
import FormComponent from '../components/Form/Form';
import Input from '../components/Form/Input';
import UserGridComponent from '../components/UserGrid';
import sendRequest, { endpoints, Services } from '../services/send-request';
import State from '../services/state';
import ErrorComponent from './error';
import ChatComponent from '../components/ChatComponent';


export default class UsersPageComponent extends Component {
    readonly element: HTMLElement;
    private allUsers: any[] = [];
    private filteredUsers: any[] = [];
    private friendList: UserGridComponent | null = null;
    private pendingReceived: UserGridComponent | null = null;
    private pendingSent: UserGridComponent | null = null;
    private strangers: UserGridComponent | null = null;
    private userListsContainer: HTMLElement | null = null;
    private chatSocket: WebSocket | null = null;

    async fetchData() {
        const withRelationsResponse = await sendRequest(
            '/users-with-relations',
            'GET',
            null,
            Services.AUTH,
        );
        let data = await withRelationsResponse.json();
        this.allUsers = data;
        this.filteredUsers = data;
        return data;
    }

    constructor() {
        super();
        this.element = document.createElement('div');
        const errorText = document.createElement('p');
        errorText.textContent = 'users';
        this.element.appendChild(errorText);
    }

    private sendFriendRequest(userData: any) {
        if (!userData.request) {
            const friendRequestData = {
                receiverId: userData.user.id,
                senderId: State.getState().getCurrentUser()!.id,
            };
            sendRequest(
                '/friend-requests',
                'POST',
                friendRequestData,
                Services.AUTH,
            );
        }
    }

    private acceptRequest(data: any) {
        sendRequest(
            `/friend-requests/${data.request.id}/accept`,
            'PUT',
            null,
            Services.AUTH,
        );
    }

    private declineRequest(data: any) {
        sendRequest(
            `/friend-requests/${data.request.id}/delete`,
            'PUT',
            null,
            Services.AUTH,
        );
    }

    private filterUsers(searchTerm: string) {
        if (!searchTerm) {
            this.filteredUsers = this.allUsers;
        } else {
            const term = searchTerm.toLowerCase();
            this.filteredUsers = this.allUsers.filter(userData =>
                userData.user.name.toLowerCase().includes(term)
            );
        }
        this.updateUserLists();
    }

    private updateUserLists() {
        if (!this.userListsContainer) return;

        this.userListsContainer.innerHTML = '';

        if (!this.filteredUsers) {
            const loading = new ErrorComponent('Loading....');
            loading.render(this.userListsContainer);
            return;
        }

        if (Array.isArray(this.filteredUsers) && this.filteredUsers.length === 0) {
            const noResults = new ErrorComponent('No users found');
            noResults.render(this.userListsContainer);
            return;
        }

        const related = this.filteredUsers.filter((data: any) => data.request);
        const strangerUsers = this.filteredUsers.filter(
            (data: any) => !data.request,
        );
        const friends = related.filter(
            (data: any) => data.request.status == 'ACCEPTED',
        );
        const pendingReceivedReq = related.filter(
            (data: any) =>
                data.request.receiver ==
                    State.getState().getCurrentUser()!.id &&
                data.request.status == 'PENDING',
        );
        const pendingSentReq = related.filter(
            (data: any) =>
                data.request.sender ==
                    State.getState().getCurrentUser()!.id &&
                data.request.status == 'PENDING',
        );

        this.friendList = new UserGridComponent(
            'Friends',
            friends.map((rel: any) => rel.user),
            friends,
            [
                {
                    callback: this.declineRequest,
                    label: 'Unfriend',
                },
                {
                    callback: (friendData: any) => {
                        this.createChatWindow(friendData.user.id, friendData.user.name);
                    },
                    label: 'Chat',
                },
            ],
            true,
        );

        this.pendingReceived = new UserGridComponent(
            'Pending',
            pendingReceivedReq.map((rel: any) => rel.user),
            pendingReceivedReq,
            [
                {
                    callback: this.acceptRequest,
                    label: 'Confirm',
                },
                {
                    callback: this.declineRequest,
                    label: 'Decline',
                },
            ],
        );

        this.pendingSent = new UserGridComponent(
            'Pending',
            pendingSentReq.map((rel: any) => rel.user),
            pendingSentReq,
            [
                {
                    callback: this.declineRequest,
                    label: 'Cancel',
                },
            ],
        );

        this.strangers = new UserGridComponent(
            'People you might know',
            strangerUsers.map((rel: any) => rel.user),
            strangerUsers,
            [
                {
                    callback: this.sendFriendRequest,
                    label: 'Add Friend',
                },
                {
                    callback: (friendData: any) => {
                        this.createChatWindow(friendData.user.id, friendData.user.name);
                    },
                    label: 'Chat',
                },
            ],
        );

        if (friends.length) this.friendList.render(this.userListsContainer);
        if (pendingSentReq.length) this.pendingSent.render(this.userListsContainer);
        if (pendingReceivedReq.length) this.pendingReceived.render(this.userListsContainer);
        if (strangerUsers.length) this.strangers.render(this.userListsContainer);
    }

    public render(parent: HTMLElement | Component): void {
        if (!State.getState()?.getCurrentUser()) return;
        State.getState()
            .getAuthSocket()
            ?.addEventListener('message', (event) => {
                const data = JSON.parse(event.data);
                if (data.type == 'FRIEND_REQUEST') {
                    if (data.data.status == 'DELETED') {
                        this.allUsers = this.allUsers.map((d: any) =>
                            d.request?.id == data.data.id
                                ? { ...d, request: null }
                                : d,
                        );
                        this.filteredUsers = this.filteredUsers.map((d: any) =>
                            d.request?.id == data.data.id
                                ? { ...d, request: null }
                                : d,
                        );
                    } else if (data.data.status == 'ACCEPTED') {
                        this.allUsers = this.allUsers.map((d: any) =>
                            d.request?.id == data.data.id
                                ? { ...d, request: data.data }
                                : d,
                        );
                        this.filteredUsers = this.filteredUsers.map((d: any) =>
                            d.request?.id == data.data.id
                                ? { ...d, request: data.data }
                                : d,
                        );
                    } else if (data.data.status == 'PENDING') {
                        this.allUsers = this.allUsers.map((d: any) =>
                            d.user.id == data.data.sender ||
                            (d.user.id == data.data.receiver &&
                                data.data.sender ==
                                    State.getState().getCurrentUser()!.id)
                                ? { ...d, request: data.data }
                                : d,
                        );
                        this.filteredUsers = this.filteredUsers.map((d: any) =>
                            d.user.id == data.data.sender ||
                            (d.user.id == data.data.receiver &&
                                data.data.sender ==
                                    State.getState().getCurrentUser()!.id)
                                ? { ...d, request: data.data }
                                : d,
                        );
                    }
                }

                if (data.type == 'LOGOUT') {
                    console.log(JSON.stringify(data));
                    this.allUsers = this.allUsers.map((d: any) =>
                        d.user?.id == data.id
                            ? { ...d, user: { ...d.user, isOnline: false } }
                            : d,
                    );
                    this.filteredUsers = this.filteredUsers.map((d: any) =>
                        d.user?.id == data.id
                            ? { ...d, user: { ...d.user, isOnline: false } }
                            : d,
                    );
                } else if (data.type == 'LOGIN') {
                    console.log(JSON.stringify(data));
                    this.allUsers = this.allUsers.map((d: any) =>
                        d.user?.id == data.id
                            ? { ...d, user: { ...d.user, isOnline: true } }
                            : d,
                    );
                    this.filteredUsers = this.filteredUsers.map((d: any) =>
                        d.user?.id == data.id
                            ? { ...d, user: { ...d.user, isOnline: true } }
                            : d,
                    );
                }
                this.updateUserLists();
            });

        this.element.innerHTML = '';

        // Create page title
        const titleContainer = document.createElement('div');
        titleContainer.className = 'text-center mb-8';
        const title = document.createElement('h1');
        title.className = 'text-3xl font-bold text-white';
        title.textContent = 'Pong Users';
        titleContainer.appendChild(title);
        this.element.appendChild(titleContainer);

        // Create search container
        const searchContainer = document.createElement('div');
        searchContainer.className = 'flex justify-center mb-6 w-full';

        // Create search input wrapper
        const searchWrapper = document.createElement('div');
        searchWrapper.className = 'w-full max-w-md';

        // Create search input
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search users...';
        searchInput.className = 'w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors';

        // Add input event listener for real-time filtering
        searchInput.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            this.filterUsers(target.value);
        });

        searchWrapper.appendChild(searchInput);
        searchContainer.appendChild(searchWrapper);
        this.element.appendChild(searchContainer);

        // Create container for user lists
        this.userListsContainer = document.createElement('div');
        this.element.appendChild(this.userListsContainer);

        this.updateUserLists();
        super.render(parent);
    }

    private setUsers(data: any): void {
        this.allUsers = data;
        this.filteredUsers = data;
        this.updateUserLists();
    }

    private createChatWindow(friendId: string, friendName: string): void {
         // connect to webscoket
         const token = State.getState().getAuthToken();
         this.chatSocket = new WebSocket(`${endpoints.chatSocket}?token=${token}`, 'wss');
         this.chatSocket.onopen = () => {
             console.log('Chat socket connected');
                // this.chatSocket?.send(
                //     JSON.stringify({
                //         type: 'chatRoom',
                //         data: {
                //             userId: State.getState().getCurrentUser()!.id,
                //             friendId: friendId,
                //         },
                //     }),
                // );
         };
         this.chatSocket.onclose = () => {
             console.log('Chat socket closed');
         };
         // fetch chat history
        const chatComponent = new ChatComponent(friendId, friendName, this.chatSocket);
        chatComponent.render(document.body);
       
    }
}
