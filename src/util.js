export function getBaseURL() {
	const currURL = window.location.href
	const match = currURL.match(/^https?:\/\/[a-zA-Z0-9.:-]+/)
	return match ? match[0] : 'website-url'
}
