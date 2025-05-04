import Component from '../components/Component';
import FormComponent from '../components/Form/Form';
import Input from '../components/Form/Input';
import LinkComponent from '../components/Link';
import sendRequest, { Services } from '../services/send-request';
import { loadBackgroundGif, loadImage, copyrightLine } from '../styles/background'

export default class RegisterComponent extends Component {
    readonly element: HTMLElement;

    constructor() {
        super();
        const container = document.createElement('div');
        container.className = 'text-center flex flex-col items-center justify-center min-h-screen'; // Center everything vertically and horizontally

		//adds the background pong gif 
		container.appendChild(loadBackgroundGif());
		container.appendChild(loadImage('welcome_img.jpg', 'w-full max-w-[400px] h-auto mb-8 rounded-lg', 'Welcome Image'));

        // "SIGN UP" text
		const signUpText = document.createElement('h1');
		signUpText.textContent = 'SIGN UP';
		signUpText.className = 'text-[#4D000D] text-4xl font-bold mb-8 sparkle-text relative z-10'; // Adding the custom class
		container.appendChild(signUpText);

        // Input Fields Styling
		const inputStyle = 'border border-[#e8e0ec] border-4 rounded-xl p-2 w-80 mb-4 shadow-[4px_4px_10px_#e8e0ec] opacity-60'; 

        // Email, Name, and Password Inputs
        const emailInput = new Input(
            'email',
            'email',
            'email',
            true,
            null,
            inputStyle,
			false
        );
        const nameInput = new Input(
            'name',
            'text',
            'name',
            true,
            null,
            inputStyle,
			false
        );
        const passwordInput = new Input(
            'password',
            'password',
            'password',
            true,
            null,
            inputStyle,
			false
        );

        // Form
        const form = new FormComponent(
            'JOIN',
            [emailInput, nameInput, passwordInput],
            (data) => sendRequest('/register', 'POST', data, Services.AUTH),
            () => {
                window.location.href = '/login';
            }
        );
        form.className = 'flex flex-col gap-4 w-80 relative z-10'; // Form styling

        // Add form to container
        form.render(container);

        // Already have an account? Link
        const loginLink = new LinkComponent(
            'Already have an account? LOG IN',
            '/login',
        );
		loginLink.element.className = 'text-[#71435b] font-bold mt-6 relative z-10';
        loginLink.render(container);

        this.element = container; // Set the final element
		this.element.append(copyrightLine());
    }
}
