import Component from "../components/Component";
// import Pong from "../components/Games/Pong";
import { initializeGame } from "../game/pong";
// import Pong from "../components/Games/Pong";
// import Game from "../game/pong";

class GamePage extends Component {
    readonly element: HTMLElement;
    constructor() {
        super();
        // create a canvas element with id gameCanvas
        this.element = document.createElement('div');
        this.element.id = 'gameIframe';
        this.element.style.width = '100%';
        this.element.style.height = '100%';
        this.element.style.backgroundColor = 'black';
    }

    public render(parent: HTMLElement | Component): void {
        const iframe = document.createElement('iframe');
        iframe.id = 'gameIframe';
        iframe.src = '/multiplayer/index.html';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        this.element.appendChild(iframe);
        super.render(parent);
    }
}

export default GamePage;