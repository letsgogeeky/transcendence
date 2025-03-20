import Component from './Component';

export default class Button extends Component {
    readonly element: HTMLButtonElement;

    constructor(label: string, onClick: () => void, className: string = '') {
        super(className);
        this.element = document.createElement('button');
        this.element.textContent = label;
        this.element.addEventListener('click', () => {
            console.log(`Button "${label}" clicked`);
            onClick();
        });
    }
}
