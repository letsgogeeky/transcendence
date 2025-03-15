import Component from '../components/Component';
import FormComponent from '../components/Form/Form';
import Input from '../components/Form/Input';
import LinkComponent from '../components/Link';
import sendRequest, { Services } from '../services/send-request';
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
        const lorgotPasswordLink = new LinkComponent(
            'Forgot my password',
            '/forgot-password',
        );
        lorgotPasswordLink.render(this.element);
    }

    private async setUserFromResponse(data: any): Promise<void> {
        localStorage.setItem('authToken', data.authToken);
        State.getState().setAuthToken(data.authToken);
        if (data.user) {
            localStorage.setItem(
                'currentUser',
                JSON.stringify(data.user || null),
            );
            State.getState().setCurrentUser(data.user);
            window.history.pushState({ path: '/' }, '/', '/');
        }
    }

    private async loginCallback(data: any): Promise<void> {
        this.setUserFromResponse(data);
        if (data.otpMethod) {
            const generated = await sendRequest(
                '/otp/generate',
                'POST',
                null,
                Services.AUTH,
            );
            const responseBody = await generated.json();
            this.element.innerHTML = '';
            if (responseBody.otpAuthUrl) {
                const qrCodeUrl = `https://quickchart.io/qr?text=${encodeURIComponent(
                    responseBody.otpAuthUrl,
                )}`;
                const imageContainer = document.createElement('div');
                const qrCodeImage = document.createElement('img');
                qrCodeImage.src = qrCodeUrl;
                imageContainer.append(qrCodeImage);
                this.element.append(qrCodeImage);
            }
            const codeInput = new Input(
                'Verification code',
                'text',
                'token',
                true,
                '6 digit code',
            );
            const form = new FormComponent(
                'Send code',
                [codeInput],
                (data) =>
                    sendRequest('/otp/verify', 'POST', data, Services.AUTH),
                this.setUserFromResponse,
            );
            form.className = 'flex flex-col gap-4 w-64';
            form.render(this.element);
        }
    }
}
