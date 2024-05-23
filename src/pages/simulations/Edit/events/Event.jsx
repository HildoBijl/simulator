import { useTheme } from '@mui/material/styles'
import Accordion from '@mui/material/Accordion'
import AccordionActions from '@mui/material/AccordionActions'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Button from '@mui/material/Button'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { deleteField } from 'firebase/firestore'

import { FormPart, TrackedTextField } from '../../../../components'
import { updateEvent, deleteEvent } from '../../../../simulations'

import { emptyEventTitle, accordionStyle } from '../../settings'

export function Event({ simulation, event, expanded, flipExpand, duplicate }) {
	const theme = useTheme()

	// On a deleted event, don't display anything.
	if (!event)
		return null

	// Render the Event.
	return <Accordion sx={accordionStyle} expanded={expanded} onChange={() => flipExpand()}>
		<AccordionSummary key="summary" expandIcon={<ExpandMoreIcon />}>
			{event.title || emptyEventTitle}
		</AccordionSummary>
		<AccordionDetails key="details" sx={{ py: 0, my: -2 }}>
			<FormPart>
				<TrackedTextField label="Titel (nur zur internen Verwendung)" value={event.title} path={`simulations/${simulation.id}/events`} documentId={event.id} field="title" />
			</FormPart>
		</AccordionDetails>
		<AccordionActions key="actions">
			<Button onClick={duplicate}>Duplizieren</Button>
			<Button onClick={() => deleteEvent(simulation, event)}>Löschen</Button>
		</AccordionActions>
	</Accordion >
}
