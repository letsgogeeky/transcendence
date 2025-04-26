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
    private matchSocket: WebSocketService | null;
    private user: MyUser | null;
    private updateTimeout: number | null;

    private constructor() {
        this.authToken = null;
        this.authSocket = null;
        this.matchSocket = null;
        this.user = null;
        this.updateTimeout = null;
    }

    public getAuthToken(): string | null {
        return this.authToken;
    }

    public setAuthToken(token: string | null): void {
        this.authToken = token;
        if (token) {
            if (this.authSocket?.socket?.readyState != WebSocket.OPEN)
                this.authSocket = new WebSocketService(endpoints.authSocket);
            if (this.matchSocket?.socket?.readyState != WebSocket.OPEN)
                this.matchSocket = new WebSocketService(`${endpoints.matchMakingSocket}?token=${token}`);
        } else {
            this.authSocket = null;
            this.matchSocket = null;
        }
        window.dispatchEvent(new Event('userChange'));
    }

    public getAuthSocket(): WebSocket | null | undefined {
        return this.authSocket?.socket;
    }

    public getMatchSocket(): WebSocket | null | undefined {
        return this.matchSocket?.socket;
    }

    public getCurrentUser(): MyUser | null {
        if (!this.user) {
            const currentUser = localStorage.getItem('currentUser')
                ? (JSON.parse(localStorage.getItem('currentUser')!) as MyUser)
                : null; //currentUser is parsed from JSON if it exists.
            this.user = currentUser;
        }
        return this.user;
    }

    public setCurrentUser(user: MyUser | null): void {
        this.user = user;
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
        this.updateTimeout = window.setTimeout(() => {
            window.dispatchEvent(new Event('userChange'));
            this.updateTimeout = null;
        }, 100); // Debounce for 100ms
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
        // Don't clear localStorage here as it may contain other app data
        // The refresh token cookie will be cleared by the backend on logout
    }
}
