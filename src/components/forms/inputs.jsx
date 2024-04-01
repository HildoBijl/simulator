import TextField from '@mui/material/TextField'

import { updateDocument } from '../../firebase'

import { FormPart } from './containers'

export function TrackedTextField({ path, documentId, field, label, value, multiline }) {
	return <FormPart>
		<TextField variant="outlined" fullWidth multiline={multiline} label={label} value={value || ''} onChange={(event) => updateDocument(path, documentId, { [field]: event.target.value })} />
	</FormPart>
}
