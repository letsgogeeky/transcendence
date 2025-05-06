import Component from "./Component";

interface ParticipantStats {
    matchesWon: number;
    totalScore: number;
}

interface TournamentWinner {
    winnerId: string;
    participantStats: {
        [key: string]: ParticipantStats;
    };
}

interface TournamentStatsProps {
    winner: TournamentWinner;
    userMap: Map<string, string>;
}

export default class TournamentStats extends Component {
    readonly element: HTMLElement;
    private props: TournamentStatsProps;

    constructor(props: TournamentStatsProps) {
        super();
        this.props = props;
        this.element = document.createElement('div');
    }

    public render(parent: HTMLElement | Component): void {
        const resultsSection = document.createElement('div');
        resultsSection.className = 'bg-gray-800 rounded-xl p-6 mb-8';

        const resultsTitle = document.createElement('h2');
        resultsTitle.className = 'text-2xl font-bold text-white mb-4';
        resultsTitle.textContent = 'Tournament Results';
        resultsSection.appendChild(resultsTitle);

        // Create a table for participant stats
        const table = document.createElement('table');
        table.className = 'w-full text-white';

        // Table header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr class="border-b border-gray-700">
                <th class="text-left py-3 px-4">Player</th>
                <th class="text-center py-3 px-4">Matches Won</th>
                <th class="text-center py-3 px-4">Total Score</th>
            </tr>
        `;
        table.appendChild(thead);

        // Table body
        const tbody = document.createElement('tbody');

        // Sort participants by matches won
        const sortedParticipants = Object.entries(this.props.winner.participantStats)
            .sort(([, a], [, b]) => b.matchesWon - a.matchesWon);

        for (const [userId, stats] of sortedParticipants) {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-gray-700 hover:bg-gray-700';

            // Get user name
            const userName = this.props.userMap.get(userId) || 'Unknown User';

            // Highlight winner
            const isWinner = this.props.winner.winnerId === userId;
            const nameCell = document.createElement('td');
            nameCell.className = `py-3 px-4 ${isWinner ? 'text-yellow-400 font-bold' : ''}`;
            nameCell.textContent = userName;

            const matchesWonCell = document.createElement('td');
            matchesWonCell.className = 'text-center py-3 px-4';
            matchesWonCell.textContent = stats.matchesWon.toString();

            const totalScoreCell = document.createElement('td');
            totalScoreCell.className = 'text-center py-3 px-4';
            totalScoreCell.textContent = stats.totalScore.toString();

            tr.appendChild(nameCell);
            tr.appendChild(matchesWonCell);
            tr.appendChild(totalScoreCell);
            tbody.appendChild(tr);
        }

        table.appendChild(tbody);
        resultsSection.appendChild(table);

        if (parent instanceof Component) {
            parent.element.appendChild(resultsSection);
        } else {
            parent.appendChild(resultsSection);
        }
    }
} 