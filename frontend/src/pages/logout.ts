import Button from '../components/button';
import Component from '../components/Component';
import { showToast, ToastState } from '../components/Toast';
import sendRequest, { Services } from '../services/send-request';
import State from '../services/state';
import ChatManager from '../components/ChatManager';

export async function logoutUser(): Promise<void> {
    try {
        // call close all chats
        ChatManager.getInstance().cleanup();
        ChatManager.getInstance().closeChatSocket();
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
        // this.element.className = 'fixed flex items-center justify-center bg-black';
    }

    public render(parent: HTMLElement | Component): void {
        this.element.innerHTML = '';

        const confirmationMessage = document.createElement('p');
        confirmationMessage.textContent = 'Are you sure you want to log out?';
        confirmationMessage.className = 'py-4 text-gray-300 font-medium mb-4 text-xl';

        const yesButton = document.createElement('button');
        yesButton.textContent = 'Yes';
        yesButton.className = 'px-10 py-4 bg-red-500 text-white font-bold rounded hover:bg-red-600 transition-colors mr-4';
        yesButton.onclick = logoutUser;

        const noButton = document.createElement('button');
        noButton.textContent = 'No';
        noButton.className = 'px-10 py-4 bg-gray-300 text-gray-800 font-bold rounded hover:bg-gray-400 transition-colors';
        noButton.onclick = () => {
            window.history.back();
        };

        this.element.appendChild(confirmationMessage);
        this.element.appendChild(yesButton);
        this.element.appendChild(noButton);

        super.render(parent);
    }
}
