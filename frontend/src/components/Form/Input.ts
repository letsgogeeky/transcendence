import Component from '../Component';

export default class Input extends Component {
    readonly element: HTMLInputElement;

    constructor(
        label: string,
        type: string,
        id: string,
        required: boolean = false,
        placeholder: string | null,
        className: string = '',
    ) {
        super(className);
        this.element = document.createElement('input');
        this.element.textContent = label;
        this.element.id = id;
        this.element.type = type;
        this.element.name = id;
        this.element.required = required || false;
        this.element.placeholder = placeholder ?? label;
    }

    get value(): string {
        return this.element.value;
    }

    set value(newValue: string | null | undefined) {
        if (newValue) this.element.value = newValue;
        else this.element.value = '';
    }
}
