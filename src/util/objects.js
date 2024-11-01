// lastOf returns the last element of an array.
export function lastOf(array) {
	return array[array.length - 1]
}

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

// arrayToObject takes an array and a function. The function takes an array value and index, and returns a tuple { key: "...", value: {...} }. This is then assembled into an object.
export function arrayToObject(array, func) {
	const result = {}
	array.forEach((...params) => {
		const itemResult = func(...params)
		result[itemResult.key] = itemResult.value
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

// insertIntoArray takes an array like [2,3,4,5] and an index like 2, and adds the given items into that spot. So insertIntoArray([2,3,4,5], 2, 6, 7) will give [2,3,6,7,4,5]. It returns a copy; the original is not adjusted.
export function insertIntoArray(array, index, ...toAdd) {
	if (!Array.isArray(array))
		throw new Error(`Invalid array: received something of type ${typeof array}.`)
	return [...array.slice(0, index), ...toAdd, ...array.slice(index)]
}

// moveArrayElement takes an array like [2, 3, 4, 5] and moves an element from an index to a new index. So moveArrayElement([2, 3, 4, 5], 2, 0) moves the element from index 2 to index 0 and hence gives [4, 2, 3, 5].
export function moveArrayElement(array, from, to) {
	// Check the input.
	if (!Array.isArray(array))
		throw new Error(`Invalid array: received something of type ${typeof array}.`)
	if (from < 0 || from >= array.length)
		throw new Error(`Invalid from parameter: the array only has length ${array.length}, but received ${from}.`)
	if (to < 0 || to >= array.length)
		throw new Error(`Invalid to parameter: the array only has length ${array.length}, but received ${to}.`)

	// Process the move, depending on whether it's a jump forwards or backwards.
	if (from === to)
		return [...array]
	if (from < to)
		return [...array.slice(0, from), ...array.slice(from + 1, to + 1), array[from], ...array.slice(to + 1)]
	return [...array.slice(0, to), array[from], ...array.slice(to, from), ...array.slice(from + 1)]
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

// deepEquals checks if two objects are the same.
export function deepEquals(a, b) {
	// On arrays check their length and walk through the items.
	if (Array.isArray(a)) {
		if (!Array.isArray(b))
			return false
		return a.length === b.length && a.every((value, index) => deepEquals(value, b[index]))
	}

	// On objects check their key length and walk through the parameters.
	if (typeof a === 'object') {
		if (typeof b !== 'object')
			return false
		const aKeys = Object.keys(a), bKeys = Object.keys(b)
		return aKeys.length === bKeys.length && aKeys.every(key => deepEquals(a[key], b[key]))
	}

	// On a basic type do a direct comparison.
	return a === b
}
