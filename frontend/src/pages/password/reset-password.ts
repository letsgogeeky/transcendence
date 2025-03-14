import Component from '../../components/Component';
import FormComponent from '../../components/Form/Form';
import Input from '../../components/Form/Input';
import { showToast, ToastState } from '../../components/Toast';
import sendRequest, { Services } from '../../services/send-request';

export default class ResetPasswordComponent extends Component {
    readonly element: HTMLElement;
    private form: FormComponent;

    constructor() {
        super();
        const container = document.createElement('div');
        container.className = 'text-center';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '10px';

        const title = document.createElement('h1');
        title.textContent = 'Reset your password';
        container.append(title);
        this.element = container;
    }

    public render(parent: HTMLElement | Component): void {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const inputStyle = 'border border-gray-300 rounded p-2 w-full';
        const newPassword = new Input(
            'newPassword',
            'password',
            'newPassword',
            true,
            null,
            inputStyle,
        );
        const confirmPassword = new Input(
            'confirmPassword',
            'password',
            'confirmPassword',
            true,
            null,
            inputStyle,
        );

        this.form = new FormComponent(
            'Reset password',
            [newPassword, confirmPassword],
            this.resetPassword(token!),
        );
        this.form.className = 'flex flex-col gap-4 w-64';
        this.form.render(this.element);
        super.render(parent);
    }

    private resetPassword(token: string) {
        return async function (data: any): Promise<void> {
            try {
                if (data.newPassword != data.confirmPassword)
                    throw Error("Passwords don't match, try again");
                const response = await sendRequest(
                    '/reset-password',
                    'POST',
                    { newPassword: data.newPassword },
                    Services.AUTH,
                    token,
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
        };
    }
}
