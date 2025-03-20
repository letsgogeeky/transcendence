import Component from '../Component';

export default class Input extends Component {
    inputElement: HTMLInputElement;
    readonly element: HTMLElement;

    constructor(
        label: string,
        type: string,
        id: string,
        required: boolean = false,
        placeholder: string | null,
        className: string = '',
    ) {
        super();
        this.element = document.createElement('div');
        this.element.className = 'flex items-center gap-2';
        this.inputElement = document.createElement('input');
        this.inputElement.className += className;
        const labelElement = document.createElement('label');
        labelElement.htmlFor = id;
        labelElement.innerText = label;
        labelElement.className = 'w-40 text-left font-medium whitespace-nowrap';
        this.inputElement.textContent = label;
        this.inputElement.id = id;
        this.inputElement.type = type;
        this.inputElement.name = id;
        this.inputElement.required = required || false;
        this.inputElement.placeholder = placeholder ?? label;
        this.element.append(labelElement, this.inputElement);
    }

    get value(): string {
        return this.inputElement.value;
    }

    set value(newValue: string | null | undefined) {
        if (newValue) this.inputElement.value = newValue;
        else this.inputElement.value = '';
    }

    public render(parent: HTMLElement | Component): void {
        super.render(parent);
    }
}
