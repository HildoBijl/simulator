// pageIndexToString takes an index array of a page (for instance [2, 0, 1]) and turns it into a string to display this index, like "3.1.2.".
export function pageIndexToString(index) {
	return index.map(value => value + 1).join('.') + '.'
}
