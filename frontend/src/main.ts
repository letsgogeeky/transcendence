import NavigatorComponent from './components/Nav/Navigator';
import { routes } from './router';
import { tryRefresh } from './services/send-request';
import State, { MyUser } from './services/state';

(function () {
    const originalPushState = history.pushState;
    history.pushState = function (state, title, url) {
        originalPushState.apply(this, [state, title, url]);
        window.dispatchEvent(new Event('pushstate')); // Emit event
    };
})();

const render = () => {
    const authToken = localStorage.getItem('authToken');
    const currentUser = localStorage.getItem('currentUser')
        ? (JSON.parse(localStorage.getItem('currentUser')!) as MyUser)
        : null;
    if (authToken && !State.getState().getAuthToken()) {
        State.getState().setAuthToken(authToken);
        console.log('Auth token is: ' + State.getState().getAuthToken());
    }
    if (currentUser && !State.getState().getCurrentUser()) {
        State.getState().setCurrentUser(currentUser);
    }
    tryRefresh();
    const element = document.getElementById('app');
    const root = element as HTMLElement;
    const navigator = new NavigatorComponent('main', routes);
    navigator.render(root);
    navigator.changeSelection(new URL(window.location.href).pathname);

    document.querySelectorAll('#app [href^="/"]').forEach((el) =>
        el.addEventListener('click', (evt) => {
            evt.preventDefault();
            try {
                const target = evt.target as HTMLAnchorElement;
                const { pathname: path } = new URL(target.href);
                window.history.pushState({ path }, path, path);
            } catch (error) {}
        }),
    );

    window.addEventListener('popstate', (e) => {
        navigator.changeSelection(new URL(window.location.href).pathname);
    });

    window.addEventListener('pushstate', (e) => {
        navigator.changeSelection(new URL(window.location.href).pathname);
        console.log('Auth token is: ' + State.getState().getAuthToken());
    });
};

render();
