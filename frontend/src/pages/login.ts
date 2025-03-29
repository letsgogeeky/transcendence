import Button from '../components/Button';
import Component from '../components/Component';
import FormComponent from '../components/Form/Form';
import Input from '../components/Form/Input';
import LinkComponent from '../components/Link';
import sendRequest, { endpoints, Services } from '../services/send-request';
import State from '../services/state';

export default class LoginComponent extends Component {
    readonly element: HTMLElement;

    constructor() {
        super();
        const container = document.createElement('div');
        container.className = 'text-center flex flex-col items-center justify-center min-h-screen'; // Center everything vertically and horizontally

        // Big welcome image
        const welcomeBackImage = document.createElement('img');
        welcomeBackImage.src = './assets/welcome_back.jpg';  // Replace with your actual image path
        welcomeBackImage.alt = 'Welcome Image';
        welcomeBackImage.className = 'w-full max-w-[400px] h-auto mb-5 rounded-lg'; // Add 'rounded-lg' to give rounded edges

		container.appendChild(welcomeBackImage);

        // Input Fields Styling
		const inputStyle = 'border border-[#00FFFF] border-4 rounded-xl p-2 w-80 mb-4 bg-[#D1C4E9] shadow-[0_0_15px_#00FFFF] opacity-60';

        // Email, Name, and Password Inputs
        const emailInput = new Input(
            'email',
            'email',
            'email',
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
            'LOG IN',
            [emailInput, passwordInput],
            (data) => sendRequest('/login', 'POST', data, Services.AUTH),
			LoginComponent.loginCallback,
        );
        form.className = 'flex flex-col gap-4 w-80 mt-6'; // Form styling

        // Add form to container
        form.render(container);

        const forgotPasswordLink = new LinkComponent(
            'Forgot my password',
            '/forgot-password',
        );
        forgotPasswordLink.render(container);
		forgotPasswordLink.element.className = 'text-[#FFB6C1] italic mt-3';

		// Container for the text and button
		const alternativeContainer = document.createElement('div');
		alternativeContainer.className = 'flex items-center mt-6';

		// "Alternatively:" text
		const alternativeText = document.createElement('span');
		alternativeText.textContent = 'Alternatively:';
		alternativeText.className = 'text-[#00FFFF] text-xl py-2 mt-4 mr-4'; // Adjust spacing with margin

		// "Log In with Google" Button
		const loginWithGoogle = new Button(
			'Log In with Google',
			() => (window.location.href = endpoints.auth + '/login/google'),
		);
		// loginWithGoogle.element.className = 'text-[#007bff] font-bold border border-[#007bff] bg-[#00FFFF] py-2 px-4 rounded-lg';
		loginWithGoogle.element.className = `w-60 border-2 border-[#007bff] text-[#007bff] text-xl font-bold py-2 rounded-lg shadow-[0_0_15px_#00FFFF] opacity-60' hover:bg-white hover:text-purple-900 mt-4`;

		// Append both to the container
		alternativeContainer.appendChild(alternativeText);
		alternativeContainer.appendChild(loginWithGoogle.element);

		// Render the container
		container.appendChild(alternativeContainer);

        this.element = container; // Set the final element
    }

	static loginCallback(data: any): void {
        LoginComponent.setUserFromResponse(data);
        if (data.otpMethod) {
            window.history.pushState(
                { path: '/login/2fa' },
                '/login/2fa',
                '/login/2fa',
            );
        }
    }

	static setUserFromResponse(data: any): void {
        localStorage.setItem('authToken', data.authToken);
        State.getState().setAuthToken(data.authToken);
        if (data.user) {
            localStorage.setItem(
                'currentUser',
                JSON.stringify(data.user || null),
            );
            State.getState().setCurrentUser(data.user);
            window.history.pushState({ path: '/' }, '', '/');
        }
    }
}
