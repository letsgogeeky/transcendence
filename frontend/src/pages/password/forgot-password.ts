import Component from '../../components/Component';
import FormComponent from '../../components/Form/Form';
import Input from '../../components/Form/Input';
import { showToast, ToastState } from '../../components/Toast';
import sendRequest, { Services } from '../../services/send-request';

export default class ForgotPasswordComponent extends Component {
    readonly element: HTMLElement;
    private form: FormComponent;

    private async forgotPassword(data: any): Promise<void> {
        try {
            const response = await sendRequest(
                '/forgot-password',
                'POST',
                data,
                Services.AUTH,
            );
            const responseBody = await response.json();
            if (!response.ok) {
                throw new Error(`Error: ${responseBody.error}`);
            }
            showToast(ToastState.SUCCESS, JSON.stringify(responseBody));
        } catch (error) {
            if (error instanceof Error) {
                showToast(ToastState.ERROR, error.message);
            } else {
                showToast(ToastState.ERROR, 'An unexpected error occurred');
            }
        }
    }

    constructor() {
        super();
        const container = document.createElement('div');
        container.className = 'text-center';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '10px';

        const inputStyle = 'border border-gray-300 rounded p-2 w-full';

        ("What's your email, name, or username?");
        const userInput = new Input(
            'User',
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
        this.form.className = 'flex flex-col gap-4 w-64';

        const title = document.createElement('h1');
        title.textContent = 'Reset your password';
        const subtitle = document.createElement('h2');
        title.textContent = "What's your email or username?";
        container.append(title, subtitle);
        this.element = container;
    }

    public render(parent: HTMLElement | Component): void {
        this.form.render(this.element);
        super.render(parent);
    }
}
