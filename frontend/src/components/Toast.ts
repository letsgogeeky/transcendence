import { createStyledButtonWithHandler, applyStyledAppearance } from '../styles/button_styles'

export enum ToastState {
    SUCCESS,
    ERROR,
    NOTIFICATION,
}

const colors = {
    [ToastState.SUCCESS]: '[#477859]',
    [ToastState.ERROR]: 'bg-red-500',
    [ToastState.NOTIFICATION]: '[#6a4778]',
};

interface ToastAction {
    text: string;
    action: () => void;
}


export function showToast(
    state: ToastState,
    message: string,
    duration = 5000,
    actions?: ToastAction[]
) {
    const existingToast = document.getElementById('toast-notification');
    if (existingToast) {
        existingToast.remove();
    }

    const colorMap = {
        [ToastState.SUCCESS]: {
            text: 'text-[#07feb9]',
            border: 'border-[#07feb9]',
            shadow: 'shadow-[0_0_10px_4px_#07feb9]',
            raw: '#07feb9',
        },
        [ToastState.ERROR]: {
            text: 'text-[#bb4b7d]',
            border: 'border-[#bb4b7d]',
            shadow: 'shadow-[0_0_10px_4px_#bb4b7d]',
            raw: '#bb4b7d',
        },
        [ToastState.NOTIFICATION]: {
            text: 'text-cyan-400',
            border: 'border-cyan-400',
            shadow: 'shadow-[0_0_10px_4px_#00FFFF]',
            raw: '#00FFFF',
        },
    };

    const { text, border, shadow, raw } = colorMap[state];

	console.log(JSON.stringify(message));
    const toast = document.createElement('div');
    toast.id = 'toast-notification';
	toast.className = `
		fixed bottom-4 left-1/2 -translate-x-1/2
		flex flex-col items-center
		text-sm px-6 py-3
		${border} ${text} ${shadow}
		bg-black/90
		rounded-xl
		pointer-events-auto
		animate-fadeIn 
		z-50
	`;

    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    toast.appendChild(messageSpan);

    if (actions && actions.length > 0) {
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'mt-2 flex justify-center gap-2';

        actions.forEach(action => {
            const button = document.createElement('button');
            button.textContent = action.text;
            button.className = `
                text-sm px-2 py-1
                bg-black/80 ${text} ${border}
                rounded-md font-bold
                shadow-[0_0_6px_2px_${raw}]
            `;
            button.onclick = action.action;
            actionsContainer.appendChild(button);
        });

        toast.appendChild(actionsContainer);
    }

    document.body.appendChild(toast);

    if (duration) {
        setTimeout(() => {
            toast.classList.add('animate-fadeOut');
            setTimeout(() => toast.remove(), 1000); // Allow fade-out to finish
        }, duration);
    }
}



/** THE BEFORE VERSION: */
// export function showToast(
//     state: ToastState,
//     message: string,
//     duration = 5000,
//     actions?: ToastAction[]
// ) {
//     const existingToast = document.getElementById('toast-notification');
//     if (existingToast) {
//         existingToast.remove();
//     }

//     const toast = document.createElement('div');
//     toast.id = 'toast-notification';
//     toast.className = `fixed bottom-4 left-1/2 transform -translate-x-1/2 ${colors[state]} text-white px-4 py-2 rounded shadow-md transition-opacity opacity-100 flex items-center gap-2`;

//     const messageSpan = document.createElement('span');
//     messageSpan.textContent = message;
//     toast.appendChild(messageSpan);

//     if (actions && actions.length > 0) {
//         const actionsContainer = document.createElement('div');
//         actionsContainer.className = 'flex gap-2 ml-4';

//         actions.forEach(action => {
//             const button = document.createElement('button');
//             button.textContent = action.text;
//             button.className = 'px-2 py-1 bg-white/20 rounded hover:bg-white/30 transition-colors';
//             button.onclick = action.action;
//             actionsContainer.appendChild(button);
//         });

//         toast.appendChild(actionsContainer);
//     }

//     document.body.appendChild(toast);
//     if (duration)
//         setTimeout(() => {
//             toast.remove();
//         }, duration);
// }
