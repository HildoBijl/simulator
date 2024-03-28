import { useState } from 'react'
import Accordion from '@mui/material/Accordion'
import AccordionActions from '@mui/material/AccordionActions'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import { setDoc, deleteField, arrayUnion } from 'firebase/firestore'

import { FormPart } from '../../../components'
import { updateSimulation, getQuestionRef, updateQuestion, deleteQuestion } from '../../../simulations'

const emptyTitle = '[Fragentitel fehlt]'

export function Questions({ simulation }) {
	// Load in the questions.
	return <QuestionsInternal {...{ simulation }} />
}

function QuestionsInternal({ simulation }) {
	// Set up manual expansion controls.
	const [expanded, setExpanded] = useState({})
	const flipExpand = (id) => setExpanded(expanded => ({ ...expanded, [id]: !expanded[id] }))

	// Set up an addQuestion handler that opens a new question upon entry.
	const addQuestion = async () => {
		const ref = getQuestionRef(simulation.id)
		setExpanded(expanded => ({ ...expanded, [ref.id]: true }))
		await setDoc(ref, {})
		await updateSimulation(simulation.id, { questionOrder: arrayUnion(ref.id), startingQuestion: simulation.startingQuestion || ref.id })
	}

	// Render the questions through an Accordion.
	return (
		<div style={{ margin: '1.5rem 0' }}>
			<StartingQuestion {...{ simulation }} />
			{simulation.questionList.map((question, index) => <Accordion key={question.id} expanded={!!expanded[question.id]} onChange={() => flipExpand(question.id)}>
				<AccordionSummary expandIcon={<ExpandMoreIcon />}>
					<span style={{ marginRight: '0.75rem' }}>{index + 1}.</span> {question.title || emptyTitle}
				</AccordionSummary>
				<Question {...{ simulation, question }} />
			</Accordion>
			)}
			<Accordion key={simulation.questionList.length} onClick={addQuestion}>
				<AccordionSummary>
					<div style={{ fontSize: '2em', lineHeight: '1em', textAlign: 'center', width: '100%' }}>+</div>
				</AccordionSummary>
			</Accordion>
		</div>
	)
}

function StartingQuestion({ simulation }) {
	const startingQuestion = simulation.startingQuestion || simulation.questionList[0]?.id || 'none'
	return <FormPart>
		<FormControl fullWidth>
			<InputLabel>Startfrage</InputLabel>
			<Select value={startingQuestion} label="Startfrage" onChange={(event) => updateSimulation(simulation.id, { startingQuestion: event.target.value })}>
				{simulation.questionList.length > 0 ?
					simulation.questionList.map((question, index) => <MenuItem key={question.id} value={question.id}>{`${index + 1}.  ${question.title || emptyTitle}`}</MenuItem>) :
					<MenuItem key="none" value="none">Es sind noch keine Fragen vorhanden.</MenuItem>}
			</Select>
		</FormControl>
	</FormPart>
}

function Question({ simulation, question }) {
	return <>
		<AccordionDetails sx={{ py: 0, my: -2 }}>
			<FormPart>
				<TextField variant="outlined" fullWidth label="Titel" value={question.title || ''} onChange={(event) => updateQuestion(simulation.id, question.id, { title: event.target.value })} />
			</FormPart>
			<FormPart>
				<TextField variant="outlined" fullWidth multiline label="Beschreibung" value={question.description || ''} onChange={(event) => updateQuestion(simulation.id, question.id, { description: event.target.value })} />
			</FormPart>
			<FollowUpDropdown {...{ simulation, question }} />
			<OrderDropdown {...{ simulation, question }} />
		</AccordionDetails>
		<AccordionActions>
			<Button onClick={() => deleteQuestion(simulation.id, question.id)}>Löschen</Button>
		</AccordionActions>
	</>
}

function FollowUpDropdown({ simulation, question }) {
	// Set up a handler to save the follow-up question.
	const setFollowUpQuestion = async (questionId) => {
		return await updateQuestion(simulation.id, question.id, { followUpQuestion: questionId === 'default' ? deleteField() : questionId })
	}

	// Render the dropdown field.
	const questionIndex = simulation.questionList.indexOf(question)
	return <FormPart>
		<FormControl fullWidth>
			<InputLabel>Standard Folgefrage</InputLabel>
			<Select value={question.followUpQuestion || 'default'} label="Standard Folgefrage" onChange={(event) => setFollowUpQuestion(event.target.value)}>
				<MenuItem key="default" value="default">Standard: Nächste Frage in der Reihenfolge (jetzt {questionIndex === simulation.questionList.length - 1 ? 'das Ende der Simulation' : `Frage ${questionIndex + 2}`})</MenuItem>
				{simulation.questionList.map((otherQuestion, index) => <MenuItem key={otherQuestion.id} value={otherQuestion.id}>{index + 1}. {otherQuestion.title || emptyTitle}</MenuItem>)}
				<MenuItem key="end" value="end">Ende: Nach dieser Frage ist die Simulation beendet</MenuItem>
			</Select>
		</FormControl>
	</FormPart>
}

function OrderDropdown({ simulation, question }) {
	const questionIndex = simulation.questionList.indexOf(question)
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
						text = `Position ${index + 1}, am ende, nach "${otherQuestion.title || emptyTitle}`
					else
						text = `Position ${index + 1}, nach "${otherQuestion.title || emptyTitle}"`
					return <MenuItem key={index} value={index}>{text}</MenuItem>
				})}
			</Select>
		</FormControl>
	</FormPart>
}
