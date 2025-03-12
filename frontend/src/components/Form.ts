import Button from './Button';
import Component from './Component';
import Input from './Input';

export default class FormComponent extends Component {
    readonly element: HTMLFormElement;
    inputs: Input[];
    submitButton: Button;
    submitCallback: (data: any) => Promise<void>;

    constructor(
        label: string,
        inputs: Input[],
        submitCallback: (data: any) => Promise<void>,
    ) {
        super();
        this.element = document.createElement('form');
        const submitButton = new Button(
            label,
            () => {},
            `px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-700 active:scale-95 transition`,
        );
        submitButton.element.type = 'submit';
        this.inputs = inputs;
        this.submitCallback = submitCallback;
        this.submitButton = submitButton;
    }

    render(parent: HTMLElement) {
        this.element.innerHTML = '';
        this.element.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(this.element);
            const formValues = Object.fromEntries(formData.entries());
            this.inputs.forEach((input) => input.disable());
            this.submitButton.disable();
            await this.submitCallback(formValues);
            this.submitButton.enable();
            this.inputs.forEach((input) => input.enable());
        });
        this.inputs.forEach((input) => {
            input.render(this.element);
        });
        this.submitButton.render(this.element);
        super.render(parent);
    }
}
