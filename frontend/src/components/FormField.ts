import Component from './Component';

export default class FormField extends Component {
    element: HTMLElement;

    constructor(text: string) {
        super();
        this.element = document.createElement('input');
        this.element.textContent = text;
    }
}
