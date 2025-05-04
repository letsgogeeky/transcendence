import Input from './Input';

export default class PhoneInput extends Input {
    constructor(required: boolean = false, className: string = '') {
        super('📞  Phone number', 'text', 'phoneNumber', required, 'e.g. 0049XXXXXXXXXX', className);
        this.element.addEventListener('input', (event) => {
            let input = this.element.value.replace(/[^\d+]/g, '');
            input = input[0] + input.slice(1).replace(/\D/g, '');
            this.value = input;
        });
    }
}
