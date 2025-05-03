import AvatarImageComponent from '../../components/AvatarImage';
import Component from '../../components/Component';
import FormComponent from '../../components/Form/Form';
import Input from '../../components/Form/Input';
import PhoneInput from '../../components/Form/PhoneInput';
import Select from '../../components/Form/Select';
import sendRequest, { Services } from '../../services/send-request';
import State from '../../services/state';
import ChangePasswordComponent from '../password/change-password';
import AvatarUploadComponent from './avatarUpload';
import { createStyledButtonWithHandler, applyStyledAppearance } from '../../styles/button_styles'

export default class UserSettingsComponent extends Component {
    readonly element: HTMLElement;
    private lastUserData: any | null = null;

    constructor() {
        super();
        this.element = document.createElement('div');
        this.element.className = 'flex flex-col items-center gap-10';
    }

    private shouldUpdate(newData: any): boolean {
        if (!this.lastUserData) return true;
        return JSON.stringify(this.lastUserData) !== JSON.stringify(newData);
    }

    render(parent: HTMLElement) {
		this.element.innerHTML = '';
		const user = State.getState().getCurrentUser();
		if (!user) return;
	
		// Main container
		// this.element.className = 'flex flex-row justify-center gap-8 items-start';
		this.element.className = 'min-h-screen flex flex-wrap justify-center items-center gap-x-40 gap-y-2';



	
		// ======= AVATAR SECTION =======
		const avatarSection = document.createElement('div');
		avatarSection.className = 'flex flex-col items-center gap-4 w-64';
		
		const avatarTitle = document.createElement('h2');
		avatarTitle.textContent = 'Change Avatar';
		avatarTitle.className = 'text-xl font-semibold';
		avatarSection.appendChild(avatarTitle);
	
		// const avatar = new AvatarImageComponent('My Avatar', user.avatarUrl!, 'w-1024 rounded-full object-cover');
		const avatar = new AvatarImageComponent('My Avatar', user.avatarUrl!, null, 'w-48 h-48 rounded-full object-cover');

		avatar.render(avatarSection);
	
		const uploadAvatarForm = new AvatarUploadComponent(
			null,
			this.setUserFromResponse.bind(this),
		);
		uploadAvatarForm.render(avatarSection);
	
		// ======= PERSONAL INFO SECTION =======
		const personalInfoSection = document.createElement('div');
		personalInfoSection.className = 'flex flex-col items-center gap-4 w-64';
	
		const infoTitle = document.createElement('h2');
		infoTitle.textContent = 'Personal Info';
		infoTitle.className = 'text-xl font-semibold';
		personalInfoSection.appendChild(infoTitle);
	
		const inputStyle = 'border border-gray-300 rounded p-2 w-full';
		const nameInput = new Input('name', 'text', 'name', true, null, inputStyle);
		const phoneInput = new PhoneInput(true, inputStyle);
		const otpOptions = [
			{ value: '', text: 'no 2FA' },
			{ value: 'SMS', text: 'Send code by SMS' },
			{ value: 'EMAIL', text: 'Send code by email' },
			{ value: 'AUTHENTICATOR', text: 'Scan QR code with Authenticator app' },
		];
		const otpMethodInput = new Select('2FA Method', 'otpMethod', otpOptions, false, inputStyle);
	
		nameInput.value = user.name || '';
		phoneInput.value = user.phoneNumber || '';
		otpMethodInput.value = user.otpMethod || '';
	
		const form = new FormComponent(
			'update',
			[nameInput, phoneInput, otpMethodInput],
			(data) => sendRequest('/user/update', 'PUT', data, Services.AUTH),
			this.setUserFromResponse.bind(this),
		);
		form.className = 'flex flex-col gap-4 w-full';
		form.render(personalInfoSection);
	
		// ======= CHANGE PASSWORD SECTION =======
		const passwordSection = document.createElement('div');
		passwordSection.className = 'flex flex-col items-center gap-4 w-64';
	
		const passwordTitle = document.createElement('h2');
		passwordTitle.textContent = 'Update Password';
		passwordTitle.className = 'text-xl font-semibold';
		passwordSection.appendChild(passwordTitle);
	
		const changePasswordForm = new ChangePasswordComponent();
		changePasswordForm.render(passwordSection);
	
		// Append all sections to main element
		this.element.appendChild(avatarSection);
		this.element.appendChild(personalInfoSection);
		this.element.appendChild(passwordSection);
	
		super.render(parent);
	}
	

    private showImageDialog(image: string) {
        let dialog = document.createElement('dialog');
        dialog.innerHTML = `<img src="${image}" style="max-width:100%; height:auto;" alt="Scan code">
                            <button id="close-btn">Close</button>`;

        document.body.appendChild(dialog);
        dialog.showModal();
        dialog.querySelector('#close-btn')?.addEventListener('click', () => {
            dialog.close();
            dialog.remove();
        });
    }

    private async setUserFromResponse(data: any): Promise<void> {
        if (!this.shouldUpdate(data)) return;

        this.lastUserData = data;
        localStorage.setItem('currentUser', JSON.stringify(data || null));
        State.getState().setCurrentUser(data);

        if (data.otpMethod == 'AUTHENTICATOR') {
            const data = await this.generateOtpUrl();
            if (data.otpAuthUrl) {
                this.showImageDialog(data.otpAuthUrl);
            }
        }
        this.render(this.parent);
    }

    async generateOtpUrl() {
        const generated = await sendRequest(
            '/otp/generate',
            'POST',
            null,
            Services.AUTH,
        );
        const responseBody = await generated.json();
        return responseBody;
    }
}
