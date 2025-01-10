// ProcessingError is a custom-made Error type for workbook-processing-errors.
export class ProcessingError extends Error {
	constructor(data) {
		super(`An error occurred processing the workbook. Data provided is: ${JSON.stringify(data)}.`)
		this.type = 'ProcessingError'
		this.data = data
	}
}

// checkHeaders takes a worksheet and checks that the headers are as expected
export function checkHeaders(worksheet, headers) {
	// On a missing or empty worksheet, something is wrong.
	if (!worksheet || worksheet.rowCount < 1)
		return false

	// If the number of columns is not correct, something is wrong.
	const row = worksheet.getRow(1)
	const columns = Object.keys(headers)
	if (row.cellCount !== columns.length)
		return false

	// Check each of the column headers.
	return columns.every((column, index) => row.getCell(index + 1)?.value === headers[column])
}
