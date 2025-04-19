import Component from '../components/Component';
import FormComponent from '../components/Form/Form';
import Input from '../components/Form/Input';
import sendRequest, { Services } from '../services/send-request';
import State from '../services/state';
import ErrorComponent from './error';
import LoginComponent from './login';

export default class LoginOtpComponent extends Component {
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

    async fetchData() {
        if (State.getState().getCurrentUser()?.otpMethod == 'AUTHENTICATOR')
            return 'authenticator';
        const generated = await sendRequest(
            '/otp/generate',
            'POST',
            null,
            Services.AUTH,
        );
        const responseBody = await generated.json();
        return responseBody;
    }

    public render(parent: HTMLElement | Component): void {
        this.element.innerHTML = '';
        if (!this.data) {
            const loading = new ErrorComponent('Loading....');
            loading.render(this.element);
        } else if (this.data.error) {
            const error = new ErrorComponent(this.data.error);
            error.render(this.element);
        } else {
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
                LoginComponent.setUserFromResponse,
            );
            form.className = 'flex flex-col gap-4 w-64';
            form.render(this.element);
        }
        super.render(parent);
    }
}
