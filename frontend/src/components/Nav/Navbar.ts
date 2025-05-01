import { Route } from '../../router';
import Component from '../Component';
import { IconLinkComponent } from '../Link';
import State, { MyUser } from '../../services/state';
import { logoutUser } from '../../pages/logout';
import AvatarImageComponent from '../../components/AvatarImage';

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
				li.className = 'text-md hover:text-purple-400 transition duration-300';
	
				// Check if the route title matches one that should be an icon
				const lowerTitle = route.title.toLowerCase();
				const iconRoutes = ['pongjam', 'settings',  'users']; // add more as needed
	
				if (iconRoutes.includes(lowerTitle)) {
					// Use your icon link component
					const iconLink = new IconLinkComponent(
						route.title,
						route.path,
						'h-8 transition-transform duration-300 ease-in-out hover:scale-110 hover:opacity-80'
					);
					li.appendChild(iconLink.element);
				} else {
					// Default text link
					const a = document.createElement('a');
					a.href = route.path;
					a.textContent = route.title;
					li.appendChild(a);
				}
	
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

// 	// the navbar before:
// 	// private renderNavList() {
// 	// 	const ul = document.createElement('ul');
// 	// 	ul.className = 'flex justify-around w-full';
	
// 	// 	this.routes.forEach((route) => {
// 	// 		if (route.visible) {
// 	// 			const li = document.createElement('li');
// 	// 			li.className = 'text-md hover:text-purple-400 transition duration-300'; // ⬅️ Changed from text-lg to text-sm
	
// 	// 			const a = document.createElement('a');
// 	// 			a.href = route.path;
// 	// 			a.textContent = route.title;
// 	// 			li.appendChild(a);
// 	// 			ul.appendChild(li);
// 	// 		}
// 	// 	});
	
// 	// 	this.element.innerHTML = '';
// 	// 	this.element.appendChild(ul);
// 	// }

// }

/** THE failed version for navbar with dropdown window on the avatar icon: */

// export default class Navbar extends Component {
// 	readonly element: HTMLElement;
// 	readonly routes: Route[];

// 	constructor(id: string, routes: Route[]) {
// 		super();
// 		this.element = document.createElement('nav');
// 		this.routes = routes;
// 		this.element.id = id + '-navbar';
// 		this.element.className = 'w-full px-10 py-3 bg-black bg-opacity-60 text-white shadow-md flex items-center justify-between';

// 		this.renderNavBasedOnUser();
// 		window.addEventListener('userChange', () => {
// 			this.element.innerHTML = '';
// 			this.renderNavBasedOnUser();
// 		});
// 	}

// 	private renderNavBasedOnUser() {
// 		const user = State.getState().getCurrentUser();
// 		user ? this.buildLoggedInUI(user) : this.buildLoggedOutUI();
// 	}

// 	private buildLoggedOutUI() {
// 		const left = this.createNavListByTitles(['PongJam']);
// 		const center = this.createNavListByTitles(['About']);
// 		const right = this.createNavListByTitles(['Log in', 'Sign up']);

// 		this.applyLayout(left, center, right);
// 	}

// 	private buildLoggedInUI() {
// 		const left = this.createNavListByTitles(['PongJam']);
// 		const center = this.createNavListByTitles(['Tournaments', 'Users']);

// 		const right = document.createElement('div');
// 		right.className = 'relative';

// 		const user = State.getState().getCurrentUser();
// 		const avatar = new AvatarImageComponent('My Avatar', user.avatarUrl!);
// 		avatar.render(this.element);

// 		// const profileImg = document.createElement('img');
// 		// profileImg.src = user.avatarUrl ?? './assets/icons/default-profile.png';
// 		// profileImg.alt = 'Profile';
// 		// profileImg.className = 'h-8 w-8 rounded-full cursor-pointer hover:scale-110 transition';

// 		const dropdown = this.buildDropdownMenu();

// 		profileImg.addEventListener('click', () => {
// 			dropdown.classList.toggle('hidden');
// 		});

// 		right.appendChild(profileImg);
// 		right.appendChild(dropdown);

// 		this.applyLayout(left, center, right);
// 	}

// 	private applyLayout(left: HTMLElement, center: HTMLElement, right: HTMLElement | HTMLElement[]) {
// 		this.element.innerHTML = '';
// 		const layout = document.createElement('div');
// 		layout.className = 'w-full flex justify-between items-center';

// 		layout.appendChild(left);
// 		layout.appendChild(center);
// 		if (Array.isArray(right)) {
// 			right.forEach(r => layout.appendChild(r));
// 		} else {
// 			layout.appendChild(right);
// 		}
// 		this.element.appendChild(layout);
// 	}

// 	private createNavListByTitles(titles: string[]): HTMLElement {
// 		const matchedRoutes = this.routes.filter(r => titles.includes(r.title) && r.visible);
// 		return this.createNavList(matchedRoutes);
// 	}

// 	private createNavList(routes: Route[]): HTMLElement {
// 		const ul = document.createElement('ul');
// 		ul.className = 'flex items-center gap-6';

// 		routes.forEach(route => {
// 			const li = document.createElement('li');
// 			li.className = 'text-md hover:text-purple-400 transition duration-300';

// 			const lowerTitle = route.title.toLowerCase();
// 			const iconRoutes = ['pongjam', 'settings', 'users'];

// 			if (iconRoutes.includes(lowerTitle)) {
// 				const iconLink = new IconLinkComponent(
// 					route.title,
// 					route.path,
// 					'h-8 transition-transform duration-300 ease-in-out hover:scale-110 hover:opacity-80'
// 				);
// 				li.appendChild(iconLink.element);
// 			} else {
// 				const a = document.createElement('a');
// 				a.href = route.path;
// 				a.textContent = route.title;
// 				li.appendChild(a);
// 			}

// 			ul.appendChild(li);
// 		});
// 		return ul;
// 	}

// 	private buildDropdownMenu(): HTMLElement {
// 		const menu = document.createElement('div');
// 		menu.className = 'hidden absolute right-0 mt-2 bg-white text-black rounded shadow-lg w-40 z-50';

// 		const dropdownTitles = ['My Profile', 'Settings', 'Log out'];
// 		const items = dropdownTitles.map(title => this.routes.find(r => r.title === title)).filter(Boolean) as Route[];

// 		items.forEach(item => {
// 			const link = document.createElement('a');
// 			link.href = item.path;
// 			link.textContent = item.title;
// 			link.className = 'block px-4 py-2 hover:bg-gray-200 cursor-pointer';

// 			if (item.title === 'Log out') {
// 				link.addEventListener('click', (e) => {
// 					e.preventDefault();
// 					logoutUser();
// 				});
// 			}

// 			menu.appendChild(link);
// 		});

// 		return menu;
// 	}
// }