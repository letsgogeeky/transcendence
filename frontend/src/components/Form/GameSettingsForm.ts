import FormComponent from './Form';
import Input from './Input';
import Select from './Select';

export default class GameSettingsForm extends FormComponent {
    constructor(
        submitCallback: ((data: any) => Promise<Response>) | null,
        successCallback: ((data: any) => Promise<void>) | ((data: any) => void) | null = null,
    ) {
        const inputs = [
            new Input(
                'Number of Players',
                'number',
                'players',
                true,
                '2',
                '',
                true
            ),
            new Input(
                'Number of AI Players',
                'number',
                'aiPlayers',
                false,
                '0',
                '',
                true
            ),
            new Select(
                'AI Difficulty Level',
                'aiLevel',
                [
                    { value: '1', text: 'Very Easy' },
                    { value: '3', text: 'Easy' },
                    { value: '5', text: 'Medium' },
                    { value: '7', text: 'Hard' },
                    { value: '9', text: 'Very Hard' }
                ],
                true,
                ''
            ),
            new Input(
                'Time Limit (seconds)',
                'number',
                'timeLimit',
                false,
                '',
                '',
                true
            ),
            new Input(
                'Win Score',
                'number',
                'winScore',
                false,
                '',
                '',
                true
            ),
            new Input(
                'Starting Score',
                'number',
                'startScore',
                false,
                '0',
                '',
                true
            ),
            new Select(
                'Replace Disconnected Players',
                'replaceDisconnected',
                [
                    { value: 'false', text: 'No' },
                    { value: 'true', text: 'Yes' }
                ],
                true,
                ''
            ),
            new Select(
                'Terminate Players at Zero Score',
                'terminatePlayers',
                [
                    { value: 'false', text: 'No' },
                    { value: 'true', text: 'Yes' }
                ],
                true,
                ''
            ),
            new Select(
                'Obstacle Mode',
                'obstacleMode',
                [
                    { value: '0', text: 'No Obstacles' },
                    { value: '1', text: 'Easy' },
                    { value: '2', text: 'Medium' },
                    { value: '3', text: 'Hard' }
                ],
                true,
                ''
            ),
			new Select(
                'Kicker Mode (Mess with gravity and find out!)',
                'kickerMode',
                [
                    { value: 'false', text: 'No' },
                    { value: 'true', text: 'Yes' }
                ],
                true,
                ''
            ),
            new Input(
                'Number of Balls',
                'number',
                'balls',
                false,
                '1',
                '',
                true
            )
        ];

        super('Start Game', inputs, submitCallback, successCallback, 'game-settings-form');
    }
} 