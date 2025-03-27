import AvatarImageComponent from '../../components/AvatarImage';
import Component from '../../components/Component';
import FormComponent from '../../components/Form/Form';
import Input from '../../components/Form/Input';
import PhoneInput from '../../components/Form/PhoneInput';
import Select from '../../components/Form/Select';
import sendRequest, { endpoints, Services } from '../../services/send-request';
import State from '../../services/state';
import ChangePasswordComponent from '../password/change-password';
import AvatarUploadComponent from './avatarUpload';

export default class UserSettingsComponent extends Component {
    readonly element: HTMLElement;

    constructor() {
        super();
        this.element = document.createElement('div');
        this.element.className = 'flex flex-col items-center gap-2';
    }

    render(parent: HTMLElement) {
        this.element.innerHTML = '';
        const user = State.getState().getCurrentUser();
        if (!user) return;

        const inputStyle = 'border border-gray-300 rounded p-2 w-full';
        const nameInput = new Input(
            'name',
            'text',
            'name',
            true,
            null,
            inputStyle,
        );
        const phoneInput = new PhoneInput(true, inputStyle);
        const otpOptions = [
            { value: '', text: 'no 2FA' },
            { value: 'SMS', text: 'Send code by SMS' },
            { value: 'EMAIL', text: 'Send code by email' },
            {
                value: 'AUTHENTICATOR',
                text: 'Scan QR code with Authenticator app',
            },
        ];
        const otpMethodInput = new Select(
            '2FA Method',
            'otpMethod',
            otpOptions,
            false,
            inputStyle,
        );

        nameInput.value = user.name || '';
        phoneInput.value = user.phoneNumber || '';
        otpMethodInput.value = user.otpMethod || '';
        const form = new FormComponent(
            'update',
            [nameInput, phoneInput, otpMethodInput],
            (data) => sendRequest('/user/update', 'PUT', data, Services.AUTH),
            this.setUserFromResponse.bind(this),
        );
        form.className = 'flex flex-col gap-4 w-64';
        form.render(this.element);

        const title = document.createElement('h1');
        this.element.append(title);

        const avatar = new AvatarImageComponent(
            'My Avatar',
            endpoints.auth + '/' + user.avatarUrl!,
        );
        avatar.render(this.element);

        const uploadAvatarForm = new AvatarUploadComponent(
            null,
            this.setUserFromResponse.bind(this),
        );
        uploadAvatarForm.render(this.element);

        const changePasswordForm = new ChangePasswordComponent();
        changePasswordForm.render(this.element);
        super.render(parent);
    }

    private showImageDialog(imageUrl: string) {
        let dialog = document.createElement('dialog');
        dialog.innerHTML = `<img src="${imageUrl}" style="max-width:100%; height:auto;">
                            <button id="close-btn">Close</button>`;

        document.body.appendChild(dialog);
        dialog.showModal();
        dialog.querySelector('#close-btn')?.addEventListener('click', () => {
            dialog.close();
            dialog.remove();
        });
    }

    private async setUserFromResponse(data: any): Promise<void> {
        localStorage.setItem('currentUser', JSON.stringify(data || null));
        State.getState().setCurrentUser(data);

        if (data.otpMethod == 'AUTHENTICATOR') {
            console.log('generate`!!');
            const data = await this.generateOtpUrl();
            if (data.otpAuthUrl) {
                const qrCodeUrl = `https://quickchart.io/qr?text=${encodeURIComponent(
                    data.otpAuthUrl,
                )}`;
                this.showImageDialog(qrCodeUrl);
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
