import { useState, useEffect, useRef } from 'react'
import TextField from '@mui/material/TextField'

import { updateDocument } from '../../firebase'

import { FormPart } from './containers'

export function TrackedTextField({ path, documentId, field, label, value, multiline }) {
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
		updateDocument(path, documentId, { [field]: event.target.value })
	}

	// Render the form.
	return <FormPart>
		<TextField inputRef={ref} variant="outlined" fullWidth multiline={multiline} label={label} value={value || ''} onChange={handleChange} />
	</FormPart>
}
