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
		// this.element.className = 'w-full h-screen bg-gradient-to-r from-black to-purple-900 flex flex-col items-center justify-center';
		this.element.className = 'w-full h-screen bg-gradient-to-r from-black to-purple-900 flex flex-col';

		// Set the background image section
		const backgroundImage = document.createElement('div');
		backgroundImage.className = 'absolute top-1/2 left-0 transform -translate-y-1/2 w-auto h-auto';  // Ensures it's centered vertically and left

		const image = document.createElement('img');
		image.src = './assets/background_elem.png';  // Replace with the actual path to your transparent image
		image.className = 'w-auto h-auto';  // Adjust width and height accordingly
		image.style.opacity = '0.6';
		image.alt = 'Background Image';
		backgroundImage.appendChild(image);

		// Append the background image container
		this.element.appendChild(backgroundImage);

		// Check window size and conditionally load the GIF
		this.loadGifBasedOnScreenSize();

		// Listen for window resize events to update the GIF visibility dynamically
		window.addEventListener('resize', () => {
			this.loadGifBasedOnScreenSize();
		});

		// Logo and Button Wrapper
		const contentContainer = document.createElement('div');
		contentContainer.className = ' absolute left-60 top-1/2 transform -translate-y-1/2'; // Centered vertically, left side';

		// Logo section
		const logoContainer = document.createElement('div');
		logoContainer.className = 'flex justify-center items-center w-full mb-6'; // Adds spacing below the logo

		const logoImage = document.createElement('img');
		logoImage.src = './assets/PongJamLogo.png';
		// logoImage.className = 'w-full max-w-3xl h-auto object-contain'; // 30% bigger with max-w-lg
		// logoImage.className = 'w-full max-w-lg h-auto object-contain scale-[1.4]'; // 140% size
		logoImage.className = 'w-full max-w-[500px] h-auto object-contain scale-[1.4]';
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
		copyright.className = 'text-white text-xs absolute bottom-4 left-4'; // Always at the bottom left
		copyright.textContent = '© 2025 PongJam. All rights reserved.';

		// Append everything to main element
		this.element.append(contentContainer, copyright);
	}

	private loadGifBasedOnScreenSize() {
        // Check if the window width is larger than a certain threshold (e.g., 1024px for wide screens)
        const isWideScreen = window.innerWidth >= 1600;  // Adjust the threshold based on your preference

        let gifContainer = document.getElementById('gif-container');
        if (isWideScreen && !gifContainer) {
            // Only load the GIF if it's not already loaded
            gifContainer = document.createElement('div');
            gifContainer.id = 'gif-container';
            gifContainer.className = 'absolute right-0 top-1/2 transform -translate-y-1/2';

            const gifImage = document.createElement('img');
            gifImage.src = './assets/home_gif.gif'; // Replace with the path to your GIF
            gifImage.alt = 'Right Side GIF';
			gifImage.style.width = '300%';  // Adjust the percentage as per the screen size
			gifImage.style.height = 'auto';
            gifContainer.appendChild(gifImage);

            this.element.appendChild(gifContainer);
        } else if (!isWideScreen && gifContainer) {
            // Remove the GIF container if the screen is smaller than the threshold
            gifContainer.remove();
        }
    }

	private createNavButton(text: string, path: string): HTMLButtonElement {
		const button = document.createElement('button');
		button.className = 'text-white hover:text-purple-300 p-2';
		button.textContent = text;
		button.onclick = () => { window.location.href = path; };
		return button;
	}
}
