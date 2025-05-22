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
		{applied ? <Alert severity="success" sx={{ my: 2 }}>Die Änderungen wurden erfolgreich in die Simulation übernommen.</Alert> : null}
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
			console.log("File loaded, creating workbook")
			const workbook = new ExcelJS.Workbook()
			const buffer = reader.result
			workbook.xlsx.load(buffer).then(workbook => {
				console.log("Workbook loaded successfully")
				setWorkbook(workbook)
			}).catch(error => {
				console.error("Error loading workbook:", error)
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
	console.log("Processing workbook")
	const { processedWorkbook, error } = useMemo(() => {
		const result = processWorkbook(workbook, simulation)
		console.log("Workbook processing result:", result)
		return result
	}, [simulation, workbook])

	if (error) {
		console.error("Error processing workbook:", error)
		return <WorkbookError {...{ error }} />
	}

	// No errors found. Show the workbook report.
	return <ProcessedWorkbookReport {...{ simulation, processedWorkbook, setWorkbook, setApplied }} />
}

function ProcessedWorkbookReport({ simulation, processedWorkbook, setWorkbook, setApplied }) {
	// Debug workbook content
	const debugWorkbook = () => {
		console.log("Processed Workbook Content:", processedWorkbook)

		// Debug sheets
		if (workbook) {
			console.log("Excel Sheets:")
			workbook.eachSheet(sheet => {
				console.log(`Sheet: ${sheet.name}, Row Count: ${sheet.rowCount}`)
				if (sheet.name === 'Parameters') {
					console.log("Parameters sheet rows:")
					sheet.eachRow((row, rowNumber) => {
						if (rowNumber > 1) { // Skip header
							const values = row.values
							console.log(`Row ${rowNumber}:`, values)
						}
					})
				}
			})
		}

		alert("Workbook content logged to console. Check browser console for details.")
	}

	return <>
		<h4>Geplante Änderungen</h4>
		<p>Die Datei ist hochgeladen und ausgewertet worden. Wenn sie umgesetzt wird, werden die folgenden Änderungen auf diese Simulation angewendet. (Geringfügige Änderungen wie z. B. Textänderungen werden hier nicht angezeigt.)</p>
		<ul>
			<FolderChanges {...{ simulation, processedWorkbook }} />
			<PageChanges {...{ simulation, processedWorkbook }} />
			<ParameterChanges {...{ simulation, processedWorkbook }} />
			<PageOrderChanges {...{ simulation, processedWorkbook }} />
		</ul>
		<p>Möchten Sie diese Änderungen durchführen?</p>
		<Button variant="contained" onClick={() => {
			console.log("Applying changes from workbook:", processedWorkbook)
			applyChanges(simulation, processedWorkbook)
			setWorkbook()
			setApplied(true) // Show the success note.
		}}>Änderungen durchführen</Button>

		{/* Debug button for examining workbook content */}
		<Button
			variant="outlined"
			color="secondary"
			onClick={debugWorkbook}
			sx={{ ml: 2 }}
		>
			Debug Workbook Content
		</Button>
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

function ParameterChanges({ simulation, processedWorkbook }) {
	// If there's no parameters data, show that no parameters will be changed
	if (!processedWorkbook.parameters || !processedWorkbook.parameterList || processedWorkbook.parameterList.length === 0) {
		return <li style={{ opacity: 0.4 }}>Es werden keine Parameter hinzugefügt, geändert oder entfernt.</li>
	}

	// Calculate additions/updates/deletions
	const newParams = (processedWorkbook.parameterList || [])
		.filter(newParam => !simulation.variables || !simulation.variables[newParam.id])

	const updatedParams = (processedWorkbook.parameterList || [])
		.filter(newParam => {
			const oldParam = simulation.variables?.[newParam.id]
			if (!oldParam) {
				return false // The parameter is new, so it didn't change
			}

			// Check if any attribute has changed
			return ['name', 'title', 'initialValue', 'minValue', 'maxValue'].some(key => {
				// Handle undefined values properly
				const oldValue = oldParam[key] || ''
				const newValue = newParam[key] || ''
				return oldValue !== newValue
			})
		})

	const removedParams = Object.values(simulation.variables || {})
		.filter(oldParam => !processedWorkbook.parameters || !processedWorkbook.parameters[oldParam.id])

	const numAdded = newParams.length
	const numUpdated = updatedParams.length
	const numRemoved = removedParams.length

	// Debug logging
	console.log("Parameter changes:", {
		added: newParams.map(p => p.name),
		updated: updatedParams.map(p => p.name),
		removed: removedParams.map(p => p.name)
	})

	// Show the statistics
	if (numAdded === 0 && numUpdated === 0 && numRemoved === 0) {
		return <li style={{ opacity: 0.4 }}>Es werden keine Parameter hinzugefügt, geändert oder entfernt.</li>
	}

	return <li>
		Für die Parameter: {numAdded === 1 ? 'ein Parameter wird' : `${numAdded} Parameter werden`} hinzugefügt
		{numAdded > 0 && <span> ({newParams.map(p => p.name || '[kein Name]').join(', ')})</span>},
		{numUpdated === 1 ? 'ein Parameter wird' : `${numUpdated} Parameter werden`} aktualisiert
		{numUpdated > 0 && <span> ({updatedParams.map(p => p.name || '[kein Name]').join(', ')})</span>}, und
		{numRemoved === 1 ? 'ein Parameter wird' : `${numRemoved} Parameter werden`} entfernt
		{numRemoved > 0 && <span> ({removedParams.map(p => p.name || '[kein Name]').join(', ')})</span>}.
	</li>
}

// Component to show the page order changes based on the "Reihenfolge" columns
function PageOrderChanges({ simulation, processedWorkbook }) {
	// If no raw page order is available, don't show anything
	if (!processedWorkbook.rawPageOrder || processedWorkbook.rawPageOrder.length === 0) {
		return <li style={{ opacity: 0.4 }}>Keine Änderungen in der Seitenreihenfolge.</li>;
	}

	// Count how many pages and folders are in the order
	const pageCount = processedWorkbook.rawPageOrder.filter(id => 
		processedWorkbook.pages[id] && 
		(!simulation.pages[id] || simulation.pages[id].type === 'page')
	).length;
	
	const folderCount = processedWorkbook.rawPageOrder.filter(id => 
		processedWorkbook.folders[id] && 
		(!simulation.pages[id] || simulation.pages[id].type === 'folder')
	).length;

	// Create a list of the first few items to show as examples
	const orderPreview = processedWorkbook.rawPageOrder.slice(0, 5).map(id => {
		const item = processedWorkbook.pages[id] || processedWorkbook.folders[id];
		if (!item) return `Unbekannt (${id})`;
		return `${item.title || 'Ohne Titel'} (${item.type === 'folder' ? 'Ordner' : 'Seite'})`;
	}).join(', ');

	return (
		<li>
			<div>Die Reihenfolge der Seiten und Ordner wurde basierend auf den "Reihenfolge"-Spalten aktualisiert.</div>
			<div style={{ margin: '0.5em 0' }}>
				• Elemente mit einer "Reihenfolge" werden nach den angegebenen Nummern sortiert
			</div>
			<div style={{ margin: '0.5em 0' }}>
				• Die Reihenfolge wird aus Spalte F in "Seiten" und Spalte D in "Ordner" entnommen
			</div>
			<div style={{ margin: '0.5em 0' }}>
				• Insgesamt werden {pageCount + folderCount} Elemente sortiert
				{pageCount > 0 && ` (${pageCount} Seiten`}
				{pageCount > 0 && folderCount > 0 && ' und '}
				{folderCount > 0 && `${folderCount} Ordner`}
				{(pageCount > 0 || folderCount > 0) && ')'}
			</div>
			{processedWorkbook.rawPageOrder.length > 0 && 
				<div style={{ fontSize: '0.9em', marginTop: '0.5em' }}>
					Die ersten Elemente sind: {orderPreview}{processedWorkbook.rawPageOrder.length > 5 ? '...' : ''}
				</div>
			}
		</li>
	);
}