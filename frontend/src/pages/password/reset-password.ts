import Component from '../../components/Component';
import FormComponent from '../../components/Form/Form';
import Input from '../../components/Form/Input';
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
            null,
        );
        this.form.className = 'flex flex-col gap-4 w-64';
    }

    public render(parent: HTMLElement | Component): void {
        this.element.innerHTML = '';
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        this.form.submitCallback = FormComponent.showNotification(
            this.resetPassword(token!),
        );
        this.form.render(this.element);
        super.render(parent);
    }

    private resetPassword(token: string) {
        return async function (data: any): Promise<Response> {
            if (data.newPassword != data.confirmPassword)
                throw Error("Passwords don't match, try again");
            return sendRequest(
                '/reset-password',
                'POST',
                { newPassword: data.newPassword },
                Services.AUTH,
                token,
            );
        };
    }
}
