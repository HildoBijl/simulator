import { useState, useRef, useCallback, useMemo } from 'react'
import { useTheme, alpha } from '@mui/material/styles'
import Tooltip from '@mui/material/Tooltip'
import Alert from '@mui/material/Alert'
import Accordion from '@mui/material/Accordion'
import AccordionActions from '@mui/material/AccordionActions'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { DragIndicator as DragIndicatorIcon, Help as HelpIcon, Info as InfoIcon, Folder as FolderIcon, FolderOpen as FolderEmptyIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { arrayUnion, arrayRemove, deleteField } from 'firebase/firestore'
import { Draggable } from '@hello-pangea/dnd'

import { FormPart, TrackedTextField, TrackedCodeField, MCE } from 'components'
import { deletePage, updatePage, pageIndexToString } from 'simulations'

import { emptyPage, emptyFolder, emptyDialTitle, accordionStyle, hasVariables, hasVideo, getScriptError } from '../../util'

import { Options, FollowUpDropdown, PageUpdateScript } from './Options'

export function PageOrFolder(data) {
	const { page } = data
	if (page.type === 'folder')
		return <Folder {...data} />
	if (page.type === 'page')
		return <Page {...data} />
}

function Page({ simulation, page, dragIndex, listIndex, expanded, isDragging, flipExpand }) {
	const theme = useTheme()
	const { id, index, title, internalTitle, description, options } = page

	// Determine what to show inside the form.
	const [showInternalTitle, setShowInternalTitle] = useState(!!page.internalTitle)
	const hasOptions = (options || []).length !== 0
	const [showOptions, setShowOptions] = useState(hasOptions)
	const allowFollowUpPage = !hasOptions
	const [showFollowUpPage, setShowFollowUpPage] = useState(allowFollowUpPage && !!page.followUpPage)
	const allowEntryScript = hasVariables(simulation)
	const [showEntryScript, setShowEntryScript] = useState(allowEntryScript && !!page.entryScript)
	const allowUpdateScript = hasVariables(simulation) && !hasOptions
	const [showUpdateScript, setShowUpdateScript] = useState(allowUpdateScript && !!page.updateScript)
	const allowHeaderSettings = !!simulation.pageHeader && simulation.allowHeaderHiding
	const [showHeaderSettings, setShowHeaderSettings] = useState(allowHeaderSettings && page.hideHeader)
	const allowFooterSettings = !!simulation.pageFooter && simulation.allowFooterHiding
	const [showFooterSettings, setShowFooterSettings] = useState(allowFooterSettings && page.hideFooter)
	const allowDialHiding = (simulation.dials || []).length > 0 && !!simulation.allowDialHiding
	const [showDialHiding, setShowDialHiding] = useState(allowDialHiding && !!page.hideDials)
	const allowAutoplay = useMemo(() => hasVideo(description), [description])
	const [showAutoplay, setShowAutoplay] = useState(allowAutoplay && page.autoplay)

	// Determine the icon for this page.
	const Icon = hasOptions ? HelpIcon : InfoIcon
	const iconColor = hasOptions ? theme.palette.primary.main : theme.palette.info.main

	// Determine the jump-in. Ensure this doesn't change upon dragging.
	const jumpInRef = useRef()
	const jumpIn = isDragging ? jumpInRef.current : listIndex.length - 1
	jumpInRef.current = jumpIn

	// Render the page.
	return <Draggable key={id} index={dragIndex} draggableId={id}>
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
					<span style={{ marginRight: '0.75rem' }}>{pageIndexToString(index)}</span>
					{internalTitle || title || emptyPage}
				</AccordionSummary>
				{expanded ? <>
					<AccordionDetails key="details" sx={{ py: 0, my: -2 }}>
						<FormPart>
							<TrackedTextField label="Titel" value={title} path={`simulations/${simulation.id}/pages`} documentId={id} field="title" />
						</FormPart>

						{showInternalTitle ? <FormPart>
							<TrackedTextField label="Interner Titel" value={internalTitle} path={`simulations/${simulation.id}/pages`} documentId={id} field="internalTitle" />
							{internalTitle ? null : <Alert severity="info" sx={{ my: 2 }}>Der interne Titel wird den Benutzern nie angezeigt. Er erscheint nur auf dieser Seitenübersicht, damit Sie Ihre Seiten leichter strukturieren können. Der obige &quot;Titel&quot; ist der Titel der Seite, der den Benutzern angezeigt wird.</Alert>}
						</FormPart> : null}

						<FormPart>
							<MCE label="Beschreibung" height="225" value={description} path={`simulations/${simulation.id}/pages`} documentId={id} field="description" />
						</FormPart>

						{/* Other components. */}
						{(allowHeaderSettings && showHeaderSettings) ? <HeaderSettings {...{ simulation, page }} /> : null}
						{(allowFooterSettings && showFooterSettings) ? <FooterSettings {...{ simulation, page }} /> : null}
						{(allowDialHiding && showDialHiding) ? <DialHidingSettings {...{ simulation, page }} /> : null}
						{(allowAutoplay && showAutoplay) ? <AutoplaySettings {...{ simulation, page }} /> : null}
						{(allowEntryScript && showEntryScript) ? <PageEntryScript {...{ simulation, page }} /> : null}
						{(allowFollowUpPage && showFollowUpPage) ? <FollowUpDropdown {...{ simulation, page }} /> : null}
						{(allowUpdateScript && showUpdateScript) ? <PageUpdateScript {...{ simulation, page }} /> : null}
						{showOptions ? <Options {...{ simulation, page }} /> : null}

						{/* Buttons to activate settings. */}
						<FormPart style={{ display: 'flex', flexFlow: 'row wrap', gap: '0.5rem', alignItems: 'stretch', justifyContent: 'stretch', marginTop: '0.6rem' }}>
							{!showOptions ? <Button variant="contained" style={{ flexGrow: 1 }} onClick={() => setShowOptions(true)}>Antwortmöglichkeiten hinzufügen</Button> : null}
							{(allowFollowUpPage && !showFollowUpPage) ? <Button variant="contained" style={{ flexGrow: 1 }} onClick={() => setShowFollowUpPage(true)}>Folgeseite einstellen</Button> : null}
							{!showInternalTitle ? <Button variant="contained" style={{ flexGrow: 1 }} onClick={() => setShowInternalTitle(true)}>Internen Titel hinzufügen</Button> : null}
							{(allowEntryScript && !showEntryScript) ? <Button variant="contained" style={{ flexGrow: 1 }} onClick={() => setShowEntryScript(true)}>Eintrittsskript hinzufügen</Button> : null}
							{(allowUpdateScript && !showUpdateScript) ? <Button variant="contained" style={{ flexGrow: 1 }} onClick={() => setShowUpdateScript(true)}>Update-Skript hinzufügen</Button> : null}
							{(allowHeaderSettings && !showHeaderSettings) ? <Button variant="contained" style={{ flexGrow: 1 }} onClick={() => {
								updatePage(simulation.id, id, { hideHeader: true })
								setShowHeaderSettings(true)
							}}>Seitenkopf ausblenden</Button> : null}
							{(allowFooterSettings && !showFooterSettings) ? <Button variant="contained" style={{ flexGrow: 1 }} onClick={() => {
								updatePage(simulation.id, id, { hideFooter: true })
								setShowFooterSettings(true)
							}}>Seitenfuß ausblenden</Button> : null}
							{(allowDialHiding && !showDialHiding) ? <Button variant="contained" style={{ flexGrow: 1 }} onClick={() => {
								updatePage(simulation.id, id, { hideDials: 'all' })
								setShowDialHiding(true)
							}}>Zahlenindikatoren ausblenden</Button> : null}
							{(allowAutoplay && !showAutoplay) ? <Button variant="contained" style={{ flexGrow: 1 }} onClick={() => {
								updatePage(simulation.id, id, { autoplay: true })
								setShowAutoplay(true)
							}}>Video direkt starten</Button> : null}
						</FormPart>
					</AccordionDetails>

					<AccordionActions key="actions">
						<Button sx={{ mt: 2 }} onClick={() => deletePage(simulation, page)}>Seite löschen</Button>
					</AccordionActions>
				</> : null}
			</Accordion>}
	</Draggable>
}

function Folder(props) {
	const folder = props.page
	if (folder.closer)
		return <FolderCloser {...props} />
	return <FolderOpener {...props} />
}

function FolderOpener({ simulation, page: folder, dragIndex, listIndex, expanded, isDragging, isDestinationFolder, flipExpand }) {
	const theme = useTheme()

	// Determine the jump-in. Ensure this doesn't change upon dragging.
	const jumpInRef = useRef()
	const jumpIn = isDragging ? jumpInRef.current : listIndex.length - 2
	jumpInRef.current = jumpIn

	// Define the expandIcon depending on whether the folder is empty or not. Also override the default animation.
	const isEmpty = !folder.contents || folder.contents.length === 0
	const expandIcon = isEmpty ?
		<Tooltip title="Ordner löschen" arrow enterDelay={500}>
			<DeleteIcon sx={{ cursor: 'pointer' }} onClick={() => deletePage(simulation, folder)} />
		</Tooltip> :
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
					<span style={{ marginRight: '0.75rem' }}>{pageIndexToString(folder.index)}</span>
					<FolderTitle {...{ simulation, folder }} />
				</AccordionSummary>
			</Accordion>
		}
	</Draggable >
}

// The FolderCloser is an invisible marker with height 0. If an object is dragged above this separator, it will be dropped inside the folder. If it is dragged below this separator, it will be dropped below the folder.
function FolderCloser({ page: folder, dragIndex }) {
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
		await updatePage(simulation.id, folder.id, { title: event.target.value })
	}
	return <input type="text" style={{ marginRight: '1em', width: '100%' }} value={folder.title || ''} onClick={(event) => event.stopPropagation()} onChange={updateTitle} autoFocus={true} onBlur={() => setIsEditing(false)} onKeyDown={event => (event.key === 'Enter' || event.key === 'Escape') && setIsEditing(false)} />
}

export function PageEntryScript({ simulation, page }) {
	const getError = useCallback((script) => getScriptError(script, simulation), [simulation])
	return <FormPart>
		<TrackedCodeField label="Eintrittsskript" value={page.entryScript} path={`simulations/${simulation.id}/pages`} documentId={page.id} field="entryScript" multiline={true} getError={getError} />
		{page.entryScript ? null : <Alert severity="info" sx={{ my: 2 }}>Das Eintrittsskript wird immer dann ausgeführt, wenn der Benutzer auf diese Seite weitergeleitet wird. Es kann nützlich sein, um Variablen auf bestimmte Werte zu setzen.</Alert>}
	</FormPart>
}

function HeaderSettings({ simulation, page }) {
	if (!simulation.pageHeader || !simulation.allowHeaderHiding)
		return null
	return <FormGroup sx={{ px: '0.5rem' }}>
		<FormControlLabel control={<Switch checked={!page.hideHeader || false} onChange={event => updatePage(simulation.id, page.id, { hideHeader: !event.target.checked || deleteField() })} />} label="Den Seitenkopf auf dieser Seite anzeigen." />
	</FormGroup>
}

function FooterSettings({ simulation, page }) {
	if (!simulation.pageFooter || !simulation.allowFooterHiding)
		return null
	return <FormGroup sx={{ px: '0.5rem' }}>
		<FormControlLabel control={<Switch checked={!page.hideFooter || false} onChange={event => updatePage(simulation.id, page.id, { hideFooter: !event.target.checked || deleteField() })} />} label="Den Seitenfuß auf dieser Seite anzeigen." />
	</FormGroup>
}

function DialHidingSettings({ simulation, page }) {
	// Set up a handler to change the setting whether or not to hide dials.
	const setPosition = hideDials => {
		if (hideDials === 'none')
			hideDials = deleteField()
		if (hideDials === 'specific')
			hideDials = Array.isArray(page.hideDials) ? page.hideDials : []
		updatePage(simulation.id, page.id, { hideDials })
	}

	// Determine the current value.
	let value = 'none'
	if (page.hideDials === 'all')
		value = 'all'
	if (Array.isArray(page.hideDials))
		value = 'specific'

	// Render the drop-down menu, including optionally the sliders per dial below it.
	const label = 'Zahlenindikatoren auf dieser Seite anzeigen'
	return <>
		<FormControl fullWidth>
			<InputLabel>{label}</InputLabel>
			<Select value={value} label={label} onChange={(event) => setPosition(event.target.value)}>
				<MenuItem value="none">Alle Zahlenindikatoren anzeigen</MenuItem>
				<MenuItem value="all">Alle Zahlenindikatoren ausblenden</MenuItem>
				<MenuItem value="specific">Angeben, welche Zahlenindikatoren angezeigt werden sollen</MenuItem>
			</Select>
		</FormControl>
		{value === 'specific' ? simulation.dials.map(dial => {
			return <FormGroup key={dial.id} sx={{ px: 1 }}>
				<FormControlLabel control={<Switch checked={!page.hideDials.includes(dial.id)} onChange={event => updatePage(simulation.id, page.id, { hideDials: (event.target.checked ? arrayRemove : arrayUnion)(dial.id) })} />} label={`${dial.title || emptyDialTitle} anzeigen`} />
			</FormGroup>
		}) : null}
	</>
}

function AutoplaySettings({ simulation, page }) {
	return <FormGroup sx={{ px: '0.5rem' }}>
		<FormControlLabel control={<Switch checked={page.autoplay || false} onChange={event => updatePage(simulation.id, page.id, { autoplay: event.target.checked || deleteField() })} />} label="Das Video auf dieser Seite direkt abspielen (autoplay)." />
	</FormGroup>
}
