
// addWorksheet takes a workbook and adds a worksheet with the given title. It immediately also adds headers for the worksheet, as specified by the key-value-object headers.
export function addWorksheet(workbook, title, headers) {
	const worksheet = workbook.addWorksheet(title)
	worksheet.columns = Object.keys(headers).map(key => ({ key, header: headers[key] }))
	worksheet.getRow(1).font = { bold: true }
	return worksheet
}

// adjustColumnWidths takes a worksheet and checks the contents of the worksheet. It then adjusts the width of the columns, based on the contents, to more or less fit. (It can only use character counts and not distinguish between "W" and "l" or so.)
export function adjustColumnWidths(worksheet, minWidth, maxWidth) {
	worksheet.columns.forEach(column => {
		let maxLength = 0
		column.eachCell({ includeEmpty: true }, cell => {
			const columnLength = cell.value ? cell.value.toString().length : 0
			if (columnLength > maxLength)
				maxLength = columnLength
		})
		column.width = Math.max(Math.min(maxLength, maxWidth), minWidth)
	})
}

// downloadWorkbook takes a workbook and makes the browser download it.
export async function downloadWorkbook(workbook) {
	try {
		const buffer = await workbook.xlsx.writeBuffer()
		const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
		const EXCEL_EXTENSION = '.xlsx'
		const blob = new Blob([buffer], { type: fileType });
		if (navigator.msSaveBlog) {
			navigator.msSaveBlog(blob, `Simulation` + EXCEL_EXTENSION)
		} else {
			const link = document.createElement('a')
			if (link.download !== undefined) {
				const url = URL.createObjectURL(blob)
				link.setAttribute('href', url);
				link.setAttribute('download', `Simulation` + EXCEL_EXTENSION)
				document.body.appendChild(link)
				link.click()
				document.body.removeChild(link)
			}
		}
	} catch (error) {
		console.error(error)
	}
}
