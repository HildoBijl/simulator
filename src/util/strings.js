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
