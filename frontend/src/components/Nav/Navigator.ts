import NotFoundComponent from '../../pages/notfound';
import { Route } from '../../router';
import Component from '../Component';
import Navbar from './Navbar';
import NavContent from './NavContent';

export default class NavigatorComponent extends Component {
    readonly element: HTMLElement;
    navbar: Navbar;
    content: NavContent;
    selectedRoute: Route;

    constructor(id: string, routes: Route[]) {
        super();
        this.element = document.createElement('div');
        this.element.id = id + '-navigator';
        this.navbar = new Navbar(id, routes);
        this.selectedRoute = this.navbar.routes[0];
        this.content = new NavContent(id, this.selectedRoute.component);
        this.content.element.className = 'px-4 md:px-8 lg:px-16 pt-8';
        document.title = this.selectedRoute.title;
    }

    changeSelection(path: string) {
        const selectedRoute = this.navbar.routes.find(
            (route) => route.path == path,
        );
        if (selectedRoute) {
            this.selectedRoute = selectedRoute;
            document.title = selectedRoute.title;
            this.content.changeSelection(selectedRoute.component);
        } else {
            document.title = 'Page Not found';
            const notFound = new NotFoundComponent();
            notFound.render(this.content.element);
        }
    }

    displayTab(path: string, shouldDisplay: boolean) {
        this.navbar.displayTab(path, shouldDisplay);
    }

    render(parent: HTMLElement) {
        this.element.innerHTML = '';
        this.navbar.render(this.element);
        this.content.render(this.element);
        super.render(parent);
    }
}
