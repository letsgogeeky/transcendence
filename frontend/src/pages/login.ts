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
            (data) => sendRequest('/login', 'POST', data, Services.AUTH),
            this.loginCallback.bind(this),
        );

        form.className = 'flex flex-col gap-4 w-64';
        const title = document.createElement('h1');

        container.append(title);
        this.element = container;
        form.render(this.element);
        const forgotPasswordLink = new LinkComponent(
            'Forgot my password',
            '/forgot-password',
        );
        forgotPasswordLink.render(this.element);

        const loginWithGoogle = new Button(
            'Log in with google',
            () => (window.location.href = endpoints.auth + '/login/google'),
        );
        loginWithGoogle.render(this.element);
    }

    private async loginCallback(data: any): Promise<void> {
        localStorage.setItem('authToken', data.authToken);
        State.getState().setAuthToken(data.authToken);
        if (data.otpMethod) {
            window.history.pushState(
                { path: '/login/2fa' },
                '/login/2fa',
                '/login/2fa',
            );
        }
    }
}
