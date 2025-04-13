import Button from '../components/Button';
import Component from '../components/Component';

export function createBackgroundImage(src: string, opacity: number, className: string): HTMLElement {
	const container = document.createElement('div');
	container.className = className;

	const img = document.createElement('img');
	img.src = src;
	img.alt = 'Background';
	img.className = 'w-full object-cover';
	img.style.opacity = opacity.toString();

	container.appendChild(img);
	return container;
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