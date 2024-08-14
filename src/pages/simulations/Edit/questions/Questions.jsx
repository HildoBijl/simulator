import { useState } from 'react'
import { setDoc, deleteField, arrayUnion } from 'firebase/firestore'
import { useTheme } from '@mui/material/styles'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import { Help, Info, Folder } from '@mui/icons-material'
import { DragDropContext, Droppable } from '@hello-pangea/dnd'

import { FormPart, Label } from 'components'
import { updateSimulation, getQuestionRef } from 'simulations'

import { emptyQuestion, accordionStyle } from '../../settings'

import { Question } from './Question'

export function Questions({ simulation }) {
	const theme = useTheme()

	// Set up manual expansion controls.
	const [expanded, setExpanded] = useState({})
	const flipExpand = (id) => setExpanded(expanded => ({ ...expanded, [id]: !expanded[id] }))

	// Set up an addQuestion handler that opens a new question upon entry.
	const addQuestion = async () => {
		const ref = getQuestionRef(simulation.id)
		setExpanded(expanded => ({ ...expanded, [ref.id]: true }))
		await setDoc(ref, { type: 'question' })
		await updateSimulation(simulation.id, { questionOrder: arrayUnion(ref.id), startingQuestion: simulation.startingQuestion || ref.id })
	}

	// Set up an addFolder handler that opens a new folder upon entry.
	const addFolder = async () => {
		const ref = getQuestionRef(simulation.id)
		setExpanded(expanded => ({ ...expanded, [ref.id]: true }))
		await setDoc(ref, { type: 'folder' })
		await updateSimulation(simulation.id, { questionOrder: arrayUnion(ref.id) })
	}

	// On a drag update, maintain an adjusted question list.
	const [draggingQuestionList, setDraggingQuestionList] = useState()
	const onDragUpdate = (dragData) => {
		if (!isDragDataValid(dragData, simulation))
			return
		setDraggingQuestionList(getNewQuestionOrder(dragData, simulation))
	}

	// Set up a handler for drags.
	const onDragEnd = async (dragData) => {
		if (!isDragDataValid(dragData, simulation))
			return
		setDraggingQuestionList()
		return await updateSimulation(simulation.id, { questionOrder: getNewQuestionOrder(dragData, simulation) })
	}

	// Render the questions through an Accordion.
	return <>
		<FormPart>
			<StartingQuestion {...{ simulation }} />
		</FormPart>
		<FormPart>
			<Label>Fragen</Label>
			<DragDropContext onDragEnd={onDragEnd} onDragUpdate={onDragUpdate}>
				<Droppable droppableId="questions">{(provided, snapshot) => (
					<div
						ref={provided.innerRef}
						{...provided.droppableProps}
						style={{ ...(snapshot.isDraggingOver ? { background: theme.palette.mode === 'light' ? '#eee' : '#222' } : {}) }}>
						{simulation.questionList.map((question, index) => <Question key={question.id} {...{ simulation, question, index: draggingQuestionList && draggingQuestionList.indexOf(question.id) !== -1 ? draggingQuestionList.indexOf(question.id) : index, expanded: !!expanded[question.id], flipExpand: () => flipExpand(question.id) }} />)}
						{provided.placeholder}
						<Accordion sx={accordionStyle} onClick={addQuestion} expanded={false}>
							<AccordionSummary>
								<div style={{ display: 'flex', flexFlow: 'row nowrap', justifyContent: 'center', alignItems: 'center', lineHeight: '0.7em', textAlign: 'center', width: '100%' }}>
									<div style={{ fontSize: '2em', transform: 'translateY(-3px)' }}>+</div>
									<Info style={{ transform: 'scale(0.75) translateY(0px)', color: theme.palette.info.main }} />
									<div style={{ fontSize: '1.2em', transform: 'translateY(-2px)' }}>/</div>
									<Help style={{ transform: 'scale(0.75) translateY(0px)', color: theme.palette.primary.main }} />
								</div>
							</AccordionSummary>
						</Accordion>
						<Accordion sx={accordionStyle} onClick={addFolder} expanded={false}>
							<AccordionSummary>
								<div style={{ display: 'flex', flexFlow: 'row nowrap', justifyContent: 'center', alignItems: 'center', lineHeight: '0.7em', textAlign: 'center', width: '100%' }}>
									<div style={{ fontSize: '2em', transform: 'translateY(-3px)' }}>+</div>
									<Folder style={{ transform: 'scale(0.75) translateY(0px)', color: theme.palette.secondary.main }} />
								</div>
							</AccordionSummary>
						</Accordion>
					</div>
				)}</Droppable>
			</DragDropContext>
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

function isDragDataValid(dragData, simulation) {
	const { draggableId, source, destination } = dragData
	if (!destination)
		return false
	if (simulation.questionOrder[source.index] !== draggableId)
		return false
	return true
}

function getNewQuestionOrder(dragData, simulation) {
	const { source, destination } = dragData
	const from = source.index, to = destination.index
	if (from === to)
		return simulation.questionOrder

	// Determine and set the new order.
	const oldOrder = simulation.questionOrder
	const newOrder = from < to ? [...oldOrder.slice(0, from), ...oldOrder.slice(from + 1, to + 1), oldOrder[from], ...oldOrder.slice(to + 1)] : [...oldOrder.slice(0, to), oldOrder[from], ...oldOrder.slice(to, from), ...oldOrder.slice(from + 1)]
	return newOrder
}
