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
        State.getState().setAuthToken(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
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

        // Create a styled logout button
        const logoutButton = document.createElement('button');
        logoutButton.textContent = 'Log out';
        logoutButton.className =
            'px-4 py-2 bg-white text-gray-800 font-bold rounded hover:bg-gray-200 transition-colors';
        logoutButton.onclick = logoutUser;

        // Append the button to the element
        this.element.appendChild(logoutButton);

        super.render(parent);
    }
}
