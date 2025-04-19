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
        container.className = 'flex flex-col items-center justify-center min-h-screen bg-gradient-to-b';
        const title = document.createElement('h1');
        title.textContent = 'Create Tournament';
        title.className = 'text-3xl font-bold mb-8 text-white';
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
        window.history.pushState({}, '', '/tournament?tournamentId=' + data.tournament.id);
    }

    public render(parent: HTMLElement | Component): void {
        this.element.innerHTML = '';
        const title = document.createElement('h1');
        title.textContent = 'Create Tournament';
        title.className = 'text-3xl font-bold mb-8 text-white';
        this.element.append(title);

        const formContainer = document.createElement('div');
        formContainer.className = 'w-1/2 max-w-md mx-auto p-8 bg-gray-800 rounded-xl shadow-2xl space-y-8 border border-gray-700';
        
        const tournamentNameInput = new Input('Name', 'text', 'name', true, null);
        const winConditionDropdown = new Select('Win Condition', 'condition', [{ value: 'score', text: 'Score' }, { value: 'time', text: 'Time' }], true, selectStyle);
        const winScoreOrTimeInput = new Input('Win Score or Time', 'text', 'win_score_time', true, null);
        
        const form = new FormComponent(
            'Create Tournament',
            [tournamentNameInput, winConditionDropdown, winScoreOrTimeInput],
            (data) => CreateTournamentComponent.createTournament(data),
            CreateTournamentComponent.createTournamentCallback,
        );
        form.render(formContainer);
        this.element.append(formContainer);
        super.render(parent);
    }
}