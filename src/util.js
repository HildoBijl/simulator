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

const alphabet = 'abcdefghijklmnopqrstuvwxyz'

// numberToLetter turns a number into a letter string, similar to the columns in Excel. So "0 = a, 1 = b, ..., 25 = z, 26 = aa, ... " and so on.
export function numberToLetter(num) {
	const multiplier = alphabet.length
	
	// Prepare the number.
	let factor = multiplier
	let digits = 1
	while (factor <= num) {
		num -= factor
		factor *= multiplier
		digits++
	}

	// Get the processed number in a basic way and fill up the digits.
	const result = numberToLetterBasic(num, digits)
	return `${alphabet[0].repeat(digits - result.length)}${result}`
}

// numberToLetterBasic turns a number like 28 into a letter string, where "a = 0, b = 1, ..., z = 25". So 28 becomes "bc", being "1*26 + 2".
export function numberToLetterBasic(num) {
	const factor = alphabet.length
	if (num < factor)
		return alphabet[num]
	const remainder = num % factor
	return `${numberToLetterBasic((num - remainder) / factor)}${numberToLetterBasic(remainder)}`
}
