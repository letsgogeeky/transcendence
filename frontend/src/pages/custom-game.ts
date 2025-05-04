import Component from '../components/Component';
import GameSettingsForm from '../components/Form/GameSettingsForm';
import { showToast, ToastState } from '../components/Toast';
import sendRequest, { Services } from '../services/send-request';
import State from '../services/state';

export default class CustomGamePage extends Component {
    readonly element: HTMLElement;
    private customGamesList: HTMLElement;

    constructor() {
        super();
        this.element = document.createElement('div');
        this.element.className = 'container mx-auto px-4 py-8';
        this.customGamesList = document.createElement('div');
        this.customGamesList.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8';
    }

    private async handleGameCreation(data: any) {
        try {
            // Convert form data to appropriate types
            const settings = {
                players: parseInt(data.players),
                aiPlayers: parseInt(data.aiPlayers) || 0,
                timeLimit: parseInt(data.timeLimit) * 1000 || 0, // Convert to milliseconds
                winScore: parseInt(data.winScore) || 0,
                startScore: parseInt(data.startScore) || 0,
                replaceDisconnected: data.replaceDisconnected === 'true',
                terminatePlayers: data.terminatePlayers === 'true',
                friendlyFire: data.friendlyFire === 'true',
                obstacleMode: parseInt(data.obstacleMode),
                balls: parseInt(data.balls) || 1,
                aiLevel: parseInt(data.aiLevel) || 5
            };

            const response = await sendRequest('/queue/create-custom', 'POST', settings, Services.MATCH);
            return response;
        } catch (error) {
            return new Response(null, { status: 400, statusText: 'Bad Request' });
        }
    }

    public async createCallback(response: Response): Promise<void> {
        if (!response || !response.ok) {
            showToast(ToastState.ERROR, 'Failed to create custom game');
            return;
        }
        const result = await response.json();
        showToast(ToastState.SUCCESS, `Custom game created successfully! Match ID: ${result.match.id}`);
        // rerender the page
        this.render(this.element);
    }

    private async loadCustomGames() {
        try {
            const response = await sendRequest('/queue/get-custom-games', 'GET', null, Services.MATCH);
            if (!response.ok) {
                throw new Error('Failed to load custom games');
            }
            const data = await response.json();
            this.renderCustomGamesList(data.matches);
        } catch (error) {
            if (error instanceof Error) {
                showToast(ToastState.ERROR, error.message);
            } else {
                showToast(ToastState.ERROR, 'Failed to load custom games');
            }
        }
    }

    private async joinCustomGame(matchId: string) {
        try {
            const response = await sendRequest('/queue/create-preconfigured', 'POST', { mode: "custom", matchId: matchId }, Services.MATCH);
            if (response.ok) {
                const result = await response.json();
                showToast(ToastState.SUCCESS, `Joined custom game successfully! Match ID: ${result.match.id}`);
            } else {
                const error = await response.json();
                showToast(ToastState.ERROR, error.error);
            }
        } catch (error) {
            if (error instanceof Error) {
                showToast(ToastState.ERROR, error.message);
            } else {
                showToast(ToastState.ERROR, 'An unexpected error occurred');
            }
        }
    }

    public render(parent: HTMLElement | Component): void {
        this.element.innerHTML = '';

        // Create header
        const header = document.createElement('h1');
        header.className = 'text-4xl font-bold text-white mb-8 text-center';
        header.textContent = 'Create Custom Game';
        this.element.appendChild(header);

        // Create description
        const description = document.createElement('p');
        description.className = 'text-gray-300 mb-8 text-center max-w-2xl mx-auto';
        description.textContent = 'Customize your game settings to create a unique gaming experience. Adjust the number of players, AI difficulty, game duration, and more.';
        this.element.appendChild(description);

        // Create main container for form and games list
        const mainContainer = document.createElement('div');
        mainContainer.className = 'flex flex-col lg:flex-row gap-8 justify-center items-start';
        this.element.appendChild(mainContainer);

        // Create form container
        const formContainer = document.createElement('div');
        formContainer.className = 'w-full lg:w-1/2 max-w-2xl bg-gray-800 rounded-lg p-8 shadow-lg';
        mainContainer.appendChild(formContainer);

        // Create and render the game settings form
        const gameSettingsForm = new GameSettingsForm(
            this.handleGameCreation.bind(this),
            this.createCallback.bind(this)
        );
        gameSettingsForm.render(formContainer);

        // Add section for available custom games
        const gamesSection = document.createElement('div');
        gamesSection.className = 'w-full lg:w-1/2';
        
        const gamesHeader = document.createElement('h2');
        gamesHeader.className = 'text-2xl font-bold text-white mb-4 text-center';
        gamesHeader.textContent = 'Available Custom Games';
        gamesSection.appendChild(gamesHeader);
        
        gamesSection.appendChild(this.customGamesList);
        mainContainer.appendChild(gamesSection);

        // Load custom games
        this.loadCustomGames();

        super.render(parent);
    }

    private renderCustomGamesList(matches: any[]) {
        this.customGamesList.innerHTML = '';
        
        if (matches.length === 0) {
            // Hide the games section when there are no games
            const gamesSection = this.customGamesList.parentElement;
            if (gamesSection) {
                gamesSection.style.display = 'none';
                // Center the form
                const formContainer = gamesSection.previousElementSibling;
                if (formContainer) {
                    formContainer.className = 'w-full max-w-2xl mx-auto bg-gray-800 rounded-lg p-8 shadow-lg';
                }
            }
            return;
        }

        // Show the games section when there are games
        const gamesSection = this.customGamesList.parentElement;
        if (gamesSection) {
            gamesSection.style.display = 'block';
            // Adjust form width for side-by-side layout
            const formContainer = gamesSection.previousElementSibling;
            if (formContainer) {
                formContainer.className = 'w-full lg:w-1/2 max-w-2xl bg-gray-800 rounded-lg p-8 shadow-lg';
            }
        }

        matches.forEach(match => {
            const gameCard = document.createElement('div');
            gameCard.className = 'bg-gray-800 rounded-lg p-4 shadow-lg hover:bg-gray-700 transition-colors cursor-pointer mb-4';
            
            const settings = match.settings;
            const participants = match.participants.length;
            const maxPlayers = settings.players;
            
            const content = document.createElement('div');
            content.className = 'space-y-2';
            
            // Game info
            content.innerHTML = `
                <div class="flex justify-between items-center">
                    <span class="text-white font-bold">Players: ${participants}/${maxPlayers}</span>
                    <span class="text-gray-400">${new Date(match.createdAt).toLocaleTimeString()}</span>
                </div>
                <div class="text-gray-300">
                    <p>AI Players: ${settings.aiPlayers || 0}</p>
                    <p>${settings.timeLimit ? `Time Limit: ${settings.timeLimit/1000}s` : `Win Score: ${settings.winScore}`}</p>
                    <p>Balls: ${settings.balls}</p>
                    <p>AI Level: ${settings.aiLevel}</p>
                    <p>Obstacles: ${['No', 'Easy', 'Medium', 'Hard'][settings.obstacleMode]}</p>
                </div>
            `;
            
            gameCard.appendChild(content);
            gameCard.addEventListener('click', () => this.joinCustomGame(match.id));
            
            this.customGamesList.appendChild(gameCard);
        });
    }
} 