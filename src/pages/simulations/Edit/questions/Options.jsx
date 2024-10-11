import { useState, useEffect, useRef, useCallback } from 'react'
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
import { DragIndicator as DragIndicatorIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material'
import { arrayUnion, arrayRemove, deleteField } from 'firebase/firestore'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

import { numberToLetter, useClearTags } from 'util'
import { FormPart, Label, TrackedTextField, TrackedCodeField, MCE } from 'components'
import { updateQuestion, moveOption, questionIndexToString } from 'simulations'

import { emptyQuestion, emptyOption } from '../../settings'
import { hasVariables, getScriptError } from '../../util'

export function Options({ simulation, question }) {
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

	// ToDo
	const [move, setMove] = useState()
	const onDragStart = (dragData) => {
		setMove([dragData.source.index, dragData.source.index])
	}
	const onDragUpdate = (dragData) => {
		if (isDragDataValid(dragData))
			setMove([dragData.source.index, dragData.destination.index])
	}
	const onDragEnd = async (dragData) => {
		setMove()
		if (!isDragDataValid(dragData))
			return
		const from = dragData.source.index
		const to = dragData.destination.index
		if (from !== to)
			await moveOption(simulation, question, from, to)
	}

	// Render the options through an Accordion. When there are no options, pull out the standard settings.
	return <>
		{options.length === 0 ? <>
			<FollowUpDropdown {...{ simulation, question }} />
			{hasVariables(simulation) ? <QuestionUpdateScript {...{ simulation, question }} /> : null}
		</> : null}
		<Label>Antwortmöglichtkeiten</Label>
		<DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd} onDragUpdate={onDragUpdate}>
			<Droppable droppableId="options">{(provided, snapshot) => (
				<div
					ref={provided.innerRef}
					{...provided.droppableProps}
					style={{ ...(snapshot.isDraggingOver ? { background: theme.palette.mode === 'light' ? '#eee' : '#222' } : {}) }}>
					{options.length === 0 ? null : <Defaults {...{ simulation, question, expanded: defaultsExpanded, flipExpand: () => setDefaultsExpanded(value => !value) }} />}
					{options.map((option, optionIndex) => <Option key={optionIndex} {...{ simulation, question, option, optionIndex, updatedIndex: applyMoveToIndex(move, optionIndex), expanded: !!expanded[optionIndex], flipExpand: () => flipExpand(optionIndex), removeOption: () => removeOption(optionIndex) }} />)}
					{provided.placeholder}
					{canAddOption ? <Accordion onClick={() => addOption()} expanded={false}>
						<AccordionSummary>
							<div style={{ fontSize: '2em', lineHeight: '0.7em', textAlign: 'center', transform: 'translateY(-3px)', width: '100%' }}>+</div>
						</AccordionSummary>
					</Accordion> : null}
				</div>
			)}</Droppable>
		</DragDropContext>
	</>
}

function Defaults({ simulation, question, expanded, flipExpand }) {
	return <Accordion expanded={expanded} onChange={() => flipExpand()}>
		<AccordionSummary key="summary" expandIcon={<ExpandMoreIcon />}>
			Standardeinstellungen für alle Antwortmöglichkeiten (sofern nicht weiter eingestellt)
		</AccordionSummary>
		<AccordionDetails key="details" sx={{ py: 0, mt: -2 }}>
			<FollowUpDropdown {...{ simulation, question }} />
			<FormPart>
				<TrackedTextField label="Standard Rückmeldung" value={question.feedback} path={`simulations/${simulation.id}/questions`} documentId={question.id} field="feedback" multiline={true} />
			</FormPart>
			{hasVariables(simulation) ? <QuestionUpdateScript {...{ simulation, question }} /> : null}
		</AccordionDetails>
	</Accordion>
}

