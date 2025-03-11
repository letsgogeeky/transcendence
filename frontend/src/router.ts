import Component from './components/Component';
import ErrorPage from './pages/ErrorPage';
import HomeComponent from './pages/home';
import NotFoundComponent from './pages/notfound';

export type Route = {
    path: string;
    title: string;
    component: Component;
};

export const routes: Route[] = [
    { path: '/', title: 'Home', component: new HomeComponent() },
    {
        path: '/register',
        title: 'Register',
        component: new ErrorPage('register'),
    },
    {
        path: '/profile',
        title: 'My Profile',
        component: new ErrorPage('my profile'),
    },
    { path: '/users', title: 'Users', component: new ErrorPage('users') },
    { path: '/error', title: 'Error', component: new NotFoundComponent() },
];
