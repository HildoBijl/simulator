import { useRef, forwardRef } from 'react'
import { deleteField } from 'firebase/firestore'
import { useTheme } from '@mui/material/styles'
import { Editor } from '@tinymce/tinymce-react'

import { useTrackedState } from 'util'
import { updateDocument } from 'fb'

import { Label } from './containers'

export const MCE = forwardRef(function MCE({ label, path, documentId, field, value: givenValue, arrayValue = [], arrayIndex, arrayField, process, processSaveValue, height }, ref) {
	const theme = useTheme()
	const editorRef = useRef(null)
	const actualRef = (ref || editorRef) // Ensure that there's a ref, even if one is not given.

	// Track the given state to also update on external changes.
	const [value, setValue] = useTrackedState(givenValue?.toString())

	// Save any changes locally and then in the database.
	const handleChange = (value) => {
		const newValue = process ? process(value) : value
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
	return <>
		{label ? <Label>{label}</Label> : null}
		<Editor
			apiKey='56c0p923nd9uycn3lw34hev6ynpwns1a0yl5kdknwshkrocq'
			onInit={(_event, editor) => actualRef.current = editor}
			value={value || ''}
			init={{
				height: height === undefined ? 250 : height,
				menubar: false,
				plugins: ['advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen', 'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount', 'image', 'media'],
				toolbar: 'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | image media | removeformat | help',
				content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
				...(theme.palette.mode === 'dark' ? { skin: 'oxide-dark', content_css: 'dark' } : {}),
			}}
			onEditorChange={handleChange}
		/>
	</>
})

export function MCEContents({ children }) {
	return <div dangerouslySetInnerHTML={{ __html: children }} />
}
