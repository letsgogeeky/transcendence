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
        let data = await response.json();
        return data;
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
    
    static async addPlayer(id: string, formData: any): Promise<Response> {
        console.log('Add Player', formData);
        return await sendRequest(`/tournament/${id}/add-player`, 'POST', formData, Services.TOURNAMENTS, State.getState().getAuthToken());
    }

    static async addPlayerCallback(data: any): Promise<void> {
        console.log('Add Player Callback', data);
        window.location.reload();
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
            (data) => TournamentComponent.addPlayer(this.data.tournament.id, data),
            TournamentComponent.addPlayerCallback,
        );
        form.render(parent);
    }

    static async removePlayer(tournamentId: string, userId: string): Promise<Response> {
        return await sendRequest(
            `/tournament/${tournamentId}/leave`,
            'POST',
            { userId },
            Services.TOURNAMENTS,
            State.getState().getAuthToken()
        );
    }

    static async startTournament(tournamentId: string): Promise<Response> {
        return await sendRequest(
            `/tournament/${tournamentId}/start`,
            'POST',
            null,
            Services.TOURNAMENTS,
            State.getState().getAuthToken()
        );
    }

    static async deleteTournament(tournamentId: string): Promise<Response> {
        return await sendRequest(
            `/tournament/${tournamentId}`,
            'DELETE',
            null,
            Services.TOURNAMENTS,
            State.getState().getAuthToken()
        );
    }

    static async removePlayerCallback(data: any): Promise<void> {
        console.log('Remove Player Callback', data);
        window.location.reload();
    }

    static async startTournamentCallback(data: any): Promise<void> {
        console.log('Start Tournament Callback', data);
        window.location.reload();
    }

    static async deleteTournamentCallback(data: any): Promise<void> {
        console.log('Delete Tournament Callback', data);
        window.location.href = '/tournaments';
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
            const tournamentContainer = document.createElement('div');
            tournamentContainer.className = 'w-1/2 max-w-md mx-auto p-8 bg-gray-800 rounded-xl shadow-2xl space-y-8 border border-gray-700';

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

            tournamentContainer.append(tournamentInfo);

            // Action buttons section
            const actionButtons = document.createElement('div');
            actionButtons.className = 'flex justify-between mt-4';
            
            // Only show start and delete buttons if user is admin
            if (this.data.tournament.adminId === State.getState().getCurrentUser()?.id) {
                const startButton = document.createElement('button');
                startButton.textContent = 'Start Tournament';
                startButton.className = 'px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors';
                startButton.onclick = async () => {
                    try {
                        const response = await TournamentComponent.startTournament(this.data.tournament.id);
                        const data = await response.json();
                        TournamentComponent.startTournamentCallback(data);
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
                            const response = await TournamentComponent.deleteTournament(this.data.tournament.id);
                            const data = await response.json();
                            TournamentComponent.deleteTournamentCallback(data);
                        } catch (error) {
                            console.error('Error deleting tournament:', error);
                        }
                    }
                };
                actionButtons.append(startButton, deleteButton);
            }
            
            tournamentContainer.append(actionButtons);

            // Participants section
            const participantsSection = document.createElement('div');
            participantsSection.className = 'mt-8';
            
            const participantsTitle = document.createElement('h2');
            participantsTitle.textContent = 'Participants';
            participantsTitle.className = 'text-xl font-bold mb-4 text-white';
            participantsSection.append(participantsTitle);

            const participantsList = document.createElement('div');
            participantsList.id = 'participants-list';
            participantsList.className = 'space-y-4';
            
            this.data.tournament.participants.forEach(async (participant: any) => {
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
                
                // Only show remove button if user is admin
                if (this.data.tournament.adminId === State.getState().getCurrentUser()?.id) {
                    const removeButton = document.createElement('button');
                    removeButton.textContent = 'Remove';
                    removeButton.className = 'px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm';
                    removeButton.onclick = async () => {
                        try {
                            const response = await TournamentComponent.removePlayer(this.data.tournament.id, participant.userId);
                            const data = await response.json();
                            TournamentComponent.removePlayerCallback(data);
                        } catch (error) {
                            console.error('Error removing player:', error);
                        }
                    };
                    participantHeader.append(participantName, removeButton);
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
                participantsList.append(participantItem);
            });

            participantsSection.append(participantsList);
            tournamentContainer.append(participantsSection);

            // Only show add participant form if user is admin
            if (this.data.tournament.adminId === State.getState().getCurrentUser()?.id) {
                // Add participant form
                const addParticipantSection = document.createElement('div');
                addParticipantSection.className = 'mt-8 pt-8 border-t border-gray-700';
                this.renderAddParticipantForm(addParticipantSection);
                tournamentContainer.append(addParticipantSection);
            }

            this.element.append(tournamentContainer);
        }
        super.render(parent);
    }   
}