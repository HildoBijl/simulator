import { useTheme } from '@mui/material/styles'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Accordion from '@mui/material/Accordion'
import AccordionActions from '@mui/material/AccordionActions'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Button from '@mui/material/Button'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { deleteField } from 'firebase/firestore'

import { fixNumber, strToNumber } from '../../../../util'
import { FormPart, TrackedTextField } from '../../../../components'
import { updateVariable, deleteVariable } from '../../../../simulations'

import { emptyVariableName, emptyVariableTitle, accordionStyle } from '../../settings'

export function Variable({ simulation, variable, expanded, flipExpand, duplicate }) {
	const theme = useTheme()

	// On a deleted variable, don't display anything.
	if (!variable)
		return null

	// Check for duplicates.
	const hasDuplicateName = !!Object.values(simulation.variables).find(otherVariable => otherVariable.id !== variable.id && otherVariable.name === variable.name)

	// Check the values.
	const { initialValue, min, max } = variable
	const valueIssues = [ // Shows problems.
		min !== undefined && max !== undefined && min > max,
		initialValue !== undefined && min !== undefined && initialValue < min,
		initialValue !== undefined && max !== undefined && initialValue > max,
	]

	// Render the Variable.
	return <Accordion sx={accordionStyle} expanded={expanded} onChange={() => flipExpand()}>
		<AccordionSummary key="summary" expandIcon={<ExpandMoreIcon />}>
			{variable.name || emptyVariableName}: {variable.title || emptyVariableTitle}
		</AccordionSummary>
		<AccordionDetails key="details" sx={{ py: 0, my: -2 }}>
			<FormPart>
				<TrackedTextField label="Titel (zur Anzeige)" value={variable.title} path={`simulations/${simulation.id}/variables`} documentId={variable.id} field="title" />
			</FormPart>
			<FormPart>
				<TrackedTextField label="Name (intern, zur Programmierung)" value={variable.name} path={`simulations/${simulation.id}/variables`} documentId={variable.id} field="name" process={name => name.replace(/[^a-zA-Z0-9_-]/, '')} />
				{hasDuplicateName ? <p style={{ color: theme.palette.error.main, fontWeight: 500 }}>Der Name dieses Parameters ist gleich einem anderen Parameter. Dies wird zu Fehlern führen.</p> : null}
			</FormPart>

			<FormPart>
				<FormGroup sx={{ px: '0.5rem' }}>
					<FormControlLabel control={<Switch checked={!variable.hidden || false} onChange={event => updateVariable(simulation.id, variable.id, { hidden: !event.target.checked || deleteField() })} label="Visible" />} label="Ständig sichtbar" />
				</FormGroup>
			</FormPart>

			<FormPart>
				<TrackedTextField label="Anfangswert" value={variable.initialValue} path={`simulations/${simulation.id}/variables`} documentId={variable.id} field="initialValue" process={fixNumber} processSaveValue={strToNumber} />
			</FormPart>
			<FormPart>
				<div style={{ display: 'flex', flexFlow: 'row nowrap', gap: '1rem' }}>
					<div style={{ width: '50%' }}>
						<TrackedTextField label="Minimum" value={variable.min} path={`simulations/${simulation.id}/variables`} documentId={variable.id} field="min" process={fixNumber} processSaveValue={strToNumber} />
					</div>
					<div style={{ width: '50%' }}>
						<TrackedTextField label="Maximum" value={variable.max} path={`simulations/${simulation.id}/variables`} documentId={variable.id} field="max" process={fixNumber} processSaveValue={strToNumber} />
					</div>
				</div>
				{valueIssues.some(value => value === true) ? <p style={{ color: theme.palette.error.main, fontWeight: 500 }}>{[
					'Das Minimum darf nicht größer sein als das Maximum.',
					'Der Anfangswert darf nicht kleiner als das Minimum sein.',
					'Der Anfangswert darf nicht größer als das Maximum sein.',
				][valueIssues.findIndex(value => value === true)]}</p> : null}
			</FormPart>
		</AccordionDetails>
		<AccordionActions key="actions">
			<Button onClick={duplicate}>Duplizieren</Button>
			<Button onClick={() => deleteVariable(simulation, variable)}>Löschen</Button>
		</AccordionActions>
	</Accordion >
}
