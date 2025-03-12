import { endpoints } from './send-request';
import WebSocketService from './sockets';

export default class State {
    private static instance: State | null = null;
    private authToken: string | null;
    private authSocket: WebSocketService | null;

    private constructor() {
        this.authToken = null;
        this.authSocket = null;
    }

    public getAuthToken(): string | null {
        return this.authToken;
    }

    public setAuthToken(token: string): void {
        this.authToken = token;
        this.authSocket = new WebSocketService(endpoints.authSocket);
    }

    public getAuthSocket(): WebSocketService | null {
        return this.authSocket;
    }

    public static getState(): State {
        if (!State.instance) {
            State.instance = new State();
        }
        return State.instance;
    }
}
