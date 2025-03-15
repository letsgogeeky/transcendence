import Component from '../Component';

export default class NavContent extends Component {
    readonly element: HTMLElement;
    childComponent: Component;

    constructor(id: string, childComponent: Component) {
        super();
        this.element = document.createElement('div');
        this.element.className = 'w-full max-w-lg';
        this.element.id = id + '-nav-content';
        this.childComponent = childComponent;
    }

    render(parent: HTMLElement) {
        this.element.innerHTML = '';
        this.childComponent.render(this.element);
        super.render(parent);
    }
}
