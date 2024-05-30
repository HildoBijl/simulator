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

// selectRandomly picks a random element out of an array.
export function selectRandomly(array) {
	const index = Math.floor(Math.random() * array.length)
	return array[index]
}

// arrayFind is like Array.find or Array.findIndex but then instead of giving the element that returns true, it returns an object { index, element, value } where value is the first truthy value that was returned. If none are found, it returns undefined.
export function arrayFind(array, func) {
	for (let index = 0; index < array.length; index++) {
		const element = array[index]
		const value = func(element, index, array)
		if (value)
			return { index, element, value }
	}
	return undefined
}
