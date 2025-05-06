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
		this.element.innerHTML = '';
		// Set the background image section
		const backgroundImage = document.createElement('div');
		backgroundImage.className = 'w-full flex justify-center mt-[-6rem]';

		const gifWrapper = document.createElement('div');
		gifWrapper.className = 'fade-mask w-full max-w-[1000px] scale-[1.6] mx-auto';
		const video = document.createElement('video');
		video.src = 'assets/PONG.mp4'; // path to your video file
		video.autoplay = true;
		video.muted = true;
		video.loop = true;
		video.playsInline = true; // important for mobile
		video.className = 'w-full h-auto object-contain';
		
		gifWrapper.appendChild(video);
		backgroundImage.appendChild(gifWrapper);

		this.element.appendChild(backgroundImage);

		// Buttons section
		const buttonContainer = document.createElement('div');
		buttonContainer.className = `
				absolute top-[65%] left-1/2 transform -translate-x-1/2
				flex justify-center items-center space-x-8 z-10
			`;

		const loginLink = new LinkComponent('Log In', '/login');
		// applyStyledAppearance(loginLink.element, '#d4cade');
		loginLink.element.className = 'w-60 border-2 text-center border-white bg-[#a59daf] text-purple-900 text-xl font-bold py-2 px-4 rounded-lg hover:bg-[#D1C4E9]';
		loginLink.render(this.element);

		const signupLink = new LinkComponent('Sign Up', '/register');
		// applyStyledAppearance(signupLink.element, '#d4cade');
		signupLink.element.className = 'w-60 border-2 text-center border-white text-[#e9daf0] text-xl font-bold py-2 px-4 rounded-lg hover:bg-[#451f6b]';
		signupLink.render(this.element);

		// Append buttons to the container
		buttonContainer.appendChild(loginLink.element);
		buttonContainer.appendChild(signupLink.element);

		// contentContainer.append(logoContainer, );

		// Append everything to main element
		this.element.append(buttonContainer, copyrightLine());
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
				// this.buildLoggedInUI();
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
		const btn1v1Local = createStyledButtonWithHandler('1 v 1 (same keyboard)', () => this.createPreconfiguredGame('1v1guest'), '#f9de91');
		const btnVsAI = createStyledButtonWithHandler(`against AI (Level ${level.level})`, () => this.createPreconfiguredGame('1vAI'), '#cb9a0d');
		const localSection = createSection('LOCALLY', [btn1v1Local, btnVsAI], '#FFCC00'); // yellow
		
		// Remote buttons
		const btn1v1Online = createStyledButtonWithHandler('2 players', () => this.createPreconfiguredGame('1v1'), '#baddf3');
		const btn2v2 = createStyledButtonWithHandler('4 players', () => this.createPreconfiguredGame('2v2'), '#2acdf5');
		// const btnAllVsAll = createStyledButtonWithHandler('All vs All', () => this.createPreconfiguredGame('All vs All'), '#077eb9');
		const createCustomGameLink = new LinkComponent('Custom Game', '/custom-game');
		applyStyledAppearance(createCustomGameLink.element, '#077eb9');
		const remoteSection = createSection('REMOTELY', [btn1v1Online, btn2v2, createCustomGameLink.element], '#20A4D6'); // blue
		// const remoteSection = createSection('REMOTELY', [btn1v1Online, btn2v2, btnAllVsAll, createCustomGameLink.element], '#20A4D6'); // blue

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
