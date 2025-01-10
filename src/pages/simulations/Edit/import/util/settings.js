// Define tab names for the Excel file.
export const tabNames = {
	// settings: 'Einstellungen',
	folders: 'Ordner',
	pages: 'Seiten',
}
export const tabs = Object.keys(tabNames)

// Define tab headers.
export const headers = {
	folders: {
		id: 'ID',
		parent: 'In Ordner',
		title: 'Titel',
	},
	pages: {
		id: 'ID',
		parent: 'In Ordner',
		title: 'Titel',
		description: 'Beschreibung',
	},
}

// We set some settings for the output.
export const minColumnWidth = 5
export const maxColumnWidth = 80

// These are settings for reading sheets.
export const rowShift = 2 // The difference between the row index (when reading the sheet) and the row number. Note that row 2 is the top row (due to headers) and will hence get index 0.