function Option({ simulation, question, option, optionIndex, updatedIndex, expanded, flipExpand }) {
	const theme = useTheme()

	// Determine some derived/default properties.
	const description = option.description || emptyOption
	const title = useClearTags(description.split('\n')[0] || emptyOption) // Get first line.

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
	return <Draggable key={optionIndex} index={optionIndex} draggableId={optionIndex.toString()}>
		{(provided, snapshot) =>
			<Accordion
				ref={provided.innerRef}
				{...provided.draggableProps}
				style={{
					...provided.draggableProps.style, // Default drag style from the toolbox.
					...(snapshot.isDragging ? { color: theme.palette.primary.main } : {}), // Further drag style customization.
				}}
				expanded={expanded}
				onChange={() => flipExpand()}
			>
				<AccordionSummary key="summary" expandIcon={<ExpandMoreIcon />}>
					<span {...provided.dragHandleProps}>
						<DragIndicatorIcon sx={{ ml: -1, mr: 1 }} />
					</span>
					<span style={{ marginRight: '0.75rem' }}>{numberToLetter(updatedIndex).toUpperCase()}.</span>{title}
				</AccordionSummary>
				{expanded ? <>
					<AccordionDetails key="details" sx={{ py: 0, my: -2 }}>
						<FormPart>
							<MCE ref={descriptionRef} label="Beschreibung" height="200" value={option.description} path={`simulations/${simulation.id}/questions`} documentId={question.id} field="options" arrayValue={question.options} arrayIndex={optionIndex} arrayField="description" />
						</FormPart>
						<FollowUpDropdown {...{ simulation, question, optionIndex }} />
						<FormPart>
							<TrackedTextField label="Rückmeldung" value={option.feedback} path={`simulations/${simulation.id}/questions`} documentId={question.id} field="options" arrayValue={question.options} arrayIndex={optionIndex} arrayField="feedback" multiline={true} />
						</FormPart>
						{hasVariables(simulation) ? <OptionUpdateScript {...{ simulation, question, optionIndex }} /> : null}
					</AccordionDetails>
					<AccordionActions key="actions">
						<Button onClick={() => updateQuestion(simulation.id, question.id, { options: arrayRemove(option) })}>Antwortmöglichkeit Löschen</Button>
					</AccordionActions>
				</> : null}
			</Accordion>}
	</Draggable>
}

function FollowUpDropdown({ simulation, question, optionIndex }) {
	const forQuestion = (optionIndex === undefined)
	const forPage = forQuestion && (question.options || []).length === 0
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
	const label = `${forQuestion && !forPage ? 'Standard ' : ''}Folgeseite`
	const value = (forQuestion ? question.followUpQuestion : option.followUpQuestion) || 'default'
	return <FormPart>
		<FormControl fullWidth>
			<InputLabel>{label}</InputLabel>
			<Select value={value} label={label} onChange={(event) => setFollowUpQuestion(event.target.value)}>
				<MenuItem key="default" value="default">{forQuestion ? <>Standard: Nächste Seite in der Reihenfolge (jetzt {nextQuestion ? `Seite ${questionIndexToString(nextQuestion.index)}` : 'das Ende der Simulation'})</> : <>Die Standardeinstellung verwenden</>}</MenuItem>
				{simulation.questionList.map(otherQuestion => <MenuItem key={otherQuestion.id} value={otherQuestion.id}>{questionIndexToString(otherQuestion.index)} {otherQuestion.internalTitle || otherQuestion.title || emptyQuestion}</MenuItem>)}
				<MenuItem key="end" value="end">Ende: Danach wird die Simulation beendet</MenuItem>
			</Select>
		</FormControl>
	</FormPart>
}

export function QuestionUpdateScript({ simulation, question }) {
	const getError = useCallback((script) => getScriptError(script, simulation), [simulation])
	const label = `${(question.options || []).length > 0 ? 'Standard ' : ''}Update-Skript`
	return <FormPart>
		<TrackedCodeField label={label} value={question.updateScript} path={`simulations/${simulation.id}/questions`} documentId={question.id} field="updateScript" multiline={true} getError={getError} />
	</FormPart>
}

export function OptionUpdateScript({ simulation, question, optionIndex, label = "Update-Skript" }) {
	const option = question.options[optionIndex]
	const getError = useCallback((script) => getScriptError(script, simulation), [simulation])
	return <FormPart>
		<TrackedCodeField label={label} value={option.updateScript} path={`simulations/${simulation.id}/questions`} documentId={question.id} field="options" arrayValue={question.options} arrayIndex={optionIndex} arrayField="updateScript" multiline={true} getError={getError} />
	</FormPart>
}

function isDragDataValid(dragData) {
	const { draggableId, source, destination } = dragData
	if (!destination)
		return false
	if (source.index !== parseInt(draggableId))
		return false
	return true
}

function applyMoveToIndex(move, index) {
	if (!move)
		return index
	const [from, to] = move
	if (index === from)
		return to
	if (index < from && index >= to)
		return index + 1
	if (index > from && index <= to)
		return index - 1
	return index
}