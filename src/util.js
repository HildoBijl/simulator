import { useState, useEffect, useCallback, useRef } from 'react'

// applyMapping is like the array-map-function but then for objects. It takes an object like { a: 1, b: 2 } and calls the given function func(value, key) for each parameter. It stores the result in an object and returns it. For instance, using the doubling function x => 2*x will give as object { a: 2, b: 4 }.
export function applyMapping(obj, func) {
	const result = {}
	Object.keys(obj).map((key, index) => {
		const value = func(obj[key], key, index)
		if (value !== undefined)
			result[key] = value
	})
	return result
}

// bound will bound a number between a minimum and maximum.
export function bound(value, min = 0, max = 1) {
	return Math.min(Math.max(value, min), max)
}

// getTickSize will take a range, like "max - min" in a plot or so, and returns a tick (step) size that is good to show in plots between this minimum and maximum. A preferred tick size can also be given. The number returned is always a number like ..., 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, .... A number of preferred ticks can be given, and the closest candidate is returned.
export function getTickSize(range, numPreferredTicks = 6) {
	const power = Math.floor(Math.log10(range / numPreferredTicks))
	const candidates = [1, 2, 5, 10].map(x => x * Math.pow(10, power))
	const numTicks = candidates.map(candidate => range / candidate)
	const deviations = numTicks.map(num => Math.abs(num - numPreferredTicks))
	const bestIndex = deviations.reduce((best, value, index) => value < deviations[best] ? index : best, 0)
	return candidates[bestIndex]
}

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

export function range(min, max) {
	return new Array(max - min + 1).fill(0).map((_, index) => index + min)
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
