import Component from '../components/Component';
import FormComponent from '../components/Form/Form';
import Input from '../components/Form/Input';
import PhoneInput from '../components/Form/PhoneInput';
import Select from '../components/Form/Select';
import { showToast, ToastState } from '../components/Toast';
import sendRequest, { Services } from '../services/send-request';
import State from '../services/state';

async function updateUser(data: any): Promise<void> {
    try {
        console.log(data);
        const response = await sendRequest(
            '/user/update',
            'PUT',
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

export default class UserSettingsComponent extends Component {
    readonly element: HTMLElement;

    constructor() {
        super();
        this.element = document.createElement('div');
        this.element.className = 'text-center';
        this.element.style.display = 'flex';
        this.element.style.flexDirection = 'column';
        this.element.style.gap = '10px';
    }

    render(parent: HTMLElement) {
        this.element.innerHTML = '';
        const user = State.getState().getCurrentUser();
        console.log('user is :' + user);

        const inputStyle = 'border border-gray-300 rounded p-2 w-full';
        const nameInput = new Input(
            'name',
            'text',
            'name',
            true,
            null,
            inputStyle,
        );
        const phoneInput = new PhoneInput(true, inputStyle);
        const otpOptions = [
            { value: '', text: 'no 2FA' },
            { value: 'SMS', text: 'Send code by SMS' },
            { value: 'EMAIL', text: 'Send code by email' },
            {
                value: 'AUTHENTICATOR',
                text: 'Scan QR code with Authenticator app',
            },
        ];
        const otpMethodInput = new Select(
            '2FA Method',
            'otpMethod',
            otpOptions,
            false,
            inputStyle,
        );

        nameInput.value = user?.name || '';
        phoneInput.value = user?.phoneNumber || '';
        otpMethodInput.value = user?.otpMethod || '';
        const form = new FormComponent(
            'update',
            [nameInput, phoneInput, otpMethodInput],
            updateUser,
        );

        document.createElement('form');
        form.className = 'flex flex-col gap-4 w-64';

        const title = document.createElement('h1');

        this.element.append(title);
        form.render(this.element);
        super.render(parent);
    }
}
