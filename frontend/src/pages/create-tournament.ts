import Button from "../components/button";
import Component from "../components/Component";
import FormComponent from "../components/Form/Form";
import Input from "../components/Form/Input";
import Select from "../components/Form/Select";
import { Services } from "../services/send-request";
import State from "../services/state";
import sendRequest from "../services/send-request";
import { buttonStyle, inputStyle, selectStyle, selectStyle2 } from "../styles/classes";
import { loadImage, copyrightLine } from '../styles/background'
import UsersPageComponent from '../pages/users';
import ChatComponent from '../components/ChatComponent';
import ChatManager from '../components/ChatManager';


export default class CreateTournamentComponent extends Component {
    readonly element: HTMLElement;

    constructor() {
        super();
        this.element = document.createElement('div');
    }
    
    static async createTournament(formData: any): Promise<Response> {
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
        // create chat for the tournament
        console.log('Create Tournament Callback', data.tournament);
        const chatManager = ChatManager.getInstance();
        chatManager.openChat(data.tournament.id, data.tournament.name, '');
    }

    public render(parent: HTMLElement | Component): void {
        this.element.innerHTML = '';
		this.element.className = 'w-full h-screen flex flex-col justify-center items-center -mt-12';

		const titleHeader = document.createElement('div');
		titleHeader.className = 'flex justify-center items-center w-full mt-8 mb-8';
		titleHeader.appendChild(loadImage('trophy.gif', 'w-20 h-20 mt-1', 'Trophy gif'));

        const title = document.createElement('h1');
		title.textContent = 'Create Tournament';
		title.className = 'font-black text-3xl px-8 py-4 text-black transition-all pointer-events-auto font-impact rounded-xl';
		title.style.webkitTextStroke = `1.5px #eedee5`;
		title.style.textShadow = `0 0 6px #eedee5, 0 0 12px #eedee5`;
		title.style.fontFamily = 'Arial Black, Gadget, sans-serif';
		titleHeader.appendChild(title);
        this.element.appendChild(titleHeader);

        const formContainer = document.createElement('div');
		formContainer.className = 'w-1/2 max-w-md mx-auto p-8 bg-[#2b272f] rounded-xl space-y-8 border border-[#eedee5]';
		formContainer.style.boxShadow = '0 0 6px #eedee5, 0 0 12px #eedee5';
        const tournamentNameInput = new Input('📝  Name', 'text', 'name', true, 'name for the tournament', );
        const winConditionDropdown = new Select('🏁 Win Condition', 'condition', [{ value: 'score', text: '🎯 Score' }, { value: 'time', text: ' ⏱️ Time' }], true, selectStyle2);
        const winScoreOrTimeInput = new Input('Win Score or Time', 'text', 'win_score_time', true, 'Points or seconds, respectively');
        
        const form = new FormComponent(
            'Create',
            [tournamentNameInput, winConditionDropdown, winScoreOrTimeInput],
            (data) => CreateTournamentComponent.createTournament(data),
            CreateTournamentComponent.createTournamentCallback,
        );
        form.render(formContainer);
		
        this.element.appendChild(formContainer);
		this.element.append(copyrightLine());
        super.render(parent);
    }
}