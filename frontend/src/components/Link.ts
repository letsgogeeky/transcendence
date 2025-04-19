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

export class IconLinkComponent extends Component {
    readonly element: HTMLAnchorElement;

    constructor(imageSrc: string, altText: string, href: string, className?: string) {
        super();

        this.element = document.createElement('a');
        this.element.href = href;

        const img = document.createElement('img');
        img.src = `./assets/${imageSrc}`;
        img.alt = altText;
        img.className = className ?? '';  // Optional styling for the image

        this.element.appendChild(img);

        this.element.addEventListener('click', (event) => {
            event.preventDefault();
            window.history.pushState({}, '', href);
        });
    }
}
