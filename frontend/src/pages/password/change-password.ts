import Component from '../../components/Component';
import FormComponent from '../../components/Form/Form';
import Input from '../../components/Form/Input';
import sendRequest, { Services } from '../../services/send-request';

export default class ChangePasswordComponent extends Component {
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
        title.textContent = 'Change your password';
        container.append(title);
        this.element = container;

        const inputStyle = 'border border-gray-300 rounded p-2 w-full';
        const oldPassword = new Input(
            'oldPassword',
            'password',
            'oldPassword',
            true,
            null,
            inputStyle,
        );
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
            'Change password',
            [oldPassword, newPassword, confirmPassword],
            (data) => this.changePassword(data),
        );
        this.form.className = 'flex flex-col gap-4 w-64';
    }

    public render(parent: HTMLElement | Component): void {
        this.element.innerHTML = '';
        this.form.render(this.element);
        super.render(parent);
    }

    private async changePassword(data: any): Promise<Response> {
        if (data.newPassword != data.confirmPassword)
            throw Error("Passwords don't match, try again");
        return sendRequest(
            '/user/update-password',
            'PUT',
            {
                newPassword: data.newPassword,
                oldPassword: data.oldPassword,
            },
            Services.AUTH,
        );
    }
}
