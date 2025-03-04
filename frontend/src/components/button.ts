export function Button(label: string, onClick: () => void, className: string = "") {
    const button = document.createElement("button");
    button.textContent = label;
    button.className = `px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-700 active:scale-95 transition ${className}`;
    button.addEventListener("click", () => {
        console.log(`Button "${label}" clicked`);
        onClick();
    });
    return button;
}