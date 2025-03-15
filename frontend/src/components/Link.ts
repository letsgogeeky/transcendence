function handleLinkClick(event: MouseEvent) {}

import Component from './Component';

export default class LinkComponent extends Component {
    readonly element: HTMLAnchorElement;

    constructor(label: string, href: string) {
        super();
        this.element = document.createElement('a');
        this.element.textContent = label;
        this.element.href = href;
        this.element.addEventListener('click', (event) => {
            event.preventDefault();
            window.history.pushState({}, '', href);
        });
    }
}
