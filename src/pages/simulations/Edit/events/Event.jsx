import { useCallback } from 'react'
import { useTheme } from '@mui/material/styles'
import Accordion from '@mui/material/Accordion'
import AccordionActions from '@mui/material/AccordionActions'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { deleteField } from 'firebase/firestore'

import { FormPart, TrackedTextField, TrackedCodeField } from '../../../../components'
import { updateEvent, deleteEvent } from '../../../../simulations'

import { emptyQuestion, emptyEventTitle, accordionStyle } from '../../settings'
import { getConditionError } from '../../util'

export function Event({ simulation, event, expanded, flipExpand, duplicate }) {
	const theme = useTheme()

	// Set up an error detection function for the condition code field.
	const getError = useCallback((condition) => getConditionError(condition, simulation), [simulation])

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
			<FormPart>
				<TrackedCodeField label="Bedingung (z. B. 'leben < 0 || geld >= 20')" value={event.condition} path={`simulations/${simulation.id}/events`} documentId={event.id} field="condition" getError={getError} />
			</FormPart>
			<FormPart>
				<QuestionDropdown simulation={simulation} event={event} />
			</FormPart>
		</AccordionDetails>
		<AccordionActions key="actions">
			<Button onClick={duplicate}>Duplizieren</Button>
			<Button onClick={() => deleteEvent(simulation, event)}>Löschen</Button>
		</AccordionActions>
	</Accordion >
}

function QuestionDropdown({ simulation, event }) {
	// Set up a handler to save the question.
	const setQuestion = (questionId) => updateEvent(simulation.id, event.id, { question: questionId })
	console.log(simulation)

	// Render the dropdown field.
	const label = 'Frage, zu der gesprungen werden soll'
	const value = event.question || simulation.questionOrder[0]
	return <FormPart>
		<FormControl fullWidth>
			<InputLabel>{label}</InputLabel>
			<Select value={value} label={label} onChange={(event) => setQuestion(event.target.value)}>
				{simulation.questionList.map((question, index) => <MenuItem key={question.id} value={question.id}>{index + 1}. {question.title || emptyQuestion}</MenuItem>)}
			</Select>
		</FormControl>
	</FormPart>
}
