import Component from '../../components/Component';
import FormComponent from '../../components/Form/Form';
import Input from '../../components/Form/Input';
import sendRequest, { Services } from '../../services/send-request';
import { loadBackgroundGif, loadImage } from '../../styles/background'

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

		// adds the background pong gif 
		container.appendChild(loadBackgroundGif());
		// adds the 'forgetful me' gif
		container.appendChild(loadImage('forgetful.gif', 'w-full max-w-[500px] h-auto mb-5 rounded-lg', 'Gif for forgetfulness'));

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
		this.form.className = 'items-center flex flex-col gap-4 w-80 mt-6 relative z-10';

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
