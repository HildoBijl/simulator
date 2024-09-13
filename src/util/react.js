import { useState, useEffect, useCallback, useRef } from 'react'

import { easeShiftSlow } from './numbers'

// useLatest is used to directly store a value in a ref. This is useful when you have use-only functions in a useEffect function: plug them in a ref, apply the ref in the useEffect function and the function isn't triggered so much. (Note: this is different from the @react-hook/latest, which uses an event and is hence too slow.)
export function useLatest(value, initialValue = value) {
	const ref = useRef(initialValue)
	ref.current = value
	return ref
}

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

// useClearTags is a memo that clears tags, but only recalculates on a change in input. It turns a string '<p>This is the <strong>title</strong>.</p>' into 'This is the title'.
export function useClearTags(str) {
	const div = document.createElement('div')
	div.innerHTML = str
	return div.textContent || div.innerText || ''
}

// useAnimation takes an animation function and calls it several times per second with both (1) the time since mounting, and (2) the time difference dt since the last call. On the first call dt is undefined.
export function useAnimation(animationFunc) {
	const startTimeRef = useRef()
	const previousTimeRef = useRef()
	const requestRef = useRef()
	const animationFuncRef = useLatest(animationFunc)

	// Set up an animate function that keeps calling itself.
	const animate = useCallback(pageTime => {
		// Calculate all relevant times.
		let dt, time
		if (startTimeRef.current === undefined) {
			startTimeRef.current = pageTime // Remember the starting time.
			time = 0
		} else {
			time = pageTime - startTimeRef.current
			dt = pageTime - previousTimeRef.current
		}
		previousTimeRef.current = pageTime

		// Call the given animation function, and then call itself a tiny bit later.
		animationFuncRef.current(time, dt)
		requestRef.current = requestAnimationFrame(animate)
	}, [startTimeRef, previousTimeRef, animationFuncRef])

	// Start the animation cycle upon mounting.
	useEffect(() => {
		requestRef.current = requestAnimationFrame(animate)
		return () => cancelAnimationFrame(requestRef.current)
	}, [requestRef, animate])
}

// useTransitionedValue will apply slow transitioning of a given value, adjusting it over time.
export function useTransitionedValue(targetValue, transitionTime = 1000, easing = easeShiftSlow) {
	const previousTargetValue = usePrevious(targetValue)
	const [update, setUpdate] = useState()
	const [value, setValue] = useState(targetValue)

	// When the target value changes, note that there is an update.
	useEffect(() => {
		if (previousTargetValue !== undefined && previousTargetValue !== targetValue) {
			setUpdate({ oldValue: previousTargetValue, newValue: targetValue, changedOn: new Date() })
		}
	}, [previousTargetValue, targetValue, setUpdate])

	// Regularly adjust the current value based on the update.
	useAnimation(() => {
		if (!update)
			return

		// Check if the transition already finished.
		const timePassed = new Date() - update.changedOn
		if (timePassed >= transitionTime) {
			setValue(update.newValue)
			setUpdate()
			return
		}

		// Calculate the current state of the transition.
		const partPassed = timePassed / transitionTime
		const easedPartPassed = easing(partPassed)
		setValue(update.oldValue + easedPartPassed * (update.newValue - update.oldValue))
	})

	// Return the value that we want to display.
	return value
}
