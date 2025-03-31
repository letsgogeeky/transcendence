import Button from '../Button';
import Component from '../Component';
import { showToast, ToastState } from '../Toast';
import Input from './Input';
import Select from './Select';

type FormInput = Input | Select;
type SuccessCallback = ((data: any) => Promise<void>) | ((data: any) => void);

export default class FormComponent extends Component {
    readonly element: HTMLFormElement;
    inputs: FormInput[];
    submitButton: Button;
    submitCallback: ((data: any) => Promise<void>) | null;

    constructor(
        label: string,
        inputs: FormInput[],
        submitCallback: ((data: any) => Promise<Response>) | null,
        successCallback: SuccessCallback | null = null,
    ) {
        super();
        this.element = document.createElement('form');
        const submitButton = new Button(
            label,
            () => {},
			`w-40 border-2 border-white text-white text-2xl font-bold py-2 px-4 rounded-lg shadow-md hover:bg-white hover:text-purple-900 mt-2 mx-auto`,
            // `px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-700 active:scale-95 transition`,
        );
        submitButton.element.type = 'submit';
        this.inputs = inputs;
        this.submitCallback = FormComponent.showNotification(
            submitCallback,
            successCallback,
        );
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
            if (this.submitCallback) await this.submitCallback(formValues);
            this.submitButton.enable();
            this.inputs.forEach((input) => input.enable());
        });
        this.inputs.forEach((input) => {
            input.render(this.element);
        });
        this.submitButton.render(this.element);
        super.render(parent);
    }

    public static showNotification(
        submitCallback: ((data: any) => Promise<Response>) | null,
        successCallback: SuccessCallback | null = null,
    ): (data: any) => Promise<void> {
        return async function (data: any) {
            {
                if (!submitCallback) return;
                try {
                    const response = await submitCallback!(data);
                    const responseBody = await response!.json();
                    if (!response!.ok) {
                        throw new Error(`Error: ${responseBody.error}`);
                    }
                    if (successCallback) await successCallback(responseBody);
                    showToast(ToastState.SUCCESS, JSON.stringify(responseBody));
                } catch (error) {
                    if (error instanceof Error) {
                        showToast(ToastState.ERROR, error.message);
                    } else {
                        showToast(
                            ToastState.ERROR,
                            'An unexpected error occurred',
                        );
                    }
                }
            }
        };
    }
}
