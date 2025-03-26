import { endpoints } from './send-request';
import WebSocketService from './sockets';

export interface MyUser {
    id: string;
    name: string;
    email: string;
    phoneNumber: string | null;
    otpMethod: string | null;
    avatarUrl: string | null;
}

export default class State {
    private static instance: State | null = null;
    private authToken: string | null;
    private authSocket: WebSocketService | null;
    private user: MyUser | null;

    private constructor() {
        this.authToken = null;
        this.authSocket = null;
        this.user = null;
    }

    public getAuthToken(): string | null {
        return this.authToken;
    }

    public setAuthToken(token: string | null): void {
        this.authToken = token;
        // setTimeout(() => {
        //     if (token && this.authSocket?.socket?.readyState != WebSocket.OPEN)
        //         this.authSocket = new WebSocketService(endpoints.authSocket);
        // }, 2000);
        if (token && this.authSocket?.socket?.readyState != WebSocket.OPEN)
            this.authSocket = new WebSocketService(endpoints.authSocket);
        window.dispatchEvent(new Event('userChange'));
    }

    public getAuthSocket(): WebSocket | null | undefined {
        return this.authSocket?.socket;
    }

    public getCurrentUser(): MyUser | null {
        return this.user;
    }

    public setCurrentUser(user: MyUser | null): void {
        this.user = user;
        window.dispatchEvent(new Event('userChange'));
    }

    public static getState(): State {
        if (!State.instance) {
            State.instance = new State();
        }
        return State.instance;
    }

    public reset() {
        this.user = null;
        this.authToken = null;
        localStorage.clear();
    }
}
