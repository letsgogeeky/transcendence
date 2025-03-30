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

		const backgroundGif = document.createElement('div');
		backgroundGif.className = 'absolute top-1/2 left-0 right-0 transform -translate-y-1/2';  // Ensures it's centered vertically and spans the full width of the screen

		const gif = document.createElement('img');
		gif.src = './assets/transparent_pong.gif';  // Replace with the actual path to your transparent gif
		gif.className = 'w-full object-cover';  // Set width to full, height to a fixed value (e.g., 700px)
		gif.style.opacity = '0.4';
		gif.alt = 'Background Gif';
		backgroundGif.appendChild(gif);

		// Append the background image container
		container.appendChild(backgroundGif);

        // Big welcome image
        const welcomeImage = document.createElement('img');
        welcomeImage.src = './assets/welcome_img.jpg';  // Replace with your actual image path
        welcomeImage.alt = 'Welcome Image';
        // welcomeImage.className = 'w-full max-w-[700px] h-auto mb-8'; // Adjust the size of the image
        welcomeImage.className = 'w-full max-w-[600px] h-auto mb-8 rounded-lg'; // Add 'rounded-lg' to give rounded edges

		container.appendChild(welcomeImage);

        // "SIGN UP" text
		const signUpText = document.createElement('h1');
		signUpText.textContent = 'SIGN UP';
		signUpText.className = 'text-[#4D000D] text-4xl font-bold mb-8 sparkle-text relative z-10'; // Adding the custom class
		container.appendChild(signUpText);

        // Input Fields Styling
		const inputStyle = 'border border-[#4D000D] border-4 rounded-xl p-2 w-80 mb-4 bg-[#D1C4E9] shadow-[4px_4px_10px_#4B1F2B] opacity-60'; 

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
        form.className = 'flex flex-col gap-4 w-80 relative z-10'; // Form styling

        // Add form to container
        form.render(container);

        // Already have an account? Link
        const loginLink = new LinkComponent(
            'Already have an account? LOG IN',
            '/login',
        );
		loginLink.element.className = 'text-[#4D000D] font-bold mt-6 relative z-10';
        loginLink.render(container);

        this.element = container; // Set the final element
    }
}
