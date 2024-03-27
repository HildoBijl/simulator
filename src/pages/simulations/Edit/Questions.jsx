import { useState } from 'react'
import Accordion from '@mui/material/Accordion'
import AccordionActions from '@mui/material/AccordionActions'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Button from '@mui/material/Button'

export function Questions({ simulation }) {
	// Set up manual expansion controls.
	const [expanded, setExpanded] = useState((simulation.questions || []).map(() => false))
	const flipExpand = (index) => setExpanded([...expanded.slice(0, index), !expanded[index], ...expanded.slice(index + 1)])

	// Set up controls for the questions themselves.
	const [questions, setQuestions] = useState(simulation.questions || [])
	const setAndSaveQuestions = (questions) => {
		setQuestions(questions)
		// ToDo: send to Firebase
	}
	const setAndSaveQuestion = ((index, question) => {
		setAndSaveQuestions([...questions.slice(0, index), { ...questions[index], ...question }, ...questions.slice(index + 1)])
	})
	const addQuestion = () => {
		setAndSaveQuestions([...questions, {}])
		setExpanded([...expanded, true])
	}

	return (
		<div style={{ margin: '1.5rem 0' }}>
			{questions.map((question, index) => <Accordion key={index} expanded={expanded[index]} onChange={() => flipExpand(index)}>
				<AccordionSummary expandIcon={<ExpandMoreIcon />}>
					<span style={{ marginRight: '0.75rem' }}>{index + 1}.</span> {question.title || '[Fragentitel fehlt]'}
				</AccordionSummary>
				<AccordionDetails>
					Stuff...
				</AccordionDetails>
				<AccordionActions>
					<Button>Cancel</Button>
					<Button>Agree</Button>
				</AccordionActions>
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
