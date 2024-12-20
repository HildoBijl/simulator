import Alert from '@mui/material/Alert'

export function Upload({ simulation }) {
	return <>
		<h2>Hochladen</h2>
		<p>Diese Funktionalität befindet sich noch im Aufbau.</p>
		<Alert severity="warning" sx={{ my: 2 }}>Das Hochladen einer Excel-Datei überschreibt den vorhandenen Inhalt. Es gibt keine Rückgängig-Option. Stellen Sie also sicher, dass Sie die richtige Excel-Datei hochladen.</Alert>
	</>
}
