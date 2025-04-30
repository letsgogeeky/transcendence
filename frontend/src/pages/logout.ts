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
        showToast(ToastState.SUCCESS, 'Successfully logged out');
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

        const confirmationMessage = document.createElement('p');
        confirmationMessage.textContent = 'Are you sure you want to log out?';
        confirmationMessage.className = 'text-white font-medium mb-4';

        const yesButton = document.createElement('button');
        yesButton.textContent = 'Yes';
        yesButton.className = 'px-4 py-2 bg-red-500 text-white font-bold rounded hover:bg-red-600 transition-colors mr-2';
        yesButton.onclick = logoutUser;

        const noButton = document.createElement('button');
        noButton.textContent = 'No';
        noButton.className = 'px-4 py-2 bg-gray-300 text-gray-800 font-bold rounded hover:bg-gray-400 transition-colors';
        noButton.onclick = () => {
            window.history.back();
        };

        this.element.appendChild(confirmationMessage);
        this.element.appendChild(yesButton);
        this.element.appendChild(noButton);

        super.render(parent);
    }
}
