import State from './state';

export enum Services {
    AUTH,
    CHAT,
    GAME,
    FRIENDS,
    TOURNAMENTS,
    MATCH,
}

export const endpoints = {
    auth: '/auth',
    authSocket: '/auth/socket',
    match: '/match',
    matchMakingSocket: '/match/matchmaking',
    chat: '/chat',
};

const noRetryRoutes = [
    '/login',
    '/register',
    '/reset-password',
    '/otp/verify',
    '/otp/generate',
    '/refresh',
    '/login/google/auth',
];

export async function tryRefresh(): Promise<string | null> {
    if (!State.getState().getAuthToken()) return null;
    let response = await fetch(endpoints.auth + '/refresh', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${State.getState().getAuthToken()}`,
        },
        credentials: 'include',
    });

    if (!response.ok) {
        return null;
    } else {
        const responseBody = await response.json();
        State.getState().setAuthToken(responseBody.authToken);
        localStorage.setItem('authToken', responseBody.authToken);

        return responseBody.authToken;
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
        init!.headers = {
            ...init?.headers,
            Authorization: `Bearer ${refreshSuccess}`,
        };
        if (refreshSuccess) return fetch(input, init);
        else window.history.pushState({ path: '/login' }, '', '/login');
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
        case Services.TOURNAMENTS || Services.MATCH:
            url = endpoints.match;
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
