import AvatarImageComponent from '../components/AvatarImage';
import Component from '../components/Component';
import sendRequest, { endpoints, Services } from '../services/send-request';
import State from '../services/state';
import ErrorComponent from './error';

export default class ProfileComponent extends Component {
    readonly element: HTMLElement;
    private tournaments: any[] = [];

    constructor() {
        super();
        this.element = document.createElement('div');
        this.element.className = 'flex flex-col items-center gap-8 min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 py-8';
    }

    async fetchData() {
        const params = new URLSearchParams(window.location.search);
        const userId = params.get('userId') || State.getState().getCurrentUser()?.id;
        if (!userId) {
            window.location.href = '/login';
            return;
        }
        console.log('User ID:', userId);
        const [userResponse, tournamentsResponse] = await Promise.all([
            sendRequest(`/users/${userId}`, 'GET', null, Services.AUTH),
            sendRequest(`/tournament/participant/${userId}`, 'GET', null, Services.TOURNAMENTS)
        ]);
        const userData = await userResponse.json();
        const tournamentsData = await tournamentsResponse.json();
        this.tournaments = tournamentsData.tournaments || [];
        return userData;
    }

    private createTournamentCard(tournament: any) {
        const card = document.createElement('div');
        card.className = 'bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer border border-gray-700';
        card.onclick = () => {
            window.history.pushState({}, '', `/tournament?tournamentId=${tournament.id}`);
            window.dispatchEvent(new PopStateEvent('popstate'));
        };

        const header = document.createElement('div');
        header.className = 'flex justify-between items-center mb-4';

        const title = document.createElement('h3');
        title.className = 'text-xl font-bold text-white';
        title.textContent = tournament.name;

        const status = document.createElement('span');
        status.className = `px-3 py-1 rounded-full text-sm font-medium ${
            tournament.status === 'active' ? 'bg-green-600 text-white' :
            tournament.status === 'pending' ? 'bg-yellow-600 text-white' :
            'bg-gray-600 text-white'
        }`;
        status.textContent = tournament.status;

        header.append(title, status);

        const details = document.createElement('div');
        details.className = 'grid grid-cols-2 gap-4 text-sm';

        const winCondition = document.createElement('div');
        winCondition.className = 'flex flex-col';
        winCondition.innerHTML = `
            <span class="text-gray-400">Win Condition</span>
            <span class="text-white">${tournament.options.winCondition}</span>
        `;

        const limit = document.createElement('div');
        limit.className = 'flex flex-col';
        limit.innerHTML = `
            <span class="text-gray-400">Limit</span>
            <span class="text-white">${tournament.options.limit}</span>
        `;

        const participants = document.createElement('div');
        participants.className = 'flex flex-col';
        participants.innerHTML = `
            <span class="text-gray-400">Participants</span>
            <span class="text-white">${tournament.participants.length}</span>
        `;

        const role = document.createElement('div');
        role.className = 'flex flex-col';
        role.innerHTML = `
            <span class="text-gray-400">Role</span>
            <span class="text-white">${tournament.adminId === this.data.id ? 'Admin' : 'Participant'}</span>
        `;

        details.append(winCondition, limit, participants, role);
        card.append(header, details);

        return card;
    }

    render(parent: HTMLElement) {
        this.element.innerHTML = '';
        if (!this.data) {
            const loading = new ErrorComponent('Loading....');
            loading.render(this.element);
        } else if (this.data.error) {
            const error = new ErrorComponent(this.data.error);
            error.render(this.element);
        } else {
            // Profile Header
            const profileHeader = document.createElement('div');
            profileHeader.className = 'flex flex-col items-center gap-4 w-full max-w-2xl bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-700';

            const avatar = new AvatarImageComponent(
                this.data.name + "'s avatar",
                this.data.avatarUrl!,
            );
            avatar.element.className = 'w-32 h-32 rounded-full border-4 border-purple-500';
            avatar.render(profileHeader);

            const name = document.createElement('h1');
            name.className = 'text-3xl font-bold text-white';
            name.textContent = this.data.name;

            const email = document.createElement('p');
            email.className = 'text-gray-400';
            email.textContent = this.data.email;

            profileHeader.append(name, email);
            this.element.append(profileHeader);

            // Tournaments Section
            if (this.tournaments.length > 0) {
                const tournamentsSection = document.createElement('div');
                tournamentsSection.className = 'w-full max-w-4xl';

                const tournamentsTitle = document.createElement('h2');
                tournamentsTitle.className = 'text-2xl font-bold text-white mb-6';
                tournamentsTitle.textContent = 'Tournaments';
                tournamentsSection.append(tournamentsTitle);

                const tournamentsGrid = document.createElement('div');
                tournamentsGrid.className = 'grid grid-cols-1 md:grid-cols-2 gap-6';

                this.tournaments.forEach(tournament => {
                    const card = this.createTournamentCard(tournament);
                    tournamentsGrid.append(card);
                });

                tournamentsSection.append(tournamentsGrid);
                this.element.append(tournamentsSection);
            } else {
                const noTournaments = document.createElement('div');
                noTournaments.className = 'text-center text-gray-400 mt-8';
                noTournaments.textContent = 'No tournaments found';
                this.element.append(noTournaments);
            }
        }
        super.render(parent);
    }
}
