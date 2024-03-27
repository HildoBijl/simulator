import { useState } from 'react'
import Accordion from '@mui/material/Accordion'
import AccordionActions from '@mui/material/AccordionActions'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import { setDoc } from 'firebase/firestore'

import { useSimulationQuestions, getQuestionRef, updateQuestion, deleteQuestion } from '../../../simulations'

export function Questions({ simulation }) {
	// Load in the questions.
	const questions = useSimulationQuestions(simulation.id)
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
	}

	// Render the questions through an Accordion.
	return (
		<div style={{ margin: '1.5rem 0' }}>
			{questions.map((question, index) => <Accordion key={question.id} expanded={!!expanded[question.id]} onChange={() => flipExpand(question.id)}>
				<AccordionSummary expandIcon={<ExpandMoreIcon />}>
					<span style={{ marginRight: '0.75rem' }}>{index + 1}.</span> {question.title || '[Fragentitel fehlt]'}
				</AccordionSummary>
				<Question {...{ simulation, question }} />
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

function Question({ simulation, question }) {
	return <>
		<AccordionDetails>
			<TextField variant="outlined" fullWidth label="Titel" value={question.title || ''} onChange={(event) => updateQuestion(simulation.id, question.id, { title: event.target.value })} />
		</AccordionDetails>
		<AccordionActions>
			<Button onClick={() => deleteQuestion(simulation.id, question.id)}>Löschen</Button>
		</AccordionActions>
	</>
}
