import { useState } from 'react'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import { setDoc, deleteField, arrayUnion } from 'firebase/firestore'

import { FormPart, Label } from 'components'
import { updateSimulation, getQuestionRef } from 'simulations'

import { emptyQuestion, accordionStyle } from '../../settings'

import { Question } from './Question'

export function Questions({ simulation }) {
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
	return <>
		<FormPart>
			<StartingQuestion {...{ simulation }} />
		</FormPart>
		<FormPart>
			<Label>Fragen</Label>
			{simulation.questionList.map((question, index) => <Question key={question.id} {...{ simulation, question, index, expanded: !!expanded[question.id], flipExpand: () => flipExpand(question.id) }} />)}
			<Accordion sx={accordionStyle} onClick={addQuestion} expanded={false}>
				<AccordionSummary>
					<div style={{ fontSize: '2em', lineHeight: '0.7em', textAlign: 'center', transform: 'translateY(-3px)', width: '100%' }}>+</div>
				</AccordionSummary>
			</Accordion>
		</FormPart>
	</>
}

function StartingQuestion({ simulation }) {
	// Set up a handler to set the starting question.
	const setStartingQuestion = async (questionId) => {
		return await updateSimulation(simulation.id, { startingQuestion: questionId === 'none' ? deleteField() : questionId })
	}

	// Render the dropdown list.
	const startingQuestion = simulation.startingQuestion || simulation.questionList[0]?.id || 'none'
	return <FormPart>
		<FormControl fullWidth>
			<InputLabel>Startfrage</InputLabel>
			<Select value={startingQuestion} label="Startfrage" onChange={(event) => setStartingQuestion(event.target.value)}>
				{simulation.questionList.length > 0 ?
					simulation.questionList.map((question, index) => <MenuItem key={question.id} value={question.id}>{`${index + 1}.  ${question.title || emptyQuestion}`}</MenuItem>) :
					<MenuItem key="none" value="none">Es sind noch keine Fragen vorhanden.</MenuItem>}
			</Select>
		</FormControl>
	</FormPart>
}
