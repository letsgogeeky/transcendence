import Component from '../../components/Component';
import FormComponent from '../../components/Form/Form';
import Input from '../../components/Form/Input';
import sendRequest, { Services } from '../../services/send-request';
import { loadBackgroundGif } from '../../styles/background'

export default class ResetPasswordComponent extends Component {
    readonly element: HTMLElement;
    private form: FormComponent;

    constructor() {
        super();
        const container = document.createElement('div');
		container.className = 'text-center flex flex-col items-center justify-center min-h-screen'; // Center everything vertically and horizontally

		//adds the background pong gif 
		container.appendChild(loadBackgroundGif());

        // The new me gif
        const newMeGif = document.createElement('img');
        newMeGif.src = './assets/newme.gif';  // Replace with your actual image path
        newMeGif.alt = 'New Me';
        newMeGif.className = 'w-full max-w-[400px] h-auto mb-5 rounded-lg'; // Add 'rounded-lg' to give rounded edges
		container.appendChild(newMeGif);

        const inputStyle = 'border border-[#FFFF33] border-4 rounded-xl p-2 w-60 mb-4 bg-[#D1C4E9] shadow-[0_0_15px_#00FFFF] opacity-60';
        // const inputStyle = 'border border-gray-300 rounded p-2 w-full';
        const newPassword = new Input(
            'new password',
            'password',
            'newPassword',
            true,
            null,
            inputStyle,
        );
        const confirmPassword = new Input(
            'confirm password',
            'password',
            'confirmPassword',
            true,
            null,
            inputStyle,
        );

        this.form = new FormComponent(
            'Reset password',
            [newPassword, confirmPassword],
            null,
        );
		document.createElement('form');
		this.form.className = 'items-center flex flex-col gap-4 w-80 mt-6 relative z-10';
        // this.form.className = 'flex flex-col gap-4 w-64';
		this.element = container; // Set the final element
    }

    public render(parent: HTMLElement | Component): void {
        // this.element.innerHTML = ''; //! if i uncomment this line my gifs disappear!
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        this.form.submitCallback = FormComponent.showNotification(
            this.resetPassword(token!),
        );
        this.form.render(this.element);
        super.render(parent);
    }

	private resetPassword(token: string) {
		return async (data: any): Promise<Response> => {
			if (data.newPassword !== data.confirmPassword) {
				throw Error("Passwords don't match, try again");
			}
	
			const response = await sendRequest(
				'/reset-password',
				'POST',
				{ newPassword: data.newPassword },
				Services.AUTH,
				token,
			);
	
			if (response.ok) {
				// FormComponent.showNotification('Password was reset successfully!');
				setTimeout(() => {
					window.location.href = '/login'; // Redirect to login after 2 seconds
				}, 2000); 
			} else {
				const errorData = await response.json();
				throw Error(errorData.message || 'Password reset failed');
			}
			return response;
		};
	}
	
	/** THE FUNCTION AS BORI HAD IT BEFORE: */
    // private resetPassword(token: string) {
    //     return async function (data: any): Promise<Response> {
    //         if (data.newPassword != data.confirmPassword)
    //             throw Error("Passwords don't match, try again");
    //         return sendRequest(
    //             '/reset-password',
    //             'POST',
    //             { newPassword: data.newPassword },
    //             Services.AUTH,
    //             token,
    //         );
    //     };
    // }
}
