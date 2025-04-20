import { showToast, ToastState } from '../components/Toast';
import State from './state';

export default class WebSocketService {
    public socket: WebSocket | null = null;
    private url: string;
    private reconnectInterval: number = 1000;
    private reconnectAttempts: number = 0;
    private isMatchSocket: boolean;
    private isAuthSocket: boolean;
    constructor(url: string) {
        this.url = url;
        this.isMatchSocket = url.includes('/match');
        this.isAuthSocket = url.includes('/auth');
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
            if (this.isAuthSocket) {
                this.sendMessage(
                    JSON.stringify({
                        type: 'AUTH',
                        token: authToken,
                    }),
                );
            }
            this.reconnectAttempts = 0;
        });

        this.socket.addEventListener('message', (event) => {
            console.log('Received message:', event.data);
            const data = JSON.parse(event.data);
            if (this.isMatchSocket) this.handleMatchMessage(data);
            if (this.isAuthSocket) this.handleAuthMessage(data);
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

    private handleAuthMessage(data: any): void {
        // Handle auth socket messages
        if (data.type == 'CONFLICT') {
            showToast(
                ToastState.ERROR,
                'You are already signed in from a different tab',
                0,
            );
            this.reconnectAttempts = 5;
            document.title += ' (Offline)';
        } else if (data.type == 'RETRY') {
            this.reconnect();
        } else if (data.type == 'SUCCESS') {
            window.dispatchEvent(new Event('userChange'));
            document.title = document.title.replace(/ \(Offline\)$/, '');
            showToast(
                ToastState.NOTIFICATION,
                data.message,
            );
        } else {
            showToast(
                ToastState.NOTIFICATION,
                data.message,
            );
        }
        window.dispatchEvent(new Event('userChange'));
    }

    private handleMatchMessage(data: any): void {
        console.log('Received match message:', data);
        switch(data.type) {
            case 'TOURNAMENT_MATCH_READY':
                showToast(
                    ToastState.NOTIFICATION,
                    `Tournament match is ready! ${data.message}`,
                    5000
                );
                // Redirect to game with tournament match ID
                if (data.matchId) {
                    window.history.pushState(
                        { path: '/game' },
                        '/game',
                        `/game?matchId=${data.matchId}&tournamentId=${data.tournamentId}`
                    );
                }
                break;

            case 'TOURNAMENT_STARTED':
                showToast(
                    ToastState.NOTIFICATION,
                    `Tournament "${data.tournamentName}" has started!`,
                    5000
                );
                break;

            case 'TOURNAMENT_INVITATION':
                const acceptTournament = () => {
                    this.sendMessage(JSON.stringify({
                        type: 'ACCEPT_TOURNAMENT',
                        tournamentId: data.tournamentId
                    }));
                    showToast(
                        ToastState.SUCCESS,
                        `You have joined tournament "${data.tournamentName}"`,
                        3000
                    );
                };
                const rejectTournament = () => {
                    this.sendMessage(JSON.stringify({
                        type: 'REJECT_TOURNAMENT',
                        tournamentId: data.tournamentId
                    }));
                    showToast(
                        ToastState.NOTIFICATION,
                        `You have declined the tournament invitation`,
                        3000
                    );
                };
                showToast(
                    ToastState.NOTIFICATION,
                    `You've been invited to tournament "${data.tournamentName}"`,
                    0,
                    [
                        { text: 'Accept', action: acceptTournament },
                        { text: 'Reject', action: rejectTournament }
                    ]
                );
                break;

            case 'MATCH_INVITATION':
                const acceptMatch = () => {
                    this.sendMessage(JSON.stringify({
                        type: 'ACCEPT_MATCH',
                        matchId: data.matchId
                    }));
                    if (data.matchId) {
                        window.history.pushState(
                            { path: '/game' },
                            '/game',
                            `/game?matchId=${data.matchId}`
                        );
                    }
                };
                const rejectMatch = () => {
                    this.sendMessage(JSON.stringify({
                        type: 'REJECT_MATCH',
                        matchId: data.matchId
                    }));
                };
                showToast(
                    ToastState.NOTIFICATION,
                    `Match Invitation: ${data.message}`,
                    0,
                    [
                        { text: 'Accept', action: acceptMatch },
                        { text: 'Reject', action: rejectMatch }
                    ]
                );
                break;

            case 'TOURNAMENT_UPDATE':
                showToast(
                    ToastState.NOTIFICATION,
                    `Tournament Update: ${data.message}`,
                    5000
                );
                break;

            case 'TOURNAMENT_ENDED':
                showToast(
                    ToastState.NOTIFICATION,
                    `Tournament "${data.tournamentName}" has ended! ${data.message}`,
                    5000
                );
                break;

            case 'TOURNAMENT_MATCH_START':
                showToast(
                    ToastState.NOTIFICATION,
                    'Tournament match is starting!',
                    5000
                );
                break;

            case 'TOURNAMENT_MATCH_END':
                showToast(
                    ToastState.NOTIFICATION,
                    `Tournament match ended: ${data.message}`,
                    5000
                );
                if (data.tournamentId) {
                    window.history.pushState(
                        { path: '/tournament' },
                        '/tournament',
                        `/tournament?tournamentId=${data.tournamentId}`
                    );
                }
                break;

            default:
                showToast(
                    ToastState.NOTIFICATION,
                    data.message,
                    5000
                );
        }
        return;
    }
}
