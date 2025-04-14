import Button from '../components/button';
import Component from '../components/Component';
import { showToast, ToastState } from '../components/Toast';
import sendRequest, { Services } from '../services/send-request';
import State from '../services/state';

export async function logoutUser(): Promise<void> {
    try {
        const response = await sendRequest(
            '/logout',
            'POST',
            null,
            Services.AUTH,
        );
        const responseBody = await response.json();
        if (!response.ok) {
            throw new Error(`Error: ${responseBody.error}`);
        }
        showToast(ToastState.SUCCESS, JSON.stringify(responseBody));
        localStorage.clear();
        State.getState().setAuthToken(null);
        State.getState().setCurrentUser(null);
    } catch (error) {
        if (error instanceof Error) {
            showToast(ToastState.ERROR, error.message);
        } else {
            showToast(ToastState.ERROR, 'An unexpected error occurred');
        }
    }
    State.getState().reset();
    window.history.pushState({ path: '/login' }, '', '/login');
}

export default class LogoutComponent extends Component {
    readonly element: HTMLElement;

    constructor() {
        super();
        this.element = document.createElement('div');
    }

    public render(parent: HTMLElement | Component): void {
        this.element.innerHTML = '';
        const logoutButton = new Button('Log out', logoutUser);
        logoutButton.render(this.element);
        super.render(parent);
    }
}
