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

// removeKeys takes an object and removes certain keys from it. It always returns a clone.
export function removeKeys(obj, keysToRemove) {
	// Turn the keysToRemove into an array if it's not already.
	if (!Array.isArray(keysToRemove))
		keysToRemove = [keysToRemove]

	// Set up a clone and remove the respective keys.
	const clone = { ...obj }
	keysToRemove.forEach(key => {
		delete clone[key]
	})
	return clone
}

// nestedListToIndices will take a nested list, like [a, [b, [c, d], e, f], g], and turn it into an array with index lists, which is [[0], [1, 0], [1, 1, 0], [1, 1, 1], [1, 2], [1, 3], [2]]. So each final element in the list gets turned into a list of indices through which it could be accessed.
export function nestedListToIndices(list, indices = []) {
	const result = []

	// Walk through the list to get the indices of each element.
	list.forEach((element, index) => {
		if (Array.isArray(element)) { // On a sub-array, recursively add its indices.
			result.push(...nestedListToIndices(element, [...indices, index]))
		} else { // On a regular element, add a clone of the indices array to the result.
			result.push([...indices, index])
		}
	})

	// All done!
	return result
}
