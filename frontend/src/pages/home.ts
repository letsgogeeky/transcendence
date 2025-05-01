import Button from '../components/button';
import Component from '../components/Component';
import sendRequest from '../services/send-request';
import LinkComponent from '../components/Link';
import { Services } from '../services/send-request';
import State, { MyUser } from '../services/state';
import { loadBackgroundGif, loadImage, copyrightLine } from '../styles/background'
import { createStyledButtonWithHandler, applyStyledAppearance } from '../styles/button_styles'
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

	private async isInQueue() {
		const response = await sendRequest(`/queue/is-in-queue`, 'GET', {}, Services.MATCH);
		if (!response.ok) {
			const data = await response.json();
			showToast(ToastState.ERROR, data.error);
			return null;
		}
		return await response.json();
	}

	private async leaveQueue() {
		const response = await sendRequest(`/queue/leave-queue`, 'POST', {}, Services.MATCH);
		if (!response.ok) {
			const data = await response.json();
			showToast(ToastState.ERROR, data.error);
			return;
		}
		showToast(ToastState.SUCCESS, 'Left queue successfully');
		this.buildLoggedInUI();
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

		// if (window.innerWidth >= 2000) {
		// 	logoClass += ' max-w-[600px]'; // for the Mac in School
		// } else {
		// 	logoClass += ' max-w-[400px]'; //how i designed it initially for laptop screens
		// }
		// logoContainer.appendChild(loadImage('PongJamLogo.png', logoClass, 'Game Logo'));
		logoContainer.appendChild(loadImage('PongJamLogo.png', 'w-full max-w-[450px] h-auto object-contain scale-[1.6]', 'Game Logo'));

		// Buttons section
		const buttonContainer = document.createElement('div');
		buttonContainer.className = 'flex justify-center space-x-8 mt-16 relative z-10';

		const loginLink = new LinkComponent('Log In', '/login');
		loginLink.element.className = 'w-60 border-2 text-center border-white bg-white text-purple-900 text-xl font-bold py-2 px-4 rounded-lg hover:bg-[#D1C4E9]';
		loginLink.render(this.element);

		const signupLink = new LinkComponent('Sign Up', '/register');
		signupLink.element.className = 'w-60 border-2 text-center border-white text-white text-xl font-bold py-2 px-4 rounded-lg hover:bg-[#451f6b]';
		signupLink.render(this.element);

		// Append buttons to the container
		buttonContainer.appendChild(loginLink.element);
		buttonContainer.appendChild(signupLink.element);

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
			if (data.match) {
				showToast(ToastState.SUCCESS, 'Queue joined successfully');
				this.buildLoggedInUI();
			} else {
				showToast(ToastState.ERROR, 'Failed to join queue. Please try again.');
			}
		} catch (error) {
			console.error('Error creating game:', error);
			showToast(ToastState.ERROR, 'Failed to create game. Please try again.');
		}
	}

	private async buildLoggedInUI() {
		const isInQueue = await this.isInQueue();
		this.element.innerHTML = '';
		this.element.appendChild(loadBackgroundGif());

		const contentContainer = document.createElement('div');
		contentContainer.className = 'flex flex-col items-center relative z-10';
		
		const logoContainer = document.createElement('div');
		logoContainer.className = 'flex justify-center items-center w-full mb-10';
		
		logoContainer.appendChild(loadImage('play.gif', 'w-full max-w-[400px] h-auto object-contain scale-[1.6] mb-16 mx-auto', 'PLAY gif'));
		
		// Preconfigured game mode buttons
		const gameModeContainer = document.createElement('div');
		gameModeContainer.className = 'flex flex-wrap justify-center gap-8 mb-8 relative z-10';
		

		const gameModes = [
			{ mode: '1v1', label: '1 v 1', color: '#73e775' },
			{ mode: '2v2', label: '2 v 2', color: '#FF69B4' },
			{ mode: '1vAI', label: '1 vs AI', color: '#FFCC00' },
			{ mode: 'All vs All', label: 'All vs All', color: '#20A4D6' }
		];
		
		gameModes.forEach(({ mode, label, color }) => {
			const btn = createStyledButtonWithHandler(
				label,
				() => this.createPreconfiguredGame(mode),
				color
			);
			gameModeContainer.appendChild(btn);
		});
		
		const tournamentLink = new LinkComponent('Tournament', '/create-tournament');
		applyStyledAppearance(tournamentLink.element, '#b98cdc');
		tournamentLink.render(this.element);

		gameModeContainer.appendChild(tournamentLink.element);

		// const gameModes = [
		// 	{ mode: '1v1', label: '1v1', color: '#4CAF50' },
		// 	{ mode: '1vAI', label: '1vAI', color: '#2196F3' },
		// 	{ mode: '2v2', label: '2v2', color: '#FF9800' },
		// 	{ mode: 'All vs All', label: 'All vs All', color: '#E91E63' }
		// ];

		// gameModes.forEach(({ mode, label, color }) => {
		// 	const button = new Button(
		// 		label,
		// 		() => this.createPreconfiguredGame(mode),
		// 		`w-40 border-2 border-white text-white text-lg font-bold py-2 px-4 rounded-lg hover:bg-opacity-80 cursor-pointer relative z-10`
		// 	);
		// 	button.element.style.backgroundColor = color;
		// 	button.element.style.pointerEvents = 'auto';
		// 	gameModeContainer.appendChild(button.element);
		// });

		contentContainer.append(logoContainer, gameModeContainer);

		if (isInQueue?.inQueue) {
			// show queue countdown
			const queueCountdown = document.createElement('div');
			queueCountdown.className = 'flex flex-wrap justify-center gap-4 mb-8 relative z-10 text-white text-lg font-bold';
			queueCountdown.textContent = `In Queue since ${isInQueue.since}`;
			contentContainer.append(queueCountdown);

			const leaveQueueButtonContainer = document.createElement('div');
			leaveQueueButtonContainer.className = 'flex flex-wrap justify-center gap-4 mb-8 relative z-10';

			const leaveQueueButton = new Button(
				'Leave Queue',
				() => this.leaveQueue(),
				'w-40 border-2 border-white text-white text-lg font-bold py-2 px-4 rounded-lg hover:bg-opacity-80 cursor-pointer relative z-10'
			);
			leaveQueueButton.element.style.backgroundColor = '#E91EA3';
			leaveQueueButton.element.style.pointerEvents = 'auto';
			leaveQueueButtonContainer.appendChild(leaveQueueButton.element);
			contentContainer.append(leaveQueueButtonContainer);
		}

		// Append to main element
		this.element.append(contentContainer, copyrightLine());
	}
}
