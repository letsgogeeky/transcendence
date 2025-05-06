import { Match } from "@prisma/client";
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
    const isTournament = match.tournamentId !== null && match.tournamentId !== '';
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
            // notify participants that match is starting
            for (const participant of match.participants) {
                const client = app.connections.get(participant.userId);
                if (client) {
                    if (isTournament) {
                        client.send(JSON.stringify({ type: 'TOURNAMENT_UPDATE', message: 'Match is starting, get ready and do some pushups!' }));
                    }
                    setTimeout(() => {
                        client.send(JSON.stringify({ type: 'MATCH_STARTED', match: match }));
                    }, 3000);
                }
            }
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

export async function ensurePlayersInMatchesAreConnected(app: FastifyInstance, userId: string) {
    // get all matches that are in progress and have not been updated in the last 10 seconds
    const matches = await app.prisma.match.findMany({
        where: { status: 'in progress', updatedAt: { lt: new Date(Date.now() - 10000) }, participants: { some: { userId: userId } } },
        include: {
            participants: true,
        },
    });
    for (const match of matches) {
        const participants = match.participants;
        for (const participant of participants) {
            const client = app.gameConnections.has(participant.userId);
            if (!client) {
                // check settings if disconnected players are allowed
                // if not, end match
                if ((match.settings as GameSettings).replaceDisconnected) {
                    continue;
                }
                await endMatch(match.id, app);
            }
        }
    }
}

export async function findNextMatchesInTournament(tournamentId: string, app: FastifyInstance) {
    // find all players in tournament that are not in an ongoing match
    const tournament = await app.prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: {
            matches: {
                include: {
                    participants: true,
                },
            },
        },
    });
    if (!tournament) {
        return null;
    }
    const matches = tournament.matches;

    const playersAddedToMatches: string[] = [];
    // get all matches that are pending and have the playersNotInMatches
    const filteredMatches = [];
    const pendingMatches = matches.filter(match => match.status === 'pending');
    for (const match of pendingMatches) {
        for (const participant of match.participants) {
            if (playersAddedToMatches.includes(participant.userId)) {
                continue;
            }
        }
        const hasBusyPlayer = await app.prisma.match.findFirst({
            where: {
                status: 'in progress',
                participants: {
                    some: {
                        userId: { in: match.participants.map(participant => participant.userId) }
                    }
                }
            }
        });
        if (!hasBusyPlayer) {
            filteredMatches.push(match);
            playersAddedToMatches.push(...match.participants.map(participant => participant.userId));
        }
    }
    return filteredMatches || null;
}

async function findTournamentWinner(tournamentId: string, app: FastifyInstance) {
    const tournament = await app.prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: {
            matches: {
                include: {
                    participants: true,
                },
            },
        },
    });
    if (!tournament) {
        return null;
    }
    const winnderId = tournament?.matches.reduce((max, match) => {
        const stats = match.stats as Record<string, number>;
        const player1 = stats[match.participants[0].userId] ?? 0;
        const player2 = stats[match.participants[1].userId] ?? 0;
        return player1 > player2 ? match.participants[0].userId : match.participants[1].userId;
    }, tournament?.matches[0].participants[0].userId);
    return winnderId ?? null;
}

