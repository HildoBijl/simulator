import { tabs, tabNames, headers } from './settings'

// getWorkbookError tries to find an error for the given workbook. Is it in the right format? If not, some object is returned that gives info about what's wrong.
export function getWorkbookError(workbook) {
	// Check that the tabs are all there.
	const missingTab = tabs.find(tab => !workbook.getWorksheet(tabNames[tab]))
	if (missingTab)
		return { type: 'missingTab', tab: missingTab }

	// Check the headers for the various tabs.
	const faultyTab = Object.keys(headers).find(tab => !areHeadersMatching(workbook, tab))
	if (faultyTab)
		return { type: 'faultyHeaders', tab: faultyTab }
}

// areHeadersMatching checks if the given tab in the workbook has its headers defined as expected.
function areHeadersMatching(workbook, tab) {
	const worksheet = workbook.getWorksheet(tabNames[tab])
	return checkHeaders(worksheet, headers[tab])
}

// checkHeaders takes a worksheet and checks the headers.
function checkHeaders(worksheet, headers) {
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
