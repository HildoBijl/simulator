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
import { setDoc, arrayUnion } from 'firebase/firestore'

import { FormPart, FormSubPart } from '../../../components'
import { updateSimulation, useSimulationQuestions, getQuestionRef, updateQuestion, deleteQuestion } from '../../../simulations'

const emptyTitle = '[Fragentitel fehlt]'

export function Questions({ simulation }) {
	// Load in the questions.
	const questions = useSimulationQuestions(simulation.id, simulation.questionOrder)
	if (!questions)
		return <p>Fragen laden...</p>
	return <QuestionsInternal {...{ simulation, questions }} />
}

function QuestionsInternal({ simulation, questions }) {
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
			<StartingQuestion {...{ simulation, questions }} />
			{questions.map((question, index) => <Accordion key={question.id} expanded={!!expanded[question.id]} onChange={() => flipExpand(question.id)}>
				<AccordionSummary expandIcon={<ExpandMoreIcon />}>
					<span style={{ marginRight: '0.75rem' }}>{index + 1}.</span> {question.title || emptyTitle}
				</AccordionSummary>
				<Question {...{ simulation, questions, question }} />
			</Accordion>
			)}
			<Accordion key={questions.length} onClick={addQuestion}>
				<AccordionSummary>
					<div style={{ fontSize: '2em', lineHeight: '1em', textAlign: 'center', width: '100%' }}>+</div>
				</AccordionSummary>
			</Accordion>
		</div>
	)
}

function StartingQuestion({ simulation, questions }) {
	const startingQuestion = simulation.startingQuestion || questions[0]?.id || 'none'
	return <FormPart>
		<FormControl fullWidth>
			<InputLabel>Startfrage</InputLabel>
			<Select value={startingQuestion} label="Startfrage" onChange={(event) => console.log('Updating to ' + event.target.value) || updateSimulation(simulation.id, { startingQuestion: event.target.value })}>
				{questions.length > 0 ?
					questions.map((question, index) => <MenuItem key={question.id} value={question.id}>{`${index + 1}.  ${question.title || emptyTitle}`}</MenuItem>) :
					<MenuItem key="none" value="none">Es sind noch keine Fragen vorhanden.</MenuItem>}
			</Select>
		</FormControl>
	</FormPart>
}

function Question({ simulation, questions, question }) {
	return <>
		<AccordionDetails sx={{ py: 0, my: -2 }}>
			<FormPart>
				<TextField variant="outlined" fullWidth label="Titel" value={question.title || ''} onChange={(event) => updateQuestion(simulation.id, question.id, { title: event.target.value })} />
			</FormPart>
			<FormPart>
				<TextField variant="outlined" fullWidth multiline label="Beschreibung" value={question.description || ''} onChange={(event) => updateQuestion(simulation.id, question.id, { description: event.target.value })} />
			</FormPart>
			<OrderDropdown {...{ simulation, questions, question }} />
		</AccordionDetails>
		<AccordionActions>
			<Button onClick={() => deleteQuestion(simulation.id, question.id)}>Löschen</Button>
		</AccordionActions>
	</>
}

function OrderDropdown({ simulation, questions, question }) {
	const questionIndex = questions.indexOf(question)
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
				{questions.map((_, index) => {
					const otherQuestion = questions[index <= questionIndex ? index - 1 : index]
					let text
					if (index === 0)
						text = 'Position 1, am Anfang'
					else if (index === questions.length - 1)
						text = `Position ${index + 1}, am ende, nach "${otherQuestion.title || emptyTitle}`
					else
						text = `Position ${index + 1}, nach "${otherQuestion.title || emptyTitle}"`
					return <MenuItem key={index} value={index}>{text}</MenuItem>
				})}
			</Select>
		</FormControl>
	</FormPart>
}
