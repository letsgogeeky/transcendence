import AvatarImageComponent from '../components/AvatarImage';
import Component from '../components/Component';
import sendRequest, { endpoints, Services } from '../services/send-request';
import State from '../services/state';
import ErrorComponent from './error';
import TournamentMatchCard from '../components/TournamentMatchCard';

export default class ProfileComponent extends Component {
    readonly element: HTMLElement;
    private tournaments: any[] = [];
    private matches: any[] = [];
    private activeTab: 'tournaments' | 'matches' = 'tournaments';
    private usersMap: Map<string, string> = new Map();

    constructor() {
        super();
        this.element = document.createElement('div');
        this.element.className = 'flex flex-col items-center gap-8 min-h-screen py-8';
    }

    async fetchData() {
        const params = new URLSearchParams(window.location.search);
        const userId = params.get('userId') || State.getState().getCurrentUser()?.id;
        if (!userId) {
            window.location.href = '/login';
            return;
        }
        console.log('User ID:', userId);
        const [userResponse, tournamentsResponse, matchesResponse] = await Promise.all([
            sendRequest(`/users/${userId}`, 'GET', null, Services.AUTH),
            sendRequest(`/tournament/participant/${userId}`, 'GET', null, Services.TOURNAMENTS),
            sendRequest(`/queue/get-user-matches`, 'GET', null, Services.MATCH)
        ]);
        const userData = await userResponse.json();
        const tournamentsData = await tournamentsResponse.json();
        const matchesData = await matchesResponse.json();
        this.tournaments = tournamentsData.tournaments || [];
        this.matches = matchesData.matches || [];
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
        status.className = `px-3 py-1 rounded-full text-sm font-medium ${tournament.status === 'active' ? 'bg-green-600 text-white' :
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

    private createTabs(): HTMLElement {
        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'flex gap-4 mb-6';

        const tournamentsTab = document.createElement('button');
        tournamentsTab.className = `px-4 py-2 rounded-lg font-medium transition-colors ${this.activeTab === 'tournaments'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`;
        tournamentsTab.textContent = 'Tournaments';
        tournamentsTab.onclick = () => {
            this.activeTab = 'tournaments';
            this.render(this.element);
        };

        const matchesTab = document.createElement('button');
        matchesTab.className = `px-4 py-2 rounded-lg font-medium transition-colors ${this.activeTab === 'matches'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`;
        matchesTab.textContent = 'Matches';
        matchesTab.onclick = () => {
            this.activeTab = 'matches';
            this.render(this.element);
        };

        tabsContainer.append(tournamentsTab, matchesTab);
        return tabsContainer;
    }

    private async createMatchCard(match: any) {
        const userMap = new Map();
        for (const participant of match.participants) {
            if (this.usersMap.has(participant.userId)) {
                userMap.set(participant.userId, this.usersMap.get(participant.userId)!);
            } else {
                const userResponse = await sendRequest(`/users/${participant.userId}`, 'GET', null, Services.AUTH);
                const userData = await userResponse.json();
                userMap.set(participant.userId, userData.name);
                this.usersMap.set(participant.userId, userData.name);
            }
        }
        const matchCard = new TournamentMatchCard(match, userMap, '');
        return matchCard;
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
            // profileHeader.className = 'flex flex-col items-center gap-4 w-full max-w-2xl bg-[#423a47] rounded-xl p-8 shadow-lg border border-gray-700';
			profileHeader.className = 'flex flex-col items-center gap-4 w-full max-w-2xl bg-gray-800 rounded-xl p-8 shadow-lg border border-[#1e3a59] shadow-[#1e3a59]';
			profileHeader.style.boxShadow = '0 0 15px 5px rgba(0, 255, 255, 0.8)';

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

            // Content Section
            const contentSection = document.createElement('div');
            contentSection.className = 'w-full max-w-4xl';

            // Add tabs
            const tabs = this.createTabs();
			tabs.className = 'flex justify-center items-center gap-4 mb-8';  // Add flex and center styles
			contentSection.append(tabs);


            if (this.activeTab === 'tournaments') {
                // Tournaments Section
                if (this.tournaments.length > 0) {
                    const tournamentsGrid = document.createElement('div');
                    tournamentsGrid.className = 'grid grid-cols-1 md:grid-cols-2 gap-6';

                    this.tournaments.forEach(tournament => {
                        const card = this.createTournamentCard(tournament);
                        tournamentsGrid.append(card);
                    });

                    contentSection.append(tournamentsGrid);
                } else {
                    const noTournaments = document.createElement('div');
                    noTournaments.className = 'text-center text-gray-400 mt-8';
                    noTournaments.textContent = 'No tournaments found';
                    contentSection.append(noTournaments);
                }
            } else {
                // Matches Section
                if (this.matches.length > 0) {
                    const matchesList = document.createElement('div');
                    matchesList.className = 'space-y-4';

                    // Sort matches by creation date in descending order
                    const sortedMatches = [...this.matches].sort((a, b) => {
                        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                        return dateB - dateA;
                    });

                    Promise.all(sortedMatches.map(match => this.createMatchCard(match))).then(matchCards => {
                        matchCards.forEach(card => {
                            card.render(matchesList);
                        });
                    });

                    contentSection.append(matchesList);
                } else {
                    const noMatches = document.createElement('div');
                    noMatches.className = 'text-center text-gray-400 mt-8';
                    noMatches.textContent = 'No matches found';
                    contentSection.append(noMatches);
                }
            }

            this.element.append(contentSection);
        }
        super.render(parent);
    }
}