import { useTheme } from '@mui/material/styles'
import Accordion from '@mui/material/Accordion'
import AccordionActions from '@mui/material/AccordionActions'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Button from '@mui/material/Button'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

import { fixNumber, strToNumber } from 'util'
import { FormPart, TrackedTextField } from 'components'
import { deleteVariable } from 'simulations'

import { emptyVariableName, emptyVariableTitle, accordionStyle } from '../../settings'
import { getVariableError, getVariableErrorMessage } from '../../validation'

export function Variable({ simulation, variable, expanded, flipExpand, duplicate }) {
	const theme = useTheme()

	// On a deleted variable, don't display anything.
	if (!variable)
		return null

	// Check for potential errors.
	const variableError = getVariableError(variable, simulation.variables)

	// Render the Variable.
	return <Accordion sx={accordionStyle} expanded={expanded} onChange={() => flipExpand()}>
		<AccordionSummary key="summary" expandIcon={<ExpandMoreIcon />}>
			{variable.name || emptyVariableName}: {variable.title || emptyVariableTitle}
		</AccordionSummary>
		<AccordionDetails key="details" sx={{ py: 0, my: -2 }}>
			<FormPart>
				<TrackedTextField label={`Titel${variable.title ? '' : ' (nur zur Anzeige hier, z.B. "Geld")'}`} value={variable.title} path={`simulations/${simulation.id}/variables`} documentId={variable.id} field="title" />
			</FormPart>
			<FormPart>
				<TrackedTextField label={`Name${variable.name ? '' : ' (intern zur Programmierung, z.B. "x")'}`} value={variable.name} path={`simulations/${simulation.id}/variables`} documentId={variable.id} field="name" process={name => name.replace(/[^a-zA-Z0-9_-]/, '')} />
				{variableError?.subtype === 'duplicateName' ? <p style={{ color: theme.palette.error.main, fontWeight: 500 }}>{getVariableErrorMessage(variableError)}</p> : null}
			</FormPart>

			<FormPart>
				<TrackedTextField label="Anfangswert" value={variable.initialValue} path={`simulations/${simulation.id}/variables`} documentId={variable.id} field="initialValue" process={fixNumber} processSaveValue={strToNumber} />
			</FormPart>
		</AccordionDetails>
		<AccordionActions key="actions">
			<Button onClick={duplicate}>Duplizieren</Button>
			<Button onClick={() => deleteVariable(simulation, variable)}>Löschen</Button>
		</AccordionActions>
	</Accordion >
}
