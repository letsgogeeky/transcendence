import Component from '../Component';

export default class NavContent extends Component {
    readonly element: HTMLElement;
    childComponent: Component;

    constructor(id: string, childComponent: Component) {
        super();
        this.element = document.createElement('div');
        this.element.className = 'w-full h-full';
        this.element.id = id + '-nav-content';
        this.childComponent = childComponent;
    }

    async init(parent: HTMLElement) {
        this.render(parent);
        this.childComponent.data = await this.childComponent.fetchData();
        this.element.innerHTML = '';
        this.render(parent);
    }

    changeSelection(childComponent: Component) {
        this.childComponent = childComponent;
        this.init(this.parent);
    }

    render(parent: HTMLElement) {
        this.element.innerHTML = '';
        this.childComponent.render(this.element);
        super.render(parent);
    }
}
