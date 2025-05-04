import NavigatorComponent from './components/Nav/Navigator';
import { routes } from './router';
import { tryRefresh, noRetryRoutes } from './services/send-request';
import State, { MyUser } from './services/state';

/**
 * history.pushState() is overridden to dispatch a pushstate event whenever navigation happens.
 * This ensures that our custom logic (inside render()) runs whenever the URL changes.
 * It helps in client-side navigation without reloading the page.
 */
(function () {
    const originalPushState = history.pushState;
    history.pushState = function (state, title, url) {
        originalPushState.apply(this, [state, title, url]);
        window.dispatchEvent(new Event('pushstate')); // Emit event
    };
})();

/**
 * This function renders the page dynamically based on:
 * 	- User authentication state
 * 	- Current URL
 * 	- Navigation events
 */
const render = () => {
	// Retrieves the auth token and current user data (if stored in localStorage).
    const authToken = localStorage.getItem('authToken');
    const currentUser = localStorage.getItem('currentUser')
        ? (JSON.parse(localStorage.getItem('currentUser')!) as MyUser)
        : null;
	// If the state doesn't already contain an auth token or user, it initializes them.
    if (authToken && !State.getState().getAuthToken()) {
        State.getState().setAuthToken(authToken);
    }
	// Ensures that the app state remains consistent across page reloads:
    if (!State.getState().getCurrentUser()) {
        State.getState().setCurrentUser(currentUser);
    }

	// Gets the #app element where the content will be rendered.
    const element = document.getElementById('app');
    if (!element) return;
    
    const root = element as HTMLElement;
	// Creates a NavigatorComponent to manage page routing.
    const navigator = new NavigatorComponent('main', routes);
    
    // Get current path
    const currentPath = window.location.pathname;

    // if (currentPath.includes('/game')) {
    //     // For game route, only render the game component without navbar
    //     const gameRoute = routes.find(route => route.path === '/game');
    //     if (gameRoute?.component) {
    //         gameRoute.component.render(root);
    //     }
    // }
    
    // Only try refresh if we're not on a public route
    if (!noRetryRoutes.includes(currentPath)) {
        tryRefresh().then(() => {
            // Renders the navigation bar and highlights the correct route:
            navigator.render(root);
            navigator.changeSelection(currentPath);
        });
    } else {
        // For public routes, render immediately
        navigator.render(root);
        navigator.changeSelection(currentPath);
    }

	/** INTERNAL LINKS handling:
	 * Finds all links (<a>) inside #app that start with / (indicating an internal route).
	 * Prevents the default behavior (evt.preventDefault()).
	 * Updates the browser history using pushState().
	 * Ensures that navigation is handled WITHOUT a full page reload.
	 */

    document.querySelectorAll('#app [href^="/"]').forEach((el) =>
        el.addEventListener('click', (evt) => {
            evt.preventDefault();
            try {
                const target = evt.target as HTMLAnchorElement;
                const { pathname: path } = new URL(target.href);
                window.history.pushState({ path }, path, path);
                const newEl = el.cloneNode(true);
                el.parentNode?.replaceChild(newEl, el);
            } catch (error) {}
        })
    );

	// Handles the Browser Back/Forward Navigation (popstate)
    window.addEventListener('popstate', (e) => {
        navigator.changeSelection(new URL(window.location.href).pathname);
    });

	/**
	 * When pushState is called (from internal link clicking), it:
	 * - Updates the selected route.
	 * - Rerenders the page only if the user navigates to /login
	 */
    window.addEventListener('pushstate', (e) => {
        // current path
        const currentPath = navigator.selectedRoute.path;
        const pathName = new URL(window.location.href).pathname;
        if (currentPath.includes('/game') && pathName.includes('/game')) {
            return;
        } else if (pathName.includes('/game')) {
            navigator.navbar.hide();
            State.getState().closeMatchSocket();
        } else {
            navigator.navbar.show();
            State.getState().connectMatchSocket();
        }
        navigator.changeSelection(pathName);
        if (pathName == '/login') navigator.render(root);
    });

	/**
	 * When user authentication state changes, the navigation bar updates:
	 * - If the user is logged in:
	 * 		- Hide register (/register)
	 * 		- Show logout (/logout) and settings (/settings)
	 * - If the user is logged out -> reverse these changes.
	 */
    window.addEventListener('userChange', (e) => {
        const user = State.getState().getCurrentUser();
        if (user) {
            navigator.displayTab('/register', false);
            navigator.displayTab('/login', false);
            navigator.displayTab('/about', false);
            navigator.displayTab('/settings', true);
            navigator.displayTab('/users', true);
            navigator.displayTab('/create-tournament', true);
            navigator.displayTab('/tournaments', true);
            navigator.displayTab('/logout', true);
        }
        if (!user) {
            navigator.displayTab('/logout', false);
            navigator.displayTab('/settings', false);
            navigator.displayTab('/create-tournament', false);
            navigator.displayTab('/tournaments', false);
            navigator.displayTab('/users', false);
        }
        document.querySelectorAll('#app [href^="/"]').forEach((el) =>
            el.addEventListener('click', (evt) => {
                evt.preventDefault();
                try {
                    const target = evt.target as HTMLAnchorElement;
                    const { pathname: path } = new URL(target.href);
                    window.history.pushState({ path }, path, path);
                } catch (error) {}
            })
        );
        navigator.render(root);
    });
};

// Only render once when the page loads
window.addEventListener('DOMContentLoaded', render);


/**

📝 SUMMARY OF FEATURES:
1.	Handles Routing & Navigation
	- Uses history.pushState() and popstate for smooth navigation.
	- Updates the navigation bar dynamically.
2.	Manages Authentication
	- Loads auth token & user data from localStorage.
	- Refreshes the session (tryRefresh()).
	- Updates the navigation bar based on login status.
3.	Listens for User State Changes:
	- If the user logs in or out, the UI updates accordingly.
4.	Prevents Full Page Reloads
	- Uses event listeners on <a> links to modify history state without a refresh.

🔹 HOW IT WORKS IN PRACTICE:
1. User opens the website → render() runs
2. Navigation bar is created
3. User clicks a link (/about) → URL updates via pushState()
4. UI updates dynamically without reloading
5. User logs in/out → userChange event updates the navigation
 */
