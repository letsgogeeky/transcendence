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
        const title = document.createElement('h1');

        container.append(title);
        this.element = container;
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

    public render(parent: HTMLElement | Component): void {
        this.element.innerHTML = '';
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
            LoginComponent.loginCallback,
        );
        form.className = 'flex flex-col gap-4 w-64';

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
        super.render(parent);
    }
}
