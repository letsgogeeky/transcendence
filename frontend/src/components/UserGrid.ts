import { endpoints } from '../services/send-request';
import AvatarImage from './AvatarImage';
import Button from './button';
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
        const card = document.createElement('div');
        card.className = 'bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-700';

        // Avatar container with status
        const avatarContainer = document.createElement('div');
        avatarContainer.className = 'relative mb-4';

        const avatar = new AvatarImage(
            user.name,
            user.avatarUrl!,
            `/profile?userId=${user.id}`,
        );
        avatar.element.className = 'w-20 h-20 rounded-full object-cover border-4 border-gray-700 shadow-md overflow-hidden';
        if (this.showOnlineStatus) {
            const statusPill = createStatusPill(user.isOnline ? 'online' : 'offline');
            statusPill.className += ' absolute bottom-0 right-0';
            avatarContainer.appendChild(statusPill);
        }
        avatarContainer.appendChild(avatar.element);

        // User info container
        const infoContainer = document.createElement('div');
        infoContainer.className = 'text-center space-y-2';

        const nameLink = new LinkComponent(user.name, `/profile?userId=${user.id}`);
        nameLink.element.className = 'text-lg font-bold text-white hover:text-purple-400 transition-colors duration-200';
        infoContainer.appendChild(nameLink.element);

        // Actions container
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'flex flex-col space-y-2 w-full mt-4';

        actions.forEach((action) => {
            const actionButton = new Button(
                action.label,
                function () {
                    action.callback(data);
                },
                `w-full px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    action.label.toLowerCase().includes('decline') || action.label.toLowerCase().includes('unfriend')
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : action.label.toLowerCase().includes('confirm')
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`,
            );
            actionsContainer.appendChild(actionButton.element);
        });

        card.appendChild(avatarContainer);
        card.appendChild(infoContainer);
        card.appendChild(actionsContainer);

        return card;
    }

    private createUserList() {
        const grid = document.createElement('div');
        if (this.users.length) {
            grid.className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6';
            const userElements = this.users.map((user, i) =>
                this.displayUser(
                    user,
                    this.actions,
                    this.data.length ? this.data[i] : null,
                ),
            );
            userElements.forEach((user: HTMLDivElement) => grid.appendChild(user));
        } else {
            const emptyMessage = document.createElement('p');
            emptyMessage.className = 'text-gray-400 text-center py-4';
            emptyMessage.textContent = 'No users found';
            grid.appendChild(emptyMessage);
        }

        return grid;
    }

    public render(parent: HTMLElement | Component): void {
        this.element.innerHTML = '';
        const titleElement = document.createElement('h2');
        titleElement.className = 'text-2xl font-bold text-white mb-6';
        titleElement.textContent = this.title;
        this.element.appendChild(titleElement);
        const grid = this.createUserList();
        this.element.appendChild(grid);
        super.render(parent);
    }
}
