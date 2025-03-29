import Button from '../components/Button';
import Component from '../components/Component';

// export default class HomeComponent extends Component {
//     readonly element: HTMLElement;

//     constructor() {
//         // super();
//         // this.element = document.createElement('div');
//         // this.element.className = 'text-center';
//         // const title = document.createElement('h1');
//         // title.className = 'text-2xl font-bold';
//         // title.textContent = "Welcome to The Orca's PONG";
//         // const description = document.createElement('p');
//         // description.className = 'text-gray-600';
//         // description.textContent = 'Welcome to the home page buddy!';
//         // let count = 0;
//         // const counter = document.createElement('p');
//         // counter.className = 'mt-4 text-lg font-semibold';
//         // counter.textContent = `Counter: ${count}`;

//         // const incrementButton = new Button('Increase', () => {
//         //     console.log(`incrementing ${count}`);
//         //     count++;
//         //     counter.textContent = `Counter: ${count + 5}`;
//         // });
//         this.element.append(title, description, counter);
//         incrementButton.render(this);
//     }
// }

// export default class HomeComponent extends Component {
//     readonly element: HTMLElement;

//     constructor() {
//         super();
//         this.element = document.createElement('div');
//         // this.element.className = 'min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-black to-purple-700 text-blue-400';
// 		this.element.className = 'min-h-screen w-full flex flex-col items-center justify-center custom-gradient';

//         const title = document.createElement('h1');
//         title.className = 'text-2xl font-bold';
//         title.textContent = "Welcome to The Orca's PONG";

//         const description = document.createElement('p');
//         description.className = 'text-lg text-gray-400';
//         description.textContent = 'Welcome to the home page buddy!';

//         let count = 0;
//         const counter = document.createElement('p');
//         counter.className = 'mt-4 text-lg font-semibold';
//         counter.textContent = `Counter: ${count}`;

//         const incrementButton = new Button('Increase', () => {
//             console.log(`incrementing ${count}`);
//             count++;
//             counter.textContent = `Counter: ${count + 5}`;
//         });

//         this.element.append(title, description, counter);
//         incrementButton.render(this);
//     }
// }


export default class HomeComponent extends Component {
    readonly element: HTMLElement;

    constructor() {
		super();

		this.element = document.createElement('div');
		this.element.className = 'w-full h-screen bg-gradient-to-r from-black to-purple-900 flex flex-col items-center justify-center';

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

		// Logo and Button Wrapper
		const contentContainer = document.createElement('div');
		contentContainer.className = 'flex flex-col items-center';

		// Logo section
		const logoContainer = document.createElement('div');
		logoContainer.className = 'flex justify-center items-center w-full mb-6'; // Adds spacing below the logo

		const logoImage = document.createElement('img');
		logoImage.src = './assets/PongJamLogo.png';
		// logoImage.className = 'w-full max-w-3xl h-auto object-contain'; // 30% bigger with max-w-lg
		// logoImage.className = 'w-full max-w-lg h-auto object-contain scale-[1.4]'; // 140% size
		logoImage.className = 'w-full max-w-[500px] h-auto object-contain scale-[1.6]';


		logoImage.alt = 'Game Logo';
		logoContainer.appendChild(logoImage);

		logoImage.onerror = function() {
			console.error("Image failed to load");
		};

		// Buttons section
		const buttonContainer = document.createElement('div');
		buttonContainer.className = 'flex justify-center space-x-8 mt-16';

		// Log In Button
		const loginButton = new Button('Log In', () => { 
			console.log('Navigating to /login');
			window.location.href = '/login';
		});
		loginButton.element.className = 'w-60 border-2 border-white bg-white text-purple-900 text-xl font-bold py-2 px-4 rounded-lg shadow-md';

		// Sign Up Button
		const signInButton = new Button('Sign Up', () => { 
			console.log('Navigating to /register');
			window.location.href = '/register';
		});
		signInButton.element.className = 'w-60 border-2 border-white text-white text-xl font-bold py-2 px-4 rounded-lg shadow-md';

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

	private createNavButton(text: string, path: string): HTMLButtonElement {
		const button = document.createElement('button');
		button.className = 'text-white hover:text-purple-300 p-2';
		button.textContent = text;
		button.onclick = () => { window.location.href = path; };
		return button;
	}
}
