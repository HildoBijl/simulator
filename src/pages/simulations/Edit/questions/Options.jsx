import { useState, useEffect, useRef, useCallback } from 'react'
import Alert from '@mui/material/Alert'
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

import { numberToLetter, useClearTags } from 'util'
import { FormPart, Label, TrackedTextField, TrackedCodeField, MCE } from 'components'
import { updateQuestion } from 'simulations'

import { emptyQuestion, emptyOption } from '../../settings'
import { hasVariables, getScriptError } from '../../util'

export function Options({ simulation, question, index: questionIndex }) {
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
		<Label>Antwortmöglichtkeiten</Label>
		<div>
			<Defaults {...{ simulation, question, questionIndex, expanded: defaultsExpanded, flipExpand: () => setDefaultsExpanded(value => !value) }} />
			{options.map((option, optionIndex) => <Option key={optionIndex} {...{ simulation, question, questionIndex, optionIndex, expanded: !!expanded[optionIndex], flipExpand: () => flipExpand(optionIndex), removeOption: () => removeOption(optionIndex) }} />)}
			{canAddOption ? <Accordion onClick={() => addOption()} expanded={false}>
				<AccordionSummary>
					<div style={{ fontSize: '2em', lineHeight: '0.7em', textAlign: 'center', transform: 'translateY(-3px)', width: '100%' }}>+</div>
				</AccordionSummary>
			</Accordion> : null}
		</div>
		{options.length === 0 ? <Alert severity="info" sx={{ mt: 1 }}>Hinweis: Eine Frage ohne Antwortmöglichkeiten ist einfach eine Infoseite. Sie können diese verwenden, um einige Informationen anzuzeigen, nach denen der Nutzer fortfahren kann. Oder Sie können damit auch eine maßgeschneiderte Endseite erstellen.</Alert> : null}
	</>
}

function Defaults({ simulation, question, questionIndex, expanded, flipExpand }) {
	return <Accordion expanded={expanded} onChange={() => flipExpand()}>
		<AccordionSummary key="summary" expandIcon={<ExpandMoreIcon />}>
			Standardeinstellungen für alle Antwortmöglichkeiten (sofern nicht weiter eingestellt)
		</AccordionSummary>
		<AccordionDetails key="details" sx={{ py: 0, mt: -2 }}>
			<FormPart>
				<TrackedTextField label="Standard Rückmeldung" value={question.feedback} path={`simulations/${simulation.id}/questions`} documentId={question.id} field="feedback" multiline={true} />
			</FormPart>
			<FollowUpDropdown {...{ simulation, question, questionIndex }} />
			{hasVariables(simulation) ? <QuestionUpdateScript {...{ simulation, question }} /> : null}
		</AccordionDetails>
	</Accordion>
}

function Option({ simulation, question, questionIndex, optionIndex, expanded, flipExpand }) {
	// Determine some derived/default properties.
	const option = question.options[optionIndex]
	const description = option.description || emptyOption
	let title = useClearTags(description.split('\n')[0] || emptyOption) // Get first line.

	// Add an effect to auto-focus the description field upon expanding.
	const descriptionRef = useRef()
	useEffect(() => {
		const field = descriptionRef.current
		if (expanded && field && field.selection) {
			field.focus() // Put the cursor in the field.
			field.selection.select(field.getBody(), true) // Select the entire contents.
			field.selection.collapse(false) // Unselect entire contents. The effect is that the cursor will be at the end.
			field.getWin().scrollTo(0, field.getWin().outerHeight) // Scroll the full height, which is more than needed to reach the bottom and ensure the cursor is displayed.
		}
	}, [expanded])

	// Render the option form.
	return <Accordion expanded={expanded} onChange={() => flipExpand()}>
		<AccordionSummary key="summary" expandIcon={<ExpandMoreIcon />}>
			<span style={{ marginRight: '0.75rem' }}>{numberToLetter(optionIndex).toUpperCase()}.</span>{title}
		</AccordionSummary>
		{expanded ? <>
			<AccordionDetails key="details" sx={{ py: 0, my: -2 }}>
				<FormPart>
					<MCE ref={descriptionRef} label="Beschreibung" height="150" value={option.description} path={`simulations/${simulation.id}/questions`} documentId={question.id} field="options" arrayValue={question.options} arrayIndex={optionIndex} arrayField="description" />
				</FormPart>
				<FormPart>
					<TrackedTextField label="Rückmeldung" value={option.feedback} path={`simulations/${simulation.id}/questions`} documentId={question.id} field="options" arrayValue={question.options} arrayIndex={optionIndex} arrayField="feedback" multiline={true} />
				</FormPart>
				<FollowUpDropdown {...{ simulation, question, questionIndex, optionIndex }} />
				{hasVariables(simulation) ? <OptionUpdateScript {...{ simulation, question, optionIndex }} /> : null}
			</AccordionDetails>
			<AccordionActions key="actions">
				<Button onClick={() => updateQuestion(simulation.id, question.id, { options: arrayRemove(option) })}>Löschen</Button>
			</AccordionActions>
		</> : null}
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

	// Determine the next question, which would be the standard option for follow-up.
	const currQuestionIndex = simulation.questionList.findIndex(currQuestion => currQuestion.id === question.id)
	const nextQuestion = simulation.questionList[currQuestionIndex + 1]

	// Render the dropdown field.
	const label = `${forQuestion ? 'Standard ' : ''}Folgefrage`
	const value = (forQuestion ? question.followUpQuestion : option.followUpQuestion) || 'default'
	return <FormPart>
		<FormControl fullWidth>
			<InputLabel>{label}</InputLabel>
			<Select value={value} label={label} onChange={(event) => setFollowUpQuestion(event.target.value)}>
				<MenuItem key="default" value="default">{forQuestion ? <>Standard: Nächste Frage in der Reihenfolge (jetzt {nextQuestion ? `Frage ${nextQuestion.index.map(index => index + 1).join('.')}` : 'das Ende der Simulation'})</> : <>Die Standardeinstellung verwenden</>}</MenuItem>
				{simulation.questionList.map(otherQuestion => <MenuItem key={otherQuestion.id} value={otherQuestion.id}>{otherQuestion.index.map(index => index + 1).join('.')}. {otherQuestion.internalTitle || otherQuestion.title || emptyQuestion}</MenuItem>)}
				<MenuItem key="end" value="end">Ende: Danach wird die Simulation beendet</MenuItem>
			</Select>
		</FormControl>
	</FormPart>
}

export function QuestionUpdateScript({ simulation, question }) {
	const getError = useCallback((script) => getScriptError(script, simulation), [simulation])
	return <FormPart>
		<TrackedCodeField label="Standard Update-Skript" value={question.updateScript} path={`simulations/${simulation.id}/questions`} documentId={question.id} field="updateScript" multiline={true} getError={getError} />
	</FormPart>
}

export function OptionUpdateScript({ simulation, question, optionIndex, label = "Update-Skript" }) {
	const option = question.options[optionIndex]
	const getError = useCallback((script) => getScriptError(script, simulation), [simulation])
	return <FormPart>
		<TrackedCodeField label={label} value={option.updateScript} path={`simulations/${simulation.id}/questions`} documentId={question.id} field="options" arrayValue={question.options} arrayIndex={optionIndex} arrayField="updateScript" multiline={true} getError={getError} />
	</FormPart>
}
