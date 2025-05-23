import Component from '../Component';

export default class Input extends Component {
    inputElement: HTMLInputElement;
    readonly element: HTMLElement;
    type: string;

    constructor(
        label: string,
        type: string,
        id: string,
        required: boolean = false,
        placeholder: string | null,
        className: string = '',
        showLabel: boolean = true,
    ) {
        super();
        this.element = document.createElement('div');
        this.element.className = 'flex flex-col space-y-2';

        const labelElement = document.createElement('label');
        labelElement.htmlFor = id;
        labelElement.innerText = label;
        labelElement.className = 'text-white text-large font-medium';

        this.inputElement = document.createElement('input');
        // this.inputElement.className = `w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${className}`;
        this.inputElement.className = `w-full px-4 py-2 rounded-lg bg-[#4f445a] border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${className}`;
        this.inputElement.id = id;
        this.inputElement.type = type;
        this.type = type;
        this.inputElement.name = id;
        this.inputElement.required = required || false;
        this.inputElement.placeholder = placeholder ?? label;

        if (showLabel) {
            const labelElement = document.createElement('label');
            labelElement.htmlFor = id;
            labelElement.innerText = label;
            labelElement.className = 'text-white text-large font-medium';
            this.element.append(labelElement);
        }
        this.element.append(this.inputElement);
        // this.element.append(labelElement, this.inputElement);
    }

    sanitize(input: string): string {
        return input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    disable() {
        this.inputElement.disabled = true;
    }

    get value(): string {
        return this.inputElement.value;
    }

    set value(newValue: string | null | undefined) {
        if (newValue)
            this.inputElement.value =
                this.type == 'password' ? newValue : this.sanitize(newValue);
        else this.inputElement.value = '';
    }

    public render(parent: HTMLElement | Component): void {
        super.render(parent);
    }
}
