import ExcelJS from 'exceljs'

import { hasFolders } from '../../../util'
import { htmlToMarkdown } from './markdown'

import { tabNames, headers, minColumnWidth, maxColumnWidth } from './settings'
import { addWorksheet, adjustColumnWidths } from './writing'

// generateSimulationWorkbook takes a simulation object and turns it into an Excel workbook.
export function generateSimulationWorkbook(simulation) {
	let workbook = new ExcelJS.Workbook()
	addPages(workbook, simulation)
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
			return `${description}|${feedback}|${followUpPage}`
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
