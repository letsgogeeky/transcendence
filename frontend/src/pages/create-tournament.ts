import Button from "../components/Button";
import Component from "../components/Component";
import FormComponent from "../components/Form/Form";
import Input from "../components/Form/Input";
import Select from "../components/Form/Select";
import { Services } from "../services/send-request";
import State from "../services/state";
import sendRequest from "../services/send-request";
import { buttonStyle, inputStyle, selectStyle } from "../styles/classes";

export default class CreateTournamentComponent extends Component {
    readonly element: HTMLElement;

    constructor() {
        super();
        const container = document.createElement('div');
        container.className = 'text-center';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '10px';
        const title = document.createElement('h1');
        title.textContent = 'Create Tournament';
        this.element = container;
        container.append(title);
    }
    
    static async createTournament(formData: any): Promise<Response> {
        console.log('Create Tournament', formData);
        const tournament = {
            name: formData.name,
            options: {
                winCondition: formData.condition,
                limit: formData.win_score_time,
            },
            participants: []
        }
        return await sendRequest('/tournament', 'POST', tournament, Services.TOURNAMENTS, State.getState().getAuthToken());
    }

    static async createTournamentCallback(data: any): Promise<void> {
        console.log('Create Tournament Callback', data);
        window.location.href = '/tournament/' + data.id;
    }

    public render(parent: HTMLElement | Component): void {
        this.element.innerHTML = '';
        const tournamentNameInput = new Input('Name', 'text', 'name', true, null, inputStyle);
        // win condition: score or time user has to choose from dropdown
        const winConditionDropdown = new Select('Win Condition', 'condition', [{ value: 'score', text: 'Score' }, { value: 'time', text: 'Time' }], true, selectStyle);
        const winScoreOrTimeInput = new Input('Win Score or Time', 'text', 'win_score_time', true, null, inputStyle);
        const form = new FormComponent(
            'Create Tournament',
            [tournamentNameInput, winConditionDropdown, winScoreOrTimeInput],
            (data) => CreateTournamentComponent.createTournament(data),
            CreateTournamentComponent.createTournamentCallback,
        );
        form.render(this.element);
        super.render(parent);
    }
}