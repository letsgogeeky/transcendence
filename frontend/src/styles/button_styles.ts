import Button from '../components/button';

export function createStyledButtonWithHandler(
	label: string,
	onClick: () => void,
	strokeColor: string
): HTMLButtonElement {
	const button = new Button(label, onClick);
	applyStyledAppearance(button.element, strokeColor);
	return button.element;
}

export function applyStyledAppearance(
	el: HTMLElement,
	glowColor: string
) {
	el.className =
		`w-72 text-xl px-6 py-3 border-4 transition-all pointer-events-auto font-[Arial_Black] font-bold rounded-xl text-center`;
	
	// Set text color to glowColor
	el.style.color = glowColor;

	// Add border styling
	el.style.borderColor = glowColor;
	el.style.borderWidth = '3px';

	// Hover effects (glow on border only)
	el.addEventListener('mouseenter', () => {
		el.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
		el.style.boxShadow = `0 0 10px 4px ${glowColor}`;
	});
	el.addEventListener('mouseleave', () => {
		el.style.backgroundColor = '';
		el.style.boxShadow = '';
	});
}

/** THE OLD FUNCTION WITH THE COLORED OUTLINE IN BLACK LETTERS */
// export function applyStyledAppearance(
// 	el: HTMLElement,
// 	strokeColor: string
// ) {
// 	el.className =
// 		'font-black text-[2.5rem] px-8 py-4 text-black border-4 transition-all pointer-events-auto font-impact rounded-xl';
// 	el.style.webkitTextStroke = `1.5px ${strokeColor}`;
// 	el.style.borderColor = strokeColor;
// 	el.style.borderWidth = '3px';

// 	// Hover effects
// 	el.addEventListener('mouseenter', () => {
// 		el.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
// 		el.style.boxShadow = `0 0 10px 4px ${strokeColor}`; // sparkle effect
// 	});
// 	el.addEventListener('mouseleave', () => {
// 		el.style.backgroundColor = '';
// 		el.style.boxShadow = '';
// 	});
// }
