import Component from "../components/Component";
import SpanComponent from "../components/Span";
import { Services } from "../services/send-request";
import State from "../services/state";
import sendRequest from "../services/send-request";
import ErrorComponent from "./error";
import FormComponent from "../components/Form/Form";
import Select from "../components/Form/Select";
import { selectStyle } from "../styles/classes";
import { showToast, ToastState } from "../components/Toast";

interface Match {
    id: string;
    status: string;
    participants: Array<{
        userId: string;
    }>;
    stats?: {
        [key: string]: number;
    };
}

interface User {
    id: string;
    name: string;
}

export default class TournamentComponent extends Component {
    readonly element: HTMLElement;
    private tournamentContainer: HTMLElement | null = null;
    private participantsSection: HTMLElement | null = null;
    private isRenderingParticipants = false;
    private isRendering = false;
    constructor() {
        super();
        const container = document.createElement('div');
        container.className = 'flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-800';
        const title = document.createElement('h1');
        title.textContent = 'Tournament';
        title.className = 'text-3xl font-bold mb-8 text-white';
        this.element = container;
        container.append(title);
    }

    async fetchData() {
        const params = new URLSearchParams(window.location.search);
        const tournamentId = params.get('tournamentId');
        if (!tournamentId) {
            window.history.pushState({}, '', '/tournaments');
            // window.dispatchEvent(new Event('popstate'));
            return;
        }
        const response = await sendRequest(
            `/tournament/${tournamentId}`,
            'GET',
            null,
            Services.TOURNAMENTS,
        );
        this.data = await response.json();
        return this.data;
    }

    async getUser(id: string) {
        const userResponse = await sendRequest(
            `/users/${id}`,
            'GET',
            null,
            Services.AUTH,
        );
        return await userResponse.json();
    }

    async addPlayer(id: string, formData: any): Promise<Response> {
        return await sendRequest(`/tournament/${id}/add-player`, 'POST', formData, Services.TOURNAMENTS, State.getState().getAuthToken());
    }

    async addPlayerCallback(data: any): Promise<void> {
        await this.fetchData();
        await this.renderParticipants();
    }

    async getUsers(): Promise<any[]> {
        const response = await sendRequest(
            '/users',
            'GET',
            null,
            Services.AUTH,
        );
        return await response.json();
    }

    async renderAddParticipantForm(parent: HTMLElement): Promise<void> {
        if (!parent) return;

        const participantsList = await this.getUsers();
        const addedParticipants = this.data.tournament.participants;
        const filteredParticipants = participantsList.filter((user: any) => !addedParticipants.some((participant: any) => participant.userId === user.id));
        if (filteredParticipants.length === 0) {
            return;
        }
        const participantOptions = filteredParticipants.map((user: any) => ({ value: user.id, text: user.name }));
        const select = new Select('Add Participant', 'playerId', participantOptions, true, selectStyle);
        const form = new FormComponent(
            'Add Participant',
            [select],
            (data) => this.addPlayer(this.data.tournament.id, data),
            this.addPlayerCallback.bind(this),
            'add-participant-form'
        );
        form.render(parent);
    }

    async removePlayer(tournamentId: string, userId: string): Promise<Response> {
        return await sendRequest(
            `/tournament/${tournamentId}/leave`,
            'POST',
            { userId },
            Services.TOURNAMENTS,
            State.getState().getAuthToken()
        );
    }

    async startTournament(tournamentId: string): Promise<Response> {
        return await sendRequest(
            `/tournament/${tournamentId}/start`,
            'POST',
            null,
            Services.TOURNAMENTS,
            State.getState().getAuthToken()
        );
    }

    async deleteTournament(tournamentId: string): Promise<Response> {
        return await sendRequest(
            `/tournament/${tournamentId}`,
            'DELETE',
            null,
            Services.TOURNAMENTS,
            State.getState().getAuthToken()
        );
    }

