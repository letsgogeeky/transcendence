import Component from '../components/Component';
import FormComponent from '../components/Form/Form';
import Input from '../components/Form/Input';
import { showToast, ToastState } from '../components/Toast';
import sendRequest, { Services } from '../services/send-request';
import State from '../services/state';

async function loginUser(data: any): Promise<void> {
    try {
        const response = await sendRequest(
            '/login',
            'POST',
            data,
            Services.AUTH,
        );
        const responseBody = await response.json();
        if (!response.ok) {
            throw new Error(`Error: ${responseBody.error}`);
        }
        showToast(ToastState.SUCCESS, JSON.stringify(responseBody));

        localStorage.setItem('authToken', responseBody.authToken);
        localStorage.setItem('currentUser', JSON.stringify(responseBody.user));
        State.getState().setAuthToken(responseBody.authToken);
        State.getState().setCurrentUser(responseBody.user);
    } catch (error) {
        if (error instanceof Error) {
            showToast(ToastState.ERROR, error.message);
        } else {
            showToast(ToastState.ERROR, 'An unexpected error occurred');
        }
    }
}

export default class LoginComponent extends Component {
    readonly element: HTMLElement;

    constructor() {
        super();
        const container = document.createElement('div');
        container.className = 'text-center';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '10px';

        const inputStyle = 'border border-gray-300 rounded p-2 w-full';

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

        const form = new FormComponent(
            'login',
            [emailInput, passwordInput],
            loginUser,
        );

        document.createElement('form');
        form.className = 'flex flex-col gap-4 w-64';

        const title = document.createElement('h1');

        container.append(title);
        this.element = container;
        form.render(this.element);
    }
}
