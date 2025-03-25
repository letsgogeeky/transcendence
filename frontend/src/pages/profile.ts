import AvatarImageComponent from '../components/AvatarImage';
import Component from '../components/Component';
import sendRequest, { endpoints, Services } from '../services/send-request';
import ErrorComponent from './error';

export default class ProfileComponent extends Component {
    readonly element: HTMLElement;

    constructor() {
        super();
        this.element = document.createElement('div');
        this.element.className = 'flex flex-col items-center gap-2';
    }

    async fetchData() {
        const params = new URLSearchParams(window.location.search);
        const userId = params.get('userId');
        console.log('User ID:', userId);
        const response = await sendRequest(
            `/users/${userId}`,
            'GET',
            null,
            Services.AUTH,
        );
        const responseBody = await response.json();
        return responseBody;
    }

    render(parent: HTMLElement) {
        this.element.innerHTML = '';
        if (!this.data) {
            const loading = new ErrorComponent('Loading....');
            loading.render(this.element);
        } else if (this.data.error) {
            const error = new ErrorComponent(this.data.error);
            error.render(this.element);
        } else {
            const avatar = new AvatarImageComponent(
                this.data.name + "'s avatar",
                endpoints.auth + '/' + this.data.avatarUrl!,
            );
            avatar.render(this.element);
            const title = document.createElement('h1');
            title.innerHTML = this.data.name;
            const email = document.createElement('h2');
            email.innerHTML = this.data.email;
            this.element.append(title);
            this.element.append(email);
        }
        super.render(parent);
    }
}