    async removePlayerCallback(data: any): Promise<void> {
        await this.fetchData();
        await this.renderParticipants();
        if (this.tournamentContainer) {
            const addParticipantSection = this.tournamentContainer.querySelector('#add-participant-form')?.parentElement;
            if (addParticipantSection) {
                addParticipantSection.innerHTML = '';
                await this.renderAddParticipantForm(addParticipantSection);
            }
        }
    }

    async startTournamentCallback(response: Response): Promise<void> {
        if (!response.ok) {
            const error = await response.json();
            showToast(ToastState.ERROR, error.message);
            return;
        }
        await this.fetchData();
        await this.renderParticipants();
    }

    private async renderParticipants() {
        if (!this.participantsSection || !this.data) return;
        if (this.isRenderingParticipants) return;
        this.isRenderingParticipants = true;
        // Clear existing participants
        this.participantsSection.innerHTML = '';

        const participantsTitle = document.createElement('h2');
        participantsTitle.textContent = 'Participants';
        participantsTitle.className = 'text-xl font-bold mb-4 text-white';
        this.participantsSection.append(participantsTitle);
        const participantsList = document.createElement('div');
        participantsList.id = 'participants-list';
        participantsList.className = 'space-y-4';

        // Create an array of promises for all participant data
        const participantPromises = this.data.tournament.participants.map(async (participant: { userId: string; status: string; createdAt: string }) => {
            const user = await this.getUser(participant.userId);
            const participantItem = document.createElement('div');
            participantItem.className = 'bg-gray-700 p-4 rounded-lg';

            const participantContent = document.createElement('div');
            participantContent.className = 'flex flex-col space-y-2';

            const participantHeader = document.createElement('div');
            participantHeader.className = 'flex justify-between items-center';

            const participantName = document.createElement('span');
            participantName.className = 'text-white text-lg font-medium';
            participantName.textContent = user.name;

            if (this.data.tournament.adminId === State.getState().getCurrentUser()?.id) {
                const removeButton = document.createElement('button');
                removeButton.textContent = 'Remove';
                removeButton.className = 'px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm';
                removeButton.onclick = async (evt) => {
                    evt.preventDefault();
                    if (this.data.tournament.status === 'in progress') {
                        showToast(ToastState.ERROR, 'Cannot remove players from a tournament that is in progress');
                        return;
                    }
                    try {
                        const response = await this.removePlayer(this.data.tournament.id, participant.userId);
                        if (response.ok) {
                            await this.actionCallback();
                        }
                    } catch (error) {
                        console.error('Error removing player:', error);
                    }
                };
                participantHeader.append(participantName, removeButton);
            } else if (participant.userId === State.getState().getCurrentUser()?.id) {
                const leaveButton = document.createElement('button');
                leaveButton.textContent = 'Leave';
                leaveButton.className = 'px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm';
                leaveButton.onclick = async (evt) => {
                    evt.preventDefault();
                    if (this.data.tournament.status === 'in progress') {
                        showToast(ToastState.ERROR, 'Cannot leave a tournament that is in progress');
                        return;
                    }
                    if (confirm('Are you sure you want to leave this tournament?')) {
                        try {
                            const response = await this.removePlayer(this.data.tournament.id, participant.userId);
                            if (response.ok) {
                                await this.actionCallback();
                            }
                        } catch (error) {
                            console.error('Error leaving tournament:', error);
                        }
                    }
                };
                participantHeader.append(participantName, leaveButton);
            } else {
                participantHeader.append(participantName);
            }

            const participantDetails = document.createElement('div');
            participantDetails.className = 'flex justify-between text-sm';
            participantDetails.innerHTML = `
                <span class="text-gray-300">Status: ${participant.status}</span>
                <span class="text-gray-300">Joined: ${new Date(participant.createdAt).toLocaleDateString()}</span>
            `;

            participantContent.append(participantHeader, participantDetails);
            participantItem.append(participantContent);
            return participantItem;
        });

        // Wait for all participant data to be fetched and elements to be created
        const participantItems = await Promise.all(participantPromises);

        // Append all participant items at once
        participantItems.forEach(item => participantsList.append(item));

        this.participantsSection.append(participantsList);
        this.isRenderingParticipants = false;
    }

