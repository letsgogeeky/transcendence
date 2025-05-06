import Component from "../components/Component";
import { Services } from "../services/send-request";
import State from "../services/state";
import sendRequest from "../services/send-request";
import ErrorComponent from "./error";
import { loadImage } from "../styles/background";
import { IconLinkComponent } from '../components/Link';

interface Tournament {
    id: string;
    name: string;
    status?: string;
    options: {
        winCondition: string;
        limit: string;
    };
    participants: any[];
    adminId: string; // ID of the user who created the tournament
}

interface User {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
}

type TournamentFilter = 'all' | 'my' | 'admin';

export default class TournamentsComponent extends Component {
    readonly element: HTMLElement;
    private tournaments: Tournament[] = [];
    private currentFilter: TournamentFilter = 'all';
    private currentUserId: string | null = null;
    private userCache: Map<string, User> = new Map();
    private isRendering: boolean = false;

    constructor() {
		super();
		this.element = document.createElement('div');
		this.element.className = 'relative flex flex-col items-center justify-center min-h-screen';  // Add 'relative' class for absolute positioning
	
		const createTournLink = new IconLinkComponent('home', 'create-tournament', 'h-6 transition-transform duration-300 ease-in-out hover:scale-110 hover:opacity-80');
		createTournLink.render(this.element);

		const title = document.createElement('h1');
		title.textContent = 'Tournaments';
		title.className = 'text-sm font-semibold text-white';  // Title styling
	
		this.element.appendChild(createTournLink.element);
		this.element.appendChild(title);
	
		// this.element = container;
		this.currentUserId = State.getState().getCurrentUser()?.id || null;
	
		// Initialize filter from URL
		const params = new URLSearchParams(window.location.search);
		this.currentFilter = (params.get('filter') as TournamentFilter) || 'all';
    }

    private async getUser(userId: string): Promise<User> {
        if (userId === null || userId === undefined || userId === '') {
            return {
                id: 'unknown',
                name: 'Unknown',
                email: 'unknown',
                avatarUrl: null,
            };
        }
        if (this.userCache.has(userId)) {
            return this.userCache.get(userId)!;
        }

        const response = await sendRequest(
            `/users/${userId}`,
            'GET',
            null,
            Services.AUTH,
        );
        const user = await response.json();
        this.userCache.set(userId, user);
        return user;
    }

    private async loadData(): Promise<void> {
        try {
            const response = await sendRequest(
                '/tournament',
                'GET',
                null,
                Services.TOURNAMENTS,
            );
            const responseData = await response.json();
            this.tournaments = responseData.tournaments;
        } catch (error) {
            console.error('Failed to load tournaments:', error);
            throw error;
        }
    }

    private createFilterUI(parent: HTMLElement | Component): HTMLElement {
        const filterContainer = document.createElement('div');
        filterContainer.className = 'mb-8 flex gap-4';

        const allButton = document.createElement('button');
        allButton.textContent = 'All Tournaments';
        allButton.className = `px-4 py-2 rounded-lg transition-colors ${this.currentFilter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`;

        const myButton = document.createElement('button');
        myButton.textContent = 'My Tournaments';
        myButton.className = `px-4 py-2 rounded-lg transition-colors ${this.currentFilter === 'my'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`;

        const adminButton = document.createElement('button');
        adminButton.textContent = 'Tournaments I Admin';
        adminButton.className = `px-4 py-2 rounded-lg transition-colors ${this.currentFilter === 'admin'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`;

        allButton.addEventListener('click', (evt) => {
            evt.preventDefault();
            this.currentFilter = 'all';
            const params = new URLSearchParams(window.location.search);
            params.set('filter', 'all');
            window.history.pushState({}, '', `?${params.toString()}`);
            // refresh this component
            this.render(parent);
        });

        myButton.addEventListener('click', (evt) => {
            evt.preventDefault();
            this.currentFilter = 'my';
            const params = new URLSearchParams(window.location.search);
            params.set('filter', 'my');
            window.history.pushState({}, '', `?${params.toString()}`);
            // refresh this component
            this.render(parent);
        });

        adminButton.addEventListener('click', (evt) => {
            evt.preventDefault();
            this.currentFilter = 'admin';
            const params = new URLSearchParams(window.location.search);
            params.set('filter', 'admin');
            window.history.pushState({}, '', `?${params.toString()}`);
            // refresh this component
            this.render(parent);
        });

        filterContainer.append(allButton, myButton, adminButton);
        return filterContainer;
    }

