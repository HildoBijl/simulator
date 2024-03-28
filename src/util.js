import { useState, useEffect, useCallback, useRef } from 'react'

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

// useTrackedState works just like useState, but then when the given value changes due to external reasons it is taken over. There's one exception: if a recent change to the state was made (in less than a second, or as specified in the second parameter) then this update is not done, assuming it's just a delayed response from an external source.
export function useTrackedState(value, threshold = 1000) {
	const [state, setState] = useState(value)
	const [lastChanged, setLastChanged] = useState(undefined)

	// The setNewState handler updates the state and remembers when it was last manually updated.
	const setNewState = useCallback((newState) => {
		setLastChanged(() => new Date())
		setState(newState)
	}, [setState, setLastChanged])

	// When the tracked value changes, and no recent changes have been made to the state, update the state.
	useEffect(() => {
		if (!lastChanged || new Date() - lastChanged > threshold)
			setState(value)
	}, [value, lastChanged, threshold, setState])

	// Return the required parameters.
	return [state, setNewState]
}
