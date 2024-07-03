import { useRef, forwardRef } from 'react'
import { deleteField } from 'firebase/firestore'
import { useTheme } from '@mui/material/styles'

// Main TinyMCE packages. See https://www.tiny.cloud/docs/tinymce/latest/react-pm-bundle/ for documentation.
import 'tinymce/tinymce' // Main file.
import 'tinymce/models/dom/model' // DOM model.
import 'tinymce/themes/silver' // Theme used.
import 'tinymce/icons/default' // Toolbar icons.
import 'tinymce/skins/ui/oxide/skin' // Skins used.

// Plugins used.
import 'tinymce/plugins/advlist'
import 'tinymce/plugins/anchor'
import 'tinymce/plugins/autolink'
// import 'tinymce/plugins/autoresize'
// import 'tinymce/plugins/autosave'
import 'tinymce/plugins/charmap'
import 'tinymce/plugins/code'
// import 'tinymce/plugins/codesample'
// import 'tinymce/plugins/directionality'
import 'tinymce/plugins/emoticons'
import 'tinymce/plugins/fullscreen'
import 'tinymce/plugins/help'
import 'tinymce/plugins/help/js/i18n/keynav/en'
import 'tinymce/plugins/image'
// import 'tinymce/plugins/importcss'
import 'tinymce/plugins/insertdatetime'
import 'tinymce/plugins/link'
import 'tinymce/plugins/lists'
import 'tinymce/plugins/media'
// import 'tinymce/plugins/nonbreaking'
// import 'tinymce/plugins/pagebreak'
import 'tinymce/plugins/preview'
// import 'tinymce/plugins/quickbars'
// import 'tinymce/plugins/save'
import 'tinymce/plugins/searchreplace'
import 'tinymce/plugins/table'
import 'tinymce/plugins/visualblocks'
// import 'tinymce/plugins/visualchars'
import 'tinymce/plugins/wordcount'

// Plug-in resources.
import 'tinymce/plugins/emoticons/js/emojis'

// Content styles, including inline UI like fake cursors.
import 'tinymce/skins/content/default/content'
import 'tinymce/skins/ui/oxide/content'

// The React editor to easily show and process TinyMCE.
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
			licenseKey="gpl"
			onInit={(_event, editor) => actualRef.current = editor}
			value={value || ''}
			init={{
				height: height === undefined ? 250 : height,
				menubar: false,
				plugins: ['advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen', 'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount', 'emoticons'],
				toolbar: 'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link unlink | image media table emoticons | code removeformat | help',
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
