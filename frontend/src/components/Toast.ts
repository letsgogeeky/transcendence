export enum ToastState {
    SUCCESS,
    ERROR,
    NOTIFICATION,
}

const colors = {
    [ToastState.SUCCESS]: 'bg-green-500',
    [ToastState.ERROR]: 'bg-red-500',
    [ToastState.NOTIFICATION]: 'bg-green-500',
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

    const toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.className = `fixed bottom-4 left-1/2 transform -translate-x-1/2 ${colors[state]} text-white px-4 py-2 rounded shadow-md transition-opacity opacity-100 flex items-center gap-2`;

    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    toast.appendChild(messageSpan);

    if (actions && actions.length > 0) {
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'flex gap-2 ml-4';

        actions.forEach(action => {
            const button = document.createElement('button');
            button.textContent = action.text;
            button.className = 'px-2 py-1 bg-white/20 rounded hover:bg-white/30 transition-colors';
            button.onclick = action.action;
            actionsContainer.appendChild(button);
        });

        toast.appendChild(actionsContainer);
    }

    document.body.appendChild(toast);
    if (duration)
        setTimeout(() => {
            toast.remove();
        }, duration);
}
