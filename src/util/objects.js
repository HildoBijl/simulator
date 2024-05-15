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
