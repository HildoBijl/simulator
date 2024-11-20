import { useState, useEffect, useRef, useCallback } from 'react'
import { useTheme } from '@mui/material/styles'
import Tooltip from '@mui/material/Tooltip'
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
import { DragIndicator as DragIndicatorIcon, ExpandMore as ExpandMoreIcon, UnfoldLess as CloseIcon, UnfoldMore as OpenIcon } from '@mui/icons-material'
import { arrayUnion, arrayRemove, deleteField } from 'firebase/firestore'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

import { numberToLetter, useClearTags } from 'util'
import { FormPart, Label, TrackedTextField, TrackedCodeField, MCE } from 'components'
import { updateSimulation, moveDial } from 'simulations'

import { emptyPage, emptyOption, emptyDialTitle } from '../../settings'
import { hasVariables } from '../../util'
import { getScriptError } from '../../scripts'

export function DialsSettings({ simulation }) {
	const theme = useTheme()

	// Set up manual expansion controls.
	const dials = simulation.dials || []
	const [expanded, setExpanded] = useState(dials.map(() => false))
	const flipExpand = (index) => setExpanded(expanded => [...expanded.slice(0, index), !expanded[index], ...expanded.slice(index + 1)])

	// Set up an addDial handler that opens a new dial upon entry.
	const addDial = async () => {
		setExpanded(expanded => [...expanded, true])
		await updateSimulation(simulation.id, { dials: arrayUnion({}) })
	}
	const removeDial = async (index) => {
		await updateSimulation(simulation.id, { dials: arrayRemove(dials[index]) })
		setExpanded(expanded => [...expanded.slice(0, index), ...expanded.slice(index + 1)])
	}

	// Set up handlers for dragging answer options.
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
			await moveDial(simulation, from, to)
	}

	// Render the dials through an Accordian.
	return <>
		<FormPart style={{ marginTop: '1.6rem' }}>
			<Label>Zahlenindikatoren</Label>
			<DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd} onDragUpdate={onDragUpdate}>
				<Droppable droppableId="dials">{(provided, snapshot) => (
					<div
						ref={provided.innerRef}
						{...provided.droppableProps}
						style={{
							margin: '0 0 1rem',
							...(snapshot.isDraggingOver ? { background: theme.palette.mode === 'light' ? '#eee' : '#222' } : {})
						}}
					>
						{dials.map((dial, dialIndex) => <DialSettings key={dialIndex} {...{ simulation, dial, dialIndex, expanded: !!expanded[dialIndex], flipExpand: () => flipExpand(dialIndex), removeDial: () => removeDial(dialIndex) }} />)}
						{provided.placeholder}
						<Accordion onClick={() => addDial()} expanded={false}>
							<AccordionSummary>
								<div style={{ fontSize: '2em', lineHeight: '0.7em', textAlign: 'center', transform: 'translateY(-3px)', width: '100%' }}>+</div>
							</AccordionSummary>
						</Accordion>
					</div>
				)}</Droppable>
			</DragDropContext>
		</FormPart>
		<Alert severity="info" sx={{ my: 2 }}>Ein Zahlenindikator ist eine eingebaute Methode zur Anzeige numerischer Variablen auf Ihren Seiten. Er sieht ein bisschen aus wie eine Geschwindigkeitsanzeige. Sie können so viele Indikatoren hinzufügen, wie Sie möchten. Versuchen Sie, eine hinzuzufügen, um zu sehen, wie es aussieht.</Alert>
	</>
}

function DialSettings({ simulation, dial, dialIndex, expanded, flipExpand, removeDial }) {
	const theme = useTheme()

	// Add an effect to auto-focus the title field upon expanding.
	const titleRef = useRef()
	useEffect(() => {
		const field = titleRef.current
		if (expanded && field && field.selection) {
			field.focus() // Put the cursor in the field.
			field.selection.select(field.getBody(), true) // Select the entire contents.
			field.selection.collapse(false) // Unselect entire contents. The effect is that the cursor will be at the end.
			field.getWin().scrollTo(0, field.getWin().outerHeight) // Scroll the full height, which is more than needed to reach the bottom and ensure the cursor is displayed.
		}
	}, [expanded])

	// Render the dial form.
	return <Draggable key={dialIndex} index={dialIndex} draggableId={dialIndex.toString()}>
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
					{dial.title || emptyDialTitle}
				</AccordionSummary>
				{expanded ? <>
					<AccordionDetails key="details" sx={{ py: 0, my: -2 }}>
						<FormPart>
							<TrackedTextField label={`Titel${dial.title ? '' : ' (zur Anzeige, z.B. "Geld")'}`} value={dial.title} path={`simulations`} documentId={simulation.id} field="dials" arrayValue={simulation.dials} arrayIndex={dialIndex} arrayField="title" />
						</FormPart>
					</AccordionDetails>
					<AccordionActions key="actions">
						<Button onClick={() => removeDial()}>Zahlenindikator Löschen</Button>
					</AccordionActions>
				</> : null}
			</Accordion>}
	</Draggable>
}

function isDragDataValid(dragData) {
	const { draggableId, source, destination } = dragData
	if (!destination)
		return false
	if (source.index !== parseInt(draggableId))
		return false
	return true
}
