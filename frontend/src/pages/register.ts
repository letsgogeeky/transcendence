import Component from '../components/Component';
import FormComponent from '../components/Form/Form';
import Input from '../components/Form/Input';
import LinkComponent from '../components/Link';
import sendRequest, { Services } from '../services/send-request';

export default class RegisterComponent extends Component {
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
        const nameInput = new Input(
            'name',
            'text',
            'name',
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
            'register',
            [emailInput, nameInput, passwordInput],
            (data) => sendRequest('/register', 'POST', data, Services.AUTH),
        );

        document.createElement('form');
        form.className = 'flex flex-col gap-4 w-64';

        const title = document.createElement('h1');

        container.append(title);
        this.element = container;
        form.render(this.element);

        const loginLink = new LinkComponent(
            'Already have an account? Log in',
            '/login',
        );
        loginLink.render(this.element);
    }
}
