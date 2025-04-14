import Component from '../components/Component';
import FormComponent from '../components/Form/Form';
import Input from '../components/Form/Input';
import LinkComponent from '../components/Link';
import sendRequest, { Services } from '../services/send-request';
import { loadBackgroundGif, loadImage } from '../styles/background'

export default class AboutComponent extends Component {
    readonly element: HTMLElement;

    constructor() {
        super();
        const container = document.createElement('div');
        container.className = 'text-center flex flex-col items-center justify-center min-h-screen'; // Center everything vertically and horizontally

		//adds the background pong gif 
		container.appendChild(loadBackgroundGif());
		// container.appendChild(loadImage('welcome_img.jpg', 'w-full max-w-[400px] h-auto mb-8 rounded-lg', 'Welcome Image'));

        // "SIGN UP" text
		const signUpText = document.createElement('h1');
		signUpText.textContent = 'To be updated...';
		signUpText.className = 'text-[#4D000D] text-4xl font-bold mb-8 sparkle-text relative z-10'; // Adding the custom class
		container.appendChild(signUpText);

        this.element = container; // Set the final element
    }
}
