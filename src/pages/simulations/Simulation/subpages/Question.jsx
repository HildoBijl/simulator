import { useState, useEffect } from 'react'
import { useTheme, darken } from '@mui/material/styles'
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

import { VariableOverview } from '../components/VariableOverview'

export function Page({ simulation, history, state, chooseOption, goToNextPage, jumpToPage, reset, undo }) {
	const isOwner = useIsOwner(simulation)
	const { pageId, choice } = state

	// Determine the page we're at.
	const page = simulation.pages[pageId]
	const options = page.options || []

	// If an option has been chosen and there's no feedback, automatically continue to the next page.
	useEffect(() => {
		const options = page.options || []
		if (!page.options)
			return // No options. Never auto-continue, since it's an info-screen.
		if (choice === undefined)
			return // It's a question but the question hasn't been answered. Can't auto-continue.
		if (options[choice].feedback || page.feedback)
			return // There's feedback to show. Don't auto-continue.
		goToNextPage(isOwner) // No reason found not to: let's auto-continue!
	}, [page, choice, goToNextPage, isOwner])

	// Check what kind of button to show.
	const showRestartButton = options.length === 0 && page.followUpPage === 'end'
	const showNextButton = !showRestartButton && (options.length === 0 || choice !== undefined)

	// Define what icons to show.
	const canUndo = history.length > 1 || state.choice !== undefined
	const icons = simulation.allowUndo && canUndo ? [{ Icon: Undo, onClick: undo }] : []

	// Render the page with description, media, options and buttons.
	return <PageContainer title={page.title || simulation.title || '[Simulationstitel fehlt]'} showLogo="right" icons={icons}>
		<MCEContents>{page.description}</MCEContents>
		{options.length === 0 ? null : <>
			<div style={{ alignItems: 'stretch', display: 'flex', flexFlow: 'column nowrap', margin: '1rem 0' }}>
				{page.options.map((option, index) => choice !== undefined ?
					<Option key={index} {...{ simulation, page, option, index, disabled: index !== choice, feedback: index === choice && (options[choice].feedback || page.feedback) }} /> :
					<Option key={index} {...{ simulation, page, option, index, selected: false, select: () => chooseOption(index, isOwner) }} />)}
			</div>
		</>}
		{showRestartButton ? <Button variant="contained" sx={{ margin: '0 0 1rem 0' }} onClick={() => reset(isOwner)}>Neu starten</Button> : null}
		{showNextButton ? <Button variant="contained" sx={{ margin: '0 0 1rem 0' }} onClick={() => goToNextPage(isOwner)}>Weiter</Button> : null}
		<VariableOverview {...{ simulation, state }} />
		<AdminTool {...{ simulation, state, jumpToPage, reset }} />
	</PageContainer>
}

function Option({ option, index, selected, select, deselect, disabled, feedback }) {
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
		padding: '0 1rem',
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
				<MCEContents>{description}</MCEContents>
			</div>
		</div>
		{feedback ? <div style={feedbackStyle}><InputParagraph>{feedback}</InputParagraph></div> : null}
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
			<MenuItem key="end" value="end">Ende: den Durchlauf beenden</MenuItem>
		</Select>
	</FormControl>
}
