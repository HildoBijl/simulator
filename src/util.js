import { useEffect, useRef } from 'react'

export function getBaseUrl() {
	const currUrl = window.location.href
	const match = currUrl.match(/^https?:\/\/[a-zA-Z0-9.:-]+/)
	return match ? match[0] : 'website-url'
}

export function usePrevious(value) {
	const ref = useRef()
	useEffect(() => {
		ref.current = value
	})
	return ref.current
}
