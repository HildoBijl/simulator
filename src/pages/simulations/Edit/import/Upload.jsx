import { useState, useMemo } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import ExcelJS from 'exceljs'

import { selectAttributes } from 'util'
import { FormSubPart } from 'components'

import { WorkbookError, processWorkbook, applyChanges } from './util'

export function Upload({ simulation }) {
	const [workbook, setWorkbook] = useState()
	const [applied, setApplied] = useState(false) // Have the changes successfully been applied?
	return <>
		<h2>Hochladen</h2>
		<p>Wenn Sie eine Simulation als Excel-Datei erstellt haben, können Sie sie hier hochladen. Die Vorgehensweise ist wie folgt.</p>
		<ul>
			<li>Sie laden die Datei hoch.</li>
			<li>Wir lesen sie und prüfen sie auf mögliche Fehler.</li>
			<li>Wir erstellen einen kleinen Bericht darüber, was sich ändern wird.</li>
			<li>Wenn Sie mit den Änderungen einverstanden sind, bestätigen Sie sie und die Änderungen werden übernommen. Achtung: Nach der Bestätigung können die Änderungen nicht mehr rückgängig gemacht werden!</li>
		</ul>
		<FileUploader {...{ setWorkbook, setApplied }} />
		{workbook ? <WorkbookReport {...{ simulation, workbook, setWorkbook, setApplied }} /> : null}
		{applied ? <Alert type="success" sx={{ my: 2 }}>Die Änderungen wurden erfolgreich in die Simulation übernommen.</Alert> : null}
	</>
}

function FileUploader({ setWorkbook, setApplied }) {
	const [file, setFile] = useState()
	const [percentage, setPercentage] = useState()

	const setAndSaveFile = async (event) => {
		// Start reading the file.
		const file = event.target.files[0]
		setFile(file)
		setApplied(false)
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

	// When a file is uploading, show an upload notification, or an error if there's a problem.
	if (file)
		return <p>Die Datei wird gerade hochgeladen. Der Upload ist zu {percentage}% abgeschlossen.</p>

	// When no file is uploading, show the upload button.
	return <FormSubPart>
		<UploadButton onChange={setAndSaveFile} />
	</FormSubPart>
}

function UploadButton({ onChange }) {
	return <Button variant="contained" component="label">
		Neue Datei hochladen
		<input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={onChange} hidden />
	</Button>
}

function WorkbookReport({ simulation, workbook, setWorkbook, setApplied }) {
	// Process the workbook. On an error, display the error report.
	const { processedWorkbook, error } = useMemo(() => processWorkbook(workbook, simulation), [simulation, workbook])
	if (error)
		return <WorkbookError {...{ error }} />

	// No errors found. Show the workbook report.
	return <ProcessedWorkbookReport {...{ simulation, processedWorkbook, setWorkbook, setApplied }} />
}

function ProcessedWorkbookReport({ simulation, processedWorkbook, setWorkbook, setApplied }) {
	return <>
		<h4>Geplante Änderungen</h4>
		<p>Die Datei ist hochgeladen und ausgewertet worden. Wenn sie umgesetzt wird, werden die folgenden Änderungen auf diese Simulation angewendet. (Geringfügige Änderungen wie z. B. Textänderungen werden hier nicht angezeigt.)</p>
		<ul>
			<FolderChanges {...{ simulation, processedWorkbook }} />
			<PageChanges {...{ simulation, processedWorkbook }} />
		</ul>
		<p>Möchten Sie diese Änderungen durchführen?</p>
		<Button variant="contained" onClick={() => {
			applyChanges(simulation, processedWorkbook)
			setWorkbook()
			setApplied(true) // Show the success note.
		}}>Änderungen durchführen</Button>
	</>
}

function FolderChanges({ simulation, processedWorkbook }) {
	// Calculate additions/updates/deletions.
	const numAdded = processedWorkbook.folderList.filter(newFolder => !simulation.pages[newFolder.id]).length
	const numUpdated = processedWorkbook.folderList.filter(newFolder => {
		const oldFolder = simulation.pages[newFolder.id]
		if (!oldFolder)
			return false // The page is new, so it didn't change.
		return Object.keys(selectAttributes(newFolder, ['title'])).some(key => oldFolder[key] !== newFolder[key]) // Some attribute in the page changed.
	}).length
	const numRemoved = Object.values(simulation.pages).filter(oldFolder => oldFolder.type === 'folder' && !processedWorkbook.folders[oldFolder.id]).length

	// Show the statistics.
	if (numAdded === 0 && numUpdated === 0 && numRemoved === 0)
		return <li style={{ opacity: 0.4 }}>Es werden keine Ordner hinzugefügt, geändert oder entfernt.</li>
	return <li>Für die Seitenordner: {numAdded === 1 ? 'ein Ordner wird' : `${numAdded} Ordner werden`} hinzugefügt, {numUpdated === 1 ? 'ein Ordner wird' : `${numUpdated} Ordner werden`} aktualisiert und {numRemoved === 1 ? 'ein Ordner wird' : `${numRemoved} Ordner werden`} entfernt.</li>
}

function PageChanges({ simulation, processedWorkbook }) {
	// Calculate additions/updates/deletions.
	const numAdded = processedWorkbook.pageList.filter(newPage => !simulation.pages[newPage.id]).length
	const numUpdated = processedWorkbook.pageList.filter(newPage => {
		const oldPage = simulation.pages[newPage.id]
		if (!oldPage)
			return false // The page is new, so it didn't change.
		
		// Check if basic attributes have changed
		const basicAttributesChanged = Object.keys(selectAttributes(newPage, ['title', 'description'])).some(key => oldPage[key] !== newPage[key]);
		
		// Check if options have changed
		const oldOptions = oldPage.options || [];
		const newOptions = newPage.options || [];
		const optionsChanged = 
			oldOptions.length !== newOptions.length || 
			JSON.stringify(oldOptions) !== JSON.stringify(newOptions);
		
		return basicAttributesChanged || optionsChanged;
	}).length
	const numRemoved = Object.values(simulation.pages).filter(oldPage => oldPage.type === 'page' && !processedWorkbook.pages[oldPage.id]).length

	// Show the statistics.
	if (numAdded === 0 && numUpdated === 0 && numRemoved === 0)
		return <li style={{ opacity: 0.4 }}>Es werden keine Seiten hinzugefügt, geändert oder entfernt.</li>
	return <li>Für die Seiten: {numAdded === 1 ? 'eine Seite wird' : `${numAdded} Seiten werden`} hinzugefügt, {numUpdated === 1 ? 'eine Seite wird' : `${numUpdated} Seiten werden`} aktualisiert und {numRemoved === 1 ? 'eine Seite wird' : `${numRemoved} Seiten werden`} entfernt.</li>
}
