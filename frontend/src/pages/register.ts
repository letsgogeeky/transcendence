import Component from '../components/Component';
import FormComponent from '../components/Form/Form';
import Input from '../components/Form/Input';
import LinkComponent from '../components/Link';
import sendRequest, { Services } from '../services/send-request';

export default class RegisterComponent extends Component {
    readonly element: HTMLElement;

    constructor() {
        super();
        const container = document.createElement('div');
        container.className = 'text-center flex flex-col items-center justify-center min-h-screen'; // Center everything vertically and horizontally

        // Big welcome image
        const welcomeImage = document.createElement('img');
        welcomeImage.src = './assets/welcome_img.jpg';  // Replace with your actual image path
        welcomeImage.alt = 'Welcome Image';
        // welcomeImage.className = 'w-full max-w-[700px] h-auto mb-8'; // Adjust the size of the image
        welcomeImage.className = 'w-full max-w-[700px] h-auto mb-8 rounded-lg'; // Add 'rounded-lg' to give rounded edges

		container.appendChild(welcomeImage);

        // "SIGN UP" text
        const signUpText = document.createElement('h1');
        signUpText.textContent = 'SIGN UP';
        signUpText.className = 'text-[#8E2C62] text-4xl font-bold mb-8';
		container.appendChild(signUpText);

        // Input Fields Styling
		const inputStyle = 'border border-[#8E2C62] border-4 rounded-xl p-2 w-80 mb-4 bg-[#D1C4E9] shadow-[4px_4px_10px_#4B1F2B] opacity-60'; 


		// const inputStyle = 'border border-gray-300 rounded p-2 w-80 mb-4 bg-purple-100'; // Light purple-gray background

        // Email, Name, and Password Inputs
        const emailInput = new Input(
            'email',
            'email',
            'email',
            true,
            null,
            inputStyle,
        );
        const nameInput = new Input(
            'name',
            'text',
            'name',
            true,
            null,
            inputStyle,
        );
        const passwordInput = new Input(
            'password',
            'password',
            'password',
            true,
            null,
            inputStyle,
        );

        // Form
        const form = new FormComponent(
            'JOIN',
            [emailInput, nameInput, passwordInput],
            (data) => sendRequest('/register', 'POST', data, Services.AUTH),
        );
        form.className = 'flex flex-col gap-4 w-80'; // Form styling

        // Add form to container
        form.render(container);

        // // "JOIN" button
        // const joinButton = document.createElement('button');
        // joinButton.textContent = 'JOIN';
        // joinButton.className = 'bg-white text-purple-900 font-bold text-xl py-2 px-6 rounded-lg shadow-md hover:bg-gray-100 mt-6'; // Button styling
        // joinButton.onclick = () => form.submit(); // Submit the form when clicked
        // container.appendChild(joinButton);

        // Already have an account? Link
        const loginLink = new LinkComponent(
            'Already have an account? Log in',
            '/login',
        );
        loginLink.render(container);

        this.element = container; // Set the final element
    }
}
