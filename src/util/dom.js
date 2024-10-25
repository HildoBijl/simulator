// getBaseUrl checks what the URL is for the user (can be the online URL or localhost) and extracts it.
export function getBaseUrl() {
	const currUrl = window.location.href
	const match = currUrl.match(/^https?:\/\/[a-zA-Z0-9.:-]+/)
	return match ? match[0] : 'website-url'
}

// isLocalhost checks if we're on the localhost development server or not.
export function isLocalhost() {
	return location.hostname === "localhost" || location.hostname === "127.0.0.1"
}
