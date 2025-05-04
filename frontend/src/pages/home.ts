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
				this.renderBasedOnUser();
			} else {
				showToast(ToastState.ERROR, 'Failed to join queue. Please try again.');
			}
		} catch (error) {
			console.error('Error creating game:', error);
			showToast(ToastState.ERROR, 'Failed to create game. Please try again.');
		}
	}

	private async getPlayerLevelAgainstAI() {
		const user = State.getState().getCurrentUser();
		if (!user) {
			return 1;
		}
		const response = await sendRequest(`/queue/get-player-level-against-ai`, 'GET', {}, Services.MATCH);
		if (!response.ok) {
			const data = await response.json();
			showToast(ToastState.ERROR, data.error);
			return 1;
		}
		return await response.json();
	}

	private async buildLoggedInUI() {
		const isInQueue = await this.isInQueue();
		const level = await this.getPlayerLevelAgainstAI();
		this.element.innerHTML = '';
		this.element.appendChild(loadBackgroundGif());

		// const contentContainer = document.createElement('div');
		// contentContainer.className = 'flex flex-col items-center relative z-10';
		
		// const logoContainer = document.createElement('div');
		// logoContainer.className = 'flex justify-center items-center w-full mb-10';
		
		// logoContainer.appendChild(loadImage('play.gif', 'w-full max-w-[400px] h-auto object-contain scale-[1.6] mb-16 mx-auto', 'PLAY gif'));
		
		// // Preconfigured game mode buttons
		// const gameModeContainer = document.createElement('div');
		// gameModeContainer.className = 'flex flex-wrap justify-center gap-8 mb-8 relative z-10';

		// const gameModes = [
		// 	{ mode: '1v1guest', label: `1 v 1 (Local)`, color: '#ABE770' },
		// 	{ mode: '1v1', label: '1 v 1 (Online)', color: '#73e775' },
		// 	{ mode: '2v2', label: '2 v 2', color: '#FF69B4' },
		// 	{ mode: '1vAI', label: `1 vs AI (Level ${level.level})`, color: '#FFCC00' },
		// 	{ mode: 'All vs All', label: 'All vs All', color: '#20A4D6' }
		// ];
		
		// gameModes.forEach(({ mode, label, color }) => {
		// 	const btn = createStyledButtonWithHandler(
		// 		label,
		// 		() => this.createPreconfiguredGame(mode),
		// 		color
		// 	);
		// 	gameModeContainer.appendChild(btn);
		// });
		
		// const tournamentLink = new LinkComponent('Tournament', '/create-tournament');
		// applyStyledAppearance(tournamentLink.element, '#b98cdc');
		// tournamentLink.render(this.element);

		// gameModeContainer.appendChild(tournamentLink.element);

		// contentContainer.append(logoContainer, gameModeContainer);

		const contentContainer = document.createElement('div');
		contentContainer.className = 'flex flex-col items-center relative z-10';

		// Centered PLAY GIF
		const logoContainer = document.createElement('div');
		logoContainer.className = 'flex justify-center items-center w-full mb-10';
		logoContainer.appendChild(loadImage('play.gif', 'w-full max-w-[400px] h-auto object-contain scale-[1.6] mb-16 mx-auto', 'PLAY gif'));
		contentContainer.appendChild(logoContainer);

		// Flex container for the three sections: Local, Remote, Tournament
		const sectionsContainer = document.createElement('div');
		sectionsContainer.className = 'flex flex-wrap justify-center gap-20 w-full';


		// Helper to create section blocks
		const createSection = (title: string, buttons: HTMLElement[], color: string) => {
			const section = document.createElement('div');
			// section.className = 'flex w-86 flex-col items-center gap-4';
			section.className = 'flex flex-col items-center gap-4 w-72';
		
			const sectionTitle = document.createElement('h1');
			sectionTitle.textContent = title;
			// sectionTitle.className = 'text-[32px] font-extrabold mb-2';
			sectionTitle.className = 'font-black text-[2.5rem] px-8 py-4 text-black transition-all pointer-events-auto font-impact rounded-xl';
			sectionTitle.style.webkitTextStroke = `1.5px ${color}`;
			sectionTitle.style.textShadow = `0 0 6px ${color}, 0 0 12px ${color}`;
			sectionTitle.style.fontFamily = 'Arial Black, Gadget, sans-serif';

			section.appendChild(sectionTitle);
			buttons.forEach(btn => section.appendChild(btn));
			return section;
		};

		// Local buttons
		const btn1v1Local = createStyledButtonWithHandler('1 v 1', () => this.createPreconfiguredGame('1v1guest'), '#f9de91');
		const btnVsAI = createStyledButtonWithHandler(`against AI (Level ${level.level})`, () => this.createPreconfiguredGame('1vAI'), '#cb9a0d');
		const localSection = createSection('LOCALLY', [btn1v1Local, btnVsAI], '#FFCC00'); // yellow
		
		// Remote buttons
		const btn1v1Online = createStyledButtonWithHandler('1 v 1', () => this.createPreconfiguredGame('1v1'), '#baddf3');
		const btn2v2 = createStyledButtonWithHandler('2 v 2', () => this.createPreconfiguredGame('2v2'), '#2acdf5');
		const btnAllVsAll = createStyledButtonWithHandler('All vs All', () => this.createPreconfiguredGame('All vs All'), '#077eb9');
		const remoteSection = createSection('REMOTELY', [btn1v1Online, btn2v2, btnAllVsAll], '#20A4D6'); // blue

		// Tournament buttons
		const createTournamentLink = new LinkComponent('Create Tournament', '/create-tournament');
		applyStyledAppearance(createTournamentLink.element, '#f5b3eb');

		const viewTournamentsLink = new LinkComponent('View Tournaments', '/tournaments');
		applyStyledAppearance(viewTournamentsLink.element, '#c433a1');

		const tournamentSection = createSection('TOURNAMENT', [createTournamentLink.element, viewTournamentsLink.element], '#eb5ba5'); // magenta

		// Append sections to main container
		sectionsContainer.append(localSection, remoteSection, tournamentSection);
		contentContainer.appendChild(sectionsContainer);

		this.element.appendChild(contentContainer);

		if (isInQueue?.inQueue) {
			// show queue countdown
			const queueCountdown = document.createElement('div');
			queueCountdown.className = 'flex flex-wrap text-[#dccde4] justify-center gap-4 mt-20 mb-8 relative z-10 text-lg font-bold';
			queueCountdown.textContent = `⏳ In Queue since ${isInQueue.since}`;
			contentContainer.append(queueCountdown);
		
			const leaveQueueButtonContainer = document.createElement('div');
			leaveQueueButtonContainer.className = 'flex flex-wrap justify-center gap-4 mb-8 relative z-10';

			const leaveQueueButton = new Button(
				'Leave Queue 🔚 ',
				() => this.leaveQueue(),
				'w-auto text-xl font-bold py-2 px-4 rounded-lg relative z-10 cursor-pointer border-[3px] text-[#87184b] border-[#87184b] bg-[#dccde4] hover:brightness-105 whitespace-nowrap'
			);
		
			// Hover sparkle effect
			const buttonEl = leaveQueueButton.element;
			buttonEl.addEventListener('mouseenter', () => {
				buttonEl.style.boxShadow = '0 0 10px 2px #87184b';
			});
			buttonEl.addEventListener('mouseleave', () => {
				buttonEl.style.boxShadow = 'none';
			});
			leaveQueueButtonContainer.appendChild(buttonEl);
			
			// leaveQueueButtonContainer.appendChild(leaveQueueButton);
			contentContainer.append(leaveQueueButtonContainer);
		}
		

		// Append to main element
		this.element.append(contentContainer, copyrightLine());
	}

	public render(parent: HTMLElement | Component): void {
		this.renderBasedOnUser();
		super.render(parent);
	}
}
