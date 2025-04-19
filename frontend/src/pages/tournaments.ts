import Component from "../components/Component";
import { Services } from "../services/send-request";
import State from "../services/state";
import sendRequest from "../services/send-request";
import ErrorComponent from "./error";

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
        const container = document.createElement('div');
        container.className = 'flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-800';
        const title = document.createElement('h1');
        title.textContent = 'Tournaments';
        title.className = 'text-3xl font-bold mb-8 text-white';
        this.element = container;
        container.append(title);
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

    private createFilterUI(): HTMLElement {
        const filterContainer = document.createElement('div');
        filterContainer.className = 'mb-8 flex gap-4';

        const allButton = document.createElement('button');
        allButton.textContent = 'All Tournaments';
        allButton.className = `px-4 py-2 rounded-lg transition-colors ${
            this.currentFilter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`;

        const myButton = document.createElement('button');
        myButton.textContent = 'My Tournaments';
        myButton.className = `px-4 py-2 rounded-lg transition-colors ${
            this.currentFilter === 'my'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`;

        const adminButton = document.createElement('button');
        adminButton.textContent = 'Tournaments I Admin';
        adminButton.className = `px-4 py-2 rounded-lg transition-colors ${
            this.currentFilter === 'admin'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`;

        allButton.addEventListener('click', () => {
            const params = new URLSearchParams(window.location.search);
            params.set('filter', 'all');
            window.history.pushState({}, '', `?${params.toString()}`);
            window.location.reload();
        });

        myButton.addEventListener('click', () => {
            const params = new URLSearchParams(window.location.search);
            params.set('filter', 'my');
            window.history.pushState({}, '', `?${params.toString()}`);
            window.location.reload();
        });

        adminButton.addEventListener('click', () => {
            const params = new URLSearchParams(window.location.search);
            params.set('filter', 'admin');
            window.history.pushState({}, '', `?${params.toString()}`);
            window.location.reload();
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

    private async createTournamentCard(tournament: Tournament) {
        const card = document.createElement('div');
        card.className = 'bg-gray-800 rounded-xl shadow-2xl p-6 border border-gray-700 hover:border-purple-500 transition-colors cursor-pointer';
        
        const header = document.createElement('div');
        header.className = 'flex justify-between items-center mb-4';
        
        const name = document.createElement('h2');
        name.textContent = tournament.name;
        name.className = 'text-xl font-bold text-white';
        
        const status = document.createElement('span');
        status.textContent = tournament.status || 'Open';
        status.className = 'px-3 py-1 rounded-full text-sm font-medium ' + 
            (tournament.status === 'completed' ? 'bg-green-500/20 text-green-400' : 
             tournament.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' : 
             'bg-blue-500/20 text-blue-400');
        
        header.append(name, status);
        
        const details = document.createElement('div');
        details.className = 'grid grid-cols-2 gap-4 text-white';
        
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
        
        details.append(winCondition, limit, participants, admin);
        
        card.append(header, details);
        
        card.addEventListener('click', () => {
            window.history.pushState({}, '', `/tournament?tournamentId=${tournament.id}`);
            window.dispatchEvent(new PopStateEvent('popstate'));
        });
        
        return card;
    }

    public async render(parent: HTMLElement | Component): Promise<void> {
        if (this.isRendering) return;
        this.isRendering = true;

        try {
            this.element.innerHTML = '';
            const title = document.createElement('h1');
            title.textContent = 'Tournaments';
            title.className = 'text-3xl font-bold mb-8 text-white';
            this.element.append(title);

            // Add filter UI
            this.element.append(this.createFilterUI());

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
                    const card = await this.createTournamentCard(tournament);
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