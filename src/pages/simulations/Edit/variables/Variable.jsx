import { useCallback } from 'react'
import Alert from '@mui/material/Alert'
import Accordion from '@mui/material/Accordion'
import AccordionActions from '@mui/material/AccordionActions'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Button from '@mui/material/Button'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

import { FormPart, TrackedTextField, TrackedCodeField } from 'components'
import { deleteVariable } from 'simulations'

import { emptyVariableName, emptyVariableTitle, accordionStyle, getExpressionError, getVariableError, getVariableErrorMessage } from '../../util'

export function Variable({ simulation, variable, expanded, flipExpand, duplicate }) {
	// Set up an error checker for the initial value field.
	const getInitialValueError = useCallback((initialValue) => getExpressionError(initialValue, { ...simulation, variables: {} }, { allowUndefined: true }), [simulation])

	// On a deleted variable, don't display anything.
	if (!variable)
		return null

	// Check for potential errors.
	const variableError = getVariableError(variable, simulation)

	// Render the Variable.
	return <Accordion sx={accordionStyle} expanded={expanded} onChange={() => flipExpand()}>
		<AccordionSummary key="summary" expandIcon={<ExpandMoreIcon />}>
			{variable.name || emptyVariableName}: {variable.title || emptyVariableTitle}
		</AccordionSummary>
		<AccordionDetails key="details" sx={{ py: 0, my: -2 }}>
			<FormPart>
				<TrackedTextField label={`Titel${variable.title ? '' : ' (nur zur Anzeige hier, z.B. "Lebenspunkte" oder "Geld auf Bank")'}`} value={variable.title} path={`simulations/${simulation.id}/variables`} documentId={variable.id} field="title" />
			</FormPart>

			<FormPart>
				<TrackedTextField label={`Name${variable.name ? '' : ' (intern zur Programmierung, z.B. "x" oder "geld")'}`} value={variable.name} path={`simulations/${simulation.id}/variables`} documentId={variable.id} field="name" process={name => name.replace(/[^a-zA-Z0-9_-]/, '')} />
				{variableError?.subtype === 'duplicateName' ? <Alert severity="error" sx={{ my: 2 }}>{getVariableErrorMessage(variableError)}</Alert> : null}
			</FormPart>

			<FormPart>
				<TrackedCodeField label={`Anfangswert${variable.initialValue ? '' : ' (einen Wert oder Ausdruck, z.B. "15", "randInt(10, 20)" oder "{ x: 2, y: 5 }")'}`} value={variable.initialValue} path={`simulations/${simulation.id}/variables`} documentId={variable.id} field="initialValue" getError={getInitialValueError} />
			</FormPart>
		</AccordionDetails>
		<AccordionActions key="actions">
			<Button onClick={duplicate}>Duplizieren</Button>
			<Button onClick={() => deleteVariable(simulation, variable)}>Löschen</Button>
		</AccordionActions>
	</Accordion >
}
