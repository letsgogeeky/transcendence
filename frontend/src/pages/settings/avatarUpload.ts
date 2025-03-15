import Button from '../../components/Button';
import Component from '../../components/Component';
import { endpoints, retryFetch } from '../../services/send-request';
import State from '../../services/state';

export default class AvatarUploadComponent extends Component {
    readonly element: HTMLFormElement;
    fileInput: HTMLInputElement;
    message: HTMLElement;
    submitButton: Button;
    successCallback: (data: any) => Promise<void>;

    constructor(
        className: string | null = '',
        successCallback: (data: any) => Promise<void>,
    ) {
        super(className || '');
        this.element = document.createElement('form');
        this.element.textContent = 'Avatar';
        this.element.id = 'avatar-form';
        this.element.name = 'avatar-form';
        this.element.required = false;
        this.element.enctype = 'multipart/form-data';

        this.fileInput = document.createElement('input');
        this.fileInput.name = 'file';
        this.fileInput.type = 'file';
        this.fileInput.id = 'file-input';
        this.fileInput.accept = 'image/*';
        this.successCallback = successCallback;

        const submitButton = new Button(
            'Upload image',
            () => {},
            `px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-700 active:scale-95 transition`,
        );
        submitButton.element.type = 'submit';
        this.submitButton = submitButton;

        this.message = document.createElement('div');
    }

    public render(parent: HTMLElement | Component): void {
        this.element.innerHTML = '';
        this.element.append(this.fileInput);
        this.element.append(this.message);
        this.submitButton.render(this.element);
        this.element.addEventListener('submit', async (event: Event) => {
            event.preventDefault();

            if (this.fileInput.files && this.fileInput.files.length > 0) {
                const formData = new FormData();
                formData.append('file', this.fileInput.files[0]);
                try {
                    let response = await retryFetch(
                        endpoints.auth + '/user/avatar',
                        {
                            method: 'PUT',
                            headers: {
                                Authorization: `Bearer ${State.getState().getAuthToken()}`,
                            },
                            body: formData,
                            credentials: 'include',
                        },
                    );
                    if (response.ok) {
                        const result = await response.json();
                        this.message.innerText = `Upload successful. `;
                        await this.successCallback(result);
                    } else {
                        this.message.innerText = 'Upload failed.';
                    }
                } catch (error) {
                    this.message.innerText = `Error: ${error}`;
                }
            } else {
                this.message.innerText = 'Please select a file.';
            }
        });
        super.render(parent);
    }
}
