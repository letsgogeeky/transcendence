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


        // Top bar
        const topBar = document.createElement('div');
        topBar.className = 'flex justify-between items-center p-4 bg-black bg-opacity-60 text-white';

        const homeButton = this.createNavButton('Home', '/');
        const howToPlayButton = this.createNavButton('How to Play', '/how-to-play');
        const aboutButton = this.createNavButton('About', '/about');

        topBar.append(homeButton, howToPlayButton, aboutButton);

        // Logo section
        const logoContainer = document.createElement('div');
        logoContainer.className = 'flex justify-center items-center flex-1';

        const logoImage = document.createElement('img');
        logoImage.src = './assets/PongJamLogo.png';
		logoImage.className = 'w-full max-w-xs h-auto';
        logoImage.alt = 'Game Logo';
		this.element.appendChild(logoImage);

		//to verify that the image loaded correctly:
        // logoImage.className = 'max-w-sm'; // Adjust size of the logo
		logoImage.onerror = function() {
			console.error("Image failed to load");
		};

        // Buttons section
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'flex justify-center space-x-4 mt-8';

        const loginButton = new Button('Log In', () => { console.log('Log In clicked'); });
        loginButton.element.className = 'bg-white text-purple-900 py-2 px-4 rounded-lg shadow-md';

        const signInButton = new Button('Sign Up', () => { console.log('Sign In clicked'); });
        signInButton.element.className = 'border-2 border-white text-white py-2 px-4 rounded-lg shadow-md';

		loginButton.render(this);
		signInButton.render(this);
        // buttonContainer.append(loginButton.render(this), signInButton.render(this));

        // Copyright section
        const copyright = document.createElement('p');
        copyright.className = 'text-white text-sm text-left p-4';
        copyright.textContent = '© 2025 PongJam. All rights reserved.';

        // Append all sections
        this.element.append(topBar, logoContainer, buttonContainer, copyright);
    }

    private createNavButton(text: string, path: string): HTMLButtonElement {
        const button = document.createElement('button');
        button.className = 'text-white hover:text-purple-300 p-2';
        button.textContent = text;
        button.onclick = () => { window.location.href = path; };
        return button;
    }
}
