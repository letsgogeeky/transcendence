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

        // Tailwind styles for a full-width top bar
        this.element.className = 'w-full px-10 py-3 bg-black bg-opacity-60 text-white shadow-md';

        this.renderNavList();
    }

	private renderNavList() {
		const ul = document.createElement('ul');
		ul.className = 'flex justify-around w-full';
	
		this.routes.forEach((route) => {
			if (route.visible) {
				const li = document.createElement('li');
				li.className = 'text-xs hover:text-purple-400 transition duration-300'; // ⬅️ Changed from text-lg to text-sm
	
				const a = document.createElement('a');
				a.href = route.path;
				a.textContent = route.title;
				
				li.appendChild(a);
				ul.appendChild(li);
			}
		});
	
		this.element.innerHTML = '';
		this.element.appendChild(ul);
	}

    displayTab(path: string, show: boolean) {
        const route = this.routes.find((r) => r.path == path);
        if (route) route.visible = show;
        this.renderNavList();
    }
}



// export default class Navbar extends Component {
//     readonly element: HTMLElement;
//     readonly routes: Route[];

//     constructor(id: string, routes: Route[]) {
//         super();
//         this.element = document.createElement('nav');
//         this.element.id = id + '-navbar';
//         this.routes = routes;
//         this.element.innerHTML = this.createNavList(routes);
//     }

//     private createNavList(routes: Route[]): string {
//         return `
//             <ul style="display: flex; list-style-type: none; padding: 0; margin: 0;">
//                 ${routes
//                     .map((route) =>
//                         route.visible
//                             ? `<li style="padding: 10px"><a href=${route.path}>${route.title}</a></li>`
//                             : `<li style="padding: 10px; display:none"><a href=${route.path}>${route.title}</a></li>`,
//                     )
//                     .join('')}
//             </ul>
//         `;
//     }

//     displayTab(path: string, show: boolean) {
//         const route = this.routes.find((r) => r.path == path);
//         if (route) route.visible = show;
//         this.element.innerHTML = this.createNavList(this.routes);
//     }
// }
