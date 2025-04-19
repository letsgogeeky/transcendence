import { showToast, ToastState } from '../components/Toast';
import State from './state';

export default class WebSocketService {
    public socket: WebSocket | null = null;
    private url: string;
    private reconnectInterval: number = 1000;
    private reconnectAttempts: number = 0;

    constructor(url: string) {
        this.url = url;
        this.connect();
    }

    private connect(): void {
        console.log('Connecting to WebSocket...');
        const authToken = State.getState().getAuthToken();
        if (!authToken) return;
        console.log(`Auth token: ${authToken}`);
        console.log(`URL: ${this.url}`);
        this.socket = new WebSocket(this.url);

        this.socket.addEventListener('open', () => {
            console.log('WebSocket connection opened');
            this.sendMessage(
                JSON.stringify({
                    type: 'AUTH',
                    token: authToken,
                }),
            );
            this.reconnectAttempts = 0;
        });

        this.socket.addEventListener('message', (event) => {
            console.log('Received message:', event.data);
            const data = JSON.parse(event.data);
            if (data.type == 'CONFLICT') {
                showToast(
                    ToastState.ERROR,
                    'You are already signed in from a different tab',
                    0,
                );
                this.reconnectAttempts = 11;
                document.title += ' (Offline)';
            } else if (data.type == 'RETRY') {
                this.reconnect();
            } else if (data.type == 'SUCCESS') {
                window.dispatchEvent(new Event('userChange'));
                document.title = document.title.replace(/ \(Offline\)$/, '');
                showToast(
                    ToastState.NOTIFICATION,
                    JSON.parse(event.data).message,
                );
            } else {
                showToast(
                    ToastState.NOTIFICATION,
                    JSON.parse(event.data).message,
                );
            }

            window.dispatchEvent(new Event('userChange'));
        });

        this.socket.addEventListener('error', (event) => {
            console.error('WebSocket Error:', event);
        });

        this.socket.addEventListener('close', () => {
            console.log('WebSocket connection closed');
            this.reconnect();
        });
    }

    private reconnect(): void {
        if (this.reconnectAttempts < 10) {
            console.log(
                `Reconnecting in ${this.reconnectInterval / 1000} seconds...`,
            );
            setTimeout(() => {
                this.reconnectAttempts++;
                this.connect();
            }, this.reconnectInterval);
        } else {
            console.log('Max reconnect attempts reached. Stopping attempts.');
        }
    }

    public sendMessage(message: string): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(message);
        } else {
            console.log('WebSocket is not open. Unable to send message.');
        }
    }
}
