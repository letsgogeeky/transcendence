import Component from './Component';
import { showToast, ToastState } from './Toast';
import State from '../services/state';
import { deleteMatch } from '../services/match.request';
interface Match {
    id: string;
    status: string;
    participants: Array<{
        userId: string;
    }>;
    stats?: {
        [key: string]: number;
    };
    createdAt?: string;
    gameType?: string;
}

interface User {
    id: string;
    name: string;
}

export default class TournamentMatchCard extends Component {
    readonly element: HTMLElement;
    private match: Match;
    private userMap: Map<string, string>;
    private tournamentId: string;

    constructor(match: Match, userMap: Map<string, string>, tournamentId: string) {
        super();
        this.element = document.createElement('div');
        this.match = match;
        this.userMap = userMap;
        this.tournamentId = tournamentId;
    }

    private createMatchHeader(): HTMLElement {
        const matchHeader = document.createElement('div');
        matchHeader.className = 'flex justify-between items-center mb-4';

        const leftSection = document.createElement('div');
        leftSection.className = 'flex items-center gap-4';

        const matchStatus = document.createElement('span');
        matchStatus.className = `px-3 py-1 rounded-full text-sm ${this.match.status === 'pending' ? 'bg-yellow-600' :
                this.match.status === 'in progress' ? 'bg-blue-600' :
                    'bg-green-600'
            } text-white`;
        matchStatus.textContent = this.match.status.toUpperCase();

        leftSection.append(matchStatus);

        const middleSection = document.createElement('div');
        middleSection.className = 'flex items-center gap-4';

        if (this.match.gameType) {
            const gameTypeSpan = document.createElement('span');
            gameTypeSpan.className = 'text-white font-medium text-sm bg-gray-700 px-3 py-1 rounded-lg';
            gameTypeSpan.textContent = this.match.gameType;
            middleSection.append(gameTypeSpan);
        }

        const matchId = document.createElement('span');
        matchId.className = 'text-gray-400 text-sm';
        matchId.textContent = `Match #${this.match.id.slice(0, 8)}`;
        middleSection.append(matchId);

        const rightSection = document.createElement('div');
        rightSection.className = 'flex items-center gap-4';

        if (this.match.createdAt) {
            const dateFormatter = new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
            const formattedDate = dateFormatter.format(new Date(this.match.createdAt));

            const dateSpan = document.createElement('span');
            dateSpan.className = 'text-gray-400 text-sm';
            dateSpan.textContent = formattedDate;
            rightSection.append(dateSpan);
        }

        if (this.match.status === 'in progress') {
            const spectateButton = document.createElement('button');
            spectateButton.textContent = 'Spectate';
            spectateButton.className = 'px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm';
            spectateButton.onclick = () => {
                window.history.pushState(
                    { path: '/game' },
                    '/game',
                    `/game?matchId=${this.match.id}&tournamentId=${this.tournamentId}&spectate=true`
                );
                window.location.reload();
            };
            rightSection.append(spectateButton);
        }

        matchHeader.append(leftSection, middleSection, rightSection);
        return matchHeader;
    }

