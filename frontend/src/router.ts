import Component from './components/Component';
import ErrorComponent from './pages/error';
import HomeComponent from './pages/home';
import LoginComponent from './pages/login';
import LogoutComponent from './pages/logout';
import NotFoundComponent from './pages/notfound';
import ForgotPasswordComponent from './pages/password/forgot-password';
import ResetPasswordComponent from './pages/password/reset-password';
import RegisterComponent from './pages/register';
import UserSettingsComponent from './pages/settings/settings';

export type Route = {
    path: string;
    title: string;
    component: Component;
    visible: boolean;
};

export const routes: Route[] = [
    { path: '/', title: 'Home', component: new HomeComponent(), visible: true },
    // {
    //     path: '/profile',
    //     title: 'My Profile',
    //     component: new ErrorComponent('my profile'),
    //     visible: true,
    // },
    {
        path: '/users',
        title: 'Users',
        component: new ErrorComponent('users'),
        visible: true,
    },
    {
        path: '/error',
        title: 'Error',
        component: new NotFoundComponent(),
        visible: false,
    },
    {
        path: '/login',
        title: 'Login',
        component: new LoginComponent(),
        visible: false,
    },
    {
        path: '/logout',
        title: 'Logout',
        component: new LogoutComponent(),
        visible: false,
    },
    {
        path: '/settings',
        title: 'User settings',
        component: new UserSettingsComponent(),
        visible: false,
    },
    {
        path: '/forgot-password',
        title: 'Password reset',
        component: new ForgotPasswordComponent(),
        visible: false,
    },
    {
        path: '/register',
        title: 'Sign up',
        component: new RegisterComponent(),
        visible: true,
    },
    {
        path: '/reset-password',
        title: 'Password reset',
        component: new ResetPasswordComponent(),
        visible: false,
    },
];
