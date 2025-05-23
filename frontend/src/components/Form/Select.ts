import Component from '../Component';

export default class Select extends Component {
    selectElement: HTMLSelectElement;
    readonly element: HTMLElement;

    constructor(
        label: string,
        id: string,
        options: { value: string; text: string }[],
        required: boolean = false,
        className: string = '',
    ) {
        super();
        this.element = document.createElement('div');
        this.element.className = 'flex flex-col space-y-2';
        
        const labelElement = document.createElement('label');
        labelElement.htmlFor = id;
        labelElement.innerText = label;
        labelElement.className = 'text-white text-md font-medium';
        this.selectElement = document.createElement('select');
        this.selectElement.id = id;
        this.selectElement.name = id;
        this.selectElement.required = required;
        this.selectElement.className = className;
        
        options.forEach(({ value, text }) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = text;
            this.selectElement.appendChild(option);
        });
        
        this.element.append(labelElement, this.selectElement);
    }

    get value(): string {
        return this.selectElement.value;
    }

    set value(newValue: string | null | undefined) {
        if (
            newValue &&
            Array.from(this.selectElement.options).some(
                (opt) => opt.value === newValue,
            )
        ) {
            this.selectElement.value = newValue;
        } else {
            this.selectElement.selectedIndex = 0;
        }
    }

    public render(parent: HTMLElement | Component): void {
        super.render(parent);
    }
}
