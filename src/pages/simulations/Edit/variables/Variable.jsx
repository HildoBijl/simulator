import { useState } from 'react'
import { useTheme } from '@mui/material/styles'
import Accordion from '@mui/material/Accordion'
import AccordionActions from '@mui/material/AccordionActions'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

import { useTrackedState } from '../../../../util'
import { FormPart, TrackedTextField } from '../../../../components'
import { deleteVariable, updateVariable } from '../../../../simulations'

import { emptyVariableName, emptyVariableTitle, accordionStyle } from '../util'

export function Variable({ simulation, variable, expanded, flipExpand }) {
	const theme = useTheme()

	// On a deleted variable, don't display anything.
	if (!variable)
		return null

	// Check for duplicates.
	const duplicateName = !!Object.values(simulation.variables).find(otherVariable => otherVariable.id !== variable.id && otherVariable.name === variable.name)

	// Render the Variable.
	return <Accordion sx={accordionStyle} expanded={expanded} onChange={() => flipExpand()}>
		<AccordionSummary key="summary" expandIcon={<ExpandMoreIcon />}>
			{variable.name || emptyVariableName}: {variable.title || emptyVariableTitle}
		</AccordionSummary>
		<AccordionDetails key="details" sx={{ py: 0, my: -2 }}>
			<TrackedTextField label="Titel (zur Anzeige)" value={variable.title} path={`simulations/${simulation.id}/variables`} documentId={variable.id} field="title" />
			<TrackedTextField label="Name (intern, zur Programmierung)" value={variable.name} path={`simulations/${simulation.id}/variables`} documentId={variable.id} field="name" process={name => name.replace(/[^a-zA-Z0-9_-]/, '')} />
			{duplicateName ? <p style={{ color: theme.palette.error.main, fontWeight: 500 }}>Der Name dieses Parameters ist gleich einem anderen Parameter. Dies wird zu Fehlern führen.</p> : null}
		</AccordionDetails>
		<AccordionActions key="actions">
			<Button onClick={() => deleteVariable(simulation, variable)}>Löschen</Button>
		</AccordionActions>
	</Accordion>
}
