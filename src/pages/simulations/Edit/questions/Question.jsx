import { useRef } from 'react'
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
import { deleteQuestion } from 'simulations'

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
					<span style={{ marginRight: '0.75rem' }}>{indicesToString(listIndex)}</span>
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
						<Options {...{ simulation, question, index: dragIndex }} />
					</AccordionDetails>
					<AccordionActions key="actions">
						<Button sx={{ mt: 2 }} onClick={() => deleteQuestion(simulation, question)}>Frage löschen</Button>
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

function FolderOpener({ simulation, question: folder, dragIndex, listIndex, expanded, isDestinationFolder, flipExpand }) {
	const theme = useTheme()

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
				sx={{ ...accordionStyle, marginLeft: snapshot.isDragging ? 0 : `${(listIndex.length - 2) * 16}px !important` }}
				expanded={false}
				onChange={() => !isEmpty && flipExpand()}
			>
				<AccordionSummary sx={{
					...(isEmpty ? { cursor: 'default', '& div': { cursor: 'default' } } : {}),
					...(isDestinationFolder ? { background: alpha(theme.palette.primary.main, 0.1) } : {}),
				}} key="summary" expandIcon={expandIcon}>
					<span {...provided.dragHandleProps} style={{ visibility: expanded && !isEmpty ? 'hidden' : 'visible' }}>
						<DragIndicatorIcon sx={{ ml: -1, mr: 1 }} />
					</span>
					<Icon sx={{ color: theme.palette.secondary.main, ml: -0.2, mr: 0.6, transform: 'scale(0.75) translateY(1px)' }} />
					<span style={{ marginRight: '0.75rem' }}>{indicesToString(listIndex)}</span>
					<span style={{ cursor: 'text' }} onClick={(event) => {
						event.stopPropagation() // Don't expand folder.
						console.log('Changing folder title ... ToDo')
					}}>{folder.title || emptyFolder}</span>
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

function indicesToString(indices) {
	return indices.map((value, i) => {
		if (i > 0 && i === indices.length - 1 && value === 0)
			return '' // Do not show the "0" index for folders.
		return `${i === 0 ? (value + 1) : value}.` // Ensure we start counting at 1 everywhere.
	}).join('')
}
