import Component from './Component';

export default class AvatarImageComponent extends Component {
    url: string;
    readonly element: HTMLElement;

    constructor(
        label: string,
        url: string,
        href: string | null = null,
        className: string = '',
    ) {
        super(className);
        this.element = document.createElement('div');
        this.url = url;
        const avatar = document.createElement('img');
        avatar.alt = label;
        avatar.className = 'w-32 h-32 rounded-full object-cover';
        avatar.src = this.url;
        if (href) {
            avatar.style.cursor = 'pointer';
            this.element.addEventListener('click', (event) => {
                event.preventDefault();
                window.history.pushState({}, '', href);
            });
        }
        this.element.append(avatar);
    }
}
