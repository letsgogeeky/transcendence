import sendRequest from "./send-request.js";
import { Services } from "./send-request.js";

export async function createPreconfiguredGame(mode: string, userIds?: string[]) {
    try {
        const body = {
            mode: mode,
            userIds: userIds,
        };
        const response = await sendRequest(`/queue/create-preconfigured`, 'POST', body, Services.MATCH);

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        if (data.match) {
            return data.match;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error creating game:', error);
        return null;
    }
}

export async function deleteMatch(matchId: string) {
    const response = await sendRequest(`/queue/delete-match/${matchId}`, 'DELETE', {}, Services.MATCH);
    return response.ok;
}