    private getFilteredTournaments(): Tournament[] {
        if (this.currentFilter === 'all' || !this.currentUserId) {
            return this.tournaments;
        }

        if (this.currentFilter === 'admin') {
            return this.tournaments.filter(tournament =>
                tournament.adminId === this.currentUserId
            );
        }

        // 'my' filter - tournaments where user is a participant
        return this.tournaments.filter(tournament =>
            tournament.participants.some(participant => participant.userId === this.currentUserId)
        );
    }

    private async createTournamentCard(tournament: Tournament, parent: HTMLElement) {
        const card = document.createElement('div');
        card.className = 'bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer border border-gray-700';

        const header = document.createElement('div');
        header.className = 'flex justify-between items-center mb-6';

        const titleContainer = document.createElement('div');
        titleContainer.className = 'flex items-center gap-3';

        const title = document.createElement('h3');
        title.className = 'text-xl font-bold text-white';
        title.textContent = tournament.name;

        const statusBadge = document.createElement('span');
        statusBadge.className = `px-3 py-1 rounded-full text-sm font-medium ${
            tournament.status === 'in progress' ? 'bg-blue-600 text-white' :
            tournament.status === 'pending' ? 'bg-yellow-600 text-white' :
            tournament.status === 'finished' ? 'bg-green-600 text-white' :
            'bg-gray-600 text-white'
        }`;
        statusBadge.textContent = tournament.status?.toUpperCase() || 'NOT STARTED';

        titleContainer.append(title, statusBadge);

        const actions = document.createElement('div');
        actions.className = 'flex gap-2';
        // Only show star and delete buttons if user is admin
        if (tournament.adminId === this.currentUserId) {
            const starButton = document.createElement('button');
            starButton.className = 'p-2 text-yellow-500 hover:text-yellow-400 transition-colors';
            starButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>';

            const deleteButton = document.createElement('button');
            deleteButton.className = 'p-2 text-red-500 hover:text-red-400 transition-colors';
            deleteButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>';

            deleteButton.addEventListener('click', async (evt) => {
                evt.preventDefault();
                evt.stopPropagation();
                if (confirm('Are you sure you want to delete this tournament? This action cannot be undone.')) {
                    try {
                        const response = await sendRequest(
                            `/tournament/${tournament.id}`,
                            'DELETE',
                            null,
                            Services.TOURNAMENTS,
                            State.getState().getAuthToken()
                        );
                        if (response.ok) {
                            await this.loadData();
                            this.render(this.element);
                        }
                    } catch (error) {
                        console.error('Error deleting tournament:', error);
                    }
                }
            });
            actions.append(starButton, deleteButton);
        }

        header.append(titleContainer, actions);
        const details = document.createElement('div');
        details.className = 'grid grid-cols-2 gap-4 text-white';

        const status = document.createElement('div');
        status.className = 'flex flex-col';
        status.innerHTML = `
            <span class="text-xs uppercase tracking-wider font-semibold text-gray-400">Status</span>
            <span class="text-lg font-medium">${tournament.status || 'Not Started'}</span>
        `;

        const winCondition = document.createElement('div');
        winCondition.className = 'flex flex-col';
        winCondition.innerHTML = `
            <span class="text-xs uppercase tracking-wider font-semibold text-gray-400">Win Condition</span>
            <span class="text-lg font-medium">${tournament.options.winCondition}</span>
        `;

        const limit = document.createElement('div');
        limit.className = 'flex flex-col';
        limit.innerHTML = `
            <span class="text-xs uppercase tracking-wider font-semibold text-gray-400">Limit</span>
            <span class="text-lg font-medium">${tournament.options.limit}</span>
        `;

        const participants = document.createElement('div');
        participants.className = 'flex flex-col';
        participants.innerHTML = `
            <span class="text-xs uppercase tracking-wider font-semibold text-gray-400">Participants</span>
            <span class="text-lg font-medium">${tournament.participants.length}</span>
        `;

        const admin = document.createElement('div');
        admin.className = 'flex flex-col';
        try {
            const adminUser = await this.getUser(tournament.adminId || '');
            admin.innerHTML = `
                <span class="text-xs uppercase tracking-wider font-semibold text-gray-400">Admin</span>
                <div class="flex items-center gap-2">
                    ${adminUser.avatarUrl ? `<img src="${adminUser.avatarUrl}" alt="${adminUser.name}" class="w-6 h-6 rounded-full">` : ''}
                    <span class="text-lg font-medium">${adminUser.name}</span>
                </div>
            `;
        } catch (error) {
            console.error('Failed to fetch admin user:', error);
            admin.innerHTML = `
                <span class="text-xs uppercase tracking-wider font-semibold text-gray-400">Admin</span>
                <span class="text-lg font-medium text-gray-500">Unknown</span>
            `;
        }

        details.append(status, winCondition, limit, participants, admin);

        card.append(header, details);

        card.addEventListener('click', (evt) => {
            evt.preventDefault();
            window.history.pushState({}, '', `/tournament?tournamentId=${tournament.id}`);
            window.dispatchEvent(new PopStateEvent('popstate'));
            this.render(parent);
        });

        return card;
    }

