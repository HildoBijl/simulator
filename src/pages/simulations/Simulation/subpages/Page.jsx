import { useState, useEffect } from 'react'
import { useTheme, darken } from '@mui/material/styles'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import { Undo } from '@mui/icons-material'

import { numberToLetter } from 'util'
import { Page as PageContainer, InputParagraph, MCEContents } from 'components'
import { useIsOwner, pageIndexToString } from 'simulations'

import { emptyPage, emptyOption } from '../../settings'
import { getVariables, getFollowUpPage, applyAutoplay } from '../../util'
import { resolveScripts } from '../../scripts'

import { Dials } from '../components/Dials'

export function Page({ simulation, history, state, chooseOption, goToNextPage, jumpToPage, reset, undo }) {
	const isOwner = useIsOwner(simulation)
	const { dialsPosition } = simulation
	const { pageId, choice } = state

	// Determine the page we're at.
	const page = simulation.pages[pageId]
	const options = page.options || []
	let { title, description, feedback, hideHeader, hideFooter } = page
	if (page.autoplay)
		description = applyAutoplay(description)
	description = resolveScripts(description, getVariables(state), simulation)

	// If an option has been chosen and there's no feedback, automatically continue to the next page (if it exists).
	useEffect(() => {
		const options = page.options || []
		if (options.length === 0)
			return // No options. Never auto-continue, since it's an info-screen.
		if (choice === undefined)
			return // It's a question page but the question hasn't been answered. Can't auto-continue.
		if (options[choice].feedback || page.feedback)
			return // There's feedback to show. Don't auto-continue.
		if (getFollowUpPage(page, simulation, choice) === 'end')
			return // After this the simulation is over. Don't auto-continue into nothingness.
		goToNextPage(isOwner) // No reason found not to: let's auto-continue!
	}, [page, simulation, choice, goToNextPage, isOwner])

	// Check what kind of button to show.
	const atSimulationEnd = (options.length === 0 || choice !== undefined) && getFollowUpPage(page, simulation, choice) === 'end'
	const showNextButton = !atSimulationEnd && (options.length === 0 || choice !== undefined)

	// Define what icons to show.
	const canUndo = history.length > 1 || state.choice !== undefined
	const icons = simulation.allowUndo && canUndo ? [{ Icon: Undo, onClick: undo }] : []

	// Check for headers/footers.
	const showHeader = !!simulation.pageHeader && (!simulation.allowHeaderHiding || !hideHeader)
	const showFooter = !!simulation.pageFooter && (!simulation.allowFooterHiding || !hideFooter)

	// Render the page with description, media, options and buttons.
	return <PageContainer title={title || simulation.title || '[Simulationstitel fehlt]'} showLogo="right" icons={icons}>
		{dialsPosition === 'top' ? <Dials {...{ simulation, state }} /> : null}
		{showHeader ? <MCEContents>{resolveScripts(simulation.pageHeader, getVariables(state), simulation)}</MCEContents> : null}
		{dialsPosition === 'belowHeader' ? <Dials {...{ simulation, state }} /> : null}
		<MCEContents>{description}</MCEContents>
		{dialsPosition === 'belowDescription' ? <Dials {...{ simulation, state }} /> : null}
		{options.length === 0 ? null : <>
			<div style={{ alignItems: 'stretch', display: 'flex', flexFlow: 'column nowrap', margin: '1rem 0' }}>
				{options.map((option, index) => choice !== undefined ?
					<Option key={index} {...{ simulation, state, page, option, index, disabled: index !== choice, feedback: index === choice && (options[choice].feedback || feedback) }} /> :
					<Option key={index} {...{ simulation, state, page, option, index, selected: false, select: () => chooseOption(index, isOwner) }} />)}
			</div>
		</>}
		{dialsPosition === 'belowOptions' ? <Dials {...{ simulation, state }} /> : null}
		{showFooter ? <MCEContents>{resolveScripts(simulation.pageFooter, getVariables(state), simulation)}</MCEContents> : null}
		{(dialsPosition === 'belowFooter' || dialsPosition === undefined) ? <Dials {...{ simulation, state }} /> : null}
		{atSimulationEnd ? <>
			<Alert severity="info" sx={{ mt: 2 }}>Sie haben die Simulation beendet. Drücken Sie die Taste unten, um erneut zu beginnen.</Alert>
			<Button variant="contained" sx={{ my: 2 }} onClick={() => reset(isOwner)}>Neu starten</Button>
		</> : null}
		{showNextButton ? <Button variant="contained" sx={{ my: 2 }} onClick={() => goToNextPage(isOwner)}>Weiter</Button> : null}
		{dialsPosition === 'belowButton' ? <Dials {...{ simulation, state }} /> : null}
		<AdminTool {...{ simulation, state, jumpToPage, reset }} />
	</PageContainer>
}

