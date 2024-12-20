
import ExcelJS from 'exceljs'
import Button from '@mui/material/Button'

import { selectAttributes } from 'util'

import { hasFolders } from '../../util'

import { addWorksheet, adjustColumnWidths, downloadWorkbook } from './downloadUtil'

export function Download({ simulation }) {
	console.log(simulation)
	return <>
		<h2>Download</h2>
		<p>Sie können Ihre aktuelle Simulation als Excel-Datei herunterladen, um sie dann zu ändern und wieder hochzuladen.</p>
		<Button variant="contained" onClick={() => downloadSimulation(simulation)}>Simulation als Excel-Datei herunterladen</Button>
	</>
}

// downloadSimulation takes a simulation, turns it into an Excel file, and makes the browser download it.
function downloadSimulation(simulation) {
	const workbook = generateSimulationExcel(simulation)
	downloadWorkbook(workbook)
}

// generateSimulationExcel takes a simulation object and turns it into an Excel workbook.
function generateSimulationExcel(simulation) {
	console.log(simulation)
	let workbook = new ExcelJS.Workbook()
	addPages(workbook, simulation)
	return workbook
}

// We define keys for the simulation Excel.
const tabs = {
	settings: 'Einstellungen',
	folders: 'Ordner',
	pages: 'Seiten',
}
const minColumnWidth = 5
const maxColumnWidth = 80

// addPages takes a simulation workbook and adds a tab for all the pages. It doesn't return anything: the workbook is simply changed by reference.
function addPages(workbook, simulation) {
	// If the simulation has folders, add a folder sheet first.
	console.log(simulation, hasFolders(simulation), Object.values(simulation.pages || {}), Object.values(simulation.pages || {}).some(page => page.type === 'folder'))
	if (hasFolders(simulation))
		addFolders(workbook, simulation)

	// Set up a tab for the pages and add headers.
	const headers = { id: 'ID', title: 'Titel', description: 'Beschreibung' }
	const worksheet = addWorksheet(workbook, tabs.pages, headers)

	// Set up the sheet contents.
	simulation.pageList.forEach(page => {
		worksheet.addRow(selectAttributes(page, ['id', 'title', 'description']))
	})
	adjustColumnWidths(worksheet, minColumnWidth, maxColumnWidth)
}

// addFolders takes a simulation workbook and adds a tab for all the folders containing pages.
function addFolders(workbook, simulation) {
	// Set up a worksheet with headers.
	const headers = { id: 'ID', title: 'Titel' }
	const worksheet = addWorksheet(workbook, tabs.folders, headers)

	// Set up a handler to recursively add an element to the sheet.
	const addTreeElement = (folder) => {
		if (folder.type !== 'folder')
			return

		// Add the row to the sheet.
		worksheet.addRow(selectAttributes(folder, ['id', 'title']))

		// Recursively add contents.
		const contents = folder.contents || []
		contents.forEach(subpage => addTreeElement(subpage))
	}

	// Add all the pages in the main folder.
	(simulation.pageTree || []).forEach(page => addTreeElement(page))
	adjustColumnWidths(worksheet, minColumnWidth, maxColumnWidth)
}
