import { Route } from '../../router';
import Component from '../Component';

export default class Navbar extends Component {
    readonly element: HTMLElement;
    readonly routes: Route[];

    constructor(id: string, routes: Route[]) {
        super();
        this.element = document.createElement('nav');
        this.element.id = id + '-navbar';
        this.routes = routes;
        this.element.innerHTML = this.createNavList(routes);
    }

    private createNavList(routes: Route[]): string {
        return `
            <ul style="display: flex; list-style-type: none; padding: 0; margin: 0;">
                ${routes
                    .map((route) =>
                        route.visible
                            ? `<li style="padding: 10px"><a href=${route.path}>${route.title}</a></li>`
                            : `<li style="padding: 10px; display:none"><a href=${route.path}>${route.title}</a></li>`,
                    )
                    .join('')}
            </ul>
        `;
    }
}
