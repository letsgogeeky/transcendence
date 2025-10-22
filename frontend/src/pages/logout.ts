import ChatManager from '../components/ChatManager';
import Component from '../components/Component';
import { showToast, ToastState } from '../components/Toast';
import sendRequest, { Services } from '../services/send-request';
import State from '../services/state';

export async function logoutUser(): Promise<void> {
    try {
        // call close all chats
        ChatManager.getInstance().cleanup();
        ChatManager.getInstance().closeChatSocket();
        const response = await sendRequest(
            '/logout',
            'POST',
            null,
            Services.AUTH,
        );

        const responseBody = await response.json();
        if (!response.ok) {
            throw new Error(`Error: ${responseBody.error}`);
        }
        showToast(ToastState.SUCCESS, 'Successfully logged out');
        State.getState().setAuthToken(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        State.getState().setCurrentUser(null);
    } catch (error) {
        showToast(ToastState.ERROR, 'Something went wrong.');
    }
    State.getState().reset();
    window.history.pushState({ path: '/login' }, '', '/login');
}

export default class LogoutComponent extends Component {
    readonly element: HTMLElement;

    constructor() {
        super();
        this.element = document.createElement('div');
        this.element.className =
            'flex flex-col items-center justify-center ';
    }

    public render(parent: HTMLElement | Component): void {
        this.element.innerHTML = '';

        // GIF
        const farewellGif = document.createElement('img');
        farewellGif.src = './assets/bye.gif';
        farewellGif.alt = 'Farewell';
        farewellGif.className = 'w-80 mb-8'; // Adjust size & spacing as needed

        // Message
        const confirmationMessage = document.createElement('p');
        confirmationMessage.textContent = 'Are you sure you want to log out?';
        confirmationMessage.className =
            'text-gray-300 font-medium mb-8 text-2xl text-center';

        // Buttons container
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'flex space-x-6';

        // Yes button
        const yesButton = document.createElement('button');
        yesButton.textContent = 'Yes';
        yesButton.className =
            'min-w-36 px-8 py-4 rounded-lg text-xl font-bold transition-all duration-300 bg-transparent text-[#8A50AB] border-2 border-[#8A50AB] hover:bg-[#CE8FF2]/20 shadow-[0_0_10px_#8A50AB,0_0_20px_#8A50AB] hover:shadow-[0_0_20px_#CE8FF2,0_0_40px_#CE8FF2]';
        yesButton.onclick = logoutUser;

        // No button
        const noButton = document.createElement('button');
        noButton.textContent = 'No';
        noButton.className =
            'min-w-36 px-8 py-4 rounded-lg text-xl font-bold transition-all duration-300 bg-transparent text-[#BDA6BC] border-2 border-[#BDA6BC] hover:bg-[#EAD7F5]/20 shadow-[0_0_10px_#BDA6BC,0_0_20px_#BDA6BC] hover:shadow-[0_0_20px_#EAD7F5,0_0_40px_#EAD7F5]';
        noButton.onclick = () => {
            window.history.back();
        };

        // Append buttons
        buttonContainer.appendChild(yesButton);
        buttonContainer.appendChild(noButton);

        // Append all elements
        this.element.appendChild(farewellGif);
        this.element.appendChild(confirmationMessage);
        this.element.appendChild(buttonContainer);

        super.render(parent);
    }
}

// // the COmponent before:
// export default class LogoutComponent extends Component {
//     readonly element: HTMLElement;

//     constructor() {
//         super();
//         this.element = document.createElement('div');
//         // this.element.className = 'fixed flex items-center justify-center bg-black';
//     }

//     public render(parent: HTMLElement | Component): void {
//         this.element.innerHTML = '';

//         const confirmationMessage = document.createElement('p');
//         confirmationMessage.textContent = 'Are you sure you want to log out?';
//         confirmationMessage.className =
//             'py-4 text-gray-300 font-medium mb-4 text-xl';

//         const yesButton = document.createElement('button');
//         yesButton.textContent = 'Yes';
//         yesButton.className =
// 			'px-8 py-4 rounded-lg text-xl mr-4 font-bold transition-all duration-300 bg-transparent text-[#8A50AB] border-2 border-[#8A50AB] hover:bg-[#CE8FF2]/20 shadow-[0_0_10px_#8A50AB,0_0_20px_#8A50AB] hover:shadow-[0_0_20px_#CE8FF2,0_0_40px_#CE8FF2]';
// 			yesButton.onclick = logoutUser;
			
// 			const noButton = document.createElement('button');
// 			noButton.textContent = 'No';
// 			noButton.className =
// 			'px-8 py-4 rounded-lg text-xl mb-4 font-bold transition-all duration-300 bg-transparent text-[#BDA6BC] border-2 border-[#BDA6BC] hover:bg-[#EAD7F5]/20 shadow-[0_0_10px_#BDA6BC,0_0_20px_#BDA6BC] hover:shadow-[0_0_20px_#EAD7F5,0_0_40px_#EAD7F5]';
//         noButton.onclick = () => {
//             window.history.back();
//         };

//         this.element.appendChild(confirmationMessage);
//         this.element.appendChild(yesButton);
//         this.element.appendChild(noButton);

//         super.render(parent);
//     }
// }
