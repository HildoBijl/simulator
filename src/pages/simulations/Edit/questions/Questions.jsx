import { useState, useMemo } from 'react'
import { setDoc, deleteField, arrayUnion } from 'firebase/firestore'
import { useTheme } from '@mui/material/styles'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import { Help as HelpIcon, Info as InfoIcon, Folder as FolderIcon } from '@mui/icons-material'
import { DragDropContext, Droppable } from '@hello-pangea/dnd'

import { nestedListToIndices } from 'util'
import { FormPart, Label } from 'components'
import { updateSimulation, getQuestionRef, moveQuestion } from 'simulations'

import { emptyQuestion, accordionStyle } from '../../settings'

import { QuestionOrFolder } from './Question'

export function Questions({ simulation }) {
	const theme = useTheme()

	// Set up manual expansion controls.
	const [expandedMap, setExpandedMap] = useState({})
	const flipExpand = (id) => setExpandedMap(expanded => ({ ...expanded, [id]: !expanded[id] }))

	// Set up a list of all draggable items to render them one by one.
	const { questions, questionOrder } = simulation
	const { draggableList, indices } = useMemo(() => {
		const list = expandFolders(questionOrder, questions, expandedMap)
		const indices = nestedListToIndices(list)
		return { draggableList: list.flat(Infinity), indices }
	}, [questions, questionOrder, expandedMap])

	// On a drag update, save the move inside a state.
	const [move, setMove] = useState() // An array of indices, like [4, 2] when element 4 moves to spot 2.
	const onDragUpdate = (dragData) => {
		console.log('Update: From ' + dragData.source.index + ' to ' + dragData.destination.index)
		if (!isDragDataValid(dragData, draggableList))
			return
		setMove([dragData.source.index, dragData.destination.index])
	}

	// On a drag end, save it to the database.
	const onDragEnd = async (dragData) => {
		// Reset any dragging parameters.
		setMove()

		console.log('End: From ' + dragData.source.index + ' to ' + dragData.destination.index)
		console.log('All stuff', simulation, dragData, draggableList)
		// On an invalid drag, or on a useless drag, do nothing.
		if (!isDragDataValid(dragData, draggableList))
			return
		const from = dragData.source.index
		const to = dragData.destination.index
		if (from === to)
			return

		// If a folder is moved right after its closer, also do nothing.
		const questionToMove = draggableList[from]
		if (questionToMove.type === 'folder' && to - from === 1)
			return

		// Determine the origins of the question that will be moved.
		const originFolder = Object.values(simulation.questions).find(question => question.type === 'folder' && question.contents && question.contents.includes(questionToMove.id))
		console.log('From data', from, questionToMove, originFolder)

		// Determine the destination, and the index within the destination folder.
		let destinationFolder, index
		if (to === 0) {
			index = 0
		} else {
			const shouldComeAfter = draggableList[to < from ? to - 1 : to]
			console.log(shouldComeAfter)
			if (shouldComeAfter && shouldComeAfter.type === 'folder' && !shouldComeAfter.closer) {
				destinationFolder = shouldComeAfter
				index = 0
			} else {
				destinationFolder = Object.values(simulation.questions).find(question => question.type === 'folder' && question.contents && question.contents.includes(shouldComeAfter.id))
				const destinationArray = destinationFolder ? destinationFolder.contents : simulation.questionOrder
				index = destinationArray.indexOf(shouldComeAfter.id) + 1
				const oldIndex = destinationArray.indexOf(questionToMove.id)
				if (oldIndex !== -1 && oldIndex < index)
					index-- // If the item was already in this list prior to the index, the desired index should be one lower.
			}
		}

		console.log('To data', to, destinationFolder, index)
		// All data gathered. Move the question.
		await moveQuestion(simulation, questionToMove, originFolder, destinationFolder, index)
	}

	// ToDo: apply move in the draggableList.
	// const updatedDraggableList = useMemo()

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
						{draggableList.map((question, index) => <QuestionOrFolder key={`${question.id}${question.closer ? '-closer' : ''}`} {...{ simulation, question, dragIndex: index, listIndex: indices[index], expanded: !!expandedMap[question.id], flipExpand: () => flipExpand(question.id) }} />)}
						{provided.placeholder}
						<AddQuestionButton {...{ simulation, setExpandedMap }} />
						<AddFolderButton {...{ simulation, setExpandedMap }} />
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

function AddQuestionButton({ simulation, setExpandedMap }) {
	const theme = useTheme()

	// Set up an addQuestion handler that opens a new question upon entry.
	const addQuestion = async () => {
		const ref = getQuestionRef(simulation.id)
		setExpandedMap(expanded => ({ ...expanded, [ref.id]: true }))
		await setDoc(ref, { type: 'question' })
		await updateSimulation(simulation.id, { questionOrder: arrayUnion(ref.id), startingQuestion: simulation.startingQuestion || ref.id })
	}

	// Render the button as an accordion item.
	return <AddButton onClick={addQuestion}>
		<InfoIcon style={{ transform: 'scale(0.75) translateY(0px)', color: theme.palette.info.main }} />
		<div style={{ fontSize: '1.2em', transform: 'translateY(-2px)' }}>/</div>
		<HelpIcon style={{ transform: 'scale(0.75) translateY(0px)', color: theme.palette.primary.main }} />
	</AddButton>
}

function AddFolderButton({ simulation, setExpandedMap }) {
	const theme = useTheme()

	// Set up an addFolder handler that opens a new folder upon entry.
	const addFolder = async () => {
		const ref = getQuestionRef(simulation.id)
		setExpandedMap(expanded => ({ ...expanded, [ref.id]: true }))
		await setDoc(ref, { type: 'folder' })
		await updateSimulation(simulation.id, { questionOrder: arrayUnion(ref.id) })
	}

	// Render the button as an accordion item.
	return <AddButton onClick={addFolder}>
		<FolderIcon style={{ transform: 'scale(0.75) translateY(0px)', color: theme.palette.secondary.main }} />
	</AddButton>
}

function AddButton({ onClick, children }) {
	return <Accordion sx={accordionStyle} onClick={onClick} expanded={false}>
		<AccordionSummary>
			<div style={{ display: 'flex', flexFlow: 'row nowrap', justifyContent: 'center', alignItems: 'center', lineHeight: '0.7em', textAlign: 'center', width: '100%' }}>
				<div style={{ fontSize: '2em', transform: 'translateY(-3px)' }}>+</div>
				<div style={{ display: 'flex', flexFlow: 'row nowrap', justifyContent: 'center', alignItems: 'center', textAlign: 'center', width: '4em' }}>
					{children}
				</div>
			</div>
		</AccordionSummary>
	</Accordion>
}

function isDragDataValid(dragData, draggableList) {
	const { draggableId, source, destination } = dragData
	if (!destination)
		return false
	if (draggableList && draggableList[source.index].id !== draggableId)
		return false
	return true
}

// expandFolders takes a list of questions (or question IDs) with potential folders in them. It then not only includes the folder, but also (assuming the folder is opened) all questions inside the folder. At the end it adds a folder-closer, which is needed for the dragging system.
function expandFolders(questionList, questions, expandedMap) {
	return questionList.map(question => {
		// Ensure we have a question object.
		if (typeof question === 'string')
			question = questions[question]

		// For folders, add an opener and a closer and, if needed, contents.
		if (question.type === 'folder') {
			const value = [{ ...question }, { ...question, closer: true }]
			if (!expandedMap || expandedMap[question.id])
				value.splice(1, 0, ...expandFolders(question.contents || [], questions, expandedMap))
			return value
		}

		// For questions return the question.
		if (question.type === 'question' || question.type === undefined)
			return question
	})
}
