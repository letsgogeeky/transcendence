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
import { loadImage } from '../../styles/background';

export default class UserSettingsComponent extends Component {
    readonly element: HTMLElement;
    private lastUserData: any | null = null;

    constructor() {
        super();
        this.element = document.createElement('div');
        // this.element.className = 'flex flex-col items-center gap-10';
    }

    private shouldUpdate(newData: any): boolean {
        if (!this.lastUserData) return true;
        return JSON.stringify(this.lastUserData) !== JSON.stringify(newData);
    }

    render(parent: HTMLElement) {
		this.element.innerHTML = '';
		const user = State.getState().getCurrentUser();
		if (!user) return;
	
		// Main container for all elements
		this.element.className = 'w-full h-screen flex flex-col items-center'; // Center all content vertically and horizontally
	
		// ======= SETTINGS HEADER (ICON + TITLE) =======
		const settingsHeader = document.createElement('div');
		settingsHeader.className = 'flex justify-center items-center w-full mt-16 mb-16'; // Added gap for spacing between icon and title
		settingsHeader.appendChild(loadImage('settings_icon.gif', 'w-12 h-12 opacity-80', 'Settings gif'));
	
		// Title for settings
		const settingsTitle = document.createElement('h1');
		settingsTitle.textContent = 'USER SETTINGS';
		settingsTitle.className = 'font-black text-3xl px-8 py-4 text-black transition-all pointer-events-auto font-impact rounded-xl';
		settingsTitle.style.webkitTextStroke = `1.5px #eedee5`;
		settingsTitle.style.textShadow = `0 0 6px #eedee5, 0 0 12px #eedee5`;
		settingsTitle.style.fontFamily = 'Arial Black, Gadget, sans-serif';
	
		// Add title to settingsHeader
		settingsHeader.appendChild(settingsTitle);
	
		// Append settingsHeader to main element
		this.element.appendChild(settingsHeader);
	
		// ======= SECTION CONTAINER (for Avatar, Personal Info, Password) =======
		const sectionsContainer = document.createElement('div');
		sectionsContainer.className = 'flex flex-wrap justify-center gap-28 w-full';
	
		// ======= AVATAR SECTION =======
		const avatarSection = document.createElement('div');
		avatarSection.className = 'flex flex-col items-center gap-4 w-72';
	
		const avatarTitle = document.createElement('h2');
		avatarTitle.textContent = '👤 EDIT YOUR AVATAR';
		avatarTitle.className = 'text-xl text-[#eedee5] font-bold mb-8';
		avatarSection.appendChild(avatarTitle);
	
		const avatar = new AvatarImageComponent('My Avatar', user.avatarUrl!, null, 'w-40 h-40 rounded-full object-cover border-2border-[#eedee5] shadow-lg');
		avatar.render(avatarSection);
	
		const uploadAvatarForm = new AvatarUploadComponent(null, this.setUserFromResponse.bind(this));
		uploadAvatarForm.render(avatarSection);
	
		// ======= PERSONAL INFO SECTION =======
		const personalInfoSection = document.createElement('div');
		personalInfoSection.className = 'flex flex-col items-center gap-4 w-72';
	
		const infoTitle = document.createElement('h2');
		infoTitle.textContent = '📝 PERSONAL INFO';
		infoTitle.className = 'text-xl text-[#eedee5] font-bold mb-8';
		personalInfoSection.appendChild(infoTitle);
	
		const inputStyle = 'border border-gray-300 rounded p-2 w-full';
		const nameInput = new Input('username', 'text', 'name', true, null, inputStyle);
		const emailInput = new Input('email', 'text', 'email', true, null, inputStyle);
		const phoneInput = new PhoneInput(true, inputStyle);
		const otpOptions = [
			{ value: '', text: 'no 2FA' },
			{ value: 'SMS', text: 'Send code by SMS' },
			{ value: 'EMAIL', text: 'Send code by email' },
			{ value: 'AUTHENTICATOR', text: 'Scan QR code with Authenticator app' },
		];
		const otpMethodInput = new Select('2FA Method', 'otpMethod', otpOptions, false, inputStyle);
	
		nameInput.value = user.name || '';
		emailInput.value = user.email || '';
		phoneInput.value = user.phoneNumber || '';
		otpMethodInput.value = user.otpMethod || '';
	
		const form = new FormComponent(
			'update',
			[nameInput, emailInput, otpMethodInput, phoneInput],
			(data) => sendRequest('/user/update', 'PUT', data, Services.AUTH),
			this.setUserFromResponse.bind(this),
		);
		form.className = 'flex flex-col gap-4 w-full';
		form.render(personalInfoSection);
	
		// ======= CHANGE PASSWORD SECTION =======
		const passwordSection = document.createElement('div');
		passwordSection.className = 'flex flex-col items-center gap-4 w-72';
	
		const passwordTitle = document.createElement('h2');
		passwordTitle.textContent = '🔒 CHANGE PASSWORD';
		passwordTitle.className = 'text-xl text-[#eedee5] font-bold mb-8';
		passwordSection.appendChild(passwordTitle);
	
		const changePasswordForm = new ChangePasswordComponent();
		changePasswordForm.render(passwordSection);
	
		// Append all sections to the sections container
		sectionsContainer.appendChild(avatarSection);
		sectionsContainer.appendChild(personalInfoSection);
		sectionsContainer.appendChild(passwordSection);
	
		// Append sectionsContainer to main element
		this.element.appendChild(sectionsContainer);
	
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
