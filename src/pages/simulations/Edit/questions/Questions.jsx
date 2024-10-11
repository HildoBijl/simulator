import { useState, useMemo } from 'react'
import { setDoc, deleteField, arrayUnion } from 'firebase/firestore'
import { useTheme } from '@mui/material/styles'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import { Help as HelpIcon, Info as InfoIcon, Folder as FolderIcon, UnfoldLess as CloseIcon, UnfoldMore as OpenIcon } from '@mui/icons-material'
import { DragDropContext, Droppable } from '@hello-pangea/dnd'

import { nestedListToIndices, insertIntoArray } from 'util'
import { FormPart, Label } from 'components'
import { updateSimulation, getQuestionRef, moveQuestion, questionIndexToString } from 'simulations'

import { emptyQuestion, accordionStyle } from '../../settings'

import { QuestionOrFolder } from './Question'

export function Questions({ simulation }) {
	const theme = useTheme()

	// Set up manual expansion controls.
	const [expandedMap, setExpandedMap] = useState({})
	const flipExpand = (id) => setExpandedMap(expanded => ({ ...expanded, [id]: !expanded[id] }))

	// Set up a list of all draggable items to render them one by one.
	const { questions, questionOrder } = simulation
	const { structure: draggableStructure, list: draggableList } = useMemo(() => {
		const structure = expandFolders(questionOrder, questions, expandedMap)
		const list = structure.flat(Infinity)
		return { list, structure }
	}, [questions, questionOrder, expandedMap])

	// On a drag start, already save the move inside a state.
	const [move, setMove] = useState() // An array of indices, like [4, 2] when element 4 moves to spot 2.
	const onDragStart = (dragData) => {
		setMove([dragData.source.index, dragData.source.index])
	}

	// On a drag update, save the move inside a state.
	const onDragUpdate = (dragData) => {
		if (!isDragDataValid(dragData, draggableList))
			return
		setMove([dragData.source.index, dragData.destination.index])
	}

	// On a drag end, save it to the database.
	const onDragEnd = async (dragData) => {
		// Reset any dragging parameters.
		setMove()

		// On an invalid drag, or on a useless drag, do nothing.
		if (!isDragDataValid(dragData, draggableList))
			return
		const from = dragData.source.index
		const to = dragData.destination.index
		if (from === to)
			return

		// Get all the data about the move and store it in the database.
		const { questionToMove, originFolder, destinationFolder, index } = getMoveData(simulation, draggableList, from, to)
		await moveQuestion(simulation, questionToMove, originFolder, destinationFolder, index)
	}

	// Determine move data depending on the move command stored.
	const moveData = useMemo(() => move && getMoveData(simulation, draggableList, move[0], move[1]), [simulation, draggableList, move])

	// For each question, determine the indices. Also take into account a potential move.
	const indices = useMemo(() => {
		// First apply the move to the existing structure.
		const structure = moveData ? expandFolders(simulation.questionOrder, simulation.questions, undefined, moveData) : draggableStructure

		// Then turn the structure into a list of indices.
		const indicesList = nestedListToIndices(structure)
		const list = structure.flat(Infinity)

		// Finally couple the indices to the question IDs for easy reference.
		const indices = {}
		list.forEach((question, index) => {
			if (question.type === 'folder' && question.closer)
				return
			indices[question.id] = indicesList[index]
		})
		return indices
	}, [simulation, moveData, draggableStructure])

	// Render the questions through an Accordion.
	return <>
		<FormPart>
			<StartingQuestion {...{ simulation }} />
		</FormPart>
		<FormPart>
			<Label>Seiten</Label>
			<ExpandButtons {...{ simulation, expandedMap, setExpandedMap }} />
			<DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd} onDragUpdate={onDragUpdate}>
				<Droppable droppableId="questions">{(provided, snapshot) => (
					<div
						ref={provided.innerRef}
						{...provided.droppableProps}
						style={{ ...(snapshot.isDraggingOver ? { background: theme.palette.mode === 'light' ? '#eee' : '#222' } : {}) }}>
						{draggableList.map((question, index) => <QuestionOrFolder
							key={`${question.id}${question.closer ? '-closer' : ''}`}
							{...{
								simulation,
								question,
								dragIndex: index,
								listIndex: indices[question.id],
								expanded: !!expandedMap[question.id],
								isDragging: moveData?.questionToMove?.id === question.id, isDestinationFolder: moveData?.destinationFolder?.id === question.id,
								flipExpand: () => flipExpand(question.id)
							}} />)}
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
			<InputLabel>Startseite</InputLabel>
			<Select value={startingQuestion} label="Startseite" onChange={(event) => setStartingQuestion(event.target.value)}>
				{simulation.questionList.length > 0 ?
					simulation.questionList.map(question => <MenuItem key={question.id} value={question.id}>{`${questionIndexToString(question.index)}  ${question.internalTitle || question.title || emptyQuestion}`}</MenuItem>) :
					<MenuItem key="none" value="none">Es sind noch keine Seiten vorhanden.</MenuItem>}
			</Select>
		</FormControl>
	</FormPart>
}

function ExpandButtons({ simulation, expandedMap, setExpandedMap }) {
	// Define handlers to open and close all folders. (openAll opens all folders, leaving questions unchanged. closeAll closes everything, both folders and questions.)
	const openAll = () => {
		setExpandedMap(expandedMap => {
			expandedMap = { ...expandedMap }
			Object.values(simulation.questions).forEach(question => {
				if (question.type === 'folder')
					expandedMap[question.id] = true
			})
			return expandedMap
		})
	}
	const closeAll = () => setExpandedMap({})

	// Check if the buttons are available.
	const isEmptyFolder = question => question.type === 'folder' && (!question.contents || question.contents.length === 0)
	const allClosed = Object.keys(expandedMap).every(questionId => !expandedMap[questionId] || !simulation.questions[questionId] || isEmptyFolder(simulation.questions[questionId])) // There are no open questions/folders: all open items are either non-existing, or empty folders.
	const allFoldersOpen = Object.values(simulation.questions).every(question => question.type !== 'folder' || isEmptyFolder(question) || expandedMap[question.id]) // All folders are either empty or expanded.

	// Render the buttons, using an outer container with no height and an inner container for the buttons.
	const buttonStyle = {
		cursor: 'pointer',
		padding: '3px',
	}
	const buttonStyleInactive = {
		...buttonStyle,
		opacity: 0.5,
		cursor: 'default',
	}
	return <div style={{ width: '100%', height: 0, position: 'relative' }}>
		<div style={{ position: 'absolute', right: 0, bottom: 0, display: 'flex', flexFlow: 'row nowrap' }}>
			<OpenIcon onClick={openAll} sx={allFoldersOpen ? buttonStyleInactive : buttonStyle} />
			<CloseIcon onClick={closeAll} sx={allClosed ? buttonStyleInactive : buttonStyle} />
		</div>
	</div>
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

// expandFolders takes a list of questions (or question IDs) with potential folders in them. It then not only turns the ID into the question/folder, but also (assuming the folder is opened) includes all questions (and recursively all folders) inside the folder. At the end it adds a folder-closer, which is needed for the dragging system.
function expandFolders(questionList, questions, expandedMap, moveData, topLevel = true) {
	const { questionToMove, originFolder, destinationFolder, index } = moveData || {}
	let list = [...(questionList || [])]

	// If we are on the top level of the question list, and there is a move command, apply it. First remove the question to move and then insert it where needed.
	if (topLevel && moveData && questionToMove && !originFolder) {
		const index = list.indexOf(questionToMove.id)
		list = [...list.slice(0, index), ...list.slice(index + 1)]
	}
	if (topLevel && moveData && questionToMove && !destinationFolder) {
		list = insertIntoArray(list, index, questionToMove.id)
	}

	// Walk through the question list to set up its contents.
	return list.map(question => {
		// Ensure we have a question object.
		if (typeof question === 'string')
			question = questions[question]

		// For folders, add an opener and a closer and, if needed, contents.
		if (question.type === 'folder') {
			// Set up the default value for a closed folder.
			const value = [{ ...question }, { ...question, closer: true }]

			// If all folders are examined, or if specifically the folder is opened, also add contents.
			if (!expandedMap || expandedMap[question.id]) {
				// If there is a move, implement it into the contents.
				let contents = question.contents || []
				if (questionToMove && originFolder && originFolder.id === question.id) {
					const index = contents.indexOf(questionToMove.id)
					contents = [...contents.slice(0, index), ...contents.slice(index + 1)]
				}
				if (questionToMove && destinationFolder && destinationFolder.id === question.id) {
					contents = insertIntoArray(contents, index, questionToMove.id)
				}

				// Add the contents.
				value.splice(1, 0, ...expandFolders(contents || [], questions, expandedMap, moveData, false))
			}

			// Return the result.
			return value
		}

		// For questions directly return the question.
		if (question.type === 'question' || question.type === undefined)
			return question
	})
}

// getMoveData takes a (flattened) list of questions and a move command: which should move to where. It then determines which question will be moved, from which folder, to which folder, and what the new index there will be.
function getMoveData(simulation, draggableList, from, to) {
	// Find the question to be move.
	const questionToMove = draggableList[from]

	// If a folder is moved right after its closer, consider it as "at the same place".
	if (questionToMove.type === 'folder' && to - from === 1)
		to = from

	// Determine the origin of the question that will be moved.
	const originFolder = Object.values(simulation.questions).find(question => question.type === 'folder' && question.contents && question.contents.find(folderQuestion => folderQuestion.id === questionToMove.id))

	// Determine the destination, and the index within the destination folder.
	let destinationFolder, index
	if (to === 0) {
		index = 0
	} else {
		const shouldComeAfter = draggableList[to <= from ? to - 1 : to]
		const shouldComeBefore = draggableList[to <= from ? to : to + 1]
		if (shouldComeAfter && shouldComeAfter.type === 'folder' && !shouldComeAfter.closer) { // Should it be put into a (closed) folder?
			destinationFolder = shouldComeAfter
			index = shouldComeBefore.id === shouldComeAfter.id ? (shouldComeAfter.contents?.length || 0) : 0 // For a closed folder, put at the end. For an open folder, put at the start.
		} else {
			destinationFolder = Object.values(simulation.questions).find(question => question.type === 'folder' && question.contents && question.contents.find(folderQuestion => folderQuestion.id === shouldComeAfter.id))
			const destinationArray = destinationFolder ? destinationFolder.contents : simulation.questionTree
			index = destinationArray.findIndex(question => question.id === shouldComeAfter.id) + 1
			const oldIndex = destinationArray.findIndex(question => question.id === questionToMove.id)
			if (oldIndex !== -1 && oldIndex < index)
				index-- // If the item was already in this list prior to the index, the desired index should be one lower.
		}
	}

	return { questionToMove, originFolder, destinationFolder, index }
}
