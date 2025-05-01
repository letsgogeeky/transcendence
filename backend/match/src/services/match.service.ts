import { GameSettings } from "../routes/ws/session";
import { FastifyInstance } from "fastify";
export async function notifyMatchParticipants(matchId: string, app: FastifyInstance) {
    const match = await app.prisma.match.findUnique({
        where: { id: matchId },
        include: {
            participants: true,
        },
    });
    if (!match) {
        return false;
    }
    // check if match is full
    if (match.participants.length >= (match.settings as GameSettings).players) {
        // notify all participants in match
        let hasDisconnected = false;
        for (const participant of match.participants) {
            const client = app.connections.get(participant.userId);
            if (!client) {
                // remove participant from match
                // await app.prisma.matchParticipant.delete({
                //     where: { id: participant.id, matchId: match.id },
                // });
                hasDisconnected = true;
            }
        }
        if (!hasDisconnected) {
            setTimeout(() => {
                for (const participant of match.participants) {
                    const client = app.connections.get(participant.userId);
                    if (client) {
                        client.send(JSON.stringify({ type: 'MATCH_STARTED', match }));
                    }
                }
            }, 2000);
            return true;
        }
        return false;
    }
    return false;
}

export async function checkMatch(userId: string, app: FastifyInstance) {
    const match = await app.prisma.match.findFirst({
        where: {
            status: { in: ['pending', 'in progress'] },
            participants: {
                some: { userId: userId },
            },
        },
    });
    return match || null;
}

export async function findNextMatchInTournament(tournamentId: string, app: FastifyInstance) {
    const tournament = await app.prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: {
            matches: true,
        },
    });
    if (!tournament) {
        return null;
    }
    const matches = tournament.matches;
    for (const match of matches) {
        if (match.status === 'pending') {
            return match;
        }
    }
    return null;
}

export async function proceedTournament(tournamentId: string, app: FastifyInstance, count: number = 0) {
    if (count > 10) {
        // tournament is stuck with no online players
        return;
    }
    const nextMatch = await findNextMatchInTournament(tournamentId, app);
    if (!nextMatch) {
        // tournament is finished
        // announce winner
        return;
    }
    const notified = await notifyMatchParticipants(nextMatch.id, app);
    if (!notified) {
        return;
    }
    // proceed to next match
    await proceedTournament(tournamentId, app, count + 1);
}