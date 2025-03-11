import Component from './Component';

export default class App extends Component {
    element: HTMLElement;

    constructor(text: string) {
        super();
        this.element = document.createElement('app');
        this.element.textContent = text;
    }
}
