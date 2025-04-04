import Button from '../components/Button';
import Component from '../components/Component';
import State, { MyUser } from '../services/state';

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

		// this.element = document.createElement('div');
		// this.element.className = 'w-full h-screen flex flex-col items-center justify-center';

		// Set the background image section
		const backgroundImage = document.createElement('div');
		backgroundImage.className = 'absolute top-1/2 left-0 right-0 transform -translate-y-1/2';  // Ensures it's centered vertically and left

		const image = document.createElement('img');
		image.src = './assets/background_elem.png';  // Replace with the actual path to your transparent image
		image.className = 'w-full h-[300px] object-cover';  // Set width to full, height to fixed value (e.g., 200px)
		image.style.opacity = '0.6';
		image.alt = 'Background Image';
		backgroundImage.appendChild(image);

		// Append the background image container
		this.element.appendChild(backgroundImage);

		// Set the background gif section
		const backgroundGif = document.createElement('div');
		backgroundGif.className = 'absolute top-1/2 left-0 right-0 transform -translate-y-1/2';  // Ensures it's centered vertically and spans the full width of the screen

		const gif = document.createElement('img');
		gif.src = './assets/transparent_pong.gif';  // Replace with the actual path to your transparent gif
		gif.className = 'w-full object-cover';  // Set width to full, height to a fixed value (e.g., 700px)
		gif.style.opacity = '0.4';
		gif.alt = 'Background Gif';
		backgroundGif.appendChild(gif);

		// Append the background image container
		this.element.appendChild(backgroundGif);

		// Logo and Button Wrapper
		const contentContainer = document.createElement('div');
		contentContainer.className = 'flex flex-col items-center';

		// Logo section
		const logoContainer = document.createElement('div');
		logoContainer.className = 'flex justify-center items-center w-full mb-6'; // Adds spacing below the logo

		const logoImage = document.createElement('img');
		logoImage.src = './assets/PongJamLogo.png';
		logoImage.className = 'w-full max-w-[400px] h-auto object-contain scale-[1.6]';

		logoImage.alt = 'Game Logo';
		logoContainer.appendChild(logoImage);

		logoImage.onerror = function() {
			console.error("Image failed to load");
		};

		// Buttons section
		const buttonContainer = document.createElement('div');
		buttonContainer.className = 'flex justify-center space-x-8 mt-16 relative z-10';

		// Log In Button
		const loginButton = new Button('Log In', () => { 
			console.log('Navigating to /login');
			window.location.href = '/login';
		});
		loginButton.element.className = 'w-60 border-2 border-white bg-white text-purple-900 text-xl font-bold py-2 px-4 rounded-lg hover:bg-[#D1C4E9]';

		// Sign Up Button
		const signInButton = new Button('Sign Up', () => { 
			console.log('Navigating to /register');
			window.location.href = '/register';
		});
		signInButton.element.className = 'w-60 border-2 border-white text-white text-xl font-bold py-2 px-4 rounded-lg hover:bg-[#451f6b]';

		// Append buttons to the container
		buttonContainer.appendChild(loginButton.element);
		buttonContainer.appendChild(signInButton.element);

		contentContainer.append(logoContainer, buttonContainer);

		// Copyright section
		const copyright = document.createElement('p');
		copyright.className = 'text-white text-xs absolute bottom-4 left-1/2 transform -translate-x-1/2'; // Always at the bottom left
		copyright.textContent = '© 2025 PongJam. All rights reserved.';

		// Append everything to main element
		this.element.append(contentContainer, copyright);
	}

	private buildLoggedInUI() {

		const backgroundGif = document.createElement('div');
		backgroundGif.className = 'absolute top-1/2 left-0 right-0 transform -translate-y-1/2';  // Ensures it's centered vertically and spans the full width of the screen

		const gif = document.createElement('img');
		gif.src = './assets/transparent_pong.gif';  // Replace with the actual path to your transparent gif
		gif.className = 'w-full object-cover';  // Set width to full, height to a fixed value (e.g., 700px)
		gif.style.opacity = '0.4';
		gif.alt = 'Background Gif';
		backgroundGif.appendChild(gif);

		// Append the background image container
		this.element.appendChild(backgroundGif);

		const contentContainer = document.createElement('div');
		contentContainer.className = 'flex flex-col items-center';
		
		const logoContainer = document.createElement('div');
		logoContainer.className = 'flex justify-center items-center w-full mb-10';
		
		const playGif = document.createElement('img');
		playGif.src = './assets/play.gif';
		playGif.className = 'w-full max-w-[400px] h-auto object-contain scale-[1.6] mb-16 mx-auto';

		playGif.alt = 'Game Logo';
		logoContainer.appendChild(playGif);
		
		// Buttons section
		// const buttonContainer = document.createElement('div');
		// buttonContainer.className = 'flex justify-center space-x-8 relative z-10';
		const buttonContainer = document.createElement('div');
		// buttonContainer.className = 'flex flex-col items-center space-y-6 relative z-10';
		buttonContainer.className = 'flex flex-wrap justify-center gap-6 max-w-full mb-8 relative z-10';


		// SINGLE PLAYER - Light Blue Border
		const singlePlayerButton = new Button('      SINGLE PLAYER', () => {
			console.log('Navigating to /singlegame');
			window.location.href = '/singlegame';
		});
		singlePlayerButton.element.style.fontFamily = '"Impact", "Arial Black", sans-serif'; // Impact is thicker
		singlePlayerButton.element.style.fontWeight = '900'; // Ensures max boldness
		singlePlayerButton.element.style.color = 'black'; // White inside
		singlePlayerButton.element.style.fontSize = '2.5rem'; // Make the text big
		singlePlayerButton.element.style.padding = '16px 32px'; // More space inside button
		singlePlayerButton.element.style.width = 'auto'; // Prevents squishing
		singlePlayerButton.element.style.height = 'auto'; // Adjusts dynamically
		singlePlayerButton.element.style.webkitTextStroke = '1.5px #20A4D6'; // Thinner light blue outline

		// MULTIPLE PLAYERS - Pink Border
		const multiplayerButton = new Button('MULTIPLE PLAYERS', () => {
			console.log('Navigating to /multiplayer');
			window.location.href = '/multiplayer';
		});
		multiplayerButton.element.style.fontFamily = '"Impact", "Arial Black", sans-serif';
		multiplayerButton.element.style.fontWeight = '900';
		multiplayerButton.element.style.color = 'black';
		multiplayerButton.element.style.fontSize = '2.5rem';
		multiplayerButton.element.style.padding = '16px 32px';
		multiplayerButton.element.style.width = 'auto';
		multiplayerButton.element.style.height = 'auto';
		multiplayerButton.element.style.webkitTextStroke = '1.5px #FF69B4'; // Thinner pink outline

		// TOURNAMENT - Yellow Border
		const tournamentButton = new Button('TOURNAMENT', () => {
			console.log('Navigating to /tournament');
			window.location.href = '/tournament';
		});
		tournamentButton.element.style.fontFamily = '"Impact", "Arial Black", sans-serif';
		tournamentButton.element.style.fontWeight = '900';
		tournamentButton.element.style.color = 'black';
		tournamentButton.element.style.fontSize = '2.5rem';
		tournamentButton.element.style.padding = '16px 32px';
		tournamentButton.element.style.width = 'auto';
		tournamentButton.element.style.height = 'auto';
		tournamentButton.element.style.webkitTextStroke = '1.5px #FFCC00'; // Thinner yellow outline

		// // First row: Single Player & Multiplayer
		// const upperButtons = document.createElement('div');
		// upperButtons.className = 'flex justify-center space-x-8';

		// // Add both buttons inside this row
		// upperButtons.appendChild(singlePlayerButton.element);
		// upperButtons.appendChild(multiplayerButton.element);

		// // Add everything to the button container
		// buttonContainer.appendChild(upperButtons);
		buttonContainer.appendChild(singlePlayerButton.element);
		buttonContainer.appendChild(multiplayerButton.element);
		buttonContainer.appendChild(tournamentButton.element);

		// Append all visual sections in order
		contentContainer.append(logoContainer, buttonContainer);
		
		// Footer
		const copyright = document.createElement('p');
		copyright.className = 'text-white text-xs absolute bottom-4 left-1/2 transform -translate-x-1/2';
		copyright.textContent = '© 2025 PongJam. All rights reserved.';
		
		// Append to main element
		this.element.append(contentContainer, copyright);
	}	

	private createNavButton(text: string, path: string): HTMLButtonElement {
		const button = document.createElement('button');
		button.className = 'text-white hover:text-purple-300 p-2';
		button.textContent = text;
		button.onclick = () => { window.location.href = path; };
		return button;
	}
}
