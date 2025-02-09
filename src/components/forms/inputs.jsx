import { useMemo } from 'react'
import TextField from '@mui/material/TextField'
import Alert from '@mui/material/Alert'
import { deleteField } from 'firebase/firestore'

import { useTrackedState } from 'util'
import { updateDocument } from 'fb'

export function TrackedTextField({ path, documentId, field, label, value: givenValue, setValue: givenSetValue, arrayValue = [], arrayIndex, arrayField, multiline, process, processSaveValue, code, ...otherProps }) {
	// Track the given state to also update on external changes.
	const [value, setValue] = useTrackedState(givenValue?.toString())

	// Save any changes locally and then in the database.
	const handleChange = (event) => {
		const newValue = process ? process(event.target.value) : event.target.value
		setValue(newValue)
		let saveValue = processSaveValue ? processSaveValue(newValue) : newValue
		if (givenSetValue !== undefined) { // When a manual setter is defined, use that.
			givenSetValue(saveValue)
		} else if (arrayIndex !== undefined) { // Do we change a part of an array?
			if (arrayField) { // The array contains objects and we need to change an element in the array.
				updateDocument(path, documentId, { [field]: [...arrayValue.slice(0, arrayIndex), { ...arrayValue[arrayIndex], [arrayField]: saveValue }, ...arrayValue.slice(arrayIndex + 1)] })
			} else { // The array contains only the text fields.
				updateDocument(path, documentId, { [field]: [...arrayValue.slice(0, arrayIndex), saveValue, ...arrayValue.slice(arrayIndex + 1)] })
			}
		} else { // We change a regular field.
			if (saveValue === undefined || saveValue === '')
				saveValue = deleteField()
			updateDocument(path, documentId, { [field]: saveValue })
		}
	}

	// Render the form.
	return <TextField variant="outlined" fullWidth multiline={multiline} label={label} value={value || ''} onChange={handleChange} sx={{ '& textarea, & input': { fontFamily: code ? "Consolas, 'Courier New', monospace" : undefined } }}{...otherProps} />
}

export function TrackedCodeField({ getError, ...options }) {
	// Check the given code for errors.
	const { value } = options
	const error = useMemo(() => getError(value), [value, getError])

	// Render the field, with a potential error message.
	return <>
		<TrackedTextField {...options} code={true} />
		{error ? <Alert severity="error" sx={{ my: 1 }}>Fehler im Skript{error.lineNumber !== undefined && error.column !== undefined ? <> in Zeile {error.lineNumber}, Zeichen {error.column}</> : null}: <em>{error.description || error.message}</em></Alert> : null}
	</>
}
