import TextField from '@mui/material/TextField'
import { deleteField } from 'firebase/firestore'

import { useTrackedState } from '../../util'
import { updateDocument } from '../../firebase'

import { FormPart } from './containers'

export function TrackedTextField({ path, documentId, field, label, value: givenValue, arrayValue = [], arrayIndex, arrayField, multiline, process, processSaveValue, ...otherProps }) {
	// Track the given state to also update on external changes.
	const [value, setValue] = useTrackedState(givenValue.toString())

	// Save any changes locally and then in the database.
	const handleChange = (event) => {
		const newValue = process ? process(event.target.value) : event.target.value
		setValue(newValue)
		let saveValue = processSaveValue ? processSaveValue(newValue) : newValue
		if (saveValue === undefined)
			saveValue = deleteField()
		if (arrayIndex !== undefined) { // Do we change a part of an array?
			if (arrayField) { // The array contains objects and we need to change an element in the array.
				updateDocument(path, documentId, { [field]: [...arrayValue.slice(0, arrayIndex), { ...arrayValue[arrayIndex], [arrayField]: saveValue }, ...arrayValue.slice(arrayIndex + 1)] })
			} else { // The array contains only the text fields.
				updateDocument(path, documentId, { [field]: [...arrayValue.slice(0, arrayIndex), saveValue, ...arrayValue.slice(arrayIndex + 1)] })
			}
		} else { // We change a regular field.
			updateDocument(path, documentId, { [field]: saveValue })
		}
	}

	// Render the form.
	return <FormPart>
		<TextField variant="outlined" fullWidth multiline={multiline} label={label} value={value || ''} onChange={handleChange} {...otherProps} />
	</FormPart>
}