    private createMatchParticipants(): HTMLElement {
        const matchParticipants = document.createElement('div');
        matchParticipants.className = 'space-y-4';

        if (this.match.participants && this.match.participants.length > 0) {
            const participantsContainer = document.createElement('div');
            participantsContainer.className = 'flex flex-col gap-4';

            // Handle invalid matches
            if (this.match.participants.length < 2 && (!this.match.stats || Object.keys(this.match.stats).length === 0)) {
                const invalidMatchDiv = document.createElement('div');
                invalidMatchDiv.className = 'flex flex-col items-center gap-4 p-4 bg-red-900/50 rounded-lg';

                const invalidText = document.createElement('span');
                invalidText.className = 'text-white font-medium';
                invalidText.textContent = 'Invalid Match';

                const deleteButton = document.createElement('button');
                deleteButton.className = 'px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors';
                deleteButton.textContent = 'Delete Match';
                deleteButton.onclick = async () => {
                    const success = await deleteMatch(this.match.id);
                    if (success) {
                        showToast(ToastState.SUCCESS, 'Match deleted successfully');
                        // Empty and dispose the component
                        this.element.innerHTML = '';
                        this.element.remove();
                    } else {
                        showToast(ToastState.ERROR, 'Failed to delete match');
                    }
                };

                invalidMatchDiv.append(invalidText, deleteButton);
                participantsContainer.append(invalidMatchDiv);
            } else {
                // Create participant cards
                const participantCards = this.match.participants.map((participant) => {
                    const participantDiv = document.createElement('div');
                    participantDiv.className = 'flex items-center justify-between p-3 bg-gray-700 rounded-lg';

                    let participantName: string;
                    if (this.match.participants.length === 1 && this.match.stats) {
                        // For single participant matches (AI/Local player), use the stats key
                        const statsKey = Object.keys(this.match.stats)[0];
                        participantName = this.userMap.get(statsKey) || statsKey;
                    } else {
                        participantName = this.userMap.get(participant.userId) || 'Unknown User';
                    }

                    const nameSpan = document.createElement('span');
                    nameSpan.className = 'text-white font-medium';
                    nameSpan.textContent = participantName;

                    const scoreContainer = document.createElement('div');
                    scoreContainer.className = 'flex items-center space-x-2';

                    if (this.match.stats && this.match.stats[participant.userId] !== undefined) {
                        const score = document.createElement('span');
                        score.className = 'text-xl font-bold text-blue-400';
                        score.textContent = this.match.stats[participant.userId].toString();

                        const scoreLabel = document.createElement('span');
                        scoreLabel.className = 'text-gray-400 text-sm';
                        scoreLabel.textContent = 'Score';

                        scoreContainer.append(scoreLabel, score);
                    } else {
                        const pendingText = document.createElement('span');
                        pendingText.className = 'text-gray-400 text-sm';
                        pendingText.textContent = 'Pending';
                        scoreContainer.append(pendingText);
                    }

                    participantDiv.append(nameSpan, scoreContainer);
                    return participantDiv;
                });

                // Add winner flag if scores are available
                if (this.match.stats && Object.keys(this.match.stats).length > 0) {
                    const scores = Array.from(Object.entries(this.match.stats));
                    const maxScore = Math.max(...scores.map(([_, score]) => score));
                    const winners = scores.filter(([_, score]) => score === maxScore);

                    const winnerFlag = document.createElement('div');
                    winnerFlag.className = 'flex items-center justify-center py-2';

                    if (winners.length === 1) {
                        const winner = winners[0];
                        const winnerName = this.userMap.get(winner[0]) || winner[0];
                        winnerFlag.innerHTML = `
                            <div class="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                                </svg>
                                <span class="font-medium">${winnerName} Won!</span>
                            </div>
                        `;
                    } else {
                        winnerFlag.innerHTML = `
                            <div class="flex items-center gap-2 bg-yellow-600 text-white px-4 py-2 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clip-rule="evenodd" />
                                </svg>
                                <span class="font-medium">Draw!</span>
                            </div>
                        `;
                    }

                    participantsContainer.append(winnerFlag);
                }
                participantsContainer.append(...participantCards);
            }

            matchParticipants.append(participantsContainer);
        }

        return matchParticipants;
    }

    public render(parent: HTMLElement | Component): void {
        this.element.className = 'bg-gray-800 rounded-xl shadow-2xl p-6 border border-gray-700';

        // Add hover effect and cursor pointer for pending matches
        if (this.match.status === 'pending') {
            this.element.classList.add('hover:bg-gray-700', 'transition-colors', 'cursor-pointer');

            // Check if current user is a participant
            const currentUserId = State.getState().getCurrentUser()?.id;
            const isParticipant = this.match.participants.some(p => p.userId === currentUserId);

            if (isParticipant) {
                this.element.onclick = () => {
                    window.history.pushState(
                        { path: '/game' },
                        '/game',
                        `/game?matchId=${this.match.id}&tournamentId=${this.tournamentId}`
                    );
                    window.location.reload();
                };
            }
        }

        const matchHeader = this.createMatchHeader();
        const matchParticipants = this.createMatchParticipants();

        this.element.append(matchHeader, matchParticipants);
        super.render(parent);
    }
} 