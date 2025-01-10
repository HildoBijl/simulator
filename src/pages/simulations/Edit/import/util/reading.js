import { tabNames, headers } from './settings'
import { ProcessingError, checkHeaders } from './checking'

// readSheet takes a worksheet and, based on the supposed headers it should have, reads the objects contained in it.
export function readSheet(workbook, tab) {
	// Extract the current worksheet and its headers.
	const worksheet = workbook.getWorksheet(tabNames[tab])
	if (!worksheet)
		throw new ProcessingError({ type: 'missingTab', tab })
	const currHeaders = headers[tab]

	// Check that the headers match.
	const sheetHeaders = headers[tab]
	if (!checkHeaders(worksheet, sheetHeaders))
		throw new ProcessingError({ type: 'faultyHeaders', tab })

	// On no sheet, or no rows, don't read anything.
	if (!worksheet || worksheet.rowCount <= 1)
		return []

	// Read in the sheet.
	const rows = []
	worksheet.eachRow((row, index) => {
		if (index === 1)
			return // Ignore the header.
		const rowAsObj = rowToObject(row, Object.keys(currHeaders))
		rows.push(rowAsObj)
	})
	return rows
}

// rowToObject turns a table row into an object, based on provided keys and a mapping.
export function rowToObject(row, keys) {
	const result = {}
	keys.forEach((key, index) => {
		const value = row.getCell(index + 1).value
		result[key] = (value === undefined || value === null) ? undefined : value
	})
	return result
}
