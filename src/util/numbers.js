// bound will bound a number between a minimum and maximum.
export function bound(value, min = 0, max = 1) {
	return Math.min(Math.max(value, min), max)
}

// range will give an array of numbers. So range(2, 5) will give [2, 3, 4, 5]. Bounds are inclusive.
export function range(min, max) {
	return new Array(max - min + 1).fill(0).map((_, index) => index + min)
}

// roundTo rounds a number to the given number of decimals. So roundTo(12.345, 2) will be 12.35, while roundTo(12.345, -1) will be 10.
export function roundTo(number, decimals = 0) {
	return Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

// roundToDigits rounds a number to the given number of digits. So roundToDigits(12.345, 4) will become 12.35. Similarly, roundToDigits(123, 2) will be 120. Do note: roundToDigits(999, 3) will be 999 while roundToDigits(999, 2) will be 1000.
export function roundToDigits(number, digits, useMinZeroDecimals = false, maxDecimals) {
	// Boundary cases.
	if (number === 0)
		return 0
	if (digits === 0)
		return 0
	if (digits === Infinity)
		return number

	// Calculate rounding.
	let decimals = digits - Math.floor(Math.log10(Math.abs(number))) - 1
	decimals = maxDecimals === undefined ? decimals : Math.min(decimals, maxDecimals)
	if (useMinZeroDecimals)
		decimals = Math.max(decimals, 0)
	return roundTo(number, decimals)
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

// The following functions are easing functions, useful for setting up animations.
export const easeInOut = x => (x * x) / (2 * (x * x - x) + 1)
export const easeShift = x => x < 0.5 ? 2 * x ** 2 : 1 - 2 * (1 - x) ** 2
export const easeShiftSlow = x => x < 0.5 ? 4 * x ** 3 : 1 - 4 * (1 - x) ** 3

// fileSizeText turns a number like "2560" into a string like "2.5 kB" that can be displayed.
export function fileSizeText(size) {
	let prefixIndex = 0
	while (size >= 1024) {
		prefixIndex++
		size /= 1024
	}
	const number = size < 9.95 ? roundTo(size, 1) : roundTo(size, 0)
	const prefix = ['', 'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'][prefixIndex]
	return `${number} ${prefix || ''}B`
}
