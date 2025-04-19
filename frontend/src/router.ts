import Component from './components/Component';
import CreateTournamentComponent from './pages/create-tournament';
import HomeComponent from './pages/home';
import LoginComponent from './pages/login';
import LoginOtpComponent from './pages/login-2fa';
import LoginAfterGoogle from './pages/login-google';
import LogoutComponent from './pages/logout';
import NotFoundComponent from './pages/notfound';
import AboutComponent from './pages/about';
import ForgotPasswordComponent from './pages/password/forgot-password';
import ResetPasswordComponent from './pages/password/reset-password';
import ProfileComponent from './pages/profile';
import RegisterComponent from './pages/register';
import UserSettingsComponent from './pages/settings/settings';
import TournamentComponent from './pages/tournament';
import TournamentsComponent from './pages/tournaments';
import UsersPageComponent from './pages/users';

export type Route = {
    path: string; // what follows in the url after the "http://localhost:3000/"
    title: string; // just a human-readable title for the route.
    component: Component; // the actual component that gets rendered when the path is visited
    visible: boolean; // controls whether the route appears in navigation menus.
	//  * 			- If visible: true -> it might be listed in a navigation bar.
	//  * 			- If visible: false, the page still exists and can be visited manually (by typing the URL), but it won’t be shown in menus.
};

export const routes: Route[] = [
	/** 1) GENERAL PAGES */
  { 
		path: '/', // The home page (/) is mapped to HomeComponent, meaning that when a user first opens the website at /, the HomeComponent is rendered:
		title: 'Home',
		component: new HomeComponent(),
		visible: true 
	},
	{
		path: '/error',
		title: 'Error',
		component: new NotFoundComponent(),
		visible: false,
	},
	{
		path: '/about',
		title: 'About',
		component: new AboutComponent(),
		visible: true,
	},
	/** 2) PAGES BEFORE LOG IN: */
	{
		path: '/login',
		title: 'Log in',
		component: new LoginComponent(),
		visible: true,
	},
	{
		path: '/register',
		title: 'Sign up',
		component: new RegisterComponent(),
		visible: true,
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
		path: '/forgot-password',
		title: 'Password reset',
		component: new ForgotPasswordComponent(),
		visible: false,
	},
	{
		path: '/reset-password',
		title: 'Password reset',
		component: new ResetPasswordComponent(),
		visible: false,
	},
	/** 3) PAGES AFTER LOG IN: */
	//	   A. Regarding User(s)
	{
		path: '/settings',
		title: 'User settings',
		component: new UserSettingsComponent(),
		visible: false,
	},
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
		visible: false,
	},
	{
		path: '/logout',
		title: 'Logout',
		component: new LogoutComponent(),
		visible: false,
	},
	//	   B. Regarding the Game
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
     path: '/tournaments',
     title: 'Tournaments',
     component: new TournamentsComponent(),
     visible: true,
   }
];
