import Alert from '@mui/material/Alert'

import { tabNames, headers } from './settings'

// WorkbookError displays a given error.
export function WorkbookError({ error }) {
	return <Alert severity="error" sx={{ my: 2 }}><WorkbookErrorMessage {...{ error }} /></Alert>
}

function WorkbookErrorMessage({ error }) {
	switch (error.type) {

		// Sheet checking.
		case 'missingTab':
			return <>Die Registerkarte <strong>{tabNames[error.tab]}</strong> fehlte in der Excel-Datei.</>
		case 'faultyHeaders':
			return <>Bei der Registerkarte <strong>{tabNames[error.tab]}</strong> waren die Kopfzeilen nicht korrekt definiert. Die Spaltentitel sollten (&quot;{Object.values(headers[error.tab]).join('", "')}&quot;) lauten. Halten Sie sich an das Format, das durch den Export/die Vorlage vorgegeben ist.</>

		// IDs and references.
		case 'duplicateId':
			return <>Auf der Registerkarte <strong>{tabNames[error.tab]}</strong> gab es eine doppelte ID <strong>{error.id}</strong>. Es sind keine doppelten IDs erlaubt.</>
		case 'invalidId':
			return <>Auf der Registerkarte <strong>{tabNames[error.originTab]}</strong> gab es einen Verweis{error.originTab === error.destinationTab ? '' : <> auf die Registerkarte <strong>{tabNames[error.destinationTab]},</strong></>} auf eine ID <strong>{error.id}</strong>, aber diese ID existiert nicht.</>
		case 'invalidRowReference':
			return <>Auf der Registerkarte <strong>{tabNames[error.originTab]}</strong> gab es einen Verweis auf die{error.originTab === error.destinationTab ? '' : <> Registerkarte <strong>{tabNames[error.destinationTab]},</strong></>} Zeile <strong>{error.reference}</strong>, aber diese Zeile existiert nicht.</>

		// Folders.
		case 'folderOwnParent':
			return <>Es gab einen Ordner mit dem Titel <strong>{error.folder.title}</strong>, der versucht hat, sich selbst zu enthalten. Dies ist nicht erlaubt.</>
		case 'cyclicFolderParentage':
			return <>Es gab einen Zyklus von Ordnern, die versuchten, sich gegenseitig zu enthalten. Dies ist nicht zulässig. Überprüfen Sie den Ordner mit dem Titel <strong>{error.folder.title}</strong> auf den Beginn des Zyklus.</>

		// Fallback, although this shouldn't happen. It means an error type hasn't been given an appropriate message.
		default:
			return <>Beim Lesen der Datei ist ein unbekannter Fehler aufgetreten. Die Fehlerreferenz ist <strong>{error.type}</strong>.</>
	}
}
