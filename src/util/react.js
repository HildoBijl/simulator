import { useState, useEffect, useCallback, useRef } from 'react'

// usePrevious returns the value which the given variable had during the previous render call.
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

// useLocalStorageState is like useState, but it then tracks the property in localStorage too. Upon saving, it stores to localStorage. Upon initializing, it tries to get the value back from localStorage.
export function useLocalStorageState(initialValue, lsKey) {
	// Set up a state that tracks the local storage.
	const lsValue = localStorage.getItem(lsKey)
	const [state, setState] = useState((lsValue === undefined || lsValue === null) ? initialValue : JSON.parse(lsValue))

	// Expand the setState to also store state updates.
	const expandedSetState = useCallback((newState) => {
		if (typeof newState === 'function') {
			const givenSetState = newState
			setState(state => {
				const newState = givenSetState(state)
				localStorage.setItem(lsKey, JSON.stringify(newState))
				return newState
			})
		} else {
			localStorage.setItem(lsKey, JSON.stringify(newState))
			setState(newState)
		}
	}, [lsKey, setState])

	// Add a clear function to get rid of the local storage and go back to the initial value.
	const clearState = useCallback(() => {
		localStorage.removeItem(lsKey)
		setState(initialValue)
	}, [initialValue, lsKey])

	// Return the tuple.
	return [state, expandedSetState, clearState]
}
