import { useTheme } from '@mui/material/styles'
import Accordion from '@mui/material/Accordion'
import AccordionActions from '@mui/material/AccordionActions'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Button from '@mui/material/Button'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { DragIndicator, Help, Info } from '@mui/icons-material'
import { Draggable } from '@hello-pangea/dnd'

import { FormPart, TrackedTextField, MediaUploader, MCE } from 'components'
import { deleteQuestion } from 'simulations'

import { emptyQuestion, accordionStyle } from '../../settings'

import { Options } from './Options'

export function Question({ simulation, question, index, expanded, flipExpand }) {
	const theme = useTheme()

	// Determine the icon for this question.
	const Icon = question.options ? Help : Info
	const iconColor = question.options ? theme.palette.primary.main : theme.palette.info.main

	// Render the question.
	return <Draggable key={question.id} index={index} draggableId={question.id}>
		{(provided, snapshot) =>
			<Accordion
				ref={provided.innerRef}
				{...provided.draggableProps}
				style={{
					...provided.draggableProps.style, // Default drag style from the toolbox.
					...(snapshot.isDragging ? { color: theme.palette.primary.main } : {}), // Further drag style customization.
				}}
				sx={accordionStyle}
				expanded={expanded}
				onChange={() => flipExpand()}
			>
				<AccordionSummary key="summary" expandIcon={<ExpandMoreIcon />}>
					<span {...provided.dragHandleProps}>
						<DragIndicator sx={{ ml: -1, mr: 1, cursor: 'grab' }} />
					</span>
					<Icon sx={{ color: iconColor, ml: -0.2, mr: 0.6, transform: 'scale(0.75) translateY(1px)' }} />
					<span style={{ marginRight: '0.75rem' }}>{index + 1}.</span>
					{question.internalTitle || question.title || emptyQuestion}
				</AccordionSummary>
				{expanded ? <>
					<AccordionDetails key="details" sx={{ py: 0, my: -2 }}>
						<FormPart>
							<TrackedTextField label="Titel" value={question.title} path={`simulations/${simulation.id}/questions`} documentId={question.id} field="title" />
						</FormPart>
						<FormPart>
							<TrackedTextField label="Interner Titel (für Benutzer nicht sichtbar)" value={question.internalTitle} path={`simulations/${simulation.id}/questions`} documentId={question.id} field="internalTitle" />
						</FormPart>
						<FormPart>
							<MCE label="Beschreibung" height="225" value={question.description} path={`simulations/${simulation.id}/questions`} documentId={question.id} field="description" />
						</FormPart>
						<MediaUploader label="Abbildung" value={question.media} path={`simulations/${simulation.id}/questions`} documentId={question.id} fileName="QuestionImage" />
						<Options {...{ simulation, question, index }} />
					</AccordionDetails>
					<AccordionActions key="actions">
						<Button sx={{ mt: 2 }} onClick={() => deleteQuestion(simulation, question)}>Frage löschen</Button>
					</AccordionActions>
				</> : null}
			</Accordion>}
	</Draggable>
}
