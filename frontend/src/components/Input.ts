import Component from './Component';

export default class Button extends Component {
    readonly element: HTMLInputElement;

    constructor(
        label: string,
        type: string,
        id: string,
        required: boolean = false,
        className: string = '',
    ) {
        super(className);
        this.element = document.createElement('input');
        this.element.textContent = label;
        this.element.id = id;
        this.element.type = type;
        this.element.name = id;
        this.element.required = required;
        this.element.placeholder = label;
    }
}
