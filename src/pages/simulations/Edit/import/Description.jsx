import Alert from '@mui/material/Alert'

export function Description() {
	return <>
		<p>Die übliche Weise, Simulationen zu erstellen, erfolgt über die Webschnittstelle. Für einige Massenbearbeitungen bieten wir die zusätzliche Funktion, die Simulation durch Hochladen einer Excel-Datei zu ändern.</p>
		<p>Laden Sie dazu Ihre aktuelle Simulation als Excel-Datei herunter. (Oder laden Sie für leere Simulationen die Vorlage herunter.) Ändern Sie den Inhalt dieser Datei. Laden Sie sie dann erneut hoch. Wir überprüfen zunächst den Inhalt der Excel-Datei. Wenn alles in Ordnung ist, dann wird nach Ihrer Bestätigung der Inhalt der Excel-Datei die bestehende Simulation überschreiben.</p>
		<Alert severity="warning" sx={{ my: 2 }}>Das Hochladen einer Excel-Datei überschreibt den vorhandenen Inhalt. Es gibt keine Rückgängig-Option. Stellen Sie also sicher, dass Sie die richtige Excel-Datei hochladen.</Alert>
		<Alert severity="info" sx={{ my: 2 }}>Nicht alle Teile der Simulation können über eine Excel-Datei geändert werden. Derzeit können nur die grundlegendsten Teile (wie Seitenbeschreibungen) auf diese Weise geändert werden.</Alert>
	</>
}
