export default abstract class Component {
    abstract element: HTMLElement;
    parent!: HTMLElement;
    className: string;

    constructor(className: string = '') {
        this.className = className;
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
