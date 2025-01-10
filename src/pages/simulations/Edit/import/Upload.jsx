import { useState, useMemo } from 'react'
import Button from '@mui/material/Button'
import ExcelJS from 'exceljs'

import { FormSubPart } from 'components'

import { WorkbookError, processWorkbook, applyChanges } from './util'

export function Upload({ simulation }) {
	const [workbook, setWorkbook] = useState()
	return <>
		<h2>Hochladen</h2>
		<p>Wenn Sie eine Simulation als Excel-Datei erstellt haben, können Sie sie hier hochladen. Die Vorgehensweise ist wie folgt.</p>
		<ul>
			<li>Sie laden die Datei hoch.</li>
			<li>Wir lesen sie und prüfen sie auf mögliche Fehler.</li>
			<li>Wir erstellen einen kleinen Bericht darüber, was sich ändern wird.</li>
			<li>Wenn Sie mit den Änderungen einverstanden sind, bestätigen Sie sie und die Änderungen werden übernommen. Achtung: Nach der Bestätigung können die Änderungen nicht mehr rückgängig gemacht werden!</li>
		</ul>
		<FileUploader {...{ setWorkbook }} />
		{workbook ? <WorkbookReport {...{ simulation, workbook }} /> : null}
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
	// Process the workbook. On an error, display the error report.
	const { processedWorkbook, error } = useMemo(() => processWorkbook(workbook, simulation), [simulation, workbook])
	if (error)
		return <WorkbookError {...{ error }} />

	// No errors found. Show the workbook report.
	return <ProcessedWorkbookReport {...{ simulation, processedWorkbook }} />
}

function ProcessedWorkbookReport({ simulation, processedWorkbook }) {
	// Interpret the workbook.

	// Generate the report.
	return <>
		<h4>Geplante Änderungen</h4>
		<p>Die Datei ist hochgeladen und ausgewertet worden. Wenn sie umgesetzt wird, werden die folgenden Änderungen auf diese Simulation angewendet. (Geringfügige Änderungen wie z. B. Textänderungen werden hier nicht angezeigt.)</p>
		<ul>
			<FolderChanges {...{ simulation, processedWorkbook }} />
			<PageChanges {...{ simulation, processedWorkbook }} />
		</ul>
		<p>Möchten Sie diese Änderungen durchführen?</p>
		<Button variant="contained" onClick={() => applyChanges(simulation, processedWorkbook)}>Änderungen durchführen</Button>
	</>
}

function FolderChanges({ simulation, processedWorkbook }) {
	console.log(simulation, processedWorkbook)
	const newFolders = processedWorkbook.folderList.filter(newFolder => simulation.pages[newFolder.id]?.type === 'folder').length
	const deletedFolders = Object.values(simulation.pages).filter(oldFolder => processedWorkbook.folders[oldFolder]).length

	// On no additions/deletions, show nothing. (Note: there might still be changes.)
	if (newFolders === 0 && deletedFolders === 0)
		return <li style={{ opacity: 0.3 }}>Es gibt keine wesentlichen Änderungen an den Ordnern.</li>
	if (deletedFolders === 0)
		return <li>Es {newFolders === 1 ? 'wird' : 'werden'} {newFolders} {newFolders === 1 ? 'neuer' : 'neue'} Ordner hinzugefügt.</li>
	if (newFolders === 0)
		return <li>Es {deletedFolders === 1 ? 'wird' : 'werden'} {deletedFolders} {deletedFolders === 1 ? 'bestehender' : 'bestehende'} Ordner gelöscht.</li>
	return <li>Es {newFolders === 1 ? 'wird' : 'werden'} {newFolders} {newFolders === 1 ? 'neuer' : 'neue'} Ordner hinzugefügt und {deletedFolders} {deletedFolders === 1 ? 'bestehender' : 'bestehende'} Ordner gelöscht.</li>
}

function PageChanges({ simulation, processedWorkbook }) {
	return <li>Temp</li>
	// // Get all the pages from the file.
	// const pages = readSheet(workbook, 'pages')

	// return <li>Wir haben {pages.length} Seiten gefunden. (Deren Bearbeitung steht noch aus.)</li>

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
