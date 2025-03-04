import { Button } from "../components/button";

export function renderNotFound(): HTMLElement {
    const container = document.createElement("div");
    container.className = "text-center";

    const title = document.createElement("h1");
    title.className = "text-2xl font-bold text-red-500";
    title.textContent = "404";

    const description = document.createElement("p");
    description.className = "text-gray-600";
    description.textContent = "I think you missed the correct exit on the highway.";

    const homeButton = Button("Go Home", () => {
        location.hash = "#";
    });

    container.append(title, description, homeButton);
    return container;
}
