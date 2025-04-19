import Button from '../components/button';

export function createStyledButton(label: string, url: string, strokeColor: string): HTMLButtonElement {
	const button = new Button(label, () => (window.location.href = url));

	// Common styling
	const el = button.element;
	el.style.fontFamily = '"Impact", "Arial Black", sans-serif';
	el.style.fontWeight = '900';
	el.style.color = 'black';
	el.style.fontSize = '2.5rem';
	el.style.padding = '16px 32px';
	el.style.width = 'auto';
	el.style.height = 'auto';
	el.style.webkitTextStroke = `1.5px ${strokeColor}`;
	el.style.border = '3px solid transparent';
	el.style.transition = 'all 0.3s';

	// Hover styling
	el.addEventListener('mouseenter', () => {
		el.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
		el.style.borderColor = strokeColor;
		el.style.borderWidth = '3px';
	});
	el.addEventListener('mouseleave', () => {
		el.style.backgroundColor = '';
		el.style.borderColor = 'transparent';
		el.style.borderWidth = '3px';
	});

	return el;
}
