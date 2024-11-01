export const alphabet = 'abcdefghijklmnopqrstuvwxyz'

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

// getBracketPositions takes a string and returns an array of opening/closing positions of the outer curly brackets. So for "a{b{c}d}e{f}g" it returns [[1, 7], [9, 11]], where the brackets around the c are ignored since they are inside other brackets. It returns undefined when brackets are not properly nested.
export function getBracketPositions(text) {
	let depth = 0, depthNegative = false, open
	let result = []
	const textAsArray = [...text]
	textAsArray.forEach((char, index) => {
		if (char === '{') {
			if (depth === 0)
				open = index
			depth++
		} else if (char === '}') {
			depth--
			if (depth === 0)
				result.push([open, index])
			if (depth < 0)
				depthNegative = true
		}
	})
	return depthNegative || depth !== 0 ? undefined : result
}

// areBracketsProperlyNested checks if the brackets are properly nested inside a text.
export function areBracketsProperlyNested(text) {
	let depth = 0, depthNegative = false
	const textAsArray = [...text]
	textAsArray.forEach(char => {
		if (char === '{') {
			depth++
		} else if (char === '}') {
			depth--
			if (depth < 0)
				depthNegative = true
		}
	})
	return !depthNegative && depth === 0
}
