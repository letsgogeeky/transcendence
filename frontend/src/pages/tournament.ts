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
        container.className = 'text-center';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '10px';
        const title = document.createElement('h1');
        title.textContent = 'Tournament';
        this.element = container;
        container.append(title);
    }

    async fetchData() {
        const params = new URLSearchParams(window.location.search);
        const tournamentId = params.get('tournamentId');
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

    public render(parent: HTMLElement | Component): void {
        this.element.innerHTML = '';
        if (!this.data) {
            const loading = new ErrorComponent('Loading....');
            loading.render(this.element);
        } else if (this.data.error) {
            const error = new ErrorComponent(this.data.error);
            error.render(this.element);
        } else {
            const tournamentName = new SpanComponent(this.data.tournament.name, 'Name');
            tournamentName.render(this.element);
            const winCondition = new SpanComponent(this.data.tournament.options.winCondition, 'Win Condition');
            winCondition.render(this.element);
            const winScoreOrTime = new SpanComponent(this.data.tournament.options.limit, 'Win Score or Time');
            winScoreOrTime.render(this.element);
            // participants list
            const participantsList = document.createElement('div');
            participantsList.id = 'participants-list';
            this.element.append(participantsList);
            this.data.tournament.participants.forEach(async (participant: any) => {
                const user = await this.getUser(participant.userId);
                const html = `
                    <div class="flex flex-col gap-2">
                        <span><b>Name:</b> ${user.name}</span>
                        <span><b>Status:</b>${participant.status}</span>
                        <span><b>Joined at:</b> ${participant.createdAt}</span>
                    </div>
                `
                const participantItem = document.createElement('div');
                participantItem.innerHTML = html;
                participantsList.append(participantItem);
            });
            this.renderAddParticipantForm(participantsList);
        }
        super.render(parent);
    }   
}