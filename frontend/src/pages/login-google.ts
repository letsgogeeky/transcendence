import Component from '../components/Component';
import sendRequest, { Services } from '../services/send-request';
import LoginComponent from './login';

export default class LoginAfterGoogleComponent extends Component {
    readonly element: HTMLElement;

    constructor() {
        super();
        const container = document.createElement('div');
        this.element = container;
    }

    async fetchData() {
        const generated = await sendRequest(
            '/login/google/auth',
            'GET',
            null,
            Services.AUTH,
        );
        const responseBody = await generated.json();
        LoginComponent.loginCallback(responseBody);
        return responseBody;
    }
}
