import Button from '../components/Button';
import Component from '../components/Component';

export default class HomeComponent extends Component {
    readonly element: HTMLElement;

    constructor() {
        super();
        this.element = document.createElement('div');
        this.element.className = 'text-center';
        const title = document.createElement('h1');
        title.className = 'text-2xl font-bold';
        title.textContent = "Welcome to The Orca's PONG";
        const description = document.createElement('p');
        description.className = 'text-gray-600';
        description.textContent = 'Welcome to the home page buddy!';
        let count = 0;
        const counter = document.createElement('p');
        counter.className = 'mt-4 text-lg font-semibold';
        counter.textContent = `Counter: ${count}`;

        const incrementButton = new Button('Increase', () => {
            console.log(`incrementing ${count}`);
            count++;
            counter.textContent = `Counter: ${count + 5}`;
        });
        this.element.append(title, description, counter);
        incrementButton.render(this);
    }
}
