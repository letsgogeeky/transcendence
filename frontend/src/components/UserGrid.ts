import { endpoints } from '../services/send-request';
import AvatarImage from './AvatarImage';
import Button from './Button';
import Component from './Component';
import LinkComponent from './Link';
import createStatusPill from './StatusPill';

export default class UserGridComponent extends Component {
    readonly element: HTMLElement;
    users: any[];
    title: string;
    actions: { callback: (id: string) => void; label: string }[];
    data: any[];
    showOnlineStatus: boolean;

    constructor(
        label: string,
        users: any[],
        data: any[] = [],
        actions: { callback: (id: string) => void; label: string }[] = [],
        showOnlineStatus: boolean = false,
        className: string = 'py-6',
    ) {
        super(className);
        this.element = document.createElement('div');
        this.users = users;
        this.data = data.length ? data : [...users];
        this.title = label;
        this.actions = actions;
        this.showOnlineStatus = showOnlineStatus;
    }

    private displayUser(
        user: any,
        actions: { callback: (id: string) => void; label: string }[],
        data: any,
    ) {
        const listElement = document.createElement('li');
        listElement.className = 'flex flex-col items-center space-y-2';

        const avatar = new AvatarImage(
            user.name,
            endpoints.auth + '/' + user.avatarUrl!,
            `/profile?userId=${user.id}`,
        );
        if (this.showOnlineStatus)
            avatar.element.appendChild(
                createStatusPill(user.isOnline ? 'online' : 'offline'),
            );

        const gridContainer = document.createElement('div');
        gridContainer.className = 'w-full text-center';

        const title = document.createElement('div');
        title.className = 'w-full text-center font-semibold';
        const link = new LinkComponent(user.name, `/profile?userId=${user.id}`);
        title.appendChild(link.element);

        gridContainer.appendChild(title);
        listElement.appendChild(avatar.element);
        actions.forEach((action) => {
            const actionButton = new Button(
                action.label,
                function () {
                    action.callback(data);
                },
                `px-3 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-700 active:scale-95 transition`,
            );
            gridContainer.appendChild(actionButton.element);
        });
        listElement.appendChild(gridContainer);

        return listElement;
    }

    private createUserList() {
        const friendsList = document.createElement('ul');
        if (this.users.length) {
            const userElements = this.users.map((user, i) =>
                this.displayUser(
                    user,
                    this.actions,
                    this.data.length ? this.data[i] : null,
                ),
            );
            document.createElement('ul');
            friendsList.className = 'grid sm:grid-cols-4 lg:grid-cols-5 gap-4';
            userElements.forEach((user: HTMLLIElement) =>
                friendsList.appendChild(user),
            );
        } else friendsList.append('[empty list]');

        return friendsList;
    }

    public render(parent: HTMLElement | Component): void {
        this.element.innerHTML = '';
        const titleElement = document.createElement('h1');
        titleElement.innerHTML = this.title;
        this.element.append(titleElement);
        const list = this.createUserList();
        this.element.append(list);
        super.render(parent);
    }
}
