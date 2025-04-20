import Component from "../components/Component";
import SpanComponent from "../components/Span";
import { Services } from "../services/send-request";
import State from "../services/state";
import sendRequest from "../services/send-request";
import ErrorComponent from "./error";
import FormComponent from "../components/Form/Form";
import Select from "../components/Form/Select";
import { selectStyle } from "../styles/classes";

export default class TournamentComponent extends Component {
    readonly element: HTMLElement;
    private tournamentContainer: HTMLElement | null = null;
    private participantsSection: HTMLElement | null = null;
    private isRenderingParticipants = false;
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
            window.location.href = '/tournaments';
            return;
        }
        console.log('Tournament ID:', tournamentId);
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
        console.log('Add Player', formData);
        return await sendRequest(`/tournament/${id}/add-player`, 'POST', formData, Services.TOURNAMENTS, State.getState().getAuthToken());
    }

    async addPlayerCallback(data: any): Promise<void> {
        console.log('Add Player Callback', data);
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
        console.log('Remove Player Callback', data);
        await this.fetchData();
        await this.renderParticipants();
    }

    async startTournamentCallback(data: any): Promise<void> {
        console.log('Start Tournament Callback', data);
        await this.fetchData();
        await this.renderParticipants();
    }

    async deleteTournamentCallback(data: any): Promise<void> {
        console.log('Delete Tournament Callback', data);
        window.location.href = '/tournaments';
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
                removeButton.onclick = async () => {
                    try {
                        const response = await this.removePlayer(this.data.tournament.id, participant.userId);
                        if (response.ok) {
                            await this.fetchData();
                            await this.renderParticipants();
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
                leaveButton.onclick = async () => {
                    if (confirm('Are you sure you want to leave this tournament?')) {
                        try {
                            const response = await this.removePlayer(this.data.tournament.id, participant.userId);
                            if (response.ok) {
                                await this.fetchData();
                                await this.renderParticipants();
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
            console.log('Rendering Tournament Container');
            this.tournamentContainer = document.createElement('div');
            this.tournamentContainer.className = 'w-1/2 max-w-md mx-auto p-8 bg-gray-800 rounded-xl shadow-2xl space-y-8 border border-gray-700';

            const tournamentInfo = document.createElement('div');
            tournamentInfo.className = 'space-y-4';
            
            const tournamentName = new SpanComponent(this.data.tournament.name, 'Name');
            tournamentName.element.className = 'text-white text-lg font-medium';
            tournamentName.render(tournamentInfo);
            
            const winCondition = new SpanComponent(this.data.tournament.options.winCondition, 'Win Condition');
            winCondition.element.className = 'text-white text-lg font-medium';
            winCondition.render(tournamentInfo);
            
            const winScoreOrTime = new SpanComponent(this.data.tournament.options.limit, 'Win Score or Time');
            winScoreOrTime.element.className = 'text-white text-lg font-medium';
            winScoreOrTime.render(tournamentInfo);

            this.tournamentContainer.append(tournamentInfo);

            // Action buttons section
            const actionButtons = document.createElement('div');
            actionButtons.className = 'flex justify-between mt-4';
            
            if (this.data.tournament.adminId === State.getState().getCurrentUser()?.id) {
                const startButton = document.createElement('button');
                startButton.textContent = 'Start Tournament';
                startButton.className = 'px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors';
                startButton.onclick = async () => {
                    try {
                        const response = await this.startTournament(this.data.tournament.id);
                        const data = await response.json();
                        await this.fetchData();
                        await this.renderParticipants();
                    } catch (error) {
                        console.error('Error starting tournament:', error);
                    }
                };
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete Tournament';
                deleteButton.className = 'px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors';
                deleteButton.onclick = async () => {
                    if (confirm('Are you sure you want to delete this tournament? This action cannot be undone.')) {
                        try {
                            const response = await this.deleteTournament(this.data.tournament.id);
                            const data = await response.json();
                            window.location.href = '/tournaments';
                        } catch (error) {
                            console.error('Error deleting tournament:', error);
                        }
                    }
                };
                actionButtons.append(startButton, deleteButton);
            }
            
            this.tournamentContainer.append(actionButtons);

            // Participants section
            this.participantsSection = document.createElement('div');
            this.participantsSection.className = 'mt-8';
            this.renderParticipants();
            this.tournamentContainer.append(this.participantsSection);

            // Add participant form
            if (this.data.tournament.adminId === State.getState().getCurrentUser()?.id) {
                const addParticipantSection = document.createElement('div');
                addParticipantSection.className = 'mt-8 pt-8 border-t border-gray-700';
                this.renderAddParticipantForm(addParticipantSection);
                this.tournamentContainer.append(addParticipantSection);
            }

            this.element.append(this.tournamentContainer);
        }
        super.render(parent);
    }   
}