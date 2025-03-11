export default abstract class Component {
    abstract element: HTMLElement;
    parent!: HTMLElement;

    public render(parent: HTMLElement | Component): void {
        if (parent instanceof Component) {
            this.parent = parent.element;
            parent.element.appendChild(this.element);
        } else {
            parent.appendChild(this.element);
            this.parent = parent;
        }
    }
}
