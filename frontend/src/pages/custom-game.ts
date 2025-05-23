import Component from '../components/Component';
import GameSettingsForm from '../components/Form/GameSettingsForm';
import { showToast, ToastState } from '../components/Toast';
import sendRequest, { Services } from '../services/send-request';
import State from '../services/state';

export default class CustomGamePage extends Component {
    readonly element: HTMLElement;
    private customGamesList: HTMLElement;
    private parent: HTMLElement;
    constructor() {
        super();
        this.element = document.createElement('div');
        this.element.className = 'container mx-auto px-4 py-8';
        this.customGamesList = document.createElement('div');
        this.customGamesList.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 mt-8';
        this.parent = this.element;
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
                aiLevel: parseInt(data.aiLevel) || 5,
				kickerMode: data.kickerMode === 'true' || false,
				gainPoints: data.gainPoints === 'true' || false,
				losePoints: data.losePoints === 'true' || false,
            };

            const response = await sendRequest('/queue/create-custom', 'POST', settings, Services.MATCH);
            return response;
        } catch (error) {
            return new Response(null, { status: 400, statusText: 'Bad Request' });
        }
    }

    public async createCallback(data: any): Promise<void> {
        console.log(`result`, data);
        showToast(ToastState.SUCCESS, `Custom game created successfully! Match ID: ${data.match.id}`);
        this.render(this.parent);
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

    public render(parent: HTMLElement): void {
        this.element.innerHTML = '';
        this.parent = parent;
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
            gameCard.className = 'w-full bg-gray-800 rounded-lg p-6 shadow-lg hover:bg-gray-700 transition-colors cursor-pointer mb-4';
            
            const settings = match.settings;
            const participants = match.participants.length;
            const maxPlayers = settings.players;
            
            const content = document.createElement('div');
            content.className = 'space-y-4';
            
            // Game info
            content.innerHTML = `
                <div class="flex justify-between items-center border-b border-gray-700 pb-3">
                    <div class="flex items-center space-x-2">
                        <span class="text-2xl font-bold text-white">${participants}</span>
                        <span class="text-gray-400">/</span>
                        <span class="text-xl text-gray-400">${maxPlayers}</span>
                        <span class="text-gray-400 ml-2">players</span>
                    </div>
                    <span class="text-sm text-gray-400">${new Date(match.createdAt).toLocaleTimeString()}</span>
                </div>
                <div class="grid grid-cols-2 gap-4 text-gray-300">
                    <div class="space-y-2">
                        <p class="flex items-center">
                            <span class="w-24 text-gray-400">AI Players:</span>
                            <span class="font-medium">${settings.aiPlayers || 0}</span>
                        </p>
                        <p class="flex items-center">
                            <span class="w-24 text-gray-400">Balls:</span>
                            <span class="font-medium">${settings.balls}</span>
                        </p>
                        <p class="flex items-center">
                            <span class="w-24 text-gray-400">AI Level:</span>
                            <span class="font-medium">${settings.aiLevel}</span>
                        </p>
                    </div>
                    <div class="space-y-2">
                        <p class="flex items-center">
                            <span class="w-24 text-gray-400">${settings.timeLimit ? 'Time Limit:' : 'Win Score:'}</span>
                            <span class="font-medium">${settings.timeLimit ? `${settings.timeLimit/1000}s` : settings.winScore}</span>
                        </p>
                        <p class="flex items-center">
                            <span class="w-24 text-gray-400">Obstacles:</span>
                            <span class="font-medium">${['No', 'Easy', 'Medium', 'Hard'][settings.obstacleMode]}</span>
                        </p>
                    </div>
                </div>
            `;
            
            gameCard.appendChild(content);
            gameCard.addEventListener('click', () => this.joinCustomGame(match.id));
            
            this.customGamesList.appendChild(gameCard);
        });
    }
} 