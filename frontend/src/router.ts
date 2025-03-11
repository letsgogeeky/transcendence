import Component from './components/Component';
import ErrorComponent from './pages/error';
import HomeComponent from './pages/home';
import NotFoundComponent from './pages/notfound';
import RegisterComponent from './pages/register';

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
        component: new RegisterComponent(),
    },
    {
        path: '/profile',
        title: 'My Profile',
        component: new ErrorComponent('my profile'),
    },
    { path: '/users', title: 'Users', component: new ErrorComponent('users') },
    { path: '/error', title: 'Error', component: new NotFoundComponent() },
];
