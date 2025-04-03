import Component from './components/Component';
import CreateTournamentComponent from './pages/create-tournament';
import HomeComponent from './pages/home';
import LoginComponent from './pages/login';
import LoginOtpComponent from './pages/login-2fa';
import LoginAfterGoogle from './pages/login-google';
import LogoutComponent from './pages/logout';
import NotFoundComponent from './pages/notfound';
import ForgotPasswordComponent from './pages/password/forgot-password';
import ResetPasswordComponent from './pages/password/reset-password';
import ProfileComponent from './pages/profile';
import RegisterComponent from './pages/register';
import UserSettingsComponent from './pages/settings/settings';
import TournamentComponent from './pages/tournament';
import UsersPageComponent from './pages/users';

export type Route = {
    path: string;
    title: string;
    component: Component;
    visible: boolean;
};

export const routes: Route[] = [
    { path: '/', title: 'Home', component: new HomeComponent(), visible: true },
    {
        path: '/profile',
        title: 'User profile',
        component: new ProfileComponent(),
        visible: false,
    },
    {
        path: '/users',
        title: 'Users',
        component: new UsersPageComponent(),
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
        path: '/login/google',
        title: 'Login',
        component: new LoginAfterGoogle(),
        visible: false,
    },
    {
        path: '/login/2fa',
        title: 'Login verification code',
        component: new LoginOtpComponent(),
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
    {
        path: '/create-tournament',
        title: 'Create Tournament',
        component: new CreateTournamentComponent(),
        visible: false,
    },
    {
        path: '/tournament',
        title: 'Tournament',
        component: new TournamentComponent(),
        visible: false,
    },
    {
        path: '/tournament/:id',
        title: 'Tournament',
        component: new TournamentComponent(),
        visible: false,
    },
];
