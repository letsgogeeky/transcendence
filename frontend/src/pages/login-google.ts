import Component from '../components/Component';
import sendRequest, { Services } from '../services/send-request';
import State from '../services/state';

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
        localStorage.setItem('responseBody', responseBody.authToken);
        State.getState().setAuthToken(responseBody.authToken);
        if (responseBody.otpMethod) {
            window.history.pushState(
                { path: '/login/2fa' },
                '/login/2fa',
                '/login/2fa',
            );
        } else window.history.pushState({ path: '/' }, '/', '/');
        return responseBody;
    }
}
