export enum ToastState {
    SUCCESS,
    ERROR,
}

export function showToast(state: ToastState, message: string, duration = 5000) {
    const existingToast = document.getElementById('toast-notification');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.textContent = message;
    toast.className = `fixed bottom-4 left-1/2 transform -translate-x-1/2 ${
        state == ToastState.SUCCESS ? 'bg-green-500' : 'bg-red-500'
    } text-white px-4 py-2 rounded shadow-md transition-opacity opacity-100`;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, duration);
}