    public async render(parent: HTMLElement | Component): Promise<void> {
        if (this.isRendering) return;
        this.isRendering = true;
        try {
            this.element.innerHTML = '';
			this.element.className = 'relative flex flex-col items-center justify-center min-h-screen';

			const createTournLink = new IconLinkComponent('create_button', 'create-tournament', 'absolute top-12 right-10 h-24 transition-transform duration-300 ease-in-out hover:scale-110 hover:opacity-80');
			createTournLink.render(this.element);

			const title = document.createElement('h1');
			title.textContent = 'Tournaments';
			// title.className = 'text-sm font-semibold text-white';  // Title styling
            title.className = 'text-3xl font-bold mb-8 text-white';
		
			this.element.appendChild(createTournLink.element);
			this.element.appendChild(title);
            // this.element.append(title);

            // Add filter UI
            this.element.append(this.createFilterUI(parent));

            const container = document.createElement('div');
            container.className = 'w-full max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-6';

            // Show loading state
            const loadingState = document.createElement('div');
            loadingState.className = 'col-span-full text-center text-gray-400 py-8';
            loadingState.textContent = 'Loading tournaments...';
            container.append(loadingState);
            this.element.append(container);

            // Load data and update UI
            await this.loadData();
            container.innerHTML = ''; // Clear loading state

            const filteredTournaments = this.getFilteredTournaments();
            if (filteredTournaments.length === 0) {
                const emptyState = document.createElement('div');
                emptyState.className = 'col-span-full text-center text-gray-400 py-8';
                emptyState.textContent = this.currentFilter === 'my'
                    ? 'You are not participating in any tournaments'
                    : this.currentFilter === 'admin'
                        ? 'You are not an admin of any tournaments'
                        : 'No tournaments available';
                container.append(emptyState);
            } else {
                for (const tournament of filteredTournaments) {
                    const card = await this.createTournamentCard(tournament, container);
                    container.append(card);
                }
            }

            this.element.append(container);
        } catch (error) {
            console.error('Failed to load tournaments', error);
            const errorComponent = new ErrorComponent('Failed to load tournaments');
            errorComponent.render(this.element);
        } finally {
            this.isRendering = false;
        }

        super.render(parent);
    }
} 