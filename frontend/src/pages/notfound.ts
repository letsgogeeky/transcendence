import Button from '../components/button';
import Component from '../components/Component';

export default class NotFoundComponent extends Component {
	readonly element: HTMLElement;

	constructor() {
		super();

		// Outer container (takes full screen, content starts at top-left)
		const container = document.createElement('div');
		container.className = 'flex items-start justify-start min-h-screen p-8 text-white';

		// Inner content wrapper (row: GIF | text)
		const contentWrapper = document.createElement('div');
		contentWrapper.className = 'flex flex-row gap-8';

		// Left: GIF
		const gif = document.createElement('img');
		gif.src = '/assets/404.gif'; // replace with actual path
		gif.alt = 'Lost GIF';
		gif.className = 'w-80 h-auto rounded shadow-lg';

		// Right: Text and button column
		const textBox = document.createElement('div');
		textBox.className = 'flex flex-col gap-3 items-center justify-center text-left';

		const title = document.createElement('h1');
		title.className = 'text-[#2b087a] text-4xl font-bold mb-12 sparkle-text relative z-10';
		title.textContent = 'PAGE NOT FOUND';

		const description = document.createElement('p');
		description.className = 'text-xl text-[#e8e0ec] max-w-md mb-8';
		description.textContent = 'I think you missed the correct exit on the highway.';

		// const leaveQueueButton = new Button(
		// 				'Leave Queue 🔚 ',
		// 				() => this.leaveQueue(),
		// 				'w-auto text-xl font-bold py-2 px-4 rounded-lg relative z-10 cursor-pointer border-[3px] text-[#87184b] border-[#87184b] bg-[#dccde4] hover:brightness-105 whitespace-nowrap'
		// 			);
				
					

		const homeButton = new Button('🏠 Go Home', () => {
			window.history.pushState({ path: '/' }, '', '/');
			window.dispatchEvent(new PopStateEvent('popstate'));},
			'w-auto text-xl font-bold py-2 px-4 rounded-lg relative z-10 cursor-pointer border-[3px] text-[#60317c] border-[#60317c] bg-[#dccde4] hover:brightness-105 whitespace-nowrap'
		);
		// homeButton.className = 'border border-[#00FFFF] border-4 text-xl text-[#e8e0ec] rounded-xl p-2 w-64 mb-4 shadow-[0_0_15px_#00FFFF] opacity-60';

		// Hover sparkle effect
		const buttonEl = homeButton.element;
		buttonEl.addEventListener('mouseenter', () => {
			buttonEl.style.boxShadow = '0 0 10px 2px #60317c';
		});
		buttonEl.addEventListener('mouseleave', () => {
			buttonEl.style.boxShadow = 'none';
		});

		// Assemble right-side column
		textBox.append(title, description);
		homeButton.render(textBox); // append AFTER the description

		// Final assembly
		contentWrapper.append(gif, textBox);
		container.append(contentWrapper);

		this.element = container;
	}
}


/** THE BEFORE VERSION: */
// export default class NotFoundComponent extends Component {
//     readonly element: HTMLElement;

//     constructor() {
//         super();
//         const container = document.createElement('div');
//         container.className = 'text-center';

//         const title = document.createElement('h1');
//         title.className = 'text-2xl font-bold text-red-500';
//         title.textContent = '404';

//         const description = document.createElement('p');
//         description.className = 'text-gray-600';
//         description.textContent =
//             'I think you missed the correct exit on the highway.';

//         const homeButton = new Button('Go Home', () => {
//             window.history.pushState({ path: '/' }, '/', '/');
//         });
//         container.append(title, description);
//         homeButton.render(container);
//         this.element = container;
//     }
// }
