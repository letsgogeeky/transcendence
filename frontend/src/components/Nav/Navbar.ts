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
		// if current path is /game, hide the navbar
		const currentPath = new URL(window.location.href).pathname;
		if (currentPath.includes('/game')) {
			return;
		}
		const ul = document.createElement('ul');
		ul.className = 'flex justify-around w-full';
	
		this.routes.forEach((route) => {
			if (route.visible) {
				const li = document.createElement('li');
				li.className = 'text-md hover:text-purple-400 transition duration-300'; // ⬅️ Changed from text-lg to text-sm
	
				const a = document.createElement('a');
				a.href = route.path;
				a.textContent = route.title;
				// a.className = 'block';
				// if (route.title != 'Home')
			
				// if (route.title != 'Sign Up') {
				// 	// Create Image Element for the Home Icon
				// 	const img = document.createElement('img');
				// 	img.src = `./assets/icons/${route.title.toLowerCase()}.png`; // Assuming icons are named like 'home.png', 'about.png'
				// 	img.alt = route.title;
				// 	img.className = 'w-10 h-8'; // Adjust the size as needed
	
				// 	a.appendChild(img);
				// }
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

	public hide() {
		this.element.style.display = 'none';
	}

	public show() {
		this.element.style.display = 'block';
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
