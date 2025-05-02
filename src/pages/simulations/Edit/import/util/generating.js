import ExcelJS from 'exceljs'

import { hasFolders } from '../../../util'
import { htmlToMarkdown } from './markdown'

import { tabNames, headers, minColumnWidth, maxColumnWidth } from './settings'
import { addWorksheet, adjustColumnWidths } from './writing'

// generateSimulationWorkbook takes a simulation object and turns it into an Excel workbook.
export function generateSimulationWorkbook(simulation) {
	let workbook = new ExcelJS.Workbook()
	addPages(workbook, simulation)
	addParameters(workbook, simulation)
	return workbook
}

// addFolders takes a simulation workbook and adds a tab for all the folders containing pages.
export function addFolders(workbook, simulation) {
	// Set up a worksheet with headers.
	const worksheet = addWorksheet(workbook, tabNames.folders, headers.folders)

	// Set up a handler to recursively add an element to the sheet.
	const addTreeElement = (folder) => {
		if (folder.type !== 'folder')
			return

		// Add the row to the sheet.
		worksheet.addRow({
			id: folder.id,
			parent: folder.parent?.id,
			title: folder.title,
		})

		// Recursively add contents.
		const contents = folder.contents || []
		contents.forEach(subpage => addTreeElement(subpage))
	}

	// Add all the pages in the main folder.
	(simulation.pageTree || []).forEach(page => addTreeElement(page))
	adjustColumnWidths(worksheet, minColumnWidth, maxColumnWidth)
}

// addPages takes a simulation workbook and adds a tab for all the pages. It doesn't return anything: the workbook is simply changed by reference.
export function addPages(workbook, simulation) {
	// If the simulation has folders, add a folder sheet first.
	if (hasFolders(simulation))
		addFolders(workbook, simulation)

	// Set up a tab for the pages and add headers.
	const worksheet = addWorksheet(workbook, tabNames.pages, headers.pages)

	// Set up the sheet contents.
	simulation.pageList.forEach(page => {
		// Convert options to pipe-separated format
		const optionsText = (page.options || []).map(option => {
			const description = option.description ? htmlToMarkdown(option.description) : ''
			const feedback = option.feedback ? htmlToMarkdown(option.feedback) : ''
			const followUpPage = option.followUpPage || ''
			const updateScript = option.updateScript || ''
			return `${description}|${feedback}|${followUpPage}|${updateScript}`
		}).join('\n')

		worksheet.addRow({
			id: page.id,
			parent: page.parent?.id,
			title: page.title,
			description: page.description ? htmlToMarkdown(page.description) : '',
			options: optionsText,
		})
	})
	adjustColumnWidths(worksheet, minColumnWidth, maxColumnWidth)
}

// addParameters takes a simulation workbook and adds a tab for all parameters/variables.
export function addParameters(workbook, simulation) {
	// If there are no variables, don't add the tab
	if (!simulation.variables || Object.keys(simulation.variables).length === 0) {
		return
	}

	// Set up a tab for the parameters and add headers
	const worksheet = addWorksheet(workbook, tabNames.parameters, headers.parameters)

	// Add all parameters to the worksheet
	Object.values(simulation.variables).forEach(variable => {
		worksheet.addRow({
			id: variable.id,
			name: variable.name || '',
			description: variable.title || '',
			defaultValue: variable.initialValue || '',
			minValue: variable.minValue || '',
			maxValue: variable.maxValue || '',
		})
	})

	adjustColumnWidths(worksheet, minColumnWidth, maxColumnWidth)
}
