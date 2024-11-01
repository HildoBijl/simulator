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
import { updatePage, moveOption, pageIndexToString } from 'simulations'

import { emptyPage, emptyOption } from '../../settings'
import { hasVariables } from '../../util'
import { getScriptError } from '../../scripts'

export function Options({ simulation, page }) {
	const theme = useTheme()

	// Set up manual expansion controls.
	const options = page.options || []
	const [defaultsExpanded, setDefaultsExpanded] = useState(false)
	const [expanded, setExpanded] = useState(options.map(() => false))
	const flipExpand = (index) => setExpanded(expanded => [...expanded.slice(0, index), !expanded[index], ...expanded.slice(index + 1)])

	// Set up an addOption handler that opens a new option upon entry.
	const canAddOption = !options.find(option => Object.keys(option).length === 0)
	const addOption = async () => {
		if (!canAddOption)
			return
		setExpanded(expanded => [...expanded, true])
		await updatePage(simulation.id, page.id, { options: arrayUnion({}) })
	}
	const removeOption = async (index) => {
		await updatePage(simulation.id, page.id, { options: arrayRemove(options[index]) })
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
			await moveOption(simulation, page, from, to)
	}

	// Render the options through an Accordion. When there are no options, pull out the standard settings.
	return <>
		{options.length === 0 ? <>
			<FollowUpDropdown {...{ simulation, page }} />
			{hasVariables(simulation) ? <>
				<PageUpdateScript {...{ simulation, page }} />
			</> : null}
		</> : null}
		<Label>Antwortmöglichtkeiten</Label>
		<DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd} onDragUpdate={onDragUpdate}>
			<Droppable droppableId="options">{(provided, snapshot) => (
				<div
					ref={provided.innerRef}
					{...provided.droppableProps}
					style={{ ...(snapshot.isDraggingOver ? { background: theme.palette.mode === 'light' ? '#eee' : '#222' } : {}) }}>
					{options.length === 0 ? null : <Defaults {...{ simulation, page, expanded: defaultsExpanded, flipExpand: () => setDefaultsExpanded(value => !value) }} />}
					{options.map((option, optionIndex) => <Option key={optionIndex} {...{ simulation, page, option, optionIndex, updatedIndex: applyMoveToIndex(move, optionIndex), expanded: !!expanded[optionIndex], flipExpand: () => flipExpand(optionIndex), removeOption: () => removeOption(optionIndex) }} />)}
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

function Defaults({ simulation, page, expanded, flipExpand }) {
	return <Accordion expanded={expanded} onChange={() => flipExpand()}>
		<AccordionSummary key="summary" expandIcon={<ExpandMoreIcon />}>
			Standardeinstellungen für alle Antwortmöglichkeiten (sofern nicht weiter eingestellt)
		</AccordionSummary>
		<AccordionDetails key="details" sx={{ py: 0, mt: -2 }}>
			<FollowUpDropdown {...{ simulation, page }} />
			<FormPart>
				<TrackedTextField label="Standard Rückmeldung" value={page.feedback} path={`simulations/${simulation.id}/pages`} documentId={page.id} field="feedback" multiline={true} />
			</FormPart>
			{hasVariables(simulation) ? <PageUpdateScript {...{ simulation, page }} /> : null}
		</AccordionDetails>
	</Accordion>
}

function Option({ simulation, page, option, optionIndex, updatedIndex, expanded, flipExpand }) {
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
							<MCE ref={descriptionRef} label="Beschreibung" height="200" value={option.description} path={`simulations/${simulation.id}/pages`} documentId={page.id} field="options" arrayValue={page.options} arrayIndex={optionIndex} arrayField="description" />
						</FormPart>
						<FollowUpDropdown {...{ simulation, page, optionIndex }} />
						<FormPart>
							<TrackedTextField label="Rückmeldung" value={option.feedback} path={`simulations/${simulation.id}/pages`} documentId={page.id} field="options" arrayValue={page.options} arrayIndex={optionIndex} arrayField="feedback" multiline={true} />
						</FormPart>
						{hasVariables(simulation) ? <OptionUpdateScript {...{ simulation, page, optionIndex }} /> : null}
					</AccordionDetails>
					<AccordionActions key="actions">
						<Button onClick={() => updatePage(simulation.id, page.id, { options: arrayRemove(option) })}>Antwortmöglichkeit Löschen</Button>
					</AccordionActions>
				</> : null}
			</Accordion>}
	</Draggable>
}

function FollowUpDropdown({ simulation, page, optionIndex }) {
	const options = page.options || []
	const option = options[optionIndex]
	const forPage = (optionIndex === undefined)

	// Set up a handler to save the follow-up page.
	const setFollowUpPage = async (pageId) => {
		if (forPage)
			return await updatePage(simulation.id, page.id, { followUpPage: pageId === 'default' ? deleteField() : pageId })
		const newOption = { ...option, followUpPage: pageId }
		if (pageId === 'default')
			delete newOption.followUpPage
		return await updatePage(simulation.id, page.id, { options: [...options.slice(0, optionIndex), newOption, ...options.slice(optionIndex + 1)] })
	}

	// Determine the next page, which would be the standard option for follow-up.
	const currPageIndex = simulation.pageList.findIndex(currPage => currPage.id === page.id)
	const nextPage = simulation.pageList[currPageIndex + 1]

	// Render the dropdown field.
	const label = `${forPage && options.length > 0 ? 'Standard ' : ''}Folgeseite`
	const value = (forPage ? page.followUpPage : option.followUpPage) || 'default'
	return <FormPart>
		<FormControl fullWidth>
			<InputLabel>{label}</InputLabel>
			<Select value={value} label={label} onChange={(event) => setFollowUpPage(event.target.value)}>
				<MenuItem key="default" value="default">{forPage ? <>Standard: Nächste Seite in der Reihenfolge (jetzt {nextPage ? `Seite ${pageIndexToString(nextPage.index)}` : 'das Ende der Simulation'})</> : <>Die Standardeinstellung dieser Frage verwenden</>}</MenuItem>
				{simulation.pageList.map(otherPage => <MenuItem key={otherPage.id} value={otherPage.id}>{pageIndexToString(otherPage.index)} {otherPage.internalTitle || otherPage.title || emptyPage}</MenuItem>)}
				<MenuItem key="end" value="end">Ende: Danach wird die Simulation beendet</MenuItem>
			</Select>
		</FormControl>
	</FormPart>
}

export function PageUpdateScript({ simulation, page }) {
	const getError = useCallback((script) => getScriptError(script, simulation), [simulation])
	const label = (page.options || []).length > 0 ? 'Standard Update-Skript (wird bei Auswahl einer Antwortmöglichkeit ohne eigenes Update-Skript ausgeführt)' : 'Update-Skript (wird beim Verlassen der Seite ausgeführt)'
	return <FormPart>
		<TrackedCodeField label={label} value={page.updateScript} path={`simulations/${simulation.id}/pages`} documentId={page.id} field="updateScript" multiline={true} getError={getError} />
	</FormPart>
}

export function OptionUpdateScript({ simulation, page, optionIndex, label = "Update-Skript (wird bei Auswahl dieser Antwortmöglichkeit ausgeführt)" }) {
	const option = page.options[optionIndex]
	const getError = useCallback((script) => getScriptError(script, simulation), [simulation])
	return <FormPart>
		<TrackedCodeField label={label} value={option.updateScript} path={`simulations/${simulation.id}/pages`} documentId={page.id} field="options" arrayValue={page.options} arrayIndex={optionIndex} arrayField="updateScript" multiline={true} getError={getError} />
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