    public render(parent: HTMLElement | Component): void {
        if (this.isRendering) return;
        this.isRendering = true;
        this.element.innerHTML = '';
        const title = document.createElement('h1');
        title.textContent = 'Tournament';
        title.className = 'text-3xl font-bold mb-8 text-white';
        this.element.append(title);

        if (!this.data) {
            const loading = new ErrorComponent('Loading....');
            loading.render(this.element);
        } else if (this.data.error) {
            const error = new ErrorComponent(this.data.error);
            error.render(this.element);
        } else {
            const container = document.createElement('div');
            container.className = 'flex flex-col md:flex-row gap-8 w-full max-w-7xl mx-auto p-8';

            // Left side - Tournament info and participants
            const leftSide = document.createElement('div');
            leftSide.className = 'flex-1 space-y-8';

            const tournamentInfo = document.createElement('div');
            tournamentInfo.className = 'bg-gray-800 rounded-xl shadow-2xl p-8 space-y-4 border border-gray-700';

            const tournamentName = new SpanComponent(this.data.tournament.name, 'Name');
            tournamentName.element.className = 'text-white text-lg font-medium';
            tournamentName.render(tournamentInfo);

            const winCondition = new SpanComponent(this.data.tournament.options.winCondition, 'Win Condition');
            winCondition.element.className = 'text-white text-lg font-medium';
            winCondition.render(tournamentInfo);

            const winScoreOrTime = new SpanComponent(this.data.tournament.options.limit, 'Win Score or Time');
            winScoreOrTime.element.className = 'text-white text-lg font-medium';
            winScoreOrTime.render(tournamentInfo);

            leftSide.append(tournamentInfo);

            // Action buttons section
            if (this.data.tournament.status !== 'in progress' && this.data.tournament.adminId === State.getState().getCurrentUser()?.id) {
                const actionButtons = document.createElement('div');
                actionButtons.className = 'flex justify-between mt-4';

                const startButton = document.createElement('button');
                startButton.textContent = 'Start Tournament';
                startButton.className = 'px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors';
                startButton.onclick = async (evt) => {
                    evt.preventDefault();
                    try {
                        const response = await this.startTournament(this.data.tournament.id);
                        await this.startTournamentCallback(response);
                    } catch (error) {
                        console.error('Error starting tournament:', error);
                    }
                };
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete Tournament';
                deleteButton.className = 'px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors';
                deleteButton.onclick = async (evt) => {
                    evt.preventDefault();
                    if (confirm('Are you sure you want to delete this tournament? This action cannot be undone.')) {
                        try {
                            const response = await this.deleteTournament(this.data.tournament.id);
                            if (response.ok) {
                                window.history.pushState({}, '', '/tournaments');
                                window.dispatchEvent(new Event('popstate'));
                            }
                        } catch (error) {
                            console.error('Error deleting tournament:', error);
                        }
                    }
                };
                actionButtons.append(startButton, deleteButton);
                leftSide.append(actionButtons);
            }

            // Participants section
            this.participantsSection = document.createElement('div');
            this.participantsSection.className = 'mt-8';
            this.renderParticipants();
            leftSide.append(this.participantsSection);

            // Add participant form
            if (this.data.tournament.status !== 'in progress' && this.data.tournament.adminId === State.getState().getCurrentUser()?.id) {
                const addParticipantSection = document.createElement('div');
                addParticipantSection.className = 'mt-8 pt-8 border-t border-gray-700';
                this.renderAddParticipantForm(addParticipantSection);
                leftSide.append(addParticipantSection);
            }

            container.append(leftSide);

            // Right side - Matches (only shown when tournament is in progress)
            if (this.data.tournament.status === 'in progress') {
                const rightSide = document.createElement('div');
                rightSide.className = 'flex-1 space-y-8';

                const matchesTitle = document.createElement('h2');
                matchesTitle.textContent = 'Tournament Matches';
                matchesTitle.className = 'text-2xl font-bold text-white mb-4';
                rightSide.append(matchesTitle);

                const matchesList = document.createElement('div');
                matchesList.className = 'space-y-4';

                if (this.data.tournament.matches && this.data.tournament.matches.length > 0) {
                    // Create an array of promises to fetch user data for all participants
                    const userPromises = this.data.tournament.matches.flatMap((match: Match) =>
                        match.participants.map((participant: { userId: string }) =>
                            this.getUser(participant.userId)
                        )
                    );

                    // Wait for all user data to be fetched
                    Promise.all(userPromises).then((users: User[]) => {
                        const userMap = new Map(users.map(user => [user.id, user.name]));

                        this.data.tournament.matches.forEach((match: Match) => {
                            const matchCard = document.createElement('div');
                            matchCard.className = 'bg-gray-800 rounded-xl shadow-2xl p-6 border border-gray-700';

                            // Add hover effect and cursor pointer for pending matches
                            if (match.status === 'pending') {
                                matchCard.classList.add('hover:bg-gray-700', 'transition-colors', 'cursor-pointer');

                                // Check if current user is a participant
                                const currentUserId = State.getState().getCurrentUser()?.id;
                                const isParticipant = match.participants.some(p => p.userId === currentUserId);

                                if (isParticipant) {
                                    matchCard.onclick = () => {
                                        window.history.pushState(
                                            { path: '/game' },
                                            '/game',
                                            `/game?matchId=${match.id}&tournamentId=${this.data.tournament.id}`
                                        );
                                        window.location.reload();
                                    };
                                }
                            }

                            const matchHeader = document.createElement('div');
                            matchHeader.className = 'flex justify-between items-center mb-4';

                            const matchStatus = document.createElement('span');
                            matchStatus.className = `px-3 py-1 rounded-full text-sm ${match.status === 'pending' ? 'bg-yellow-600' :
                                match.status === 'in progress' ? 'bg-blue-600' :
                                    'bg-green-600'
                                } text-white`;
                            matchStatus.textContent = match.status.toUpperCase();

                            const matchId = document.createElement('span');
                            matchId.className = 'text-gray-400 text-sm';
                            matchId.textContent = `Match #${match.id.slice(0, 8)}`;

                            matchHeader.append(matchStatus, matchId);

                            // Add spectate button for in-progress matches
                            if (match.status === 'in progress') {
                                const spectateButton = document.createElement('button');
                                spectateButton.textContent = 'Spectate';
                                spectateButton.className = 'px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm';
                                spectateButton.onclick = () => {
                                    window.history.pushState(
                                        { path: '/game' },
                                        '/game',
                                        `/game?matchId=${match.id}&tournamentId=${this.data.tournament.id}&spectate=true`
                                    );
                                    window.location.reload();
                                };
                                matchHeader.append(spectateButton);
                            }

                            const matchParticipants = document.createElement('div');
                            matchParticipants.className = 'space-y-2';

                            if (match.participants && match.participants.length > 0) {
                                match.participants.forEach((participant: { userId: string }) => {
                                    const participantDiv = document.createElement('div');
                                    participantDiv.className = 'flex items-center space-x-2';

                                    const participantName = document.createElement('span');
                                    participantName.className = 'text-white';
                                    participantName.textContent = userMap.get(participant.userId) || 'Unknown User';

                                    if (match.stats && match.stats[participant.userId]) {
                                        const score = document.createElement('span');
                                        score.className = 'text-gray-400';
                                        score.textContent = `Score: ${match.stats[participant.userId]}`;
                                        participantDiv.append(participantName, score);
                                    } else {
                                        participantDiv.append(participantName);
                                    }

                                    matchParticipants.append(participantDiv);
                                });
                            }

                            matchCard.append(matchHeader, matchParticipants);
                            matchesList.append(matchCard);
                        });
                    });
                } else {
                    const noMatches = document.createElement('div');
                    noMatches.className = 'text-gray-400 text-center py-4';
                    noMatches.textContent = 'No matches have been created yet';
                    matchesList.append(noMatches);
                }

                rightSide.append(matchesList);
                container.append(rightSide);
            }

            this.element.append(container);
        }
        super.render(parent);
    }
}