import { useState, useEffect, useRef } from 'react'
import TextField from '@mui/material/TextField'

import { updateDocument } from '../../firebase'

import { FormPart } from './containers'

export function TrackedTextField({ path, documentId, field, label, value, arrayValue = [], arrayIndex, arrayField, multiline, ...otherProps }) {
	// Set up a tracking system for the cursor position, so that it doesn't jump upon changes.
	const [cursor, setCursor] = useState(null)
	const ref = useRef(null)
	useEffect(() => {
		const field = ref.current
		if (field)
			field.setSelectionRange(cursor, cursor)
	}, [ref, cursor, value])
	const handleChange = (event) => {
		setCursor(event.target.selectionStart)
		const newValue = event.target.value
		if (arrayIndex !== undefined) { // Do we change a part of an array?
			if (arrayField) { // The array contains objects and we need to change an element in the array.
				updateDocument(path, documentId, { [field]: [...arrayValue.slice(0, arrayIndex), { ...arrayValue[arrayIndex], [arrayField]: newValue }, ...arrayValue.slice(arrayIndex + 1)] })
			} else { // The array contains only the text fields.
				updateDocument(path, documentId, { [field]: [...arrayValue.slice(0, arrayIndex), value, ...arrayValue.slice(arrayIndex + 1)] })
			}
		} else { // We change a regular field.
			updateDocument(path, documentId, { [field]: newValue })
		}
	}

	// Render the form.
	return <FormPart>
		<TextField inputRef={ref} variant="outlined" fullWidth multiline={multiline} label={label} value={value || ''} onChange={handleChange} {...otherProps} />
	</FormPart>
}
