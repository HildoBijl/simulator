// range will give an array of numbers. So range(2, 5) will give [2, 3, 4, 5]. Bounds are inclusive.
export function range(min, max) {
	return new Array(max - min + 1).fill(0).map((_, index) => index + min)
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
