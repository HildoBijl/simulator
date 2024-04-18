import { useState, useEffect, useRef } from 'react'
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
import { arrayUnion, arrayRemove, deleteField } from 'firebase/firestore'

import { numberToLetter } from '../../../../util'
import { FormPart, TrackedTextField } from '../../../../components'
import { updateQuestion } from '../../../../simulations'

import { emptyQuestion, emptyOption } from './util'

export function Options({ simulation, question, index: questionIndex }) {
	const theme = useTheme()

	// Set up manual expansion controls.
	const options = question.options || []
	const [defaultsExpanded, setDefaultsExpanded] = useState(false)
	const [expanded, setExpanded] = useState(options.map(() => false))
	const flipExpand = (index) => setExpanded(expanded => [...expanded.slice(0, index), !expanded[index], ...expanded.slice(index + 1)])

	// Set up an addOption handler that opens a new option upon entry.
	const canAddOption = !options.find(option => Object.keys(option).length === 0)
	const addOption = async () => {
		if (!canAddOption)
			return
		setExpanded(expanded => [...expanded, true])
		await updateQuestion(simulation.id, question.id, { options: arrayUnion({}) })
	}
	const removeOption = async (index) => {
		await updateQuestion(simulation.id, question.id, { options: arrayRemove(options[index]) })
		setExpanded(expanded => [...expanded.slice(0, index), ...expanded.slice(index + 1)])
	}

	// Render the options through an Accordion.
	return <>
		<h5 style={{ color: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)', fontSize: '0.9rem', fontWeight: 400, margin: '-0.5rem 0 0 0.4rem' }}>Antwortmöglichkeiten</h5>
		<div>
			<Defaults {...{ simulation, question, questionIndex, expanded: defaultsExpanded, flipExpand: () => setDefaultsExpanded(value => !value) }} />
			{options.map((option, optionIndex) => <Option key={optionIndex} {...{ simulation, question, questionIndex, optionIndex, expanded: !!expanded[optionIndex], flipExpand: () => flipExpand(optionIndex), removeOption: () => removeOption(optionIndex) }} />)}
			{canAddOption ? <Accordion onClick={() => addOption()} expanded={false}>
				<AccordionSummary>
					<div style={{ fontSize: '2em', lineHeight: '0.7em', textAlign: 'center', transform: 'translateY(-3px)', width: '100%' }}>+</div>
				</AccordionSummary>
			</Accordion> : null}
		</div>
	</>
}

function Defaults({ simulation, question, questionIndex, expanded, flipExpand }) {
	return <Accordion expanded={expanded} onChange={() => flipExpand()}>
		<AccordionSummary key="summary" expandIcon={<ExpandMoreIcon />}>
			Standardeinstellungen für Antwortmöglichkeiten
		</AccordionSummary>
		<AccordionDetails key="details" sx={{ py: 0, mt: -2 }}>
			<TrackedTextField label="Standard Rückmeldung" value={question.feedback} path={`simulations/${simulation.id}/questions`} documentId={question.id} field="feedback" multiline={true} />
			<FollowUpDropdown {...{ simulation, question, questionIndex }} />
		</AccordionDetails>
	</Accordion>
}

function Option({ simulation, question, questionIndex, optionIndex, expanded, flipExpand }) {
	// Determine some derived/default properties.
	const option = question.options[optionIndex]
	const description = option.description || ''
	const title = description.split('\n')[0] || emptyOption

	// Add an effect to auto-focus the description field upon expanding.
	const descriptionRef = useRef()
	useEffect(() => {
		const field = descriptionRef.current
		if (expanded && field) {
			field.focus()
			field.setSelectionRange(field.value.length, field.value.length)
		}
	}, [expanded])

	// Render the option form.
	return <Accordion expanded={expanded} onChange={() => flipExpand()}>
		<AccordionSummary key="summary" expandIcon={<ExpandMoreIcon />}>
			<span style={{ marginRight: '0.75rem' }}>{numberToLetter(optionIndex).toUpperCase()}.</span>{title}
		</AccordionSummary>
		<AccordionDetails key="details" sx={{ py: 0, my: -2 }}>
			<TrackedTextField inputRef={descriptionRef} label="Beschreibung" value={option.description} path={`simulations/${simulation.id}/questions`} documentId={question.id} field="options" arrayValue={question.options} arrayIndex={optionIndex} arrayField="description" multiline={true} />
			<TrackedTextField label="Rückmeldung" value={option.feedback} path={`simulations/${simulation.id}/questions`} documentId={question.id} field="options" arrayValue={question.options} arrayIndex={optionIndex} arrayField="feedback" multiline={true} />
			<FollowUpDropdown {...{ simulation, question, questionIndex, optionIndex }} />
		</AccordionDetails>
		<AccordionActions key="actions">
			<Button onClick={() => updateQuestion(simulation.id, question.id, { options: arrayRemove(option) })}>Löschen</Button>
		</AccordionActions>
	</Accordion>
}

function FollowUpDropdown({ simulation, question, questionIndex, optionIndex }) {
	const forQuestion = (optionIndex === undefined)
	const options = question.options || []
	const option = options[optionIndex]

	// Set up a handler to save the follow-up question.
	const setFollowUpQuestion = async (questionId) => {
		if (forQuestion)
			return await updateQuestion(simulation.id, question.id, { followUpQuestion: questionId === 'default' ? deleteField() : questionId })
		const newOption = { ...option, followUpQuestion: questionId }
		if (questionId === 'default')
			delete newOption.followUpQuestion
		return await updateQuestion(simulation.id, question.id, { options: [...options.slice(0, optionIndex), newOption, ...options.slice(optionIndex + 1)] })
	}

	// Render the dropdown field.
	const label = `${forQuestion ? 'Standard ' : ''}Folgefrage`
	const value = (forQuestion ? question.followUpQuestion : option.followUpQuestion) || 'default'
	return <FormPart>
		<FormControl fullWidth>
			<InputLabel>{label}</InputLabel>
			<Select value={value} label={label} onChange={(event) => setFollowUpQuestion(event.target.value)}>
				<MenuItem key="default" value="default">{forQuestion ? <>Standard: Nächste Frage in der Reihenfolge (jetzt {questionIndex === simulation.questionList.length - 1 ? 'das Ende der Simulation' : `Frage ${questionIndex + 2}`})</> : <>Die Standardeinstellung verwenden</>}</MenuItem>
				{simulation.questionList.map((otherQuestion, index) => <MenuItem key={otherQuestion.id} value={otherQuestion.id}>{index + 1}. {otherQuestion.title || emptyQuestion}</MenuItem>)}
				<MenuItem key="end" value="end">Ende: Danach wird die Simulation beendet</MenuItem>
			</Select>
		</FormControl>
	</FormPart>
}
