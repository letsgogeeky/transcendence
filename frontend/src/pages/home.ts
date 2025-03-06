import { Button } from "../components/button";

export async function renderHome(): Promise<HTMLElement> {
    const container = document.createElement("div");
    container.className = "text-center";

    const title = document.createElement("h1");
    title.className = "text-2xl font-bold";
    title.textContent = "Welcome to The Orca's PONG";
    const description = document.createElement("p");
    description.className = "text-gray-600";
    description.textContent = "Welcome to the home page buddy!";
    let count = 0;
    const counter = document.createElement("p");
    counter.className = "mt-4 text-lg font-semibold";
    counter.textContent = `Counter: ${count}`;

    const incrementButton = Button("Increase", () => {
        console.log(`incrementing ${count}`);
        count++;
        counter.textContent = `Counter: ${count + 5}`;
    });
    container.append(
        title, description, counter, incrementButton
    )
    return container;
}
