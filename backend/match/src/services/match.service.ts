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
    const guestsCount = (match.settings as GameSettings).guests?.length ?? 0;
    if (match.participants.length >= ((match.settings as GameSettings).players - guestsCount)) {
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

export async function getPlayerLevelAgainstAI(userId: string, app: FastifyInstance) {
    const lastMatchVsAI = await app.prisma.match.findFirst({
        where: {
            status: 'ended',
            gameType: '1vAI',
            participants: { some: { userId: userId } },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
    if (!lastMatchVsAI) {
        return 1;
    }
    const settings = lastMatchVsAI.settings as GameSettings;
    console.log("settings", settings);
    const stats = lastMatchVsAI.stats as Record<string, number>;
    if (!stats) {
        return 1;
    }
    // find highest score
    const playerScore = stats[userId];
    // AI score
    const aiScore = stats['COM1'];
    console.log("scores", playerScore, aiScore);
    if (playerScore === undefined || aiScore === undefined) {
        return 1;
    }
    if (playerScore > aiScore) {
        return (settings.aiLevel ?? 1) + 1;
    }
    return settings.aiLevel ?? 1;
}

export async function createMatch(app: FastifyInstance, mode: string, userId: string) {
    const settings: GameSettings = {
        players: 0,
        aiPlayers: 0,
        winScore: 0,
        timeLimit: 0,
        replaceDisconnected: false,
        startScore: 0,
        terminatePlayers: false,
        friendlyFire: false,
        kickerMode: false,
        obstacleMode: 0,
        balls: 1,
        guests: [],
        aiLevel: 1,
    };
    if (mode === '1v1guest') {
        settings.players = 2;
        settings.guests = [userId];
        settings.aiLevel = await getPlayerLevelAgainstAI(userId, app);
    } else if (mode === '1v1') {
        settings.players = 2;
        settings.replaceDisconnected = false;
    } else if (mode === '1vAI') {
        settings.players = 1;
        settings.aiPlayers = 1;
        settings.replaceDisconnected = false;
    } else if (mode === '2v2') {
        settings.players = 4;
        settings.replaceDisconnected = true;
    } else if (mode === 'All vs All') {
        settings.players = 4;
        settings.replaceDisconnected = true;
    } else {
        return null;
    }
    settings.winScore = 10;
    settings.timeLimit = 60000;
    settings.startScore = 0;

    const newMatch = await app.prisma.match.create({
        data: {
            userId: userId,
            gameType: mode,
            status: 'pending',
            settings: settings,
            participants: {
                create: {
                    userId: userId,
                    joinedAt: new Date(),
                },
            },
        },
    });
    return newMatch;
}