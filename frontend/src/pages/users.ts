import Component from '../components/Component';
import FormComponent from '../components/Form/Form';
import Input from '../components/Form/Input';
import UserGridComponent from '../components/UserGrid';
import sendRequest, { Services } from '../services/send-request';
import State from '../services/state';
import ErrorComponent from './error';

export default class UsersPageComponent extends Component {
    readonly element: HTMLElement;

    async fetchData() {
        const withRelationsResponse = await sendRequest(
            '/users-with-relations',
            'GET',
            null,
            Services.AUTH,
        );
        let data = await withRelationsResponse.json();
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

    public render(parent: HTMLElement | Component): void {
        State.getState()
            .getAuthSocket()
            ?.addEventListener('message', (event) => {
                const data = JSON.parse(event.data);
                if (data.type == 'FRIEND_REQUEST') {
                    if (data.data.status == 'DELETED') {
                        this.data = this.data.map((d: any) =>
                            d.request?.id == data.data.id
                                ? { ...d, request: null }
                                : d,
                        );
                    } else if (data.data.status == 'ACCEPTED') {
                        this.data = this.data.map((d: any) =>
                            d.request?.id == data.data.id
                                ? { ...d, request: data.data }
                                : d,
                        );
                    } else if (data.data.status == 'PENDING') {
                        this.data = this.data.map((d: any) =>
                            d.user.id == data.data.sender ||
                            (d.user.id == data.data.receiver &&
                                data.data.sender ==
                                    State.getState().getCurrentUser()!.id)
                                ? { ...d, request: data.data }
                                : d,
                        );
                    }
                    this.render(this.parent);
                }
            });

        this.element.innerHTML = '';
        const userSearchInput = new Input(
            'Search for user',
            'text',
            'searchname',
            true,
            'username',
        );
        const form = new FormComponent(
            'Search',
            [userSearchInput],
            (data) =>
                sendRequest(
                    `/users-with-relations/search?username=${data.searchname}`,
                    'GET',
                    null,
                    Services.AUTH,
                ),
            this.setUsers.bind(this),
        );
        form.className = 'flex flex-col gap-4 w-64';
        form.render(this.element);
        if (!this.data) {
            const loading = new ErrorComponent('Loading....');
            loading.render(this.element);
        } else if (this.data.error) {
            const error = new ErrorComponent(this.data.error);
            error.render(this.element);
        } else {
            const related = this.data.filter((data: any) => data.request);
            const strangerUsers = this.data.filter(
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
            const friendList = new UserGridComponent(
                'Friends',
                friends.map((rel: any) => rel.user),
                friends,
                [
                    {
                        callback: this.declineRequest,
                        label: 'Unfriend',
                    },
                ],
            );
            const pendingReceived = new UserGridComponent(
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
            const pendingSent = new UserGridComponent(
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
            const strangers = new UserGridComponent(
                'People you might know',
                strangerUsers.map((rel: any) => rel.user),
                strangerUsers,
                [
                    {
                        callback: this.sendFriendRequest,
                        label: 'Add Friend',
                    },
                ],
            );
            if (friends.length) friendList.render(this.element);
            if (pendingSentReq.length) pendingSent.render(this.element);
            if (pendingReceivedReq.length) pendingReceived.render(this.element);
            if (strangerUsers.length) strangers.render(this.element);
        }
        super.render(parent);
    }

    private setUsers(data: any): void {
        this.data = data;
        this.render(this.parent);
    }
}
