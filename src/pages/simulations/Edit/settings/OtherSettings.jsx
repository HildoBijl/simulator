import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import { deleteField } from 'firebase/firestore'

import { FormPart } from 'components'
import { updateSimulation } from 'simulations'

export function OtherSettings({ simulation }) {
	return <>
		<h2>Sonstige Einstellungen</h2>
		<AllowUndo simulation={simulation} />
	</>
}

function AllowUndo({ simulation }) {
	return <FormPart>
		<FormGroup sx={{ px: '0.5rem' }}>
			<FormControlLabel control={<Switch checked={simulation.allowUndo || false} onChange={event => updateSimulation(simulation.id, { allowUndo: event.target.checked || deleteField() })} label="Allow Undo" />} label="Benutzern die Möglichkeit geben, ihre Aktionen rückgängig zu machen." />
		</FormGroup>
	</FormPart>
}
