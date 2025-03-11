import { Button } from '../components/Button';

export async function renderRegister(): Promise<HTMLElement> {
    const container = document.createElement('div');
    container.className = 'text-center';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '10px';

    const title = document.createElement('h1');
    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.placeholder = 'email';
    emailInput.id = 'email';
    const passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.placeholder = 'password';
    passwordInput.id = 'password';

    const submitButton = Button('Register', () => {
        console.log();
    });
    container.append(title, emailInput, passwordInput, submitButton);
    return container;
}