function Option({ option, index, selected, select, deselect, disabled, feedback, simulation, state }) {
	const [isHovered, setIsHovered] = useState(false)
	const theme = useTheme()
	const letter = numberToLetter(index)
	const description = option.description || emptyOption

	// Set up handlers for interaction functionalities.
	const handlers = {
		onClick: () => selected ? deselect && deselect() : select && select(),
		onMouseEnter: () => setIsHovered(true),
		onMouseLeave: () => setIsHovered(false),
	}

	// Define styles for the various elements.
	const commonStyle = {
		background: disabled ? (theme.palette.mode === 'light' ? '#bbb' : '#444') : (selected ? darken(theme.palette.primary.main, 0.25) : (isHovered && select ? darken(theme.palette.primary.main, 0.15) : darken(theme.palette.primary.main, 0))),
		borderRadius: '1.5rem',
		color: disabled ? darken(theme.palette.primary.contrastText, 0.5) : theme.palette.primary.contrastText,
		cursor: (select ? 'pointer' : 'default'),
		WebkitTapHighlightColor: 'rgba(0, 0, 0, 0)', // Don't show a blue rectangle on selecting.
	}
	const letterStyle = {
		...commonStyle,
		flex: '0 0 auto',
		fontSize: '1.5rem',
		fontWeight: 500,
		height: '3rem',
		lineHeight: '2.8rem',
		marginRight: '0.5rem',
		textAlign: 'center',
		width: '3rem',
	}
	const descriptionStyle = {
		...commonStyle,
		flex: '1 1 auto',
		minHeight: '3rem',
		padding: '0 1rem',
		display: 'flex',
		flexFlow: 'column nowrap',
		justifyContent: 'center',
	}
	const feedbackStyle = {
		background: theme.palette.secondary.main,
		borderRadius: '1.5rem',
		color: theme.palette.secondary.contrastText,
		fontSize: '0.85rem',
		margin: '0rem 0 0.5rem 7rem',
		padding: '0 1rem',
	}

	// Render the option.
	return <>
		<div style={{ alignItems: 'flex-start', display: 'flex', flexFlow: 'row nowrap', margin: '0.25rem 0' }}>
			<div style={letterStyle} {...handlers}>{letter.toUpperCase()}</div>
			<div style={descriptionStyle} {...handlers}>
				<MCEContents>{resolveScripts(description, getVariables(state), simulation)}</MCEContents>
			</div>
		</div>
		{feedback ? <div style={feedbackStyle}><InputParagraph>{resolveScripts(feedback, getVariables(state), simulation)}</InputParagraph></div> : null}
	</>
}

function AdminTool({ simulation, state, jumpToPage, reset }) {
	const isOwner = useIsOwner(simulation)
	if (!isOwner)
		return null // Only show the tool for owners.
	return <>
		<h4>Ersteller-Tools</h4>
		<JumpDropDown {...{ simulation, state, jumpToPage }} />
		<Button variant="contained" sx={{ margin: '1rem 0 0 0' }} onClick={() => reset(isOwner)}>Neu starten</Button>
	</>
}

function JumpDropDown({ simulation, state, jumpToPage }) {
	const label = 'Zur Seite springen'
	const value = state.pageId
	return <FormControl fullWidth>
		<InputLabel>{label}</InputLabel>
		<Select value={value} label={label} onChange={(event) => jumpToPage(event.target.value)}>
			{simulation.pageList.map(page => <MenuItem key={page.id} value={page.id}>{pageIndexToString(page.index)} {page.title || emptyPage}</MenuItem>)}
		</Select>
	</FormControl>
}
