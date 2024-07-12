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
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import { Draggable } from '@hello-pangea/dnd'

import { FormPart, TrackedTextField, MediaUploader, MCE } from 'components'
import { updateSimulation, deleteQuestion } from 'simulations'

import { emptyQuestion, accordionStyle } from '../../settings'

import { Options } from './Options'

export function Question({ simulation, question, index, expanded, flipExpand }) {
	const theme = useTheme()
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
						<DragIndicatorIcon sx={{ ml: -1, mr: 1, cursor: 'grab' }} />
					</span>
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
						<OrderDropdown {...{ simulation, question, index }} />
					</AccordionDetails>
					<AccordionActions key="actions">
						<Button onClick={() => deleteQuestion(simulation, question)}>Löschen</Button>
					</AccordionActions>
				</> : null}
			</Accordion>}
	</Draggable>
}

function OrderDropdown({ simulation, index: questionIndex }) {
	const moveQuestion = async (to) => {
		const from = questionIndex
		if (from === to)
			return
		const oldOrder = simulation.questionOrder
		const newOrder = from < to ? [...oldOrder.slice(0, from), ...oldOrder.slice(from + 1, to + 1), oldOrder[from], ...oldOrder.slice(to + 1)] : [...oldOrder.slice(0, to), oldOrder[from], ...oldOrder.slice(to, from), ...oldOrder.slice(from + 1)]
		await updateSimulation(simulation.id, { questionOrder: newOrder })
	}
	return <FormPart>
		<FormControl fullWidth>
			<InputLabel>Reihenfolge</InputLabel>
			<Select value={questionIndex} label="Reihenfolge" onChange={(event) => moveQuestion(event.target.value)}>
				{simulation.questionList.map((_, index) => {
					const otherQuestion = simulation.questionList[index <= questionIndex ? index - 1 : index]
					let text
					if (index === 0)
						text = 'Position 1, am Anfang'
					else if (index === simulation.questionList.length - 1)
						text = `Position ${index + 1}, am ende, nach "${otherQuestion.title || emptyQuestion}"`
					else
						text = `Position ${index + 1}, nach "${otherQuestion.title || emptyQuestion}"`
					return <MenuItem key={index} value={index}>{text}</MenuItem>
				})}
			</Select>
		</FormControl>
	</FormPart>
}
