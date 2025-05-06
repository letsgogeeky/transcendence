import Button from '../components/button';
import Component from '../components/Component';

/**
 * 
 * @param fileName the name or path of the file inside the directory `frontend/assets/`
 * @param className the tailwind formatting string that will style the image element
 * @param altText the "alt text" to be provided if the image fail to load
 * @param opacity optional - sets the opacity of the image if given
 * @returns the HTMLImageElement
 */
export function loadImage(
	fileName: string,
	className: string,
	altText: string,
	opacity?: number
): HTMLImageElement {
	const image = document.createElement('img');
	image.src = `./assets/${fileName}`;
	image.className = className;
	image.alt = altText;

	if (opacity !== undefined) {
		image.style.opacity = opacity.toString();
	}
	image.onerror = () => {
		console.error(`Image "${fileName}" failed to load`);
	};
	return image;
}

export function loadBackgroundGif(): HTMLElement {
	const container = document.createElement('div');
	container.className = 'absolute top-1/2 left-0 right-0 transform -translate-y-1/2';  // Ensures it's centered vertically and spans the full width of the screen

	const gif = document.createElement('img');
	gif.src = './assets/transparent_pong.gif';  // Replace with the actual path to your transparent gif
	gif.className = 'w-full object-cover';  // Set width to full, height to a fixed value (e.g., 700px)
	gif.style.opacity = '0.4';
	gif.alt = 'Background Gif';
	container.appendChild(gif);
	return container;
}

export function copyrightLine(): HTMLElement {
	const copyright = document.createElement('p');
	copyright.className = 'text-[#c9b2d3] text-xs fixed bottom-6 left-6';
	copyright.textContent = '© 2025 PongJam. All rights reserved.';
	return copyright;
}