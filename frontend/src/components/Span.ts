import Component from './Component';

export default class SpanComponent extends Component {
    readonly element: HTMLElement;


    constructor(text: string, title: string, className: string = 'text-gray-900') {
        super();
        const div = document.createElement('div');
        div.className = 'flex items-center space-x-2';
        const label = document.createElement('label');
        label.textContent = title;
        label.className = 'font-medium text-gray-700';
        div.appendChild(label);
        const span = document.createElement('span');
        span.textContent = text;
        span.className = className;
        div.appendChild(span);
        this.element = div;
    }

    public render(parent: HTMLElement | Component): void {
        super.render(parent);
    }
}
