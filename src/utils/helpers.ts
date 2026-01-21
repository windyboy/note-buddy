export function debounce<T extends (...args: unknown[]) => void>(
	func: T,
	wait: number,
): (...args: Parameters<T>) => void {
	let timeout: number | null = null;
	return function (...args: Parameters<T>) {
		if (timeout !== null) {
			clearTimeout(timeout);
		}
		timeout = window.setTimeout(() => {
			func(...args);
			timeout = null;
		}, wait);
	};
}

export function formatDate(timestamp: number): string {
	return new Date(timestamp).toLocaleString();
}

export function sanitizeContent(content: string): string {
	return content.replace(/<script[^>]*>.*?<\/script>/gi, '');
}

export function truncateString(str: string, maxLength: number): string {
	if (str.length <= maxLength) return str;
	return `${str.slice(0, maxLength - 3)}...`;
}