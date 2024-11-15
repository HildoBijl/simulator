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

	// Determine whether or not to show defaults. Do so when it has at least one useful field.
	const showDefaultFollowUpPage = !options.every(option => option.followUpPage)
	const showDefaultFeedback = !options.every(option => option.feedback)
	const showDefaultUpdateScript = !options.every(option => option.updateScript)
	const showDefaults = options.length > 0 && (showDefaultFollowUpPage || showDefaultFeedback || showDefaultUpdateScript)

	// Render the options through an Accordion. When there are no options, pull out the standard settings.
	return <FormPart style={{ marginTop: '1.6rem' }}>
		<Label>Antwortmöglichtkeiten</Label>
		{options.length === 0 ? null : <ExpandButtons {...{ expanded, setExpanded, showDefaults, defaultsExpanded, setDefaultsExpanded }} />}
		<DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd} onDragUpdate={onDragUpdate}>
			<Droppable droppableId="options">{(provided, snapshot) => (
				<div
					ref={provided.innerRef}
					{...provided.droppableProps}
					style={{
						margin: '0 0 1rem',
						...(snapshot.isDraggingOver ? { background: theme.palette.mode === 'light' ? '#eee' : '#222' } : {})
					}}
				>
					{showDefaults ? <Defaults {...{ simulation, page, expanded: defaultsExpanded, flipExpand: () => setDefaultsExpanded(value => !value) }} /> : null}
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
	</FormPart>
}

function ExpandButtons({ expanded, setExpanded, showDefaults, defaultsExpanded, setDefaultsExpanded }) {
	// Define handlers to open and close all options.
	const openAll = () => {
		setExpanded(expanded => expanded.map(() => true))
		setDefaultsExpanded(true)
	}
	const closeAll = () => {
		setExpanded(expanded => expanded.map(() => false))
		setDefaultsExpanded(false)
	}
	const allOpen = (!showDefaults || defaultsExpanded) && expanded.every(value => value)
	const allClosed = (!showDefaults || !defaultsExpanded) && !expanded.some(value => value)

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
			<Tooltip title="Alle Antwortmöglichkeiten aufklappen" arrow enterDelay={500}>
				<OpenIcon onClick={openAll} sx={allOpen ? buttonStyleInactive : buttonStyle} />
			</Tooltip>
			<Tooltip title="Alle Antwortmöglichkeiten schließen" arrow enterDelay={500}>
				<CloseIcon onClick={closeAll} sx={allClosed ? buttonStyleInactive : buttonStyle} />
			</Tooltip>
		</div>
	</div>
}

function Defaults({ simulation, page, expanded, flipExpand }) {
	// Determine the extra message to show for the feedback field, giving info on where this will be used.
	const { options } = page
	const optionsWithFeedback = options.map(option => !!option.feedback)
	const allOptionsHaveFeedback = optionsWithFeedback.every(value => value)
	const noOptionsHaveFeedback = !optionsWithFeedback.some(value => value)
	const optionsWithoutFeedback = optionsWithFeedback.map((value, index) => !value && numberToLetter(index).toUpperCase()).filter(value => value)
	const extraMessage = allOptionsHaveFeedback ? 'derzeit nicht verwendet; alle Möglichkeiten haben eine eigene Rückmeldung' : noOptionsHaveFeedback ? 'für alle Möglichkeiten, da keine ihre eigene Rückmeldung hat' : `für die Möglichkeit${optionsWithoutFeedback.length === 1 ? ` (nur ${optionsWithoutFeedback.join('/')})` : `en ${optionsWithoutFeedback.join('/')}`} ohne eigene Rückmeldung`

	// Check which fields should be shown.
	const showDefaultFollowUpPage = !options.every(option => option.followUpPage)
	const showDefaultFeedback = !allOptionsHaveFeedback
	const showDefaultUpdateScript = !options.every(option => option.updateScript)

	// Show the standard options.
	return <Accordion expanded={expanded} onChange={() => flipExpand()}>
		<AccordionSummary key="summary" expandIcon={<ExpandMoreIcon />}>
			Standardeinstellungen für alle Antwortmöglichkeiten (sofern nicht weiter eingestellt)
		</AccordionSummary>
		<AccordionDetails key="details" sx={{ py: 0, mt: -2 }}>
			{showDefaultFollowUpPage ? <FollowUpDropdown {...{ simulation, page }} /> : null}
			{showDefaultFeedback ? <FormPart>
				<TrackedTextField label={`Standard Rückmeldung (${extraMessage})`} value={page.feedback} path={`simulations/${simulation.id}/pages`} documentId={page.id} field="feedback" multiline={true} />
			</FormPart> : null}
			{hasVariables(simulation) && showDefaultUpdateScript ? <PageUpdateScript {...{ simulation, page }} /> : null}
		</AccordionDetails>
	</Accordion>
}

function Option({ simulation, page, option, optionIndex, updatedIndex, expanded, flipExpand, removeOption }) {
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
							<MCE ref={descriptionRef} label="Beschreibung" height="170" value={option.description} path={`simulations/${simulation.id}/pages`} documentId={page.id} field="options" arrayValue={page.options} arrayIndex={optionIndex} arrayField="description" />
						</FormPart>
						<FollowUpDropdown {...{ simulation, page, optionIndex }} />
						<FormPart>
							<TrackedTextField label="Rückmeldung" value={option.feedback} path={`simulations/${simulation.id}/pages`} documentId={page.id} field="options" arrayValue={page.options} arrayIndex={optionIndex} arrayField="feedback" multiline={true} />
						</FormPart>
						{hasVariables(simulation) ? <OptionUpdateScript {...{ simulation, page, optionIndex }} /> : null}
					</AccordionDetails>
					<AccordionActions key="actions">
						<Button onClick={() => removeOption()}>Antwortmöglichkeit Löschen</Button>
					</AccordionActions>
				</> : null}
			</Accordion>}
	</Draggable>
}

export function FollowUpDropdown({ simulation, page, optionIndex }) {
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

	// Determine the extra message to show for the field, giving info on where this will be used.
	const optionsWithFollowUp = (page.options || []).map(option => !!option.followUpPage)
	const allOptionsHaveFollowUp = optionsWithFollowUp.every(value => value)
	const noOptionsHaveFollowUp = !optionsWithFollowUp.some(value => value)
	const optionsWithoutFollowUp = optionsWithFollowUp.map((value, index) => !value && numberToLetter(index).toUpperCase()).filter(value => value)
	const extraMessage = allOptionsHaveFollowUp ? 'derzeit nicht verwendet; alle Möglichkeiten haben eine eigene Folgeseite' : noOptionsHaveFollowUp ? 'für alle Möglichkeiten, da keine eine eigene Folgeseite hat' : `für die Möglichkeit${optionsWithoutFollowUp.length === 1 ? ` (nur ${optionsWithoutFollowUp.join('/')})` : `en ${optionsWithoutFollowUp.join('/')}`} ohne eigene Folgeseite`
	const label = forPage && options.length > 0 ? `Standard Folgeseite (${extraMessage})` : 'Folgeseite'

	// Render the dropdown field.
	const value = (forPage ? page.followUpPage : option.followUpPage) || 'default'
	return <FormPart>
		<FormControl fullWidth>
			<InputLabel>{label}</InputLabel>
			<Select value={value} label={label} onChange={(event) => setFollowUpPage(event.target.value)}>
				<MenuItem key="default" value="default">{forPage ? <>Standard: Nächste Seite in der Reihenfolge (jetzt {nextPage ? `Seite ${pageIndexToString(nextPage.index)
					} ` : 'das Ende der Simulation'})</> : <>Die Standardeinstellung dieser Frage verwenden</>}</MenuItem>
				{simulation.pageList.map(otherPage => <MenuItem key={otherPage.id} value={otherPage.id}>{pageIndexToString(otherPage.index)} {otherPage.internalTitle || otherPage.title || emptyPage}</MenuItem>)}
				<MenuItem key="end" value="end">Ende: Danach wird die Simulation beendet</MenuItem>
			</Select>
		</FormControl>
	</FormPart>
}

export function PageUpdateScript({ simulation, page }) {
	const getError = useCallback((script) => getScriptError(script, simulation), [simulation])

	// Determine the extra message to show for the field, giving info on where this will be used.
	const options = page.options || []
	const optionsWithScript = options.map(option => !!option.updateScript)
	const allOptionsHaveScript = optionsWithScript.every(value => value)
	const noOptionsHaveScript = !optionsWithScript.some(value => value)
	const optionsWithoutScript = optionsWithScript.map((value, index) => !value && numberToLetter(index).toUpperCase()).filter(value => value)
	const extraMessage = allOptionsHaveScript ? 'derzeit nicht verwendet; alle Möglichkeiten haben ein eigenes Update-Skript' : noOptionsHaveScript ? 'für alle Möglichkeiten, da keine ein eigenes Update-Skript hat' : `für die Möglichkeit${optionsWithoutScript.length === 1 ? ` (nur ${optionsWithoutScript.join('/')})` : `en ${optionsWithoutScript.join('/')}`} ohne eigenes Update-Skript`
	const label = options.length > 0 ? `Standard Update-Skript (${extraMessage})` : 'Update-Skript'

	// Render the code field.
	return <FormPart>
		<TrackedCodeField label={label} value={page.updateScript} path={`simulations/${simulation.id}/pages`} documentId={page.id} field="updateScript" multiline={true} getError={getError} />
		{page.updateScript ? null : <Alert severity="info" sx={{ my: 2 }}>{options.length > 0 ? <>Das Update-Skript wird bei Auswahl einer Antwortmöglichkeit ausgeführt. Sie können es verwenden, um die Auswirkungen der Wahl dieser Option durch den Benutzer auf die Parameter der Simulation zu implementieren.</> : <>Das Update-Skript wird beim Verlassen der Seite ausgeführt. Sie können damit die Werte bestimmter Parameter anpassen, falls gewünscht.</>}</Alert>}
	</FormPart >
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
