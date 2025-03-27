export default function createStatusPill(
    status: 'online' | 'offline',
): HTMLDivElement {
    const statusMap: Record<string, string> = {
        online: 'bg-green-500',
        offline: 'bg-gray-400',
    };

    const pill = document.createElement('div');
    pill.className =
        'flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-full';

    const circle = document.createElement('span');
    circle.className = `w-3 h-3 rounded-full ${
        statusMap[status] || 'bg-gray-300'
    }`;

    const text = document.createElement('span');
    text.className = 'text-sm font-medium text-gray-700';
    text.textContent = status;

    pill.appendChild(circle);
    pill.appendChild(text);

    return pill;
}
