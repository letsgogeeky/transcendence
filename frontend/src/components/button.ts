import Component from './Component';

/**
 * This Button class:
 * Creates a DOM <button> element.
 * Sets its label and optional CSS class.
 * Adds a click handler that logs a message and runs a callback.
 * Inherits additional functionality from a base Component class (like maybe rendering or mounting logic).
 */
export default class Button extends Component {
    readonly element: HTMLButtonElement;

	/**
	 * @param label the text to display on the button.
	 * @param onClick a function to call when the button is clicked.
	 * @param className an optional string to apply CSS classes to the button (default is an empty string).
	 */
    constructor(label: string, onClick: () => void, className: string = '') {
        super(className);
        this.element = document.createElement('button');
        this.element.className += className;
        this.element.textContent = label;
        this.element.addEventListener('click', () => {
            console.log(`Button "${label}" clicked`);
            onClick();
        });
    }
}
