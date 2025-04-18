import Component from './Component';

export default class SpanComponent extends Component {
    readonly element: HTMLElement;

    constructor(text: string, title: string, className: string = '') {
        super();
        this.element = document.createElement('div');
        this.element.className = 'flex bg-gray-700/50 p-6 rounded-lg mb-4';
        
        const label = document.createElement('label');
        label.textContent = title + ' -> ';
        label.className = 'text-xs uppercase tracking-wider font-semibold text-gray-400 mb-2 w-1/2';
        
        const span = document.createElement('span');
        span.textContent = text;
        span.className = `text-white text-xl font-medium ${className}`;
        
        this.element.append(label, span);
    }

    public render(parent: HTMLElement | Component): void {
        super.render(parent);
    }
}
