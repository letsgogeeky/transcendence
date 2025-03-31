import Component from '../../components/Component';
import FormComponent from '../../components/Form/Form';
import Input from '../../components/Form/Input';
import sendRequest, { Services } from '../../services/send-request';


// export default class ForgotPasswordComponent extends Component {
//     readonly element: HTMLElement;
//     private form: FormComponent;

//     private async forgotPassword(data: any): Promise<Response> {
//         return sendRequest('/forgot-password', 'POST', data, Services.AUTH);
//     }

//     constructor() {
//         super();
// 		const container = document.createElement('div');
//         container.className = 'text-center flex flex-col items-center justify-center min-h-screen'; // Center everything vertically and horizontally

// 		const backgroundGif = document.createElement('div');
// 		backgroundGif.className = 'absolute top-1/2 left-0 right-0 transform -translate-y-1/2';  // Ensures it's centered vertically and spans the full width of the screen

// 		const gif = document.createElement('img');
// 		gif.src = './assets/transparent_pong.gif';
// 		gif.className = 'w-full object-cover';  // Set width to full, height to a fixed value (e.g., 700px)
// 		gif.style.opacity = '0.4';
// 		gif.alt = 'Background Gif';
// 		backgroundGif.appendChild(gif);

// 		// Append the background image container
// 		container.appendChild(backgroundGif);

//         // Big welcome image
//         const welcomeBackImage = document.createElement('img');
//         welcomeBackImage.src = './assets/forgetful.gif';  // Replace with your actual image path
//         welcomeBackImage.alt = 'Forgetful Me';
//         welcomeBackImage.className = 'w-full max-w-[500px] h-auto mb-5 rounded-lg'; // Add 'rounded-lg' to give rounded edges

// 		container.appendChild(welcomeBackImage);

//         const inputStyle = 'border border-[#FFFF33] border-4 rounded-xl p-2 w-60 mb-4 bg-[#D1C4E9] shadow-[0_0_15px_#00FFFF] opacity-60';
//         const userInput = new Input(
//             'username or email',
//             'text',
//             'user',
//             true,
//             null,
//             inputStyle,
//         );

//         this.form = new FormComponent(
//             'Send Email',
//             [userInput],
//             this.forgotPassword,
//         );

//         document.createElement('form');
// 		this.form.className = 'items-center flex flex-col gap-4 w-80 mt-6 relative z-10';

//         const title = document.createElement('h1');
//         title.textContent = 'It \'s OK! We got you! 😉';
// 		title.className = 'text-white font-bold mt-4';
//         const subtitle = document.createElement('h2');
//         subtitle.textContent = "Fill out your email or username:";
// 		subtitle.className = 'text-[#FFFF33] mt-8';
//         container.append(title, subtitle);
//         this.element = container;
//     }

//     public render(parent: HTMLElement | Component): void {
//         this.form.render(this.element);
//         super.render(parent);
//     }
// }





export default class ResetPasswordComponent extends Component {
    readonly element: HTMLElement;
    private form: FormComponent;

    constructor() {
        super();
        const container = document.createElement('div');
		container.className = 'text-center flex flex-col items-center justify-center min-h-screen'; // Center everything vertically and horizontally
        // container.className = 'text-center';
        // container.style.display = 'flex';
        // container.style.flexDirection = 'column';
        // container.style.gap = '10px';


		const backgroundGif = document.createElement('div');
		backgroundGif.className = 'absolute top-1/2 left-0 right-0 transform -translate-y-1/2';  // Ensures it's centered vertically and spans the full width of the screen

		const gif = document.createElement('img');
		gif.src = './assets/transparent_pong.gif';
		gif.className = 'w-full object-cover';  // Set width to full, height to a fixed value (e.g., 700px)
		gif.style.opacity = '0.4';
		gif.alt = 'Background Gif';
		backgroundGif.appendChild(gif);

		// Append the background image container
		container.appendChild(backgroundGif);

        // The new me gif
        const newMeGif = document.createElement('img');
        newMeGif.src = './assets/newme.gif';  // Replace with your actual image path
        newMeGif.alt = 'New Me';
        newMeGif.className = 'w-full max-w-[400px] h-auto mb-5 rounded-lg'; // Add 'rounded-lg' to give rounded edges

		container.appendChild(newMeGif);

		// "RESET PASSWORD" text
		// const ResetPasswordText = document.createElement('h1');
		// ResetPasswordText.textContent = 'RESET PASSWORD';
		// ResetPasswordText.className = 'text-[#3a8072] text-4xl font-bold mb-8 sparkle-text relative z-10'; // Adding the custom class
		// container.appendChild(ResetPasswordText);
		// const resetPasswordText = document.createElement('h1');
		// resetPasswordText.textContent = 'Reset Password';
		// resetPasswordText.className = 'text-[#4D000D] text-4xl font-bold mb-8 sparkle-text relative z-10'; // Adding the custom class
		// container.appendChild(resetPasswordText);
        // const title = document.createElement('h1');
        // title.textContent = 'Reset your password';
        // container.append(title);
        // this.element = container;
		
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
        // this.element.innerHTML = '';
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        this.form.submitCallback = FormComponent.showNotification(
            this.resetPassword(token!),
        );
        this.form.render(this.element);
        super.render(parent);
    }

    private resetPassword(token: string) {
        return async function (data: any): Promise<Response> {
            if (data.newPassword != data.confirmPassword)
                throw Error("Passwords don't match, try again");
            return sendRequest(
                '/reset-password',
                'POST',
                { newPassword: data.newPassword },
                Services.AUTH,
                token,
            );
        };
    }
}
