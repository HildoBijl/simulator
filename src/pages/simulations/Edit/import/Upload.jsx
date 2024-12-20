import { useState } from 'react'
import Button from '@mui/material/Button'
import ExcelJS from 'exceljs'

import { FormSubPart } from 'components'

import { readSheet, getWorkbookError, WorkbookError, applyChanges } from './util'

export function Upload({ simulation }) {
	const [workbook, setWorkbook] = useState()
	return <>
		<h2>Hochladen</h2>
		<p>Wenn Sie eine Simulation als Excel-Datei erstellt haben, können Sie sie hier hochladen. Die Vorgehensweise ist wie folgt.</p>
		<ul>
			<li>Sie laden die Datei hoch.</li>
			<li>Wir lesen sie und prüfen sie auf mögliche Fehler.</li>
			<li>Wir erstellen einen kleinen Bericht darüber, was sich ändern wird.</li>
			<li>Wenn Sie mit den Änderungen einverstanden sind, bestätigen Sie sie und die Änderungen werden übernommen. Achtung: Dies kann nicht rückgängig gemacht werden!</li>
		</ul>
		<FileUploader {...{ setWorkbook }} />
		<WorkbookReport {...{ simulation, workbook }} />
	</>
}

function FileUploader({ setWorkbook }) {
	const [file, setFile] = useState()
	const [percentage, setPercentage] = useState()

	const setAndSaveFile = async (event) => {
		// Start reading the file.
		const file = event.target.files[0]
		setFile(file)
		const reader = new FileReader()
		reader.readAsArrayBuffer(file)

		// On a progress event, update the message.
		reader.onprogress = (event) => {
			setPercentage(Math.round(event.loaded / event.total) * 100)
		}

		// On a load (finish) event, update the workbook.
		reader.onload = () => {
			const workbook = new ExcelJS.Workbook()
			const buffer = reader.result
			workbook.xlsx.load(buffer).then(workbook => {
				setWorkbook(workbook)
			})
		}

		// On any type of end, get rid of the file to show the upload button again.
		reader.onloadend = () => {
			setFile()
		}
	}

	// When a file is selected, show an upload notification, or an error if there's a problem.
	if (file)
		return <p>Die Datei wird gerade hochgeladen. Der Upload ist zu {percentage}% abgeschlossen.</p>

	// When no file is selected, show the upload button.
	return <FormSubPart>
		<UploadButton onChange={setAndSaveFile} />
	</FormSubPart>
}

function UploadButton({ onChange }) {
	return <Button variant="contained" component="label">
		Datei hochladen
		<input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={onChange} hidden />
	</Button>
}

function WorkbookReport({ simulation, workbook }) {
	// On no workbook, don't show a report.
	if (!workbook)
		return null

	// Check the workbook for errors.
	const error = getWorkbookError(workbook)
	if (error)
		return <WorkbookError {...{ error }} />

	// Generate the report.
	return <>
		<h4>Geplante Änderungen</h4>
		<p>Die Datei ist hochgeladen und ausgewertet worden. Wenn sie umgesetzt wird, werden die folgenden Änderungen auf diese Simulation angewendet.</p>
		<ul>
			<FolderChanges {...{ simulation, workbook }} />
			<PageChanges {...{ simulation, workbook }} />
		</ul>
		<p>Möchten Sie diese Änderungen durchführen?</p>
		<Button variant="contained" onClick={() => applyChanges(simulation, workbook)}>Änderungen durchführen</Button>
	</>
}

function FolderChanges({ simulation, workbook }) {
	// Get all the folders from the file.
	const folders = readSheet(workbook, 'folders')

	// ToDo: implement folder changes.
	return <li>Wir haben {folders.length} Ordner gefunden. (Deren Bearbeitung steht noch aus.)</li>
}

function PageChanges({ simulation, workbook }) {
	// Get all the pages from the file.
	const pages = readSheet(workbook, 'pages')

	return <li>Wir haben {pages.length} Seiten gefunden. (Deren Bearbeitung steht noch aus.)</li>

	// // Get the statistics on added, updated and removed pages.
	// const changes = { added: 0, updated: 0, removed: 0 }
	// pages.forEach(page => {
	// 	if (!page.id || !simulation.pages[page.id])
	// 		changes.added++
	// 	else if (Object.keys(page).some(key => page[key] !== simulation.pages[page.id][key]))
	// 		changes.updated++
	// })
	// changes.removed = simulation.pageList.length - (pages.length - changes.added)

	// // Show the statistics.
	// if (Object.values(changes).every(value => value === 0))
	// 	return <li>Es werden keine Seiten hinzugefügt, geändert oder entfernt.</li>
	// return <li>Für die Seiten: {changes.added === 1 ? 'eine Seite wird' : `${changes.added} Seiten werden`} hinzugefügt, {changes.updated === 1 ? 'eine Seite wird' : `${changes.updated} Seiten werden`} aktualisiert und {changes.removed === 1 ? 'eine Seite wird' : `${changes.removed} Seiten werden`} entfernt.</li>
}
