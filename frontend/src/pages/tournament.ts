import Component from "../components/Component";
import SpanComponent from "../components/span";
import { Services } from "../services/send-request";
import State from "../services/state";
import sendRequest from "../services/send-request";
import ErrorComponent from "./error";

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
    
    static async addPlayer(id: string, formData: any): Promise<Response> {
        console.log('Add Player', formData);
        return await sendRequest(`/tournament/${id}/add-player`, 'POST', formData, Services.TOURNAMENTS, State.getState().getAuthToken());
    }

    static async addPlayerCallback(data: any): Promise<void> {
        console.log('Add Player Callback', data);
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
        }
        super.render(parent);
    }   
}