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
        this.authSocket = new WebSocketService(endpoints.authSocket);
    }

    public getAuthSocket(): WebSocketService | null {
        return this.authSocket;
    }

    public getCurrentUser(): MyUser | null {
        return this.user;
    }

    public setCurrentUser(user: MyUser | null): void {
        this.user = user;
    }

    public static getState(): State {
        if (!State.instance) {
            State.instance = new State();
        }
        return State.instance;
    }
}
