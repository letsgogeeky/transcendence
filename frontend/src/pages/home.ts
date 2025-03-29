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
        this.element.className = 'w-full h-screen bg-gradient-to-r from-black to-purple-900 flex flex-col';
		// this.element.className = 'w-full h-screen bg-gradient-to-r from-black via-purple-500 to-purple-700';

		// Logo section
		const logoContainer = document.createElement('div');
		logoContainer.className = 'flex justify-center items-center h-full w-full'; // Ensure full screen coverage

		const logoImage = document.createElement('img');
		logoImage.src = './assets/PongJamLogo.png';
		logoImage.className = 'w-full max-w-lg h-auto object-contain'; // 30% bigger with max-w-lg
		logoImage.alt = 'Game Logo';
		logoContainer.appendChild(logoImage);

		this.element.appendChild(logoContainer);

		// Verify if image fails to load
		logoImage.onerror = function() {
			console.error("Image failed to load");
		};

		// Buttons section
		const buttonContainer = document.createElement('div');
		buttonContainer.className = 'flex justify-center space-x-4 mt-8';

		// Log In Button
		const loginButton = new Button('Log In', () => { 
			console.log('Navigating to /login');
			window.location.href = '/login';
		});
		loginButton.element.className = 'border-2 border-white bg-white text-purple-900 py-2 px-4 rounded-lg shadow-md';

		// Sign Up Button
		const signInButton = new Button('Sign Up', () => { 
			console.log('Navigating to /register');
			window.location.href = '/register';
		});
		signInButton.element.className = 'border-2 border-white text-white py-2 px-4 rounded-lg shadow-md';

		// Render buttons
		loginButton.render(this);
		signInButton.render(this);


        // Copyright section
        const copyright = document.createElement('p');
        copyright.className = 'text-white text-sm text-center p-20';
        copyright.textContent = '© 2025 PongJam. All rights reserved.';

        // Append all sections
        this.element.append(logoContainer, buttonContainer, copyright);
    }

    private createNavButton(text: string, path: string): HTMLButtonElement {
        const button = document.createElement('button');
        button.className = 'text-white hover:text-purple-300 p-2';
        button.textContent = text;
        button.onclick = () => { window.location.href = path; };
        return button;
    }
}
