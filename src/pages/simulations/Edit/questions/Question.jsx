import { useState, useRef } from 'react'
import { useTheme, alpha } from '@mui/material/styles'
import Accordion from '@mui/material/Accordion'
import AccordionActions from '@mui/material/AccordionActions'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Button from '@mui/material/Button'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { DragIndicator as DragIndicatorIcon, Help as HelpIcon, Info as InfoIcon, Folder as FolderIcon, FolderOpen as FolderEmptyIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { Draggable } from '@hello-pangea/dnd'

import { FormPart, TrackedTextField, MediaUploader, MCE } from 'components'
import { deleteQuestion, updateQuestion, questionIndexToString } from 'simulations'

import { emptyQuestion, emptyFolder, accordionStyle } from '../../settings'

import { Options } from './Options'

export function QuestionOrFolder(data) {
	const { question } = data
	if (question.type === 'folder')
		return <Folder {...data} />
	if (question.type === 'question' || question.type === undefined)
		return <Question {...data} />
}

export function Question({ simulation, question, dragIndex, listIndex, expanded, isDragging, flipExpand }) {
	const theme = useTheme()

	// Determine the icon for this question.
	const Icon = question.options ? HelpIcon : InfoIcon
	const iconColor = question.options ? theme.palette.primary.main : theme.palette.info.main

	// Determine the jump-in. Ensure this doesn't change upon dragging.
	const jumpInRef = useRef()
	const jumpIn = isDragging ? jumpInRef.current : listIndex.length - 1
	jumpInRef.current = jumpIn

	// Render the question.
	return <Draggable key={question.id} index={dragIndex} draggableId={question.id}>
		{(provided, snapshot) =>
			<Accordion
				ref={provided.innerRef}
				{...provided.draggableProps}
				style={{
					...provided.draggableProps.style, // Default drag style from the toolbox.
					...(snapshot.isDragging ? { color: theme.palette.primary.main } : {}), // Further drag style customization.
				}}
				sx={{ ...accordionStyle, marginLeft: `${jumpIn * 16}px !important` }}
				expanded={expanded}
				onChange={() => flipExpand()}
			>
				<AccordionSummary key="summary" expandIcon={<ExpandMoreIcon />}>
					<span {...provided.dragHandleProps}>
						<DragIndicatorIcon sx={{ ml: -1, mr: 1 }} />
					</span>
					<Icon sx={{ color: iconColor, ml: -0.2, mr: 0.6, transform: 'scale(0.75) translateY(1px)' }} />
					<span style={{ marginRight: '0.75rem' }}>{questionIndexToString(question.index)}</span>
					{question.internalTitle || question.title || emptyQuestion}
				</AccordionSummary>
				{expanded ? <>
					<AccordionDetails key="details" sx={{ py: 0, my: -2 }}>
						<FormPart>
							<TrackedTextField label="Titel" value={question.title} path={`simulations/${simulation.id}/questions`} documentId={question.id} field="title" />
						</FormPart>
						<FormPart>
							<TrackedTextField label="Interner Titel (für Benutzer nicht sichtbar)" value={question.internalTitle} path={`simulations/${simulation.id}/questions`} documentId={question.id} field="internalTitle" />
						</FormPart>
						<FormPart>
							<MCE label="Beschreibung" height="225" value={question.description} path={`simulations/${simulation.id}/questions`} documentId={question.id} field="description" />
						</FormPart>
						<MediaUploader label="Abbildung" value={question.media} path={`simulations/${simulation.id}/questions`} documentId={question.id} fileName="QuestionImage" />
						<Options {...{ simulation, question }} />
					</AccordionDetails>
					<AccordionActions key="actions">
						<Button sx={{ mt: 2 }} onClick={() => deleteQuestion(simulation, question)}>Seite löschen</Button>
					</AccordionActions>
				</> : null}
			</Accordion>}
	</Draggable>
}

function Folder(props) {
	const folder = props.question
	if (folder.closer)
		return <FolderCloser {...props} />
	return <FolderOpener {...props} />
}

function FolderOpener({ simulation, question: folder, dragIndex, listIndex, expanded, isDragging, isDestinationFolder, flipExpand }) {
	const theme = useTheme()

	// Determine the jump-in. Ensure this doesn't change upon dragging.
	const jumpInRef = useRef()
	const jumpIn = isDragging ? jumpInRef.current : listIndex.length - 2
	jumpInRef.current = jumpIn

	// Define the expandIcon depending on whether the folder is empty or not. Also override the default animation.
	const isEmpty = !folder.contents || folder.contents.length === 0
	const expandIcon = isEmpty ?
		<DeleteIcon sx={{ cursor: 'pointer' }} onClick={() => deleteQuestion(simulation, folder)} /> :
		<ExpandMoreIcon sx={{ transition: 'transform 150ms', ...(expanded ? { transform: 'rotate(180deg)', transition: 'transform 150ms' } : {}) }} />

	// Render the folder. Make sure it never expands, as this is organized elsewhere.
	const Icon = isEmpty ? FolderEmptyIcon : FolderIcon
	return <Draggable key={folder.id} index={dragIndex} draggableId={folder.id}>
		{(provided, snapshot) =>
			<Accordion
				ref={provided.innerRef}
				{...provided.draggableProps}
				style={{
					...provided.draggableProps.style, // Default drag style from the toolbox.
					...(snapshot.isDragging ? { color: theme.palette.primary.main } : {}), // Further drag style customization.
				}}
				sx={{ ...accordionStyle, marginLeft: snapshot.isDragging ? 0 : `${jumpIn * 16}px !important` }}
				expanded={false}
				onChange={() => !isEmpty && flipExpand()}
			>
				<AccordionSummary style={{
					...(isEmpty ? { cursor: 'default', '& div': { cursor: 'default' } } : {}),
				}} sx={{
					'&.Mui-focusVisible': { background: 'transparent' }, // Prevent the whole bar from changing color upon changing the title.
					...(isDestinationFolder ? { background: alpha(theme.palette.primary.main, 0.2) } : {}),
				}} key="summary" expandIcon={expandIcon}>
					<span {...provided.dragHandleProps} style={{ visibility: expanded && !isEmpty ? 'hidden' : 'visible' }}>
						<DragIndicatorIcon sx={{ ml: -1, mr: 1 }} />
					</span>
					<Icon sx={{ color: theme.palette.secondary.main, ml: -0.2, mr: 0.6, transform: 'scale(0.75) translateY(1px)' }} />
					<span style={{ marginRight: '0.75rem' }}>{questionIndexToString(folder.index)}</span>
					<FolderTitle {...{ simulation, folder }} />
				</AccordionSummary>
			</Accordion>
		}
	</Draggable >
}

// The FolderCloser is an invisible marker with height 0. If an object is dragged above this separator, it will be dropped inside the folder. If it is dragged below this separator, it will be dropped below the folder.
function FolderCloser({ question: folder, dragIndex }) {
	return <Draggable key={`${folder.id}-closer`} index={dragIndex} draggableId={`${folder.id}-closer`}>
		{(provided) => <div ref={provided.innerRef}	{...provided.draggableProps}	{...provided.dragHandleProps}><div style={{ height: 0, background: 'red' }} />
		</div>}
	</Draggable>
}

function FolderTitle({ simulation, folder }) {
	const [isEditing, setIsEditing] = useState(false)

	// When not editing, set up text that can be clicked on to start editing.
	const startEditingTitle = (event) => {
		event.stopPropagation() // Don't expand the folder accordeon.
		setIsEditing(true)
	}
	if (!isEditing)
		return <span style={{ cursor: 'text' }} onClick={startEditingTitle}>{folder.title || emptyFolder}</span>

	// When editing, store any edits directly.
	const updateTitle = async (event) => {
		await updateQuestion(simulation.id, folder.id, { title: event.target.value })
	}
	return <input type="text" style={{ marginRight: '1em', width: '100%' }} value={folder.title || ''} onClick={(event) => event.stopPropagation()} onChange={updateTitle} autoFocus={true} onBlur={() => setIsEditing(false)} onKeyDown={event => (event.key === 'Enter' || event.key === 'Escape') && setIsEditing(false)} />
}
