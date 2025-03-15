import { showToast, ToastState } from '../components/Toast';
import State from './state';

export default class WebSocketService {
    private socket: WebSocket | null = null;
    private url: string;
    private reconnectInterval: number = 1000;
    private reconnectAttempts: number = 0;

    constructor(url: string) {
        this.url = url;
        this.connect();
    }

    private connect(): void {
        console.log('Connecting to WebSocket...');
        if (!State.getState().getAuthToken()) return;
        this.socket = new WebSocket(this.url);

        this.socket.addEventListener('open', () => {
            this.sendMessage(
                JSON.stringify({
                    type: 'AUTH',
                    token: State.getState().getAuthToken(),
                }),
            );
            console.log('Connected to WebSocket server');
            this.reconnectAttempts = 0;
        });

        this.socket.addEventListener('message', (event) => {
            console.log('Received message:', event.data);
            showToast(ToastState.NOTIFICATION, event.data);
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