export async function proceedTournament(tournamentId: string, app: FastifyInstance) {
    const nextMatches = await findNextMatchesInTournament(tournamentId, app);
    if (nextMatches === null) {
        // tournament is finished
        // announce winner
        return;
    }
    if (nextMatches.length === 0) {
        // tournament is finished, update tournament status
        const tournament = await app.prisma.tournament.update({
            where: { id: tournamentId },
            data: { status: 'finished' },
            include: {
                participants: true,
            },
        });
        // find winner by comparing stats in matches of a tournament
        const winner = await findTournamentWinner(tournamentId, app);
        // announce winner
        if (winner) {
            const client = app.connections.get(winner);
            if (client) {
                client.send(JSON.stringify({ type: 'TOURNAMENT_ENDED', message: 'You won the tournament!', winner }));
            }
        }
        // annount to other participants
        for (const participant of tournament.participants.filter(participant => participant.userId !== winner)) {
            const client = app.connections.get(participant.userId);
            if (client) {
                client.send(JSON.stringify({ type: 'TOURNAMENT_ENDED', message: 'You lost the tournament... OFC!', winner }));
            }
        }
        return;
    }
    const notifiedParticipants: string[] = [];
    for (const match of nextMatches) {
        // if participant is not notified of any match now, notify them, otherwise skip the match for now
        let skip = false;
        for (const participant of match.participants) {
            if (notifiedParticipants.includes(participant.userId)) {
                skip = true;
                break;
            }
        }
        if (skip) {
            continue;
        }
        const notified = await notifyMatchParticipants(match.id, app);
        if (!notified) {
            continue;
        } else {
            for (const participant of match.participants) {
                if (!notifiedParticipants.includes(participant.userId)) {
                    notifiedParticipants.push(participant.userId);
                }
            }
        }
    }
    return notifiedParticipants;
}

export async function endMatch(matchId: string, app: FastifyInstance) {
    const match = await app.prisma.match.findUnique({
        where: { id: matchId },
    });
    if (!match) {
        return;
    }
    if (match.status !== 'in progress') {
        return;
    }
    await app.prisma.match.update({
        where: { id: matchId },
        data: { status: 'ended' },
    });
    if (match.tournamentId) {
        const result = await proceedTournament(match.tournamentId, app);
        console.log("proceed tournament result", result);
    }
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
    const stats = lastMatchVsAI.stats as Record<string, number>;
    if (!stats) {
        return 1;
    }
    // find highest score
    const playerScore = stats[userId];
    // AI score
    const aiScore = stats['COM1'];
    if (playerScore === undefined || aiScore === undefined) {
        return 1;
    }
    if (playerScore > aiScore) {
        return (settings.aiLevel ?? 1) + 1;
    }
    return settings.aiLevel ?? 1;
}

export async function createMatch(app: FastifyInstance, mode: string, userId: string, userIds?: string[]) {
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
		teams: [],
        guests: [],
        aiLevel: 5,
		gainPoints: true,
		losePoints: false
    };
    if (mode === '1v1guest') {
        settings.players = 2;
        settings.guests = [userId];
        settings.replaceDisconnected = false;
    } else if (mode === '1v1') {
        settings.players = 2;
        settings.replaceDisconnected = false;
    } else if (mode === '1vAI') {
        settings.players = 1;
        settings.aiPlayers = 1;
        settings.replaceDisconnected = false;
        settings.aiLevel = await getPlayerLevelAgainstAI(userId, app);
    } else if (mode === '2v2') {
        settings.players = 4;
        settings.replaceDisconnected = true;
    } else if (mode === 'All vs All') {
        settings.players = 8;
        settings.replaceDisconnected = true;
    } else {
        return null;
    }
    settings.winScore = 3;
    settings.timeLimit = 60000;
    settings.startScore = 0;
    const newMatch = await app.prisma.match.create({
        data: {
            userId: userId,
            gameType: mode,
            status: 'pending',
            settings: settings,
            participants: {
                create: userIds?.map(userId => ({
                    userId: userId,
                    joinedAt: new Date(),
                })),
            },
        },
    });
    return newMatch;
}

export async function getUserMatches(app: FastifyInstance, userId: string) {
    const matches = await app.prisma.match.findMany({
        where: {
            participants: { some: { userId: userId } },
        },
        include: {
            participants: true,
        },
    });
    return matches;
}

export async function deleteMatch(app: FastifyInstance, matchId: string, userId: string) {
    const match = await app.prisma.match.findUnique({
        where: { id: matchId, userId: userId },
    });
    if (!match) {
        return false;
    }
    // delete match participants
    await app.prisma.matchParticipant.deleteMany({
        where: { matchId: matchId },
    });
    // delete match scores
    await app.prisma.matchScore.deleteMany({
        where: { matchId: matchId },
    });
    // delete match
    await app.prisma.match.delete({
        where: { id: matchId, userId: userId },
    });
    return true;
}