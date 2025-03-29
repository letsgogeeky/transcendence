import Component from '../../components/Component';
import FormComponent from '../../components/Form/Form';
import Input from '../../components/Form/Input';
import sendRequest, { Services } from '../../services/send-request';

export default class ForgotPasswordComponent extends Component {
    readonly element: HTMLElement;
    private form: FormComponent;

    private async forgotPassword(data: any): Promise<Response> {
        return sendRequest('/forgot-password', 'POST', data, Services.AUTH);
    }

    constructor() {
        super();
		const container = document.createElement('div');
        container.className = 'text-center flex flex-col items-center justify-center min-h-screen'; // Center everything vertically and horizontally

        // Big welcome image
        const welcomeBackImage = document.createElement('img');
        welcomeBackImage.src = './assets/forgetful.gif';  // Replace with your actual image path
        welcomeBackImage.alt = 'Forgetful Me';
        welcomeBackImage.className = 'w-full max-w-[600px] h-auto mb-5 rounded-lg'; // Add 'rounded-lg' to give rounded edges

		container.appendChild(welcomeBackImage);

        const inputStyle = 'border border-[#FFFF33] border-4 rounded-xl p-2 w-60 mb-4 bg-[#D1C4E9] shadow-[0_0_15px_#00FFFF] opacity-60';
        const userInput = new Input(
            'username or email',
            'text',
            'user',
            true,
            null,
            inputStyle,
        );

        this.form = new FormComponent(
            'Send Email',
            [userInput],
            this.forgotPassword,
        );

        document.createElement('form');
		this.form.className = 'items-center flex flex-col gap-4 w-80 mt-6';

        const title = document.createElement('h1');
        title.textContent = 'It \'s OK! We got you! 😉';
		title.className = 'text-white font-bold mt-4';
        const subtitle = document.createElement('h2');
        subtitle.textContent = "Fill out your email or username:";
		subtitle.className = 'text-[#FFFF33] mt-8';
        container.append(title, subtitle);
        this.element = container;
    }

    public render(parent: HTMLElement | Component): void {
        this.form.render(this.element);
        super.render(parent);
    }
}
