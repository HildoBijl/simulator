import { useState, useEffect, useRef, useCallback } from 'react'
import { useTheme } from '@mui/material/styles'
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
import { DragIndicator as DragIndicatorIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material'
import { arrayUnion, arrayRemove } from 'firebase/firestore'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

import { FormPart, Label, TrackedTextField, TrackedCodeField } from 'components'
import { updateSimulation, moveDial } from 'simulations'

import { emptyDialTitle } from '../../settings'
import { getExpressionError } from '../../scripts'

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
	const onDragEnd = async (dragData) => {
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
			<DragDropContext onDragEnd={onDragEnd}>
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
		{dials.length === 0 ?
			<Alert severity="info" sx={{ my: 2 }}>Ein Zahlenindikator ist eine eingebaute Methode zur Anzeige numerischer Variablen auf Ihren Seiten. Er sieht ein bisschen aus wie eine Geschwindigkeitsanzeige. Sie können so viele Indikatoren hinzufügen, wie Sie möchten. Versuchen Sie, eine hinzuzufügen, um zu sehen, wie es funktioniert.</Alert> :
			<DialsPosition {...{ simulation }} />}
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

	// Set up checking for fields.
	const getError = useCallback((value) => value && getExpressionError(value, simulation), [simulation])

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
						<FormPart>
							<TrackedCodeField label={`Zahlenwert${dial.value ? '' : ' (als Wert/Berechnung, z. B. "x" oder "roundTo(x/100,1)"'}`} value={dial.value} path={`simulations`} documentId={simulation.id} field="dials" arrayValue={simulation.dials} arrayIndex={dialIndex} arrayField="value" getError={getError} />
						</FormPart>
						<FormPart>
							<div style={{ display: 'flex', flexFlow: 'row nowrap', gap: '1rem' }}>
								<div style={{ width: '50%' }}>
									<TrackedCodeField label="Minimum" value={dial.min} path={`simulations`} documentId={simulation.id} field="dials" arrayValue={simulation.dials} arrayIndex={dialIndex} arrayField="min" getError={getError} />
								</div>
								<div style={{ width: '50%' }}>
									<TrackedCodeField label="Maximum" value={dial.max} path={`simulations`} documentId={simulation.id} field="dials" arrayValue={simulation.dials} arrayIndex={dialIndex} arrayField="max" getError={getError} />
								</div>
							</div>
						</FormPart>
					</AccordionDetails>
					<AccordionActions key="actions">
						<Button onClick={() => removeDial()}>Zahlenindikator Löschen</Button>
					</AccordionActions>
				</> : null}
			</Accordion>}
	</Draggable>
}

function DialsPosition({ simulation }) {
	// Set up a handler to change the position.
	const setPosition = dialsPosition => updateSimulation(simulation.id, { dialsPosition })

	// If there is no header or footer, remove that option and adjust the value if needed.
	let value = simulation.dialsPosition
	const hasHeader = !!simulation.pageHeader
	if (!hasHeader && value === 'belowHeader')
		value = 'top'
	const hasFooter = !!simulation.pageFooter
	if (!hasFooter && value === 'belowFooter')
		value = 'belowOptions'

	// Render the drop-down menu.
	const defaultValue = 'belowFooter'
	const label = 'Position der Zahlenindikatoren auf der Seite'
	return <FormControl fullWidth>
		<InputLabel>{label}</InputLabel>
		<Select value={value || defaultValue} label={label} onChange={(event) => setPosition(event.target.value)}>
			<MenuItem value="top">Oben auf der Seite</MenuItem>
			{hasHeader ? <MenuItem value="belowHeader">Unterhalb des Seitenkopfes</MenuItem> : null}
			<MenuItem value="belowDescription">Unterhalb der Seitenbeschreibung</MenuItem>
			<MenuItem value="belowOptions">Unterhalb der Antwortmöglichkeiten</MenuItem>
			{hasFooter ? <MenuItem value="belowFooter">Unterhalb des Seitenfußes</MenuItem> : null}
			<MenuItem value="belowButton">Unterhalb der Weiter-Taste</MenuItem>
		</Select>
	</FormControl>
}

function isDragDataValid(dragData) {
	const { draggableId, source, destination } = dragData
	if (!destination)
		return false
	if (source.index !== parseInt(draggableId))
		return false
	return true
}
