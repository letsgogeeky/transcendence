import Button from '../components/Button';
import Component from '../components/Component';

export default class NotFoundComponent extends Component {
    readonly element: HTMLElement;

    constructor() {
        super();
        const container = document.createElement('div');
        container.className = 'text-center';

        const title = document.createElement('h1');
        title.className = 'text-2xl font-bold text-red-500';
        title.textContent = '404';

        const description = document.createElement('p');
        description.className = 'text-gray-600';
        description.textContent =
            'I think you missed the correct exit on the highway.';

        const homeButton = new Button('Go Home', () => {
            window.history.pushState({ path: '/' }, '/', '/');
        });
        container.append(title, description);
        homeButton.render(container);
        this.element = container;
    }
}
