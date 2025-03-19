import State from './state';

export enum Services {
    AUTH,
    CHAT,
    GAME,
    FRIENDS,
}

export const endpoints = {
    auth: 'https://localhost:8081',
    authSocket: 'wss://localhost:8081/socket/',
    friends: 'https://localhost:8080',
};

const noRetryRoutes = [
    '/login',
    '/register',
    '/reset-password',
    '/otp/verify',
    '/otp/generate',
    '/refresh',
];

export async function tryRefresh(): Promise<boolean> {
    if (!State.getState().getAuthToken()) return false;
    let response = await fetch(endpoints.auth + '/refresh', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${State.getState().getAuthToken()}`,
        },
        credentials: 'include',
    });

    if (!response.ok) {
        return false;
    } else {
        const responseBody = await response.json();
        localStorage.setItem('authToken', responseBody.authToken);
        State.getState().setAuthToken(responseBody.authToken);
        return true;
    }
}

export async function retryFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
    noretry?: boolean,
): Promise<Response> {
    let response = await fetch(input, init);
    if (!noretry && !response.ok && response.status == 401) {
        const refreshSuccess = await tryRefresh();
        if (refreshSuccess) return fetch(input, init);
        else throw Error('Unauthorized');
    }
    return response;
}

export default async function sendRequest(
    path: string,
    method: string,
    data: any,
    service: Services,
    token: string | null = null,
    contentType: string = 'application/json',
): Promise<Response> {
    let url;
    switch (service) {
        case Services.AUTH:
            url = endpoints.auth;
            break;
        case Services.FRIENDS:
            url = endpoints.friends;
            break;
        default:
            break;
    }
    try {
        let response = await retryFetch(
            url + path,
            {
                method,
                headers: {
                    'Content-Type': contentType,
                    Authorization: `Bearer ${
                        token ?? State.getState().getAuthToken()
                    }`,
                },
                ...(method !== 'GET' && { body: JSON.stringify(data) }),
                credentials: 'include',
            },
            noRetryRoutes.includes(path),
        );
        return response;
    } catch (error) {
        throw error;
    }
}
