import Button from '../components/button';
import Component from '../components/Component';
import sendRequest from '../services/send-request';
import { Services } from '../services/send-request';
import State, { MyUser } from '../services/state';
import { loadBackgroundGif, loadImage, copyrightLine } from '../styles/background'
import { createStyledButton } from '../styles/button_styles'
import { showToast, ToastState } from '../components/Toast';

export default class HomeComponent extends Component {
    readonly element: HTMLElement;
	constructor() {
		super();
		this.element = document.createElement('div');
		this.element.className = 'w-full h-screen flex flex-col items-center justify-center';
	
		// Initial render
		this.renderBasedOnUser();
	
		// Listen for login/logout changes
		window.addEventListener('userChange', () => {
			this.element.innerHTML = ''; // Clear previous content
			this.renderBasedOnUser();    // Rebuild based on latest state of user (whether he's logged in or not)
		});
	}
	
	private renderBasedOnUser() {
		const user = State.getState().getCurrentUser();
		if (user) {
			this.buildLoggedInUI();
		} else {
			this.buildLoggedOutUI();
		}
	}

	private buildLoggedOutUI() {

		// Set the background image section
		const backgroundImage = document.createElement('div');
		backgroundImage.className = 'absolute top-1/2 left-0 right-0 transform -translate-y-1/2';  // Ensures it's centered vertically and left

		// adds the background transparent decorative stripes:
		backgroundImage.appendChild(loadImage('background_elem.png', 'w-full h-[300px] object-cover', 'background styling element', 0.6));
		this.element.appendChild(backgroundImage);

		// adds the background gif 
		this.element.appendChild(loadBackgroundGif());

		// Logo and Button Wrapper
		const contentContainer = document.createElement('div');
		contentContainer.className = 'flex flex-col items-center';

		// Logo section
		const logoContainer = document.createElement('div');
		logoContainer.className = 'flex justify-center items-center w-full mb-6'; // Adds spacing below the logo

		logoContainer.appendChild(loadImage('PongJamLogo.png', 'w-full max-w-[400px] h-auto object-contain scale-[1.6]', 'Game Logo'));

		// Buttons section
		const buttonContainer = document.createElement('div');
		buttonContainer.className = 'flex justify-center space-x-8 mt-16 relative z-10';

		const loginButton = new Button(
			'Log In',
			() => (window.location.href = '/login'),
			'w-60 border-2 border-white bg-white text-purple-900 text-xl font-bold py-2 px-4 rounded-lg hover:bg-[#D1C4E9]'
		);
		
		const signInButton = new Button(
			'Sign Up',
			() => (window.location.href = '/register'),
			'w-60 border-2 border-white text-white text-xl font-bold py-2 px-4 rounded-lg hover:bg-[#451f6b]'
		);
		
		// Append buttons to the container
		buttonContainer.appendChild(loginButton.element);
		buttonContainer.appendChild(signInButton.element);

		contentContainer.append(logoContainer, buttonContainer);

		// Append everything to main element
		this.element.append(contentContainer, copyrightLine());
	}

	private async createPreconfiguredGame(mode: string) {
		try {
			const body = {
				mode: mode,
			};
			const response = await sendRequest(`/queue/create-preconfigured`, 'POST', body, Services.MATCH);

			if (!response.ok) {
				const data = await response.json();
				showToast(ToastState.ERROR, data.error);
				return;
			}

			const data = await response.json();
			// Redirect to the game page with the match ID
			window.location.href = `/game/${data.match.id}`;
		} catch (error) {
			console.error('Error creating game:', error);
			showToast(ToastState.ERROR, 'Failed to create game. Please try again.');
		}
	}

	private buildLoggedInUI() {
		this.element.appendChild(loadBackgroundGif());

		const contentContainer = document.createElement('div');
		contentContainer.className = 'flex flex-col items-center relative z-10';
		
		const logoContainer = document.createElement('div');
		logoContainer.className = 'flex justify-center items-center w-full mb-10';
		
		logoContainer.appendChild(loadImage('play.gif', 'w-full max-w-[400px] h-auto object-contain scale-[1.6] mb-16 mx-auto', 'PLAY gif'));
		
		// Buttons section
		const buttonContainer = document.createElement('div');
		buttonContainer.className = 'flex flex-wrap justify-center gap-6 max-w-full mb-8 relative z-10';

		// Preconfigured game mode buttons
		const gameModeContainer = document.createElement('div');
		gameModeContainer.className = 'flex flex-wrap justify-center gap-4 mb-8 relative z-10';
		
		const gameModes = [
			{ mode: '1v1', label: '1v1', color: '#4CAF50' },
			{ mode: '1vAI', label: '1vAI', color: '#2196F3' },
			{ mode: '2v2', label: '2v2', color: '#FF9800' },
			{ mode: 'All vs All', label: 'All vs All', color: '#E91E63' }
		];

		gameModes.forEach(({ mode, label, color }) => {
			const button = new Button(
				label,
				() => this.createPreconfiguredGame(mode),
				`w-40 border-2 border-white text-white text-lg font-bold py-2 px-4 rounded-lg hover:bg-opacity-80 cursor-pointer relative z-10`
			);
			button.element.style.backgroundColor = color;
			button.element.style.pointerEvents = 'auto';
			gameModeContainer.appendChild(button.element);
		});

		// Existing buttons
		buttonContainer.appendChild(createStyledButton('SINGLE PLAYER', '/singlegame', '#20A4D6'));
		buttonContainer.appendChild(createStyledButton('MULTIPLE PLAYERS', '/multiplayer/index.html', '#FF69B4'));
		buttonContainer.appendChild(createStyledButton('TOURNAMENT', '/create-tournament', '#FFCC00'));

		// Append all visual sections in order
		contentContainer.append(logoContainer, gameModeContainer, buttonContainer);
		
		// Footer
		const copyright = document.createElement('p');
		copyright.className = 'text-white text-xs absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10';
		copyright.textContent = '© 2025 PongJam. All rights reserved.';
		
		// Append to main element
		this.element.append(contentContainer, copyright);
	}
}
