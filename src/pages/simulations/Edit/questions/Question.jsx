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

import { FormPart, TrackedTextField, MediaUploader } from '../../../../components'
import { updateSimulation, updateQuestion, deleteQuestion } from '../../../../simulations'

import { emptyQuestion, accordionStyle } from './util'
import { Options } from './Options'

export function Question({ simulation, question, index, expanded, flipExpand }) {
	return <Accordion sx={accordionStyle} expanded={expanded} onChange={() => flipExpand()}>
		<AccordionSummary key="summary" expandIcon={<ExpandMoreIcon />}>
			<span style={{ marginRight: '0.75rem' }}>{index + 1}.</span> {question.title || emptyQuestion}
		</AccordionSummary>
		<AccordionDetails key="details" sx={{ py: 0, my: -2 }}>
			<TrackedTextField label="Titel" value={question.title} path={`simulations/${simulation.id}/questions`} documentId={question.id} field="title" />
			<TrackedTextField label="Beschreibung" value={question.description} path={`simulations/${simulation.id}/questions`} documentId={question.id} field="description" multiline={true} />
			<MediaUploader label="Abbildung" value={question.media} path={`simulations/${simulation.id}/questions`} documentId={question.id} fileName="QuestionImage" />
			<FollowUpDropdown {...{ simulation, question, index }} />
			<TrackedTextField label="Standard Rückmeldung" value={question.feedback} path={`simulations/${simulation.id}/questions`} documentId={question.id} field="feedback" multiline={true} />
			<Options {...{ simulation, question, index }} />
			<OrderDropdown {...{ simulation, question, index }} />
		</AccordionDetails>
		<AccordionActions key="actions">
			<Button onClick={() => deleteQuestion(simulation, question)}>Löschen</Button>
		</AccordionActions>
	</Accordion>
}

function FollowUpDropdown({ simulation, question, index: questionIndex }) {
	// Set up a handler to save the follow-up question.
	const setFollowUpQuestion = async (questionId) => {
		return await updateQuestion(simulation.id, question.id, { followUpQuestion: questionId === 'default' ? deleteField() : questionId })
	}

	// Render the dropdown field.
	return <FormPart>
		<FormControl fullWidth>
			<InputLabel>Standard Folgefrage</InputLabel>
			<Select value={question.followUpQuestion || 'default'} label="Standard Folgefrage" onChange={(event) => setFollowUpQuestion(event.target.value)}>
				<MenuItem key="default" value="default">Standard: Nächste Frage in der Reihenfolge (jetzt {questionIndex === simulation.questionList.length - 1 ? 'das Ende der Simulation' : `Frage ${questionIndex + 2}`})</MenuItem>
				{simulation.questionList.map((otherQuestion, index) => <MenuItem key={otherQuestion.id} value={otherQuestion.id}>{index + 1}. {otherQuestion.title || emptyQuestion}</MenuItem>)}
				<MenuItem key="end" value="end">Ende: Nach dieser Frage ist die Simulation beendet</MenuItem>
			</Select>
		</FormControl>
	</FormPart>
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
