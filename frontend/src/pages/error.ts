import Component from '../components/Component';

export default class ErrorComponent extends Component {
    readonly element: HTMLElement;

    constructor(errorMessage: string) {
        super();
        this.element = document.createElement('div');
        this.element.classList.add('error-page');

        const errorText = document.createElement('p');
        errorText.textContent = errorMessage;
		errorText.className = 'text-white';

        this.element.appendChild(errorText);
    }
}
