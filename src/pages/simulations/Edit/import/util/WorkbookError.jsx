import Alert from '@mui/material/Alert'

import { tabNames, headers } from './settings'

// WorkbookError displays a given data.
export function WorkbookError({ error }) {
	return <Alert severity="error" sx={{ my: 2 }}><WorkbookErrorMessage {...{ error }} /></Alert>
}

function WorkbookErrorMessage({ error }) {
	const { data } = error
	switch (data.type) {

		// Sheet checking.
		case 'missingTab':
			return <>Die Registerkarte <strong>{tabNames[data.tab]}</strong> fehlte in der Excel-Datei.</>
		case 'faultyHeaders':
			return <>Bei der Registerkarte <strong>{tabNames[data.tab]}</strong> waren die Kopfzeilen nicht korrekt definiert. Die Spaltentitel sollten (&quot;{Object.values(headers[data.tab]).join('", "')}&quot;) lauten. Halten Sie sich an das Format, das durch den Export/die Vorlage vorgegeben ist.</>

		// IDs and references.
		case 'duplicateId':
			return <>Auf der Registerkarte <strong>{tabNames[data.tab]}</strong> gab es eine doppelte ID <strong>{data.id}</strong>. Es sind keine doppelten IDs erlaubt.</>
		case 'invalidId':
			return <>Auf der Registerkarte <strong>{tabNames[data.originTab]}</strong> gab es einen Verweis{data.originTab === data.destinationTab ? '' : <> auf die Registerkarte <strong>{tabNames[data.destinationTab]},</strong></>} auf eine ID <strong>{data.id}</strong>, aber diese ID existiert nicht.</>
		case 'invalidRowReference':
			return <>Auf der Registerkarte <strong>{tabNames[data.originTab]}</strong> gab es einen Verweis auf die{data.originTab === data.destinationTab ? '' : <> Registerkarte <strong>{tabNames[data.destinationTab]},</strong></>} Zeile <strong>{data.reference}</strong>, aber diese Zeile existiert nicht.</>

		// Folders.
		case 'folderOwnParent':
			return <>Es gab einen Ordner mit dem Titel <strong>{data.folder.title}</strong>, der versucht hat, sich selbst zu enthalten. Dies ist nicht erlaubt.</>
		case 'cyclicFolderParentage':
			return <>Es gab einen Zyklus von Ordnern, die versuchten, sich gegenseitig zu enthalten. Dies ist nicht zulässig. Überprüfen Sie den Ordner mit dem Titel <strong>{data.folder.title}</strong> auf den Beginn des Zyklus.</>

		// Fallback, although this shouldn't happen. It means an error type hasn't been given an appropriate message.
		default:
			return <>Beim Lesen der Datei ist ein unbekannter Fehler aufgetreten. Die Fehlerreferenz ist <strong>{data.type}</strong>.</>
	}
}
