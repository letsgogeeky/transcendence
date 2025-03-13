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

const noRetryRoutes = ['/login', '/register'];

async function tryRefresh(): Promise<boolean> {
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

export default async function sendRequest(
    path: string,
    method: string,
    data: any,
    service: Services,
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
        let response = await fetch(url + path, {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${State.getState().getAuthToken()}`,
            },
            body: JSON.stringify(data),
            credentials: 'include',
        });
        console.log(path in noRetryRoutes);
        console.log(path);
        if (noRetryRoutes.includes(path)) return response;
        else if (!response.ok) {
            const responseBody = await response.json();
            if (responseBody.error == 'Invalid or expired token') {
                const refreshSuccess = await tryRefresh();
                if (refreshSuccess)
                    return sendRequest(path, method, data, service);
                else throw Error('Unauthorized');
            }
        } else return response;
        throw Error('ajajaj');
    } catch (error) {
        throw error;
    }
}
