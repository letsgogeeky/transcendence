import Component from '../Component';

export default class Select extends Component {
    readonly element: HTMLSelectElement;

    constructor(
        label: string,
        id: string,
        options: { value: string; text: string }[],
        required: boolean = false,
        className: string = '',
    ) {
        super(className);
        this.element = document.createElement('select');
        this.element.id = id;
        this.element.name = id;
        this.element.required = required;

        options.forEach(({ value, text }) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = text;
            this.element.appendChild(option);
        });
    }

    get value(): string {
        return this.element.value;
    }

    set value(newValue: string | null | undefined) {
        if (
            newValue &&
            Array.from(this.element.options).some(
                (opt) => opt.value === newValue,
            )
        ) {
            this.element.value = newValue;
        } else {
            this.element.selectedIndex = 0;
        }
    }
}
