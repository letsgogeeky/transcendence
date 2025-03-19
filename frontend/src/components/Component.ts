export default abstract class Component {
    abstract element: HTMLElement;
    parent!: HTMLElement;
    className: string;
    data: any;

    constructor(className: string = '') {
        this.className = className;
        this.data = null;
    }

    public render(parent: HTMLElement | Component): void {
        this.element.className += this.className;
        if (parent instanceof Component) {
            this.parent = parent.element;
            parent.element.appendChild(this.element);
        } else {
            parent.appendChild(this.element);
            this.parent = parent;
        }
    }

    async fetchData() {
        console.log('fetching data');
    }

    disable() {
        if (
            this.element instanceof HTMLInputElement ||
            this.element instanceof HTMLButtonElement
        )
            this.element.disabled = true;
    }

    enable() {
        if (
            this.element instanceof HTMLInputElement ||
            this.element instanceof HTMLButtonElement
        )
            this.element.disabled = false;
    }
}
