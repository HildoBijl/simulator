import Accordion from '@mui/material/Accordion'
import AccordionActions from '@mui/material/AccordionActions'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Button from '@mui/material/Button'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

import { TrackedTextField } from '../../../../components'
import { deleteVariable } from '../../../../simulations'

import { emptyVariableName, emptyVariableTitle, accordionStyle } from '../util'

export function Variable({ simulation, variable, expanded, flipExpand }) {
	if (!variable)
		return null
	return <Accordion sx={accordionStyle} expanded={expanded} onChange={() => flipExpand()}>
		<AccordionSummary key="summary" expandIcon={<ExpandMoreIcon />}>
			{variable.name || emptyVariableName}: {variable.title || emptyVariableTitle}
		</AccordionSummary>
		<AccordionDetails key="details" sx={{ py: 0, my: -2 }}>
			<TrackedTextField label="Titel (zur Anzeige)" value={variable.title} path={`simulations/${simulation.id}/variables`} documentId={variable.id} field="title" />
			<TrackedTextField label="Name (intern, zur Programmierung)" value={variable.name} path={`simulations/${simulation.id}/variables`} documentId={variable.id} field="name" />
		</AccordionDetails>
		<AccordionActions key="actions">
			<Button onClick={() => deleteVariable(simulation, variable)}>Löschen</Button>
		</AccordionActions>
	</Accordion>
}
