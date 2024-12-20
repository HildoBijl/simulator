import Alert from '@mui/material/Alert'

import { tabNames } from './settings'

// WorkbookError displays a given error.
export function WorkbookError({ error }) {
	switch (error.type) {
		case 'missingTab':
			return <Alert severity="error" sx={{ my: 2 }}>Die Registerkarte <strong>{tabNames[error.tab]}</strong> fehlte in der Excel-Datei.</Alert>

		case 'faultyHeaders':
			return <Alert severity="error" sx={{ my: 2 }}>Bei der Registerkarte <strong>{tabNames[error.tab]}</strong> waren die Kopfzeilen nicht korrekt definiert. Halten Sie sich an das Format, das durch den Export/die Vorlage vorgegeben ist.</Alert>
	}
}
