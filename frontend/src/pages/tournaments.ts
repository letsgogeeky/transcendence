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
}

export default class TournamentsComponent extends Component {
    readonly element: HTMLElement;
    private tournaments: Tournament[] = [];

    constructor() {
        super();
        const container = document.createElement('div');
        container.className = 'flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-800';
        const title = document.createElement('h1');
        title.textContent = 'Tournaments';
        title.className = 'text-3xl font-bold mb-8 text-white';
        this.element = container;
        container.append(title);
    }

    async fetchData(): Promise<Tournament[]> {
        const response = await sendRequest(
            '/tournament',
            'GET',
            null,
            Services.TOURNAMENTS,
        );
        const responseData = await response.json();
        this.tournaments = responseData.tournaments;
        return this.tournaments;
    }

    private createTournamentCard(tournament: Tournament) {
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
        
        details.append(winCondition, limit, participants);
        
        card.append(header, details);
        
        card.addEventListener('click', () => {
            window.history.pushState({}, '', `/tournament?tournamentId=${tournament.id}`);
            window.dispatchEvent(new PopStateEvent('popstate'));
        });
        
        return card;
    }

    public async render(parent: HTMLElement | Component): Promise<void> {
        this.element.innerHTML = '';
        const title = document.createElement('h1');
        title.textContent = 'Tournaments';
        title.className = 'text-3xl font-bold mb-8 text-white';
        this.element.append(title);

        try {
            const container = document.createElement('div');
            container.className = 'w-full max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-6';
            
            if (this.tournaments.length === 0) {
                const emptyState = document.createElement('div');
                emptyState.className = 'col-span-full text-center text-gray-400 py-8';
                emptyState.textContent = 'No tournaments available';
                container.append(emptyState);
            } else {
                this.tournaments.forEach(tournament => {
                    container.append(this.createTournamentCard(tournament));
                });
            }
            
            this.element.append(container);
        } catch (error) {
            console.error('Failed to load tournaments', error);
            const errorComponent = new ErrorComponent('Failed to load tournaments');
            errorComponent.render(this.element);
        }
        
        super.render(parent);
    }
